/**
 * Módulo de Integração com Channel Manager
 * 
 * Este módulo gerencia a sincronização bidirecional entre o sistema local
 * e Channel Managers (Cloudbeds, Smoobu, Beds24, etc.) para integração com
 * Booking.com, Airbnb e outros canais de distribuição.
 * 
 * Arquitetura:
 * MEU SISTEMA ↔ CHANNEL MANAGER ↔ BOOKING.COM / AIRBNB / OUTROS
 */

const crypto = require('crypto');

/**
 * Classe principal para gerenciamento de sincronização com Channel Manager
 */
class ChannelManager {
  constructor(db, queryOneFn, queryAllFn, executeFn, saveDbFn) {
    this.db = db;
    this.queryOne = queryOneFn;
    this.queryAll = queryAllFn;
    this.execute = executeFn;
    this.saveDatabase = saveDbFn;
  }

  /**
   * ==========================================
   * FUNÇÕES DE CONSULTA
   * ==========================================
   */

  /**
   * Buscar todas as propriedades cadastradas
   */
  getPropriedades() {
    return this.queryAll('SELECT * FROM propriedades WHERE ativo = 1 ORDER BY nome');
  }

  /**
   * Buscar propriedade por ID
   */
  getPropriedade(id) {
    return this.queryOne('SELECT * FROM propriedades WHERE id = ?', [id]);
  }

  /**
   * Buscar todos os canais configurados
   */
  getCanais() {
    return this.queryAll('SELECT * FROM canais WHERE ativo = 1 ORDER BY nome');
  }

  /**
   * Buscar canal por ID
   */
  getCanal(id) {
    return this.queryOne('SELECT * FROM canais WHERE id = ?', [id]);
  }

  /**
   * Buscar mapeamento de quartos com canais
   */
  getRoomMappings(quartoId = null, canalId = null) {
    let query = `
      SELECT 
        rcm.*,
        q.categoria,
        q.numero,
        c.nome as canal_nome,
        c.tipo as canal_tipo
      FROM room_channel_mapping rcm
      JOIN quartos q ON rcm.quarto_id = q.id
      JOIN canais c ON rcm.canal_id = c.id
      WHERE rcm.sync_ativo = 1
    `;
    const params = [];
    
    if (quartoId) {
      query += ' AND rcm.quarto_id = ?';
      params.push(quartoId);
    }
    
    if (canalId) {
      query += ' AND rcm.canal_id = ?';
      params.push(canalId);
    }
    
    return this.queryAll(query, params);
  }

  /**
   * ==========================================
   * FUNÇÕES DE DISPONIBILIDADE
   * ==========================================
   */

  /**
   * Verificar disponibilidade de um quarto em um período
   * Retorna true se disponível, false se não disponível
   * Prevenção de overbooking: verifica todas as fontes de ocupação
   */
  verificarDisponibilidade(quartoId, checkIn, checkOut) {
    // Verificar se há bloqueios manuais para qualquer data do período
    const bloqueios = this.queryAll(`
      SELECT * FROM disponibilidade 
      WHERE quarto_id = ? 
        AND data >= ? 
        AND data < ? 
        AND (bloqueado = 1 OR disponivel = 0)
    `, [quartoId, checkIn, checkOut]);
    
    if (bloqueios && bloqueios.length > 0) {
      return false;
    }
    
    // Verificar se há reservas confirmadas ou pendentes que se sobrepõem ao período
    // Uma reserva se sobrepõe se: check_in < check_out_solicitado AND check_out > check_in_solicitado
    const reservas = this.queryAll(`
      SELECT * FROM reservas 
      WHERE quarto_id = ? 
        AND status IN ('Confirmado', 'Pendente')
        AND check_in < ? 
        AND check_out > ?
    `, [quartoId, checkOut, checkIn]);
    
    if (reservas && reservas.length > 0) {
      return false;
    }
    
    // Verificar reservas externas (de canais) que se sobrepõem ao período
    const reservasExternas = this.queryAll(`
      SELECT * FROM reservas_externas 
      WHERE quarto_id = ? 
        AND status IN ('Confirmado', 'Pendente')
        AND check_in < ? 
        AND check_out > ?
    `, [quartoId, checkOut, checkIn]);
    
    if (reservasExternas && reservasExternas.length > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Obter disponibilidade de um quarto para um período
   * Retorna array de objetos { data, disponivel, preco }
   */
  obterDisponibilidadePeriodo(quartoId, checkIn, checkOut) {
    const disponibilidade = [];
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const currentDate = new Date(checkInDate);
    
    while (currentDate < checkOutDate) {
      const dataStr = currentDate.toISOString().split('T')[0];
      
      // Verificar disponibilidade manual
      const dispManual = this.queryOne(
        'SELECT * FROM disponibilidade WHERE quarto_id = ? AND data = ?',
        [quartoId, dataStr]
      );
      
      // Verificar se está bloqueado
      const bloqueado = dispManual && dispManual.bloqueado === 1;
      
      // Verificar se há reserva
      const temReserva = this.queryOne(`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM reservas 
          WHERE quarto_id = ? 
            AND status IN ('Confirmado', 'Pendente')
            AND ? >= check_in AND ? < check_out
          UNION ALL
          SELECT id FROM reservas_externas 
          WHERE quarto_id = ? 
            AND status IN ('Confirmado', 'Pendente')
            AND ? >= check_in AND ? < check_out
        )
      `, [quartoId, dataStr, dataStr, quartoId, dataStr, dataStr]);
      
      const disponivel = !bloqueado && (!temReserva || temReserva.count === 0);
      
      // Obter preço
      const tarifa = this.queryOne(
        'SELECT * FROM tarifas WHERE quarto_id = ? AND data = ?',
        [quartoId, dataStr]
      );
      
      const quarto = this.queryOne('SELECT * FROM quartos WHERE id = ?', [quartoId]);
      const preco = tarifa ? tarifa.preco : (quarto ? quarto.preco_base : 0);
      
      disponibilidade.push({
        data: dataStr,
        disponivel: disponivel ? 1 : 0,
        preco: preco
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return disponibilidade;
  }

  /**
   * Atualizar disponibilidade de um quarto para um período
   */
  atualizarDisponibilidade(quartoId, data, disponivel, bloqueado = false, motivo = null) {
    const existing = this.queryOne(
      'SELECT * FROM disponibilidade WHERE quarto_id = ? AND data = ?',
      [quartoId, data]
    );
    
    if (existing) {
      this.execute(
        `UPDATE disponibilidade 
         SET disponivel = ?, bloqueado = ?, motivo_bloqueio = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [disponivel ? 1 : 0, bloqueado ? 1 : 0, motivo, existing.id]
      );
    } else {
      this.execute(
        `INSERT INTO disponibilidade (quarto_id, data, disponivel, bloqueado, motivo_bloqueio)
         VALUES (?, ?, ?, ?, ?)`,
        [quartoId, data, disponivel ? 1 : 0, bloqueado ? 1 : 0, motivo]
      );
    }
  }

  /**
   * Atualizar tarifa de um quarto para uma data
   */
  atualizarTarifa(quartoId, data, preco, precoMinimo = null, precoMaximo = null) {
    const existing = this.queryOne(
      'SELECT * FROM tarifas WHERE quarto_id = ? AND data = ?',
      [quartoId, data]
    );
    
    if (existing) {
      this.execute(
        `UPDATE tarifas 
         SET preco = ?, preco_minimo = ?, preco_maximo = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [preco, precoMinimo, precoMaximo, existing.id]
      );
    } else {
      this.execute(
        `INSERT INTO tarifas (quarto_id, data, preco, preco_minimo, preco_maximo)
         VALUES (?, ?, ?, ?, ?)`,
        [quartoId, data, preco, precoMinimo, precoMaximo]
      );
    }
  }

  /**
   * ==========================================
   * FUNÇÕES DE SINCRONIZAÇÃO
   * ==========================================
   */

  /**
   * Registrar log de sincronização
   */
  logSync(canalId, tipoOperacao, direcao, status, dadosEnviados = null, dadosRecebidos = null, erro = null) {
    this.execute(
      `INSERT INTO sync_logs 
       (canal_id, tipo_operacao, direcao, status, dados_enviados, dados_recebidos, erro)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        canalId,
        tipoOperacao, // 'reserva', 'disponibilidade', 'tarifa', 'cancelamento'
        direcao, // 'enviado', 'recebido'
        status, // 'sucesso', 'erro', 'pendente'
        dadosEnviados ? JSON.stringify(dadosEnviados) : null,
        dadosRecebidos ? JSON.stringify(dadosRecebidos) : null,
        erro
      ]
    );
  }

  /**
   * Processar reserva recebida de um canal externo
   * Esta função previne overbooking verificando disponibilidade antes de criar a reserva
   */
  processarReservaExterna(dadosReserva) {
    const {
      codigo_externo,
      canal_id,
      quarto_id,
      categoria,
      nome_completo,
      email,
      telefone,
      check_in,
      check_out,
      num_hospedes,
      adultos,
      criancas,
      valor_total,
      status = 'Confirmado',
      dados_originais
    } = dadosReserva;

    // Verificar disponibilidade ANTES de criar a reserva (prevenção de overbooking)
    const disponivel = this.verificarDisponibilidade(quarto_id, check_in, check_out);
    
    if (!disponivel) {
      this.logSync(
        canal_id,
        'reserva',
        'recebido',
        'erro',
        null,
        dadosReserva,
        'Quarto não disponível para as datas solicitadas (overbooking prevenido)'
      );
      
      return {
        success: false,
        error: 'Quarto não disponível para as datas solicitadas',
        codigo_externo: codigo_externo
      };
    }

    // Criar reserva externa
    try {
      this.execute(
        `INSERT INTO reservas_externas 
         (codigo_externo, canal_id, quarto_id, categoria, nome_completo, email, telefone,
          check_in, check_out, num_hospedes, adultos, criancas, valor_total, status,
          dados_originais, sync_status, sync_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          codigo_externo,
          canal_id,
          quarto_id,
          categoria,
          nome_completo,
          email,
          telefone,
          check_in,
          check_out,
          num_hospedes,
          adultos || num_hospedes,
          criancas || 0,
          valor_total,
          status,
          dados_originais ? JSON.stringify(dados_originais) : null,
          'Sincronizado'
        ]
      );

      // Bloquear disponibilidade automaticamente
      this.bloquearDisponibilidadePeriodo(quarto_id, check_in, check_out, 'Reserva externa');

      // Log de sucesso
      this.logSync(
        canal_id,
        'reserva',
        'recebido',
        'sucesso',
        null,
        dadosReserva,
        null
      );

      return {
        success: true,
        codigo_externo: codigo_externo,
        message: 'Reserva externa processada com sucesso'
      };
    } catch (error) {
      this.logSync(
        canal_id,
        'reserva',
        'recebido',
        'erro',
        null,
        dadosReserva,
        error.message
      );
      
      return {
        success: false,
        error: error.message,
        codigo_externo: codigo_externo
      };
    }
  }

  /**
   * Bloquear disponibilidade de um quarto para um período
   */
  bloquearDisponibilidadePeriodo(quartoId, checkIn, checkOut, motivo = 'Reserva confirmada') {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const currentDate = new Date(checkInDate);
    
    while (currentDate < checkOutDate) {
      const dataStr = currentDate.toISOString().split('T')[0];
      this.atualizarDisponibilidade(quartoId, dataStr, false, true, motivo);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Processar cancelamento de reserva externa
   */
  processarCancelamentoExterno(codigoExterno, canalId) {
    const reserva = this.queryOne(
      'SELECT * FROM reservas_externas WHERE codigo_externo = ? AND canal_id = ?',
      [codigoExterno, canalId]
    );

    if (!reserva) {
      return {
        success: false,
        error: 'Reserva não encontrada'
      };
    }

    // Atualizar status da reserva
    this.execute(
      `UPDATE reservas_externas 
       SET status = 'Cancelado', sync_status = 'Cancelado', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reserva.id]
    );

    // Liberar disponibilidade
    const checkInDate = new Date(reserva.check_in);
    const checkOutDate = new Date(reserva.check_out);
    const currentDate = new Date(checkInDate);
    
    while (currentDate < checkOutDate) {
      const dataStr = currentDate.toISOString().split('T')[0];
      
      // Verificar se não há outras reservas para esta data
      const reservasInternas = this.queryAll(`
        SELECT id FROM reservas 
        WHERE quarto_id = ? 
          AND status IN ('Confirmado', 'Pendente')
          AND ? >= check_in AND ? < check_out
      `, [reserva.quarto_id, dataStr, dataStr]);
      
      const reservasExt = this.queryAll(`
        SELECT id FROM reservas_externas 
        WHERE quarto_id = ? 
          AND status IN ('Confirmado', 'Pendente')
          AND id != ?
          AND ? >= check_in AND ? < check_out
      `, [reserva.quarto_id, reserva.id, dataStr, dataStr]);
      
      if ((!reservasInternas || reservasInternas.length === 0) && 
          (!reservasExt || reservasExt.length === 0)) {
        // Liberar disponibilidade apenas se não houver outras reservas
        this.execute(
          `UPDATE disponibilidade 
           SET disponivel = 1, bloqueado = 0, motivo_bloqueio = NULL, updated_at = CURRENT_TIMESTAMP
           WHERE quarto_id = ? AND data = ?`,
          [reserva.quarto_id, dataStr]
        );
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.logSync(
      canalId,
      'cancelamento',
      'recebido',
      'sucesso',
      null,
      { codigo_externo: codigoExterno },
      null
    );

    return {
      success: true,
      message: 'Cancelamento processado e disponibilidade liberada'
    };
  }

  /**
   * Gerar dados de disponibilidade para enviar ao Channel Manager
   * Formato compatível com Cloudbeds, Smoobu, Beds24
   */
  gerarDadosDisponibilidade(quartoId, checkIn, checkOut) {
    const disponibilidade = this.obterDisponibilidadePeriodo(quartoId, checkIn, checkOut);
    const quarto = this.queryOne('SELECT * FROM quartos WHERE id = ?', [quartoId]);
    const mapping = this.queryOne(
      'SELECT * FROM room_channel_mapping WHERE quarto_id = ? AND sync_ativo = 1',
      [quartoId]
    );

    return {
      room_code: mapping ? mapping.room_code_externo : quarto.id.toString(),
      availability: disponibilidade.map(d => ({
        date: d.data,
        available: d.disponivel,
        price: d.preco,
        min_stay: 1,
        max_stay: null
      }))
    };
  }

}

module.exports = ChannelManager;

