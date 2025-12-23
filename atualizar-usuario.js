// Script para atualizar nome do usuário no banco de dados
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');

async function atualizarUsuario() {
  try {
    console.log('🔍 Verificando banco de dados...\n');
    
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
    
    const email = 'luizmarcosramires@hotmail.com';
    
    // Buscar usuário
    const stmt = db.prepare('SELECT * FROM users_admin WHERE LOWER(email) = ?');
    stmt.bind([email.toLowerCase()]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();
    
    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado!`);
      db.close();
      return;
    }
    
    console.log('👤 Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nome atual: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    
    // Atualizar nome para "Luiz Marcos"
    const updateStmt = db.prepare('UPDATE users_admin SET name = ? WHERE LOWER(email) = ?');
    updateStmt.bind(['Luiz Marcos', email.toLowerCase()]);
    updateStmt.step();
    updateStmt.free();
    
    console.log('\n✅ Nome atualizado para: Luiz Marcos');
    
    // Verificar novamente
    const verifyStmt = db.prepare('SELECT * FROM users_admin WHERE LOWER(email) = ?');
    verifyStmt.bind([email.toLowerCase()]);
    let updatedUser = null;
    if (verifyStmt.step()) {
      updatedUser = verifyStmt.getAsObject();
    }
    verifyStmt.free();
    
    console.log('\n📋 Verificação:');
    console.log(`   Nome: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    
    // Salvar banco
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    
    console.log('\n💾 Banco de dados salvo!');
    
    // Sobre a senha - informar que precisa verificar no código ou resetar
    console.log('\n🔐 INFORMAÇÃO SOBRE A SENHA:');
    console.log('   A senha atual está criptografada no banco de dados.');
    console.log('   Para saber ou alterar a senha, é necessário:');
    console.log('   1. Verificar se há alguma senha padrão configurada no código');
    console.log('   2. Ou usar o script fix-user.js para resetar a senha');
    console.log('   3. Ou resetar via painel admin se houver essa funcionalidade');
    
    db.close();
    
    console.log('\n✅ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// Executar
atualizarUsuario();






