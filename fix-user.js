// Script para criar/atualizar usuário admin diretamente
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');
const dbDir = path.join(__dirname, 'database');

async function fixUser() {
  try {
    // Inicializar SQL.js
    const SQL = await initSqlJs();
    
    // Carregar banco
    let db;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('📂 Banco de dados carregado');
    } else {
      console.log('❌ Banco de dados não encontrado!');
      return;
    }

    const email = 'murilodiasms15@gmail.com';
    const password = 'Boob.08.';
    const name = 'Murilo Dias';

    // Verificar se usuário existe
    const stmt = db.prepare('SELECT * FROM users_admin WHERE LOWER(email) = ?');
    stmt.bind([email.toLowerCase()]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();

    console.log('\n🔍 Usuário encontrado:', user ? 'SIM' : 'NÃO');
    if (user) {
      console.log('   ID:', user.id);
      console.log('   Nome:', user.name);
      console.log('   Email:', user.email);
      console.log('   Tem senha:', !!user.password);
    }

    // Criar hash da senha
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log('\n🔐 Hash da senha criado');

    if (user) {
      // Atualizar usuário existente
      console.log('\n🔄 Atualizando usuário existente...');
      const updateStmt = db.prepare('UPDATE users_admin SET name = ?, password = ? WHERE LOWER(email) = ?');
      updateStmt.bind([name, hashedPassword, email.toLowerCase()]);
      updateStmt.step();
      updateStmt.free();
      console.log('✅ Usuário atualizado!');
    } else {
      // Criar novo usuário
      console.log('\n➕ Criando novo usuário...');
      const insertStmt = db.prepare('INSERT INTO users_admin (name, email, password) VALUES (?, ?, ?)');
      insertStmt.bind([name, email, hashedPassword]);
      insertStmt.step();
      insertStmt.free();
      console.log('✅ Usuário criado!');
    }

    // Verificar novamente
    const verifyStmt = db.prepare('SELECT * FROM users_admin WHERE LOWER(email) = ?');
    verifyStmt.bind([email.toLowerCase()]);
    let verifyUser = null;
    if (verifyStmt.step()) {
      verifyUser = verifyStmt.getAsObject();
    }
    verifyStmt.free();

    console.log('\n✅ Verificação final:');
    if (verifyUser) {
      console.log('   ID:', verifyUser.id);
      console.log('   Nome:', verifyUser.name);
      console.log('   Email:', verifyUser.email);
      console.log('   Tem senha:', !!verifyUser.password);
      
      // Testar senha
      const testPassword = bcrypt.compareSync(password, verifyUser.password);
      console.log('   Senha válida:', testPassword ? '✅ SIM' : '❌ NÃO');
    }

    // Salvar banco
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log('\n💾 Banco de dados salvo!');

    console.log('\n📋 Credenciais:');
    console.log('   Email:', email);
    console.log('   Senha:', password);
    console.log('\n✅ Pronto! Tente fazer login novamente.');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixUser();



