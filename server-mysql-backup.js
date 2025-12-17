const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'brisa_imperial_secret_key_2024';

// Configuração MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'brisa_imperial',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexões MySQL
let pool;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Headers anti-cache para atualização automática
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static('public', {
  etag: false,
  lastModified: false
}));

// Inicializar banco de dados
async function initDatabase() {
  try {
    // Criar conexão sem database para criar o database se não existir
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();

    // Criar pool de conexões
    pool = mysql.createPool(dbConfig);

    // Criar tabelas
    await createTables();
    await insertDefaultData();

    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error.message);
    console.warn('⚠️  Servidor continuará rodando sem banco de dados. Algumas funcionalidades podem não funcionar.');
    pool = null; // Define pool como null para indicar que não há conexão
  }
}

async function createTables() {
  const connection = await pool.getConnection();
  
  try {
    // Tabela users_admin
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users_admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        two_factor_code VARCHAR(6),
        two_factor_expires_at DATETIME
      )
    `);

    // Tabela allowed_emails
    await connection.query(`
      CREATE TABLE IF NOT EXISTS allowed_emails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL
      )
    `);

    // Tabela pages
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_name VARCHAR(255) UNIQUE NOT NULL,
        html_content LONGTEXT
      )
    `);

    // Tabela services
    await connection.query(`
      CREATE TABLE IF NOT EXISTS services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(500)
      )
    `);

    // Tabela appointments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        service_id INT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
      )
    `);

    // Tabela contact_messages
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        message TEXT NOT NULL,
        read_status BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabelas antigas (para compatibilidade)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quartos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoria VARCHAR(255) NOT NULL,
        numero INT NOT NULL,
        capacidade INT NOT NULL,
        vista VARCHAR(255) NOT NULL,
        disponivel BOOLEAN DEFAULT TRUE,
        preco_base DECIMAL(10, 2) NOT NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nome_completo VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telefone VARCHAR(50),
        quarto_id INT,
        categoria VARCHAR(255) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        num_hospedes INT NOT NULL,
        valor_quarto DECIMAL(10, 2) NOT NULL,
        adicionais TEXT,
        valor_adicionais DECIMAL(10, 2) DEFAULT 0,
        desconto DECIMAL(10, 2) DEFAULT 0,
        valor_total DECIMAL(10, 2) NOT NULL,
        metodo_pagamento VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Confirmado',
        data_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chave VARCHAR(255) UNIQUE NOT NULL,
        valor TEXT NOT NULL
      )
    `);

    // Tabela de bloqueios de quartos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bloqueios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quarto_id INT,
        categoria VARCHAR(255) NOT NULL,
        data_inicio DATE NOT NULL,
        data_fim DATE NOT NULL,
        motivo TEXT,
        criado_por INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE CASCADE,
        FOREIGN KEY (criado_por) REFERENCES users_admin(id) ON DELETE SET NULL
      )
    `);

    // Tabela de histórico de check-in e check-out
    await connection.query(`
      CREATE TABLE IF NOT EXISTS historico_check (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reserva_id INT NOT NULL,
        tipo ENUM('check_in', 'check_out') NOT NULL,
        data_hora DATETIME NOT NULL,
        observacoes TEXT,
        realizado_por INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
        FOREIGN KEY (realizado_por) REFERENCES users_admin(id) ON DELETE SET NULL
      )
    `);

    // Tabela de dados dos hóspedes (expansão)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hospedes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reserva_id INT NOT NULL,
        nome_completo VARCHAR(255) NOT NULL,
        documento VARCHAR(50),
        telefone VARCHAR(50),
        email VARCHAR(255),
        data_nascimento DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
      )
    `);

    // Índices para melhor performance
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_reservas_check_in ON reservas(check_in)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_reservas_check_out ON reservas(check_out)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_bloqueios_datas ON bloqueios(data_inicio, data_fim)`);
    await connection.query(`CREATE INDEX IF NOT EXISTS idx_historico_reserva ON historico_check(reserva_id)`);

  } finally {
    connection.release();
  }
}

async function insertDefaultData() {
  const connection = await pool.getConnection();
  
  try {
    // Admin padrão
    const adminPassword = await bcrypt.hash('Boob.08.', 10);
    await connection.query(`
      INSERT IGNORE INTO users_admin (name, email, password) 
      VALUES (?, ?, ?)
    `, ['Administrador', 'murilodiasms15@gmail.com', adminPassword]);

    // Email autorizado
    await connection.query(`
      INSERT IGNORE INTO allowed_emails (name, email) 
      VALUES (?, ?)
    `, ['Administrador', 'murilodiasms15@gmail.com']);

    // Quartos
    const categorias = [
      { nome: 'Suíte Harmonia', quantidade: 20, capacidade: 3, vista: 'jardim', preco: 350 },
      { nome: 'Suíte Orquídea Premium', quantidade: 20, capacidade: 4, vista: 'piscina', preco: 550 },
      { nome: 'Suíte Imperial Master', quantidade: 10, capacidade: 6, vista: 'mar', preco: 950 }
    ];

    for (const cat of categorias) {
      for (let i = 1; i <= cat.quantidade; i++) {
        const numero = (categorias.indexOf(cat) * 100) + i;
        await connection.query(`
          INSERT IGNORE INTO quartos (categoria, numero, capacidade, vista, preco_base) 
          VALUES (?, ?, ?, ?, ?)
        `, [cat.nome, numero, cat.capacidade, cat.vista, cat.preco]);
      }
    }

    // Configurações padrão
    const configs = [
      ['preco_harmonia', '350'],
      ['preco_orquidea', '550'],
      ['preco_imperial', '950'],
      ['preco_passeio', '150'],
      ['preco_romantico', '200'],
      ['preco_upgrade_vista', '80'],
      ['preco_cama_extra', '50'],
      ['preco_decoracao', '100']
    ];

    for (const [chave, valor] of configs) {
      await connection.query(`
        INSERT IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)
      `, [chave, valor]);
    }

  } finally {
    connection.release();
  }
}

// Configurar email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'murilodiasms15@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'sua_senha_app_gmail'
  }
});

// Função para gerar código 2FA
function generate2FACode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Função para enviar código 2FA
async function send2FACode(email, code) {
  try {
    await transporter.sendMail({
      from: 'murilodiasms15@gmail.com',
      to: 'murilodiasms15@gmail.com',
      subject: 'Código de Verificação 2FA - Brisa Imperial',
      html: `
        <h2>Código de Verificação</h2>
        <p>Seu código de verificação é: <strong>${code}</strong></p>
        <p>Este código expira em 10 minutos.</p>
      `
    });
  } catch (error) {
    console.error('Erro ao enviar email 2FA:', error);
  }
}

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// ROTAS PÚBLICAS

// Home - com suporte a páginas dinâmicas
app.get('/', async (req, res) => {
  try {
    // Verificar se o banco de dados está disponível
    if (!pool) {
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT html_content FROM pages WHERE page_name = ?',
      ['home']
    );
    connection.release();

    if (rows.length > 0 && rows[0].html_content) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(rows[0].html_content);
    } else {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  } catch (error) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Páginas estáticas específicas
app.get('/quartos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quartos.html'));
});

app.get('/reserva', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reserva.html'));
});

app.get('/contato', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contato.html'));
});

app.get('/sobre', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sobre.html'));
});

app.get('/suite.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'suite.html'));
});

app.get('/agendamento', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agendamento.html'));
});

// Painel admin (deve vir antes da rota genérica)
app.get('/painel-brisa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/painel-brisa/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// Páginas dinâmicas (deve vir depois das rotas estáticas)
app.get('/:page', async (req, res) => {
  const pageName = req.params.page;
  
  // Ignorar rotas do painel admin
  if (pageName === 'painel-brisa' || pageName.startsWith('painel-brisa')) {
    return res.status(404).send('Página não encontrada');
  }
  
  // Tentar buscar página dinâmica
  try {
    // Verificar se o banco de dados está disponível
    if (!pool) {
      return res.status(404).send('Página não encontrada');
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT html_content FROM pages WHERE page_name = ?',
      [pageName]
    );
    connection.release();

    if (rows.length > 0 && rows[0].html_content) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(rows[0].html_content);
    } else {
      res.status(404).send('Página não encontrada');
    }
  } catch (error) {
    res.status(404).send('Página não encontrada');
  }
});

// Ficha de Reserva
app.get('/ficha/:codigo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ficha.html'));
});

// API - Listar serviços
app.get('/api/services', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM services ORDER BY name');
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Criar agendamento
app.post('/api/appointments', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { full_name, email, phone, service_id, date, time, note } = req.body;

    if (!full_name || !email || !service_id || !date || !time) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome completo, email, serviço, data e horário' });
    }

    // Validar nome completo (deve ter pelo menos nome e sobrenome)
    const nameParts = full_name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return res.status(400).json({ error: 'Nome completo deve conter pelo menos nome e sobrenome' });
    }

    // Verificar se já existe agendamento no mesmo horário
    const connection = await pool.getConnection();
    const [existing] = await connection.query(
      'SELECT * FROM appointments WHERE date = ? AND time = ?',
      [date, time]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'Horário já está ocupado' });
    }

    await connection.query(
      'INSERT INTO appointments (full_name, email, phone, service_id, date, time, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, phone, service_id, date, time, note || null]
    );
    connection.release();

    res.json({ success: true, message: 'Agendamento criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Função auxiliar para verificar disponibilidade considerando reservas e bloqueios
async function verificarDisponibilidade(quartoId, categoria, checkIn, checkOut, connection) {
  // Verificar reservas ativas
  const [reservas] = await connection.query(`
    SELECT * FROM reservas 
    WHERE quarto_id = ? 
    AND status NOT IN ('Concluído', 'Cancelado')
    AND (
      (check_in <= ? AND check_out >= ?) OR
      (check_in <= ? AND check_out >= ?) OR
      (check_in >= ? AND check_out <= ?)
    )
  `, [quartoId, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]);

  if (reservas.length > 0) {
    return false;
  }

  // Verificar bloqueios
  const [bloqueios] = await connection.query(`
    SELECT * FROM bloqueios 
    WHERE (quarto_id = ? OR categoria = ?)
    AND (
      (data_inicio <= ? AND data_fim >= ?) OR
      (data_inicio <= ? AND data_fim >= ?) OR
      (data_inicio >= ? AND data_fim <= ?)
    )
  `, [quartoId, categoria, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut]);

  if (bloqueios.length > 0) {
    return false;
  }

  return true;
}

// API - Listar quartos disponíveis
app.get('/api/quartos/:categoria', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { categoria } = req.params;
    const { check_in, check_out } = req.query;

    const connection = await pool.getConnection();
    
    try {
      let query = 'SELECT * FROM quartos WHERE categoria = ? AND disponivel = TRUE';
      let params = [categoria];

      if (check_in && check_out) {
        // Buscar todos os quartos da categoria
        const [todosQuartos] = await connection.query('SELECT * FROM quartos WHERE categoria = ? AND disponivel = TRUE', [categoria]);
        
        // Verificar disponibilidade de cada quarto
        const quartosDisponiveis = [];
        for (const quarto of todosQuartos) {
          const disponivel = await verificarDisponibilidade(quarto.id, categoria, check_in, check_out, connection);
          if (disponivel) {
            quartosDisponiveis.push(quarto);
          }
        }
        
        connection.release();
        return res.json(quartosDisponiveis);
      }

      const [rows] = await connection.query(query, params);
      connection.release();
      res.json(rows);
    } catch (error) {
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Criar reserva
app.post('/api/reserva', async (req, res) => {
  try {
    const {
      nome_completo,
      email,
      telefone,
      categoria,
      check_in,
      check_out,
      num_hospedes,
      adicionais,
      metodo_pagamento,
      cupom
    } = req.body;

    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const connection = await pool.getConnection();

    // Buscar quartos da categoria
    const [todosQuartos] = await connection.query(
      'SELECT * FROM quartos WHERE categoria = ? AND disponivel = TRUE',
      [categoria]
    );

    // Verificar disponibilidade considerando reservas e bloqueios
    let quartoDisponivel = null;
    for (const quarto of todosQuartos) {
      const disponivel = await verificarDisponibilidade(quarto.id, categoria, check_in, check_out, connection);
      if (disponivel) {
        quartoDisponivel = quarto;
        break;
      }
    }

    if (!quartoDisponivel) {
      connection.release();
      return res.status(400).json({ error: 'Nenhum quarto disponível para essas datas' });
    }

    const quarto = quartoDisponivel;
    let valorQuarto = parseFloat(quarto.preco_base);

    // Calcular noites
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const noites = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    valorQuarto *= noites;

    // Calcular adicionais
    let valorAdicionais = 0;
    const adicionaisArray = Array.isArray(adicionais) ? adicionais : [];
    
    const [precos] = await connection.query('SELECT chave, valor FROM configuracoes WHERE chave LIKE ?', ['preco_%']);
    const precoMap = {};
    precos.forEach(p => {
      const chave = p.chave.replace('preco_', '');
      precoMap[chave] = parseFloat(p.valor);
    });

    adicionaisArray.forEach(adicional => {
      if (adicional === 'passeio') valorAdicionais += precoMap.passeio || 150;
      if (adicional === 'romantico') valorAdicionais += precoMap.romantico || 200;
      if (adicional === 'upgrade_vista') valorAdicionais += precoMap.upgrade_vista || 80;
      if (adicional === 'cama_extra') valorAdicionais += precoMap.cama_extra || 50;
      if (adicional === 'decoracao') valorAdicionais += precoMap.decoracao || 100;
    });

    // Aplicar cupom
    let desconto = 0;
    if (cupom === 'BRISA10') desconto = (valorQuarto + valorAdicionais) * 0.10;
    if (cupom === 'BRISA20') desconto = (valorQuarto + valorAdicionais) * 0.20;

    const valorTotal = valorQuarto + valorAdicionais - desconto;
    const codigo = 'BR' + Date.now().toString().slice(-8);

    // Inserir reserva
    const [result] = await connection.query(`
      INSERT INTO reservas (
        codigo, nome_completo, email, telefone, quarto_id, categoria,
        check_in, check_out, num_hospedes, valor_quarto, adicionais,
        valor_adicionais, desconto, valor_total, metodo_pagamento, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, nome_completo, email, telefone, quarto.id, categoria,
      check_in, check_out, num_hospedes, valorQuarto, JSON.stringify(adicionaisArray),
      valorAdicionais, desconto, valorTotal, metodo_pagamento, 'Confirmado'
    ]);

    connection.release();

    // Enviar email de confirmação
    try {
      await transporter.sendMail({
        from: 'murilodiasms15@gmail.com',
        to: email,
        subject: `Confirmação de Reserva - ${codigo}`,
        html: `
          <h2>Reserva Confirmada - Brisa Imperial Resort</h2>
          <p><strong>Código da Reserva:</strong> ${codigo}</p>
          <p><strong>Nome:</strong> ${nome_completo}</p>
          <p><strong>Categoria:</strong> ${categoria}</p>
          <p><strong>Quarto:</strong> ${quarto.numero}</p>
          <p><strong>Check-in:</strong> ${check_in}</p>
          <p><strong>Check-out:</strong> ${check_out}</p>
          <p><strong>Hóspedes:</strong> ${num_hospedes}</p>
          <p><strong>Valor Total:</strong> R$ ${valorTotal.toFixed(2)}</p>
          <p>Acesse sua ficha em: ${req.protocol}://${req.get('host')}/ficha/${codigo}</p>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    res.json({
      success: true,
      codigo,
      reserva_id: result.insertId,
      valor_total: valorTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Buscar reserva por código
app.get('/api/reserva/:codigo', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { codigo } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE r.codigo = ?
    `, [codigo]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const reserva = rows[0];
    reserva.adicionais = JSON.parse(reserva.adicionais || '[]');
    res.json(reserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Enviar mensagem de contato
app.post('/api/contato', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email e mensagem' });
    }

    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, message]
    );
    connection.release();

    res.json({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Função para atualizar status automático de reservas (executar periodicamente)
async function atualizarStatusReservas() {
  if (!pool) return;
  
  try {
    const connection = await pool.getConnection();
    const hoje = new Date().toISOString().split('T')[0];
    
    // Atualizar reservas com check-out passado para "Concluído"
    await connection.query(`
      UPDATE reservas 
      SET status = 'Concluído' 
      WHERE status NOT IN ('Concluído', 'Cancelado') 
      AND check_out < ?
    `, [hoje]);
    
    connection.release();
  } catch (error) {
    console.error('Erro ao atualizar status das reservas:', error);
  }
}

// Executar atualização a cada hora
setInterval(atualizarStatusReservas, 60 * 60 * 1000);
// Executar imediatamente ao iniciar
atualizarStatusReservas();

// ROTAS ADMINISTRATIVAS

// Login - Passo 1: Verificar email e senha
app.post('/api/admin/login', async (req, res) => {
  try {
    // Verificar se o banco de dados está disponível
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível. Por favor, configure o MySQL e reinicie o servidor.' });
    }

    const { email, password } = req.body;

    const connection = await pool.getConnection();
    
    // Verificar se email está autorizado
    const [allowed] = await connection.query(
      'SELECT * FROM allowed_emails WHERE email = ?',
      [email]
    );

    if (allowed.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Email não autorizado' });
    }

    // Verificar credenciais
    const [admins] = await connection.query(
      'SELECT * FROM users_admin WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const admin = admins[0];
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      connection.release();
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar e enviar código 2FA
    const code = generate2FACode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await connection.query(
      'UPDATE users_admin SET two_factor_code = ?, two_factor_expires_at = ? WHERE id = ?',
      [code, expiresAt, admin.id]
    );

    await send2FACode(email, code);
    connection.release();

    res.json({ 
      success: true, 
      message: 'Código 2FA enviado para seu email',
      requires2FA: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login - Passo 2: Verificar código 2FA
app.post('/api/admin/verify-2fa', async (req, res) => {
  try {
    // Verificar se o banco de dados está disponível
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível. Por favor, configure o MySQL e reinicie o servidor.' });
    }

    const { email, code } = req.body;

    const connection = await pool.getConnection();
    const [admins] = await connection.query(
      'SELECT * FROM users_admin WHERE email = ? AND two_factor_code = ? AND two_factor_expires_at > NOW()',
      [email, code]
    );

    if (admins.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Código inválido ou expirado' });
    }

    const admin = admins[0];

    // Limpar código 2FA
    await connection.query(
      'UPDATE users_admin SET two_factor_code = NULL, two_factor_expires_at = NULL WHERE id = ?',
      [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    connection.release();
    res.json({ token, user: { id: admin.id, email: admin.email, name: admin.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Lista de ocupação
app.get('/api/admin/ocupacao', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE r.status != 'Concluído'
      ORDER BY r.check_in ASC
    `);
    connection.release();

    rows.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Listar todas as reservas
app.get('/api/admin/reservas', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { mes, nome, categoria, status } = req.query;
    
    const connection = await pool.getConnection();
    let query = `
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE 1=1
    `;
    const params = [];

    if (mes) {
      query += ` AND MONTH(r.data_reserva) = ?`;
      params.push(parseInt(mes));
    }
    if (nome) {
      query += ` AND r.nome_completo LIKE ?`;
      params.push(`%${nome}%`);
    }
    if (categoria) {
      query += ` AND r.categoria = ?`;
      params.push(categoria);
    }
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY r.data_reserva DESC`;

    const [rows] = await connection.query(query, params);
    connection.release();

    rows.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Buscar agendamentos por nome (com histórico)
app.get('/api/admin/appointments', authenticateToken, async (req, res) => {
  try {
    const { nome, data } = req.query;
    const connection = await pool.getConnection();
    
    let query = `
      SELECT a.*, s.name as service_name, s.price as service_price
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (nome) {
      query += ` AND a.full_name LIKE ?`;
      params.push(`%${nome}%`);
    }
    if (data) {
      query += ` AND a.date = ?`;
      params.push(data);
    }

    query += ` ORDER BY a.date DESC, a.time DESC`;

    const [rows] = await connection.query(query, params);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Atualizar status da reserva
app.put('/api/admin/reserva/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome_completo, 
      email, 
      telefone, 
      categoria, 
      quarto_id, 
      num_hospedes, 
      check_in, 
      check_out, 
      adicionais, 
      status,
      valor_total
    } = req.body;

    const connection = await pool.getConnection();
    
    // Preparar dados para atualização
    const updateFields = [];
    const updateValues = [];

    if (nome_completo !== undefined) {
      updateFields.push('nome_completo = ?');
      updateValues.push(nome_completo);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (telefone !== undefined) {
      updateFields.push('telefone = ?');
      updateValues.push(telefone);
    }
    if (categoria !== undefined) {
      updateFields.push('categoria = ?');
      updateValues.push(categoria);
    }
    if (quarto_id !== undefined && quarto_id !== null && quarto_id !== '') {
      updateFields.push('quarto_id = ?');
      updateValues.push(parseInt(quarto_id));
    }
    if (num_hospedes !== undefined) {
      updateFields.push('num_hospedes = ?');
      updateValues.push(parseInt(num_hospedes));
    }
    if (check_in !== undefined) {
      updateFields.push('check_in = ?');
      updateValues.push(check_in);
    }
    if (check_out !== undefined) {
      updateFields.push('check_out = ?');
      updateValues.push(check_out);
    }
    if (adicionais !== undefined) {
      updateFields.push('adicionais = ?');
      updateValues.push(JSON.stringify(Array.isArray(adicionais) ? adicionais : []));
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (valor_total !== undefined && valor_total !== null && valor_total !== '') {
      updateFields.push('valor_total = ?');
      updateValues.push(parseFloat(valor_total));
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updateValues.push(id);
    const query = `UPDATE reservas SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await connection.query(query, updateValues);
    connection.release();

    res.json({ success: true, message: 'Reserva atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Clientes chegando hoje
app.get('/api/admin/chegadas-hoje', authenticateToken, async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE DATE(r.check_in) = ? AND r.status != 'Concluído'
      ORDER BY r.check_in ASC
    `, [hoje]);
    connection.release();

    rows.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Relatório de vendas
app.get('/api/admin/relatorio-vendas', authenticateToken, async (req, res) => {
  try {
    const { mes } = req.query;
    const connection = await pool.getConnection();

    let query = `
      SELECT 
        COUNT(*) as total_reservas,
        SUM(valor_total) as total_vendido,
        AVG(valor_total) as ticket_medio,
        categoria,
        COUNT(*) as quantidade_categoria
      FROM reservas 
      WHERE 1=1
    `;
    const params = [];

    if (mes) {
      query += ` AND MONTH(data_reserva) = ?`;
      params.push(parseInt(mes));
    }

    query += ` GROUP BY categoria`;

    const [rows] = await connection.query(query, params);

    // Calcular totais
    let totalQuery = `
      SELECT 
        COUNT(*) as total_reservas,
        SUM(valor_total) as total_vendido,
        AVG(valor_total) as ticket_medio
      FROM reservas 
      WHERE 1=1
    `;
    const totalParams = [];

    if (mes) {
      totalQuery += ` AND MONTH(data_reserva) = ?`;
      totalParams.push(parseInt(mes));
    }

    const [totals] = await connection.query(totalQuery, totalParams);
    connection.release();

    res.json({
      resumo: totals[0] || { total_reservas: 0, total_vendido: 0, ticket_medio: 0 },
      por_categoria: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Configurações
app.get('/api/admin/configuracoes', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM configuracoes');
    connection.release();

    const config = {};
    rows.forEach(row => {
      config[row.chave] = row.valor;
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/configuracoes', authenticateToken, async (req, res) => {
  try {
    const configs = req.body;
    const connection = await pool.getConnection();

    for (const [chave, valor] of Object.entries(configs)) {
      await connection.query(
        'UPDATE configuracoes SET valor = ? WHERE chave = ?',
        [valor, chave]
      );
    }

    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Páginas
app.get('/api/admin/pages', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT id, page_name FROM pages ORDER BY page_name');
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM pages WHERE id = ?', [id]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/pages', authenticateToken, async (req, res) => {
  try {
    const { page_name, html_content } = req.body;

    if (!page_name) {
      return res.status(400).json({ error: 'Nome da página é obrigatório' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO pages (page_name, html_content) VALUES (?, ?)',
      [page_name, html_content || '']
    );
    connection.release();

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Já existe uma página com este nome' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.put('/api/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { page_name, html_content } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE pages SET page_name = ?, html_content = ? WHERE id = ?',
      [page_name, html_content || '', id]
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM pages WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Funcionários (allowed_emails)
app.get('/api/admin/funcionarios', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM allowed_emails ORDER BY name');
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/funcionarios', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validação
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Nome é obrigatório e deve ser um texto válido' });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Email é obrigatório e deve ser um texto válido' });
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.query(
        'INSERT INTO allowed_emails (name, email) VALUES (?, ?)',
        [name.trim(), email.trim().toLowerCase()]
      );
      
      connection.release();
      res.json({ success: true, id: result.insertId, message: 'Funcionário adicionado com sucesso' });
    } catch (dbError) {
      connection.release();
      
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Este email já está cadastrado' });
      }
      
      console.error('Erro ao inserir funcionário no banco:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao adicionar funcionário:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Este email já está cadastrado' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor. Por favor, tente novamente.' });
  }
});

app.delete('/api/admin/funcionarios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM allowed_emails WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Serviços
app.get('/api/admin/services', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM services ORDER BY name');
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/services', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO services (name, description, price, image_url) VALUES (?, ?, ?, ?)',
      [name, description || null, price, image_url || null]
    );
    connection.release();

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image_url } = req.body;

    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE services SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?',
      [name, description || null, price, image_url || null, id]
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM services WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Agendamentos
app.get('/api/admin/appointments', authenticateToken, async (req, res) => {
  try {
    const { nome, data } = req.query;
    const connection = await pool.getConnection();
    
    let query = `
      SELECT a.*, s.name as service_name, s.price as service_price
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (nome) {
      query += ` AND a.full_name LIKE ?`;
      params.push(`%${nome}%`);
    }
    if (data) {
      query += ` AND a.date = ?`;
      params.push(data);
    }

    query += ` ORDER BY a.date DESC, a.time DESC`;

    const [rows] = await connection.query(query, params);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM appointments WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Mensagens de Contato
app.get('/api/admin/messages', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE contact_messages SET read_status = TRUE WHERE id = ?',
      [id]
    );
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM contact_messages WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Dashboard (métricas em tempo real)
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const connection = await pool.getConnection();
    const hoje = new Date().toISOString().split('T')[0];

    // Total de reservas confirmadas
    const [confirmadas] = await connection.query(`
      SELECT COUNT(*) as total FROM reservas WHERE status = 'Confirmado'
    `);

    // Reservas pendentes
    const [pendentes] = await connection.query(`
      SELECT COUNT(*) as total FROM reservas WHERE status = 'Pendente'
    `);

    // Taxa de ocupação (quartos ocupados hoje / total de quartos)
    const [ocupadosHoje] = await connection.query(`
      SELECT COUNT(DISTINCT quarto_id) as total FROM reservas 
      WHERE status NOT IN ('Concluído', 'Cancelado')
      AND check_in <= ? AND check_out >= ?
    `, [hoje, hoje]);

    const [totalQuartos] = await connection.query(`
      SELECT COUNT(*) as total FROM quartos WHERE disponivel = TRUE
    `);

    const taxaOcupacao = totalQuartos[0].total > 0 
      ? ((ocupadosHoje[0].total / totalQuartos[0].total) * 100).toFixed(2)
      : 0;

    // Total faturado (reservas confirmadas e concluídas)
    const [faturado] = await connection.query(`
      SELECT COALESCE(SUM(valor_total), 0) as total FROM reservas 
      WHERE status IN ('Confirmado', 'Concluído')
    `);

    // Reservas do mês atual
    const [mesAtual] = await connection.query(`
      SELECT COUNT(*) as total, COALESCE(SUM(valor_total), 0) as faturado 
      FROM reservas 
      WHERE MONTH(data_reserva) = MONTH(CURRENT_DATE()) 
      AND YEAR(data_reserva) = YEAR(CURRENT_DATE())
      AND status IN ('Confirmado', 'Concluído')
    `);

    connection.release();

    res.json({
      reservasConfirmadas: confirmadas[0].total || 0,
      reservasPendentes: pendentes[0].total || 0,
      taxaOcupacao: parseFloat(taxaOcupacao),
      totalFaturado: parseFloat(faturado[0].total || 0),
      mesAtual: {
        reservas: mesAtual[0].total || 0,
        faturado: parseFloat(mesAtual[0].faturado || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Quartos Reservados
app.get('/api/admin/quartos-reservados', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT r.*, q.numero as quarto_numero, q.categoria as quarto_categoria
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.status NOT IN ('Concluído', 'Cancelado')
      ORDER BY r.check_in ASC
    `);
    connection.release();

    rows.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Bloqueios
app.get('/api/admin/bloqueios', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT b.*, q.numero as quarto_numero, q.categoria as quarto_categoria,
             u.name as criado_por_nome
      FROM bloqueios b
      LEFT JOIN quartos q ON b.quarto_id = q.id
      LEFT JOIN users_admin u ON b.criado_por = u.id
      ORDER BY b.data_inicio DESC
    `);
    connection.release();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/bloqueios', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { quarto_id, categoria, data_inicio, data_fim, motivo } = req.body;

    if (!categoria || !data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Campos obrigatórios: categoria, data_inicio e data_fim' });
    }

    if (new Date(data_inicio) >= new Date(data_fim)) {
      return res.status(400).json({ error: 'Data de início deve ser anterior à data de fim' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(`
      INSERT INTO bloqueios (quarto_id, categoria, data_inicio, data_fim, motivo, criado_por)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [quarto_id || null, categoria, data_inicio, data_fim, motivo || null, req.user.id]);

    connection.release();

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/bloqueios/:id', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query('DELETE FROM bloqueios WHERE id = ?', [id]);
    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Histórico de Check-in/Check-out
app.get('/api/admin/historico-check', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { reserva_id } = req.query;
    const connection = await pool.getConnection();
    
    let query = `
      SELECT h.*, r.codigo as reserva_codigo, r.nome_completo,
             u.name as realizado_por_nome
      FROM historico_check h
      LEFT JOIN reservas r ON h.reserva_id = r.id
      LEFT JOIN users_admin u ON h.realizado_por = u.id
      WHERE 1=1
    `;
    const params = [];

    if (reserva_id) {
      query += ' AND h.reserva_id = ?';
      params.push(reserva_id);
    }

    query += ' ORDER BY h.data_hora DESC';

    const [rows] = await connection.query(query, params);
    connection.release();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/check-in-out', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { reserva_id, tipo, observacoes } = req.body;

    if (!reserva_id || !tipo || !['check_in', 'check_out'].includes(tipo)) {
      return res.status(400).json({ error: 'Campos obrigatórios: reserva_id e tipo (check_in ou check_out)' });
    }

    const connection = await pool.getConnection();
    
    // Registrar no histórico
    await connection.query(`
      INSERT INTO historico_check (reserva_id, tipo, data_hora, observacoes, realizado_por)
      VALUES (?, ?, NOW(), ?, ?)
    `, [reserva_id, tipo, observacoes || null, req.user.id]);

    // Se for check-out, atualizar status da reserva
    if (tipo === 'check_out') {
      await connection.query(`
        UPDATE reservas SET status = 'Concluído' WHERE id = ?
      `, [reserva_id]);
    }

    connection.release();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerar link WhatsApp (público - usando código da reserva)
app.get('/api/whatsapp/:codigo', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { codigo } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(`
      SELECT r.*, q.numero as quarto_numero
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.codigo = ?
    `, [codigo]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const reserva = rows[0];
    const telefone = reserva.telefone?.replace(/\D/g, '') || '';
    
    if (!telefone) {
      return res.status(400).json({ error: 'Telefone não cadastrado para esta reserva' });
    }

    // Montar mensagem
    const adicionais = JSON.parse(reserva.adicionais || '[]');
    const adicionaisTexto = adicionais.length > 0 
      ? `\n*Adicionais:* ${adicionais.map(a => {
          const map = { 'passeio': 'Passeio Turístico', 'romantico': 'Pacote Romântico', 'upgrade_vista': 'Upgrade de Vista', 'cama_extra': 'Cama Extra', 'decoracao': 'Decoração Especial' };
          return map[a] || a;
        }).join(', ')}`
      : '';

    const mensagem = encodeURIComponent(
      `Olá ${reserva.nome_completo}!\n\n` +
      `*Confirmação de Reserva - Brisa Imperial Resort*\n\n` +
      `*Código:* ${reserva.codigo}\n` +
      `*Quarto:* ${reserva.quarto_numero || reserva.categoria}\n` +
      `*Check-in:* ${reserva.check_in}\n` +
      `*Check-out:* ${reserva.check_out}\n` +
      `*Hóspedes:* ${reserva.num_hospedes}\n` +
      `*Valor Total:* R$ ${parseFloat(reserva.valor_total).toFixed(2)}\n` +
      `*Status:* ${reserva.status}${adicionaisTexto}\n\n` +
      `Obrigado por escolher o Brisa Imperial Resort!`
    );

    const whatsappLink = `https://wa.me/55${telefone}?text=${mensagem}`;

    res.json({ 
      success: true, 
      link: whatsappLink,
      telefone: reserva.telefone,
      mensagem: decodeURIComponent(mensagem)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerar link WhatsApp (admin - usando ID da reserva)
app.get('/api/admin/whatsapp/:reserva_id', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { reserva_id } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(`
      SELECT r.*, q.numero as quarto_numero
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.id = ?
    `, [reserva_id]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const reserva = rows[0];
    const telefone = reserva.telefone?.replace(/\D/g, '') || '';
    
    if (!telefone) {
      return res.status(400).json({ error: 'Telefone não cadastrado para esta reserva' });
    }

    // Montar mensagem
    const adicionais = JSON.parse(reserva.adicionais || '[]');
    const adicionaisTexto = adicionais.length > 0 
      ? `\n*Adicionais:* ${adicionais.join(', ')}`
      : '';

    const mensagem = encodeURIComponent(
      `Olá ${reserva.nome_completo}!\n\n` +
      `*Confirmação de Reserva - Brisa Imperial Resort*\n\n` +
      `*Código:* ${reserva.codigo}\n` +
      `*Quarto:* ${reserva.quarto_numero || reserva.categoria}\n` +
      `*Check-in:* ${reserva.check_in}\n` +
      `*Check-out:* ${reserva.check_out}\n` +
      `*Hóspedes:* ${reserva.num_hospedes}\n` +
      `*Valor Total:* R$ ${parseFloat(reserva.valor_total).toFixed(2)}\n` +
      `*Status:* ${reserva.status}${adicionaisTexto}\n\n` +
      `Obrigado por escolher o Brisa Imperial Resort!`
    );

    const whatsappLink = `https://wa.me/55${telefone}?text=${mensagem}`;

    res.json({ 
      success: true, 
      link: whatsappLink,
      telefone: reserva.telefone,
      mensagem: decodeURIComponent(mensagem)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    if (!pool) {
      console.warn('⚠️  ATENÇÃO: Banco de dados não disponível. Instale e configure o MySQL para funcionalidades completas.');
    }
  });
}).catch((error) => {
  console.error('Erro ao inicializar:', error);
  // Inicia o servidor mesmo sem banco de dados para servir arquivos estáticos
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} (modo limitado - sem banco de dados)`);
    console.log(`Acesse: http://localhost:${PORT}`);
    console.warn('⚠️  ATENÇÃO: Banco de dados não disponível. Instale e configure o MySQL para funcionalidades completas.');
  });
});
