// Script para resetar senha do usuário luizmarcosramires@hotmail.com
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');

async function resetarSenha() {
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
    // Você pode alterar esta senha para a que desejar
    const novaSenha = 'Luizadminramires'; // ALTERE AQUI SE DESEJAR OUTRA SENHA
    
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
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    
    // Criar hash da nova senha
    const hashedPassword = bcrypt.hashSync(novaSenha, 10);
    
    // Atualizar senha
    const updateStmt = db.prepare('UPDATE users_admin SET password = ? WHERE LOWER(email) = ?');
    updateStmt.bind([hashedPassword, email.toLowerCase()]);
    updateStmt.step();
    updateStmt.free();
    
    console.log('\n✅ Senha resetada com sucesso!');
    console.log('\n📋 CREDENCIAIS:');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${novaSenha}`);
    
    // Salvar banco
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    
    console.log('\n💾 Banco de dados salvo!');
    console.log('\n✅ Você pode fazer login com essas credenciais.');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

// Executar
resetarSenha();

