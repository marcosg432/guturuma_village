// Script para visualizar dados do banco SQLite
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');

async function visualizarBanco() {
  try {
    console.log('🔍 Carregando banco de dados...\n');
    
    // Inicializar SQL.js
    const SQL = await initSqlJs();
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Arquivo do banco não encontrado:', dbPath);
      return;
    }
    
    // Carregar banco
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);
    
    console.log('✅ Banco carregado com sucesso!\n');
    console.log('='.repeat(60));
    console.log('📊 RESUMO DO BANCO DE DADOS');
    console.log('='.repeat(60));
    
    // Listar todas as tabelas
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    if (tables.length > 0) {
      console.log('\n📋 TABELAS ENCONTRADAS:');
      tables[0].values.forEach(([tableName]) => {
        console.log(`   - ${tableName}`);
      });
    }
    
    // Estatísticas de cada tabela
    console.log('\n' + '='.repeat(60));
    console.log('📈 ESTATÍSTICAS POR TABELA');
    console.log('='.repeat(60));
    
    if (tables.length > 0) {
      for (const [tableName] of tables[0].values) {
        try {
          const countResult = db.exec(`SELECT COUNT(*) as total FROM ${tableName}`);
          const count = countResult[0]?.values[0]?.[0] || 0;
          console.log(`\n📊 ${tableName.toUpperCase()}: ${count} registro(s)`);
          
          // Mostrar alguns registros de cada tabela
          if (count > 0) {
            const sampleResult = db.exec(`SELECT * FROM ${tableName} LIMIT 5`);
            if (sampleResult.length > 0) {
              const columns = sampleResult[0].columns;
              const rows = sampleResult[0].values;
              
              console.log('   Colunas:', columns.join(', '));
              if (rows.length > 0) {
                console.log('   Primeiros registros:');
                rows.slice(0, 3).forEach((row, idx) => {
                  const rowData = {};
                  columns.forEach((col, i) => {
                    rowData[col] = row[i];
                  });
                  console.log(`   [${idx + 1}]`, JSON.stringify(rowData, null, 2).replace(/\n/g, '\n      '));
                });
                if (rows.length > 3) {
                  console.log(`   ... e mais ${count - 3} registro(s)`);
                }
              }
            }
          }
        } catch (error) {
          console.log(`   ⚠️  Erro ao ler tabela ${tableName}:`, error.message);
        }
      }
    }
    
    // Dados específicos importantes
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DADOS IMPORTANTES');
    console.log('='.repeat(60));
    
    // Reservas recentes
    try {
      const reservas = db.exec(`
        SELECT id, nome_completo, email, telefone, categoria, 
               check_in, check_out, total_noites, valor_total, 
               status, data_reserva 
        FROM reservas 
        ORDER BY data_reserva DESC 
        LIMIT 5
      `);
      
      if (reservas.length > 0 && reservas[0].values.length > 0) {
        console.log('\n📅 ÚLTIMAS 5 RESERVAS:');
        reservas[0].values.forEach((row, idx) => {
          const [id, nome, email, telefone, categoria, checkIn, checkOut, noites, preco, status, createdAt] = row;
          console.log(`\n   Reserva #${id}:`);
          console.log(`   - Nome: ${nome}`);
          console.log(`   - Email: ${email}`);
          console.log(`   - Telefone: ${telefone || 'N/A'}`);
          console.log(`   - Categoria: ${categoria}`);
          console.log(`   - Check-in: ${checkIn} → Check-out: ${checkOut} (${noites} noites)`);
          console.log(`   - Total: R$ ${preco || 'N/A'}`);
          console.log(`   - Status: ${status}`);
          console.log(`   - Criada em: ${createdAt}`);
        });
      } else {
        console.log('\n📅 Nenhuma reserva encontrada');
      }
    } catch (error) {
      console.log('\n⚠️  Erro ao ler reservas:', error.message);
    }
    
    // Mensagens de contato recentes
    try {
      const contatos = db.exec(`
        SELECT id, name, email, phone, message, read_status, created_at 
        FROM contact_messages 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (contatos.length > 0 && contatos[0].values.length > 0) {
        console.log('\n\n📧 ÚLTIMAS 5 MENSAGENS DE CONTATO:');
        contatos[0].values.forEach((row, idx) => {
          const [id, name, email, phone, message, readStatus, createdAt] = row;
          console.log(`\n   Mensagem #${id}:`);
          console.log(`   - Nome: ${name}`);
          console.log(`   - Email: ${email}`);
          console.log(`   - Telefone: ${phone || 'N/A'}`);
          console.log(`   - Lida: ${readStatus ? 'Sim' : 'Não'}`);
          console.log(`   - Mensagem: ${message?.substring(0, 100)}${message?.length > 100 ? '...' : ''}`);
          console.log(`   - Criada em: ${createdAt}`);
        });
      } else {
        console.log('\n📧 Nenhuma mensagem de contato encontrada');
      }
    } catch (error) {
      console.log('\n⚠️  Erro ao ler mensagens de contato:', error.message);
    }
    
    // Usuários admin
    try {
      const admins = db.exec(`
        SELECT id, name, email 
        FROM users_admin
      `);
      
      if (admins.length > 0 && admins[0].values.length > 0) {
        console.log('\n\n👤 USUÁRIOS ADMINISTRATIVOS:');
        admins[0].values.forEach((row) => {
          const [id, name, email] = row;
          console.log(`   - ID ${id}: ${name} (${email})`);
        });
      } else {
        console.log('\n👤 Nenhum usuário admin encontrado');
      }
    } catch (error) {
      console.log('\n⚠️  Erro ao ler usuários admin:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Visualização concluída!');
    console.log('='.repeat(60));
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro ao visualizar banco:', error);
    process.exit(1);
  }
}

// Executar
visualizarBanco();

