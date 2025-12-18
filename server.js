// Carregar variáveis de ambiente
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const initSqlJs = require('sql.js');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Middlewares de Segurança
const { 
  loginLimiter, 
  apiLimiter, 
  adminApiLimiter, 
  securityHeaders, 
  sanitizeRequest 
} = require('./middleware/security');
const { 
  validateLogin, 
  validateReserva, 
  validateContato 
} = require('./middleware/validation');
const { 
  authenticateToken, 
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  requireAdmin 
} = require('./middleware/auth');
const { 
  logLoginAttempt, 
  logAdminRequests,
  logUnauthorizedAccess 
} = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'brisa_imperial_secret_key_2024_secure'; // ⚠️ USAR VARIÁVEL DE AMBIENTE EM PRODUÇÃO

// Configuração SQLite - banco embutido
const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');
const dbDir = path.join(__dirname, 'database');

// Criar diretório se não existir
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Banco de dados SQLite
let db;
let SQL; // Será inicializado em initDatabase

// ==========================================
// MIDDLEWARES DE SEGURANÇA
// ==========================================

// Trust proxy para rate limiting funcionar corretamente atrás de proxies
app.set('trust proxy', 1);

// Headers de Segurança (Helmet) - Aplicado ANTES de static para que funcione em todas as rotas
// Helmet apenas adiciona headers, não interfere no conteúdo dos arquivos estáticos
app.use(securityHeaders);

// Servir arquivos estáticos
app.use(express.static('public', {
  etag: false,
  lastModified: false
}));

// CORS configurável via ambiente
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser com limites
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Sanitização de inputs - REATIVADA com exceções para arquivos estáticos
// A função sanitizeRequest já tem lógica interna para pular arquivos estáticos
app.use(sanitizeRequest);

// Headers anti-cache para atualização automática (apenas para desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
}

// Inicializar banco de dados SQLite
async function initDatabase() {
  try {
    // Inicializar SQL.js
    SQL = await initSqlJs();
    
    // Carregar banco existente ou criar novo
    let dbData = null;
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
      console.log('📂 Banco de dados existente carregado');
    } else {
      db = new SQL.Database();
      console.log('✨ Novo banco de dados criado');
    }
    
    // Criar tabelas
    createTables();
    insertDefaultData();
    
    // Salvar banco
    saveDatabase();
    
    console.log('✅ Banco de dados SQLite inicializado com sucesso!');
    console.log(`📁 Arquivo: ${dbPath}`);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    process.exit(1);
  }
}

// Salvar banco de dados
function saveDatabase() {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (error) {
    console.error('Erro ao salvar banco de dados:', error);
  }
}

function createTables() {
  // Habilitar foreign keys
  try {
    db.run('PRAGMA foreign_keys = ON');
  } catch (e) {}

  // Tabela users_admin
  db.exec(`
    CREATE TABLE IF NOT EXISTS users_admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Tabela allowed_emails
  db.run(`
    CREATE TABLE IF NOT EXISTS allowed_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `);

  // Tabela pages
  db.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT UNIQUE NOT NULL,
      html_content TEXT
    )
  `);

  // Tabela services
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT
    )
  `);

  // Tabela appointments
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      service_id INTEGER,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    )
  `);

  // Tabela contact_messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT NOT NULL,
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);
  
  // Adicionar coluna expires_at se não existir (para bancos antigos)
  try {
    db.run(`ALTER TABLE contact_messages ADD COLUMN expires_at DATETIME`);
    console.log('✅ Coluna expires_at adicionada à tabela contact_messages');
  } catch (e) {
    // Coluna já existe, ignorar erro
    if (!e.message || !e.message.includes('duplicate column')) {
      console.log('ℹ️ Coluna expires_at já existe ou erro ao adicionar:', e.message);
    }
  }

  // Tabela quartos
  db.exec(`
    CREATE TABLE IF NOT EXISTS quartos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL,
      numero INTEGER NOT NULL,
      capacidade INTEGER NOT NULL,
      vista TEXT NOT NULL,
      disponivel INTEGER DEFAULT 1,
      preco_base REAL NOT NULL
    )
  `);

  // Tabela reservas
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nome_completo TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT,
      quarto_id INTEGER,
      categoria TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      num_hospedes INTEGER NOT NULL,
      adultos INTEGER,
      criancas INTEGER,
      total_noites INTEGER,
      valor_quarto REAL NOT NULL,
      adicionais TEXT,
      valor_adicionais REAL DEFAULT 0,
      desconto REAL DEFAULT 0,
      hospedes_extras INTEGER DEFAULT 0,
      valor_hospedes_extras REAL DEFAULT 0,
      valor_total REAL NOT NULL,
      metodo_pagamento TEXT,
      status TEXT DEFAULT 'Confirmado',
      data_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE SET NULL
    )
  `);
  
  // Adicionar novas colunas se não existirem (para bancos existentes)
  try {
    db.exec(`ALTER TABLE reservas ADD COLUMN adultos INTEGER`);
  } catch (e) {
    // Coluna já existe, ignorar erro
  }
  try {
    db.exec(`ALTER TABLE reservas ADD COLUMN criancas INTEGER`);
  } catch (e) {
    // Coluna já existe, ignorar erro
  }
  try {
    db.exec(`ALTER TABLE reservas ADD COLUMN total_noites INTEGER`);
  } catch (e) {
    // Coluna já existe, ignorar erro
  }
  try {
    db.exec(`ALTER TABLE reservas ADD COLUMN motivo_cancelamento TEXT`);
  } catch (e) {
    // Coluna já existe, ignorar erro
  }
  try {
    db.exec(`ALTER TABLE reservas ADD COLUMN hospedes_extras INTEGER DEFAULT 0`);
  } catch (e) {
    // Coluna já existe, ignorar erro
  }
  try {
    db.exec(`ALTER TABLE reservas ADD COLUMN valor_hospedes_extras REAL DEFAULT 0`);
  } catch (e) {
    // Coluna já existe, ignorar erro
  }

  // Tabela configuracoes
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT UNIQUE NOT NULL,
      valor TEXT NOT NULL
    )
  `);

  // Tabela de histórico de check-in e check-out
  db.exec(`
    CREATE TABLE IF NOT EXISTS historico_check (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reserva_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('check_in', 'check_out')),
      data_hora DATETIME NOT NULL,
      observacoes TEXT,
      realizado_por INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
      FOREIGN KEY (realizado_por) REFERENCES users_admin(id) ON DELETE SET NULL
    )
  `);

  // Tabela de dados dos hóspedes
  db.exec(`
    CREATE TABLE IF NOT EXISTS hospedes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reserva_id INTEGER NOT NULL,
      nome_completo TEXT NOT NULL,
      documento TEXT,
      telefone TEXT,
      email TEXT,
      data_nascimento TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE
    )
  `);

  // Tabela de configurações SMTP
  db.exec(`
    CREATE TABLE IF NOT EXISTS smtp_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL DEFAULT 'smtp.gmail.com',
      port INTEGER NOT NULL DEFAULT 587,
      secure INTEGER DEFAULT 0,
      user TEXT NOT NULL,
      password TEXT NOT NULL,
      from_email TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela historico_2fa removida - sistema 2FA desativado

  // Criar índices para melhor performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_check_in ON reservas(check_in)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_check_out ON reservas(check_out)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_historico_reserva ON historico_check(reserva_id)`);
  // Índices de historico_2fa removidos - sistema 2FA desativado
}

function insertDefaultData() {
  // Criar usuário administrador principal (Murilo Dias)
  const emailMurilo = 'luizmarcosramires@hotmail.com';
  const muriloUser = queryOne('SELECT * FROM users_admin WHERE LOWER(email) = ?', [emailMurilo.toLowerCase()]);
  if (!muriloUser) {
    const hashedPassword = bcrypt.hashSync('Boob.08.', 10);
    const result = execute('INSERT INTO users_admin (name, email, password) VALUES (?, ?, ?)', 
      ['Murilo Dias', emailMurilo, hashedPassword]);
    console.log('👤 Usuário admin criado: luizmarcosramires@hotmail.com / Boob.08.');
    console.log('📝 ID do usuário criado:', result.lastInsertRowid);
    
    // Verificar se foi criado corretamente
    const verifyUser = queryOne('SELECT * FROM users_admin WHERE LOWER(email) = ?', [emailMurilo.toLowerCase()]);
    if (verifyUser) {
      console.log('✅ Usuário verificado no banco:', { id: verifyUser.id, email: verifyUser.email, name: verifyUser.name, hasPassword: !!verifyUser.password });
    } else {
      console.log('❌ ERRO: Usuário não foi encontrado após criação!');
    }
  } else {
    // Atualizar senha e nome se o usuário já existir
    const hashedPassword = bcrypt.hashSync('Boob.08.', 10);
    execute('UPDATE users_admin SET name = ?, password = ? WHERE LOWER(email) = ?', 
      ['Murilo Dias', hashedPassword, emailMurilo.toLowerCase()]);
    console.log('👤 Usuário admin atualizado: luizmarcosramires@hotmail.com');
    
    // Verificar se foi atualizado corretamente
    const verifyUser = queryOne('SELECT * FROM users_admin WHERE LOWER(email) = ?', [emailMurilo.toLowerCase()]);
    if (verifyUser) {
      console.log('✅ Usuário verificado após atualização:', { id: verifyUser.id, email: verifyUser.email, name: verifyUser.name, hasPassword: !!verifyUser.password });
    }
  }

  // Criar usuário admin padrão (backup) se não existir
  const emailAdmin = 'luizmarcosramires@hotmail.com';
  const adminResult = queryOne('SELECT COUNT(*) as count FROM users_admin WHERE LOWER(email) = ?', [emailAdmin.toLowerCase()]);
  if (adminResult && adminResult.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    execute('INSERT INTO users_admin (name, email, password) VALUES (?, ?, ?)', 
      ['Administrador', emailAdmin, hashedPassword]);
    console.log('👤 Usuário admin backup criado: luizmarcosramires@hotmail.com / admin123');
  }

  // Apagar todas as reservas antigas para o novo sistema funcionar corretamente
  try {
    const reservasAntigas = queryAll('SELECT COUNT(*) as count FROM reservas');
    if (reservasAntigas && reservasAntigas.length > 0) {
      execute('DELETE FROM reservas');
      console.log('🗑️ Todas as reservas antigas foram removidas');
    }
  } catch (error) {
    console.error('Erro ao remover reservas antigas:', error);
  }

  // Garantir que temos apenas 1 quarto por categoria (remover duplicatas)
  try {
    const categorias = ['Casa 1', 'Casa 2', 'Casa 3', 'Casa 4', 'Quarto Deluxe com Cama Queen-size', 'Suíte Orquídea Premium', 'Suíte Imperial Master', 'Suíte Deluxe com Cama Queen-size', 'Suíte Executiva', 'Suíte Família', 'Suíte Romântica'];
    for (const categoria of categorias) {
      const quartosCategoria = queryAll('SELECT * FROM quartos WHERE categoria = ?', [categoria]);
      if (quartosCategoria && quartosCategoria.length > 1) {
        // Manter apenas o primeiro quarto, deletar os demais
        for (let i = 1; i < quartosCategoria.length; i++) {
          execute('DELETE FROM quartos WHERE id = ?', [quartosCategoria[i].id]);
        }
        console.log(`✅ Removidos quartos duplicados da categoria: ${categoria}`);
      }
    }
  } catch (error) {
    console.error('Erro ao limpar quartos duplicados:', error);
  }

  // Inserir quartos padrão se não existirem (1 quarto único por categoria)
  // Garantir que as 4 casas e os 8 novos quartos existam no banco
  const quartosNovos = [
    { categoria: 'Casa Sobrado 2 – Conforto e Espaço com 3 Quartos', numero: 1, capacidade: 8, vista: 'Condomínio', preco_base: 250 },
    { categoria: 'Casa Sobrado 4 – Ampla, Completa e Ideal para Famílias', numero: 2, capacidade: 8, vista: 'Condomínio', preco_base: 250 },
    { categoria: 'Casa Ampla e Confortável – 3 Quartos e 5 Banheiros', numero: 3, capacidade: 10, vista: 'Condomínio', preco_base: 250 },
    { categoria: 'Casa Sobrado 6 – Ampla, Equipada e com 3 Quartos', numero: 4, capacidade: 8, vista: 'Condomínio', preco_base: 250 },
    { categoria: 'Quarto Deluxe com Cama Queen-size', numero: 101, capacidade: 2, vista: 'Jardim', preco_base: 150 },
    { categoria: 'Suíte Orquídea Premium', numero: 201, capacidade: 4, vista: 'Piscina', preco_base: 150 },
    { categoria: 'Suíte Imperial Master', numero: 301, capacidade: 6, vista: 'Mar', preco_base: 150 },
    { categoria: 'Quarto Deluxe com Cama Queen-size', numero: 401, capacidade: 2, vista: 'Mar', preco_base: 150 },
    { categoria: 'Suíte Deluxe com Cama Queen-size', numero: 501, capacidade: 2, vista: 'Jardim', preco_base: 150 },
    { categoria: 'Suíte Executiva', numero: 601, capacidade: 2, vista: 'Piscina', preco_base: 150 },
    { categoria: 'Suíte Família', numero: 701, capacidade: 4, vista: 'Mar', preco_base: 150 },
    { categoria: 'Suíte Romântica', numero: 801, capacidade: 2, vista: 'Jardim', preco_base: 150 }
  ];

  let quartosCriados = 0;
  for (const quarto of quartosNovos) {
    // Verificar se já existe um quarto desta categoria antes de inserir
    const existe = queryOne('SELECT COUNT(*) as count FROM quartos WHERE categoria = ?', [quarto.categoria]);
    if (!existe || existe.count === 0) {
      execute('INSERT INTO quartos (categoria, numero, capacidade, vista, disponivel, preco_base) VALUES (?, ?, ?, ?, 1, ?)',
        [quarto.categoria, quarto.numero, quarto.capacidade, quarto.vista, quarto.preco_base]);
      quartosCriados++;
    }
  }
  if (quartosCriados > 0) {
    console.log(`🏨 ${quartosCriados} novos quartos/casas criados (4 casas + 8 quartos)`);
  }

  // Atualizar preços: casas para R$ 250, suítes para R$ 150
  execute('UPDATE quartos SET preco_base = 250 WHERE categoria LIKE "Casa%"', []);
  execute('UPDATE quartos SET preco_base = 150 WHERE categoria NOT LIKE "Casa%" AND preco_base != 150', []);
  console.log('💰 Preços atualizados: Casas R$ 250, Suítes R$ 150');

  // Inserir configurações padrão
  const configsResult = queryOne('SELECT COUNT(*) as count FROM configuracoes');
  if (configsResult && configsResult.count === 0) {
    const configs = [
      { chave: 'preco_passeio', valor: '150' },
      { chave: 'preco_romantico', valor: '200' },
      { chave: 'preco_upgrade_vista', valor: '80' },
      { chave: 'preco_cama_extra', valor: '50' },
      { chave: 'preco_decoracao', valor: '100' }
    ];

    for (const config of configs) {
      execute('INSERT INTO configuracoes (chave, valor) VALUES (?, ?)', [config.chave, config.valor]);
    }
    console.log('⚙️  Configurações padrão criadas');
  }
}

// Função auxiliar para sanitizar parâmetros (garantir que nunca seja undefined)
function sanitizeParams(params) {
  if (!params) return [];
  if (!Array.isArray(params)) return [params];
  return params.map(p => p === undefined ? null : p);
}

// Função auxiliar para executar query e retornar um objeto
function queryOne(sql, params = []) {
  if (!db) return null;
  try {
    const sanitized = sanitizeParams(params);
    const stmt = db.prepare(sql);
    stmt.bind(sanitized);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  } catch (error) {
    console.error('Erro em queryOne:', error, 'SQL:', sql, 'Params:', params);
    return null;
  }
}

// Função auxiliar para executar query e retornar array de objetos
function queryAll(sql, params = []) {
  if (!db) return [];
  try {
    const sanitized = sanitizeParams(params);
    const stmt = db.prepare(sql);
    stmt.bind(sanitized);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Erro em queryAll:', error, 'SQL:', sql, 'Params:', params);
    return [];
  }
}

// Função para gerar código único de reserva
function gerarCodigoReserva() {
  // Gerar código único: BR + timestamp + número aleatório
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let codigo = `BR${timestamp}${random}`;
  
  // Verificar se o código já existe (garantir unicidade)
  let tentativas = 0;
  while (tentativas < 10) {
    const existe = queryOne('SELECT id FROM reservas WHERE codigo = ?', [codigo]);
    if (!existe) {
      return codigo;
    }
    // Se existe, gerar novo código
    const novoRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    codigo = `BR${Date.now().toString().slice(-8)}${novoRandom}`;
    tentativas++;
  }
  
  // Fallback: usar UUID se houver muitos conflitos
  return `BR${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Função auxiliar para executar INSERT/UPDATE/DELETE
function execute(sql, params = []) {
  if (!db) return { lastInsertRowid: null };
  try {
    const sanitized = sanitizeParams(params);
    const stmt = db.prepare(sql);
    stmt.bind(sanitized);
    stmt.step();
    const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
    const lastId = lastIdResult && lastIdResult[0] && lastIdResult[0].values && lastIdResult[0].values[0] ? lastIdResult[0].values[0][0] : null;
    stmt.free();
    saveDatabase(); // Salvar após modificações
    return { lastInsertRowid: lastId };
  } catch (error) {
    console.error('Erro em execute:', error, 'SQL:', sql, 'Params:', params);
    saveDatabase(); // Tentar salvar mesmo em caso de erro
    return { lastInsertRowid: null };
  }
}

// Função auxiliar para converter resultados
function formatResult(rows) {
  if (!rows) return [];
  if (Array.isArray(rows)) {
    return rows;
  }
  return [rows];
}

// Função para atualizar status automático de reservas
function atualizarStatusReservas() {
  try {
    if (!db) return;
    const agora = new Date();
    
    // 1. Excluir reservas PENDENTES com mais de 24 horas (NÃO vão para histórico)
    const reservasPendentes = queryAll(`
      SELECT id, data_reserva FROM reservas
      WHERE status = 'Pendente'
    `, []);

    reservasPendentes.forEach(reserva => {
      const dataCriacao = new Date(reserva.data_reserva);
      const horasDecorridas = (agora.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60);
      
      if (horasDecorridas >= 24) {
        // Excluir permanentemente do banco (NÃO vai para histórico)
        execute('DELETE FROM reservas WHERE id = ?', [reserva.id]);
        console.log(`Reserva pendente ${reserva.id} excluída automaticamente após 24h`);
        saveDatabase();
      }
    });

    // 2. Mover reservas CONCLUÍDAS para o histórico (quando check-out passou de 12:00)
    const reservasParaConcluir = queryAll(`
      SELECT id, check_out FROM reservas
      WHERE status NOT IN ('Concluído', 'Cancelada')
    `, []);

    reservasParaConcluir.forEach(reserva => {
      const checkoutDate = new Date(reserva.check_out + 'T12:00:00');
      
      // Se passou do check-out + 12h, marcar como concluído (vai para histórico automaticamente)
      if (agora >= checkoutDate) {
        execute(`
          UPDATE reservas 
          SET status = 'Concluído' 
          WHERE id = ?
        `, [reserva.id]);
        console.log(`Reserva ${reserva.id} movida para histórico (check-out passou de 12h)`);
        saveDatabase();
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar status das reservas:', error);
  }
}

// Executar atualização a cada hora
setInterval(atualizarStatusReservas, 60 * 60 * 1000);
// Executar também a cada 5 minutos para processar regras automáticas mais rapidamente
setInterval(processarRegrasAutomaticas, 5 * 60 * 1000);
// Executar imediatamente ao iniciar
atualizarStatusReservas();
processarRegrasAutomaticas();

// Função para carregar configuração SMTP do banco
function loadSMTPConfig() {
  if (!db) return null;
  
  try {
    const config = queryOne('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1', []);
    if (config && config.user && config.password) {
      return {
        host: config.host || 'smtp.gmail.com',
        port: config.port || 587,
        secure: config.secure === 1,
        auth: {
          user: config.user,
          pass: config.password
        }
      };
    }
  } catch (error) {
    console.error('Erro ao carregar configuração SMTP:', error);
  }
  return null;
}

// Função para criar transporter SMTP
function createTransporter() {
  const smtpConfig = loadSMTPConfig();
  if (!smtpConfig) {
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
      tls: {
        rejectUnauthorized: false
      }
    });
    return transporter;
  } catch (error) {
    console.error('Erro ao criar transporter SMTP:', error);
    return null;
  }
}

// Variável global do transporter (será atualizada quando SMTP for configurado)
let transporter = null;

// ROTAS ESTÁTICAS

// Home - com suporte a páginas dinâmicas
app.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }

    const page = queryOne('SELECT html_content FROM pages WHERE page_name = ?', ['home']);

    if (page && page.html_content) {
      res.setHeader('Content-Type', 'text/html');
      res.send(page.html_content);
    } else {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  } catch (error) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Rota para a cópia da página inicial
app.get('/inicio-copia', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inicio-copia.html'));
});

// Rotas do painel administrativo (ANTES da rota genérica)
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  // Verificar token via JavaScript no frontend
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// Rota para página de ficha completa do histórico
app.get('/admin/historico/:id', (req, res) => {
  // Verificar token via JavaScript no frontend
  res.sendFile(path.join(__dirname, 'public', 'admin', 'historico-detalhes.html'));
});

// Rota para redirecionar /admin para /admin/login
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

// Páginas dinâmicas
app.get('/:page', async (req, res) => {
  const pageName = req.params.page;
  
  // Ignorar rotas do painel admin para evitar conflito
  if (pageName.startsWith('painel-brisa') || pageName === 'admin' || pageName.startsWith('admin/')) {
    return res.status(404).send('Página não encontrada');
  }

  try {
    if (!db) {
      const filePath = path.join(__dirname, 'public', `${pageName}.html`);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      return res.status(404).send('Página não encontrada');
    }

    const page = queryOne('SELECT html_content FROM pages WHERE page_name = ?', [pageName]);

    if (page && page.html_content) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(page.html_content);
    } else {
      const filePath = path.join(__dirname, 'public', `${pageName}.html`);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send('Página não encontrada');
      }
    }
  } catch (error) {
    const filePath = path.join(__dirname, 'public', `${pageName}.html`);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Página não encontrada');
    }
  }
});

// Ficha de Reserva
app.get('/ficha/:codigo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ficha.html'));
});

// API - Listar serviços
app.get('/api/services', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }
    const rows = queryAll('SELECT * FROM services ORDER BY name', []);
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Criar agendamento
app.post('/api/appointments', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { full_name, email, phone, service_id, date, time, note } = req.body;

    if (!full_name || !email || !service_id || !date || !time) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome completo, email, serviço, data e horário' });
    }

    // Validar nome completo
    const nameParts = full_name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return res.status(400).json({ error: 'Nome completo deve conter pelo menos nome e sobrenome' });
    }

    // Verificar se já existe agendamento no mesmo horário
    const existing = queryOne('SELECT * FROM appointments WHERE date = ? AND time = ?', [date, time]);
    if (existing) {
      return res.status(400).json({ error: 'Horário já está ocupado' });
    }

    db.prepare(`
      INSERT INTO appointments (full_name, email, phone, service_id, date, time, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(full_name, email, phone || null, service_id, date, time, note || null);

    res.json({ success: true, message: 'Agendamento criado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Função auxiliar para verificar disponibilidade considerando reservas
// Retorna { disponivel: boolean, conflito: { check_in, check_out } | null }
// IMPORTANTE: Verifica por quarto_id específico quando disponível, não por categoria
function verificarDisponibilidade(quartoId, categoria, checkIn, checkOut) {
  // Se não houver banco, considerar disponível por padrão
  if (!db) {
    console.warn('Banco de dados não disponível - considerando data como disponível');
    return { disponivel: true, conflito: null };
  }

  try {
    // Validar datas
    if (!checkIn || !checkOut) {
      console.warn('Datas inválidas - considerando como disponível');
      return { disponivel: true, conflito: null };
    }

    // Converter para objetos Date para comparação correta
    const checkInDate = new Date(checkIn + 'T00:00:00');
    const checkOutDate = new Date(checkOut + 'T00:00:00');

    // Validar se check-out é depois de check-in
    if (checkOutDate <= checkInDate) {
      console.warn('Check-out deve ser depois de check-in - considerando como disponível');
      return { disponivel: true, conflito: null };
    }

    // Verificar reservas ativas que se sobrepõem ao período solicitado
    // IMPORTANTE: Verificar por quarto_id específico (não por categoria)
    // Isso garante que apenas o quarto específico fique indisponível, não todos da mesma categoria
    // Uma reserva se sobrepõe se:
    // - check_in da reserva < check_out solicitado E check_out da reserva > check_in solicitado
    // IMPORTANTE: Excluir reservas canceladas (tanto 'Cancelada' quanto 'Cancelado') e concluídas
    
    let reservas;
    if (quartoId) {
      // Verificar por quarto_id específico (MELHOR: verifica apenas o quarto específico)
      reservas = queryAll(`
        SELECT * FROM reservas 
        WHERE quarto_id = ?
        AND status NOT IN ('Concluído', 'Cancelada', 'Cancelado')
        AND check_in < ? 
        AND check_out > ?
      `, [quartoId, checkOut, checkIn]);
    } else if (categoria) {
      // Fallback: Se não tiver quarto_id, buscar o quarto pela categoria e verificar pelo ID
      const quarto = queryOne('SELECT id FROM quartos WHERE categoria = ? LIMIT 1', [categoria]);
      if (quarto && quarto.id) {
        reservas = queryAll(`
          SELECT * FROM reservas 
          WHERE quarto_id = ?
          AND status NOT IN ('Concluído', 'Cancelada', 'Cancelado')
          AND check_in < ? 
          AND check_out > ?
        `, [quarto.id, checkOut, checkIn]);
      } else {
        // Se não encontrar quarto, considerar disponível
        return { disponivel: true, conflito: null };
      }
    } else {
      // Se não tiver nem quarto_id nem categoria, considerar disponível
      return { disponivel: true, conflito: null };
    }
    
    // Debug: Log das reservas encontradas (apenas reservas ativas, não canceladas)
    if (reservas && reservas.length > 0) {
      console.log(`🔍 Verificando disponibilidade para quarto_id ${quartoId || 'N/A'}, categoria ${categoria || 'N/A'} entre ${checkIn} e ${checkOut}`);
      console.log(`   Reservas ativas encontradas (NÃO canceladas) para este quarto específico:`, reservas.map(r => ({
        id: r.id,
        quarto_id: r.quarto_id,
        categoria: r.categoria,
        status: r.status,
        check_in: r.check_in,
        check_out: r.check_out
      })));
    }

    if (reservas && reservas.length > 0) {
      // Retornar informações sobre o conflito
      const conflito = reservas[0];
      return { 
        disponivel: false, 
        conflito: {
          check_in: conflito.check_in,
          check_out: conflito.check_out
        }
      };
    }

    // Se não há reservas, está disponível
    return { disponivel: true, conflito: null };
  } catch (error) {
    // Em caso de erro, considerar como disponível por padrão
    console.error('Erro ao verificar disponibilidade:', error);
    return { disponivel: true, conflito: null };
  }
}

// API - Listar quartos disponíveis
app.get('/api/quartos/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const { check_in, check_out } = req.query;

    // Se não houver banco, retornar todos os quartos como disponíveis
    if (!db) {
      console.warn('Banco de dados não disponível - retornando quartos como disponíveis');
      // Retornar lista vazia ou quartos padrão - dependendo da lógica do sistema
      // Por segurança, retornar vazio para não criar reservas sem banco
      return res.json([]);
    }

    // Buscar todos os quartos da categoria que estão disponíveis
    let todosQuartos = [];
    try {
      todosQuartos = queryAll('SELECT * FROM quartos WHERE categoria = ? AND disponivel = 1', [categoria]);
    } catch (error) {
      console.error('Erro ao buscar quartos:', error);
      // Em caso de erro, retornar vazio
      return res.json([]);
    }

    // Se não há quartos cadastrados, retornar vazio
    if (!todosQuartos || todosQuartos.length === 0) {
      return res.json([]);
    }

    // Se não foram fornecidas datas, retornar todos os quartos
    if (!check_in || !check_out) {
      return res.json(formatResult(todosQuartos));
    }

    // Validar formato das datas
    const checkInDate = new Date(check_in + 'T00:00:00');
    const checkOutDate = new Date(check_out + 'T00:00:00');
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      console.warn('Datas inválidas fornecidas');
      return res.json([]);
    }

    // Filtrar quartos disponíveis para as datas solicitadas
    const quartosDisponiveis = todosQuartos.filter(quarto => {
      const disponibilidade = verificarDisponibilidade(quarto.id, categoria, check_in, check_out);
      return disponibilidade.disponivel;
    });
    
    return res.json(formatResult(quartosDisponiveis));
  } catch (error) {
    console.error('Erro na API de quartos:', error);
    // Em caso de erro, retornar vazio (não disponível) para segurança
    res.json([]);
  }
});

// API - Obter informações de um quarto por ID
app.get('/api/quartos/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const idNum = parseInt(id, 10);
    
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ error: 'ID do quarto inválido' });
    }
    
    // Buscar quarto por ID
    const quarto = queryOne('SELECT * FROM quartos WHERE id = ?', [idNum]);
    
    if (!quarto) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }

    // Retornar informações completas do quarto
    res.json({
      id: quarto.id,
      categoria: quarto.categoria,
      numero: quarto.numero,
      capacidade: quarto.capacidade,
      vista: quarto.vista,
      valor_diaria: quarto.preco_base || 0,
      preco_base: quarto.preco_base || 0,
      disponivel: quarto.disponivel === 1
    });
  } catch (error) {
    console.error('Erro ao buscar informações do quarto:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar informações do quarto' });
  }
});

// API - Obter informações de um quarto por categoria (incluindo preço)
app.get('/api/quartos/info/:categoria', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { categoria } = req.params;
    
    // Buscar o primeiro quarto da categoria (todos têm o mesmo preço_base)
    const quarto = queryOne('SELECT * FROM quartos WHERE categoria = ? LIMIT 1', [categoria]);
    
    if (!quarto) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }

    // Retornar informações do quarto, incluindo preço
    res.json({
      id: quarto.id,
      categoria: quarto.categoria,
      numero: quarto.numero,
      capacidade: quarto.capacidade,
      vista: quarto.vista,
      valor_diaria: quarto.preco_base || 0,
      preco_base: quarto.preco_base || 0,
      disponivel: quarto.disponivel === 1
    });
  } catch (error) {
    console.error('Erro ao buscar informações do quarto:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar informações do quarto' });
  }
});

// API - Obter todas as informações de quartos (para listagem)
app.get('/api/quartos/info', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    // Buscar um quarto de cada categoria (para obter os preços)
    const categorias = ['Casa 1', 'Casa 2', 'Casa 3', 'Casa 4', 'Quarto Deluxe com Cama Queen-size', 'Suíte Orquídea Premium', 'Suíte Imperial Master', 'Suíte Deluxe com Cama Queen-size', 'Suíte Executiva', 'Suíte Família', 'Suíte Romântica'];
    
    const quartosInfo = [];
    
    categorias.forEach(categoria => {
      const quarto = queryOne('SELECT * FROM quartos WHERE categoria = ? LIMIT 1', [categoria]);
      if (quarto) {
        quartosInfo.push({
          categoria: quarto.categoria,
          preco_base: quarto.preco_base || 0
        });
      }
    });

    // Criar um objeto mapeado por categoria para facilitar o acesso
    const precosMap = {};
    quartosInfo.forEach(q => {
      precosMap[q.categoria] = q.preco_base;
      // Mapear também variações de nome
      if (q.categoria === 'Suíte Harmonia') {
        precosMap['Suíte Standard'] = q.preco_base;
      } else if (q.categoria === 'Suíte Orquídea Premium') {
        precosMap['Suíte Premium'] = q.preco_base;
      } else if (q.categoria === 'Suíte Imperial Master') {
        precosMap['Suíte Master Lux'] = q.preco_base;
      }
    });

    res.json(precosMap);
  } catch (error) {
    console.error('Erro ao buscar informações dos quartos:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar informações dos quartos' });
  }
});

// API - Obter datas disponíveis e reservadas de um quarto
app.get('/api/quartos/:categoria/disponibilidade', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { categoria } = req.params;
    const { ano, mes } = req.query;

    // Buscar o quarto único da categoria
    const quarto = queryOne('SELECT * FROM quartos WHERE categoria = ?', [categoria]);
    if (!quarto) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }

    // Buscar todas as reservas ativas deste quarto específico (por quarto_id, não por categoria)
    const reservas = queryAll(`
      SELECT * FROM reservas 
      WHERE quarto_id = ?
      AND status NOT IN ('Concluído', 'Cancelada', 'Cancelado')
      ORDER BY check_in ASC
    `, [quarto.id]);

    // Calcular datas disponíveis e ocupadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const datasReservadas = [];
    const datasLivres = [];

    // Processar reservas
    reservas.forEach(reserva => {
      const checkIn = new Date(reserva.check_in + 'T00:00:00');
      const checkOut = new Date(reserva.check_out + 'T00:00:00');
      
      let dataAtual = new Date(checkIn);
      while (dataAtual < checkOut) {
        const dataStr = dataAtual.toISOString().split('T')[0];
        datasReservadas.push({
          data: dataStr,
          tipo: 'reserva',
          reserva_id: reserva.id,
          nome_cliente: reserva.nome_completo,
          check_in: reserva.check_in,
          check_out: reserva.check_out
        });
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    });

    // Calcular datas livres (próximos 365 dias)
    for (let i = 0; i < 365; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      
      const estaReservada = datasReservadas.some(d => d.data === dataStr);
      
      if (!estaReservada) {
        datasLivres.push(dataStr);
      }
    }

    res.json({
      quarto: {
        id: quarto.id,
        categoria: quarto.categoria,
        numero: quarto.numero
      },
      datas_reservadas: datasReservadas,
      datas_livres: datasLivres,
      reservas: reservas.map(r => ({
        id: r.id,
        codigo: r.codigo,
        nome_cliente: r.nome_completo,
        email: r.email,
        telefone: r.telefone,
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status
      }))
    });
  } catch (error) {
    console.error('Erro ao obter disponibilidade:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Obter datas disponíveis para um período (para mostrar ao cliente)
app.get('/api/quartos/:categoria/datas-livres', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { categoria } = req.params;
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'Datas de check-in e check-out são obrigatórias' });
    }

    // Verificar disponibilidade
    // Buscar o quarto para obter o quarto_id
    const quartoInfo = queryOne('SELECT id FROM quartos WHERE categoria = ? LIMIT 1', [categoria]);
    if (!quartoInfo) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }
    
    const disponibilidade = verificarDisponibilidade(quartoInfo.id, categoria, check_in, check_out);
    
    if (!disponibilidade.disponivel) {
      // Buscar todas as reservas para calcular datas livres (excluir canceladas e concluídas)
      // IMPORTANTE: Esta query determina quais datas ficam indisponíveis no calendário
      // Verificar por quarto_id específico
      const reservas = queryAll(`
        SELECT check_in, check_out FROM reservas 
        WHERE quarto_id = ?
        AND status NOT IN ('Concluído', 'Cancelada', 'Cancelado')
        ORDER BY check_in ASC
      `, [quartoInfo.id]);

      // Calcular próximas datas livres (próximos 90 dias)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const datasLivres = [];
      const periodosOcupados = [];

      // Adicionar reservas aos períodos ocupados
      reservas.forEach(r => {
        periodosOcupados.push({
          inicio: new Date(r.check_in + 'T00:00:00'),
          fim: new Date(r.check_out + 'T00:00:00')
        });
      });

      // Encontrar períodos livres (próximos 90 dias)
      for (let i = 0; i < 90; i++) {
        const data = new Date(hoje);
        data.setDate(data.getDate() + i);
        
        const estaOcupada = periodosOcupados.some(p => {
          return data >= p.inicio && data < p.fim;
        });

        if (!estaOcupada) {
          datasLivres.push(data.toISOString().split('T')[0]);
        }
      }

      const conflito = disponibilidade.conflito;
      return res.status(400).json({ 
        error: 'Quarto não disponível para essas datas',
        conflito: conflito,
        datas_livres: datasLivres.slice(0, 10) // Primeiras 10 datas livres
      });
    }

    res.json({ 
      disponivel: true,
      message: 'Quarto disponível para essas datas'
    });
  } catch (error) {
    console.error('Erro ao verificar datas livres:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Criar reserva (com rate limiting e validação)
app.post('/api/reserva', apiLimiter, validateReserva, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const {
      nome_completo,
      email,
      telefone,
      categoria,
      check_in,
      check_out,
      num_hospedes,
      adultos,
      criancas,
      hospedes_extras,
      valor_hospedes_extras,
      total_noites,
      valor_quarto,
      valor_total,
      adicionais,
      metodo_pagamento,
      cupom
    } = req.body;

    // Buscar o quarto único da categoria (cada categoria tem apenas 1 quarto)
    console.log('🔍 Buscando quarto com categoria:', categoria);
    
    // Primeiro, tentar busca exata
    let quarto = queryOne('SELECT * FROM quartos WHERE categoria = ? AND disponivel = 1', [categoria]);
    
    // Se não encontrar, tentar busca case-insensitive
    if (!quarto) {
      const todosQuartos = queryAll('SELECT * FROM quartos WHERE disponivel = 1', []);
      quarto = todosQuartos.find(q => q.categoria.toLowerCase().trim() === categoria.toLowerCase().trim());
    }
    
    if (!quarto) {
      console.error('❌ Quarto não encontrado para categoria:', categoria);
      // Listar todas as categorias disponíveis para debug
      const todasCategorias = queryAll('SELECT DISTINCT categoria FROM quartos WHERE disponivel = 1', []);
      console.log('📋 Categorias disponíveis:', todasCategorias.map(q => q.categoria));
      return res.status(400).json({ error: `Quarto não encontrado para a categoria "${categoria}". Verifique se o nome da categoria está correto.` });
    }
    
    console.log('✅ Quarto encontrado:', quarto.id, '-', quarto.categoria);
    console.log('📌 Quarto ID que será salvo na reserva:', quarto.id);

    // Verificar disponibilidade do quarto único
    const disponibilidade = verificarDisponibilidade(quarto.id, categoria, check_in, check_out);

    if (!disponibilidade.disponivel) {
      // Formatar mensagem de erro com as datas do conflito
      const conflito = disponibilidade.conflito;
      if (conflito) {
        const checkInFormatado = new Date(conflito.check_in + 'T00:00:00').toLocaleDateString('pt-BR');
        const checkOutFormatado = new Date(conflito.check_out + 'T00:00:00').toLocaleDateString('pt-BR');
        return res.status(400).json({ 
          error: `Este quarto já está reservado entre ${checkInFormatado} e ${checkOutFormatado}. Por favor, escolha outras datas.`,
          conflito: conflito
        });
      } else {
        return res.status(400).json({ error: 'Este quarto não está disponível para essas datas. Por favor, escolha outras datas.' });
      }
    }

    let valorQuarto = parseFloat(quarto.preco_base);

    // Calcular noites
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const noites = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    valorQuarto *= noites;

    // Calcular adicionais
    let valorAdicionais = 0;
    const adicionaisArray = Array.isArray(adicionais) ? adicionais : [];
    
    const precos = queryAll('SELECT chave, valor FROM configuracoes WHERE chave LIKE ?', ['preco_%']);
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

    // Usar valores fornecidos ou calcular
    const valorTotalFinal = valor_total || (valorQuarto + valorAdicionais - desconto);
    const valorQuartoFinal = valor_quarto || valorQuarto;
    const totalNoitesFinal = total_noites || noites;
    const adultosFinal = adultos || num_hospedes || 2;
    const criancasFinal = criancas || 0;
    
    // Gerar código único para a reserva (sempre gerado, nunca NULL)
    const codigo = gerarCodigoReserva();
    
    // Validar que o código foi gerado
    if (!codigo || codigo.trim() === '') {
      console.error('Erro: Código da reserva não foi gerado!');
      return res.status(500).json({ error: 'Erro ao gerar código da reserva' });
    }

    // Status inicial: usar o status fornecido ou 'Pagamento não confirmado' por padrão
    const statusInicial = req.body.status || 'Pagamento não confirmado';
    
    console.log('💾 Salvando reserva com quarto_id:', quarto.id, 'para categoria:', quarto.categoria);
    console.log('📋 Dados da reserva:', {
      codigo,
      nome_completo,
      email,
      telefone,
      quarto_id: quarto.id,
      categoria: quarto.categoria,
      check_in,
      check_out,
      status: statusInicial
    });
    
    // Inserir reserva usando execute para obter o ID
    // IMPORTANTE: Usar quarto.categoria para garantir consistência com o banco
    const hospedesExtras = parseInt(hospedes_extras || 0, 10);
    const valorHospedesExtras = parseFloat(valor_hospedes_extras || 0);
    
    // Incluir valor de hóspedes extras no valor total
    const valorTotalComExtras = valorTotalFinal + valorHospedesExtras;
    
    const result = execute(`
      INSERT INTO reservas (
        codigo, nome_completo, email, telefone, quarto_id, categoria,
        check_in, check_out, num_hospedes, adultos, criancas, total_noites,
        valor_quarto, adicionais, valor_adicionais, desconto, hospedes_extras, valor_hospedes_extras, valor_total, metodo_pagamento, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, nome_completo, email, telefone, quarto.id, quarto.categoria, // Usar quarto.categoria para garantir consistência
      check_in, check_out, num_hospedes, adultosFinal, criancasFinal, totalNoitesFinal,
      valorQuartoFinal, JSON.stringify(adicionaisArray || []),
      valorAdicionais, desconto, hospedesExtras, valorHospedesExtras, valorTotalComExtras, metodo_pagamento || 'Pendente', statusInicial
    ]);
    
    const reservaId = result.lastInsertRowid;
    
    // Verificar se a reserva foi salva corretamente com o quarto_id
    const reservaVerificada = queryOne('SELECT * FROM reservas WHERE id = ?', [reservaId]);
    if (reservaVerificada) {
      console.log('✅ Reserva criada com sucesso! ID:', reservaId, 'Quarto ID:', reservaVerificada.quarto_id, 'Código:', codigo);
      console.log('🔍 Verificação - Reserva salva com quarto_id:', reservaVerificada.quarto_id, 'categoria:', reservaVerificada.categoria);
      
      if (reservaVerificada.quarto_id !== quarto.id) {
        console.error('❌ ERRO CRÍTICO: quarto_id salvo não corresponde ao quarto encontrado!');
        console.error('   Esperado:', quarto.id, 'Salvo:', reservaVerificada.quarto_id);
      }
    } else {
      console.error('❌ ERRO: Reserva não foi encontrada após inserção!');
    }
    console.log('📅 Check-in:', check_in, 'Check-out:', check_out);
    console.log('📊 Status inicial:', statusInicial);
    
    // Verificar se a reserva aparecerá na ficha (check-out >= hoje)
    const hoje = new Date().toISOString().split('T')[0];
    const checkOutDateVerificacao = new Date(check_out + 'T00:00:00');
    const hojeDate = new Date(hoje + 'T00:00:00');
    if (checkOutDateVerificacao >= hojeDate) {
      console.log(`✅ Reserva ${codigo} aparecerá na ficha do quarto ${quarto.id} (${quarto.categoria})`);
    } else {
      console.log(`⚠️ Reserva ${codigo} não aparecerá na ficha (check-out já passou)`);
    }

    // Enviar email de confirmação (apenas se SMTP estiver configurado)
    if (transporter) {
    try {
      await transporter.sendMail({
        from: 'luizmarcosramires@hotmail.com',
        to: email,
        subject: `Confirmação de Reserva - ${codigo}`,
        html: `
          <h2>Reserva Confirmada - Brisa Imperial Resort</h2>
          <p><strong>Código da Reserva:</strong> ${codigo}</p>
          <p>Olá ${nome_completo},</p>
          <p>Sua reserva foi confirmada com sucesso!</p>
          <p><strong>Detalhes:</strong></p>
          <ul>
            <li>Categoria: ${categoria}</li>
            <li>Check-in: ${check_in}</li>
            <li>Check-out: ${check_out}</li>
            <li>Hóspedes: ${num_hospedes}</li>
            <li>Valor Total: R$ ${valorTotalFinal.toFixed(2)}</li>
          </ul>
          <p>Acesse sua ficha em: <a href="${req.protocol}://${req.get('host')}/ficha/${codigo}">Ver Ficha</a></p>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      }
    } else {
      console.log('SMTP não configurado. E-mail de confirmação não será enviado.');
    }

    res.json({ 
      success: true, 
      codigo, 
      id: reservaId,
      valor_total: valorTotalFinal,
      status: statusInicial
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Atualizar status de pagamento
app.post('/api/reserva/:codigo/pagamento', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { codigo } = req.params;
    const { status, metodo_pagamento } = req.body;

    // Buscar reserva
    const reserva = queryOne('SELECT * FROM reservas WHERE codigo = ?', [codigo]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    // Atualizar status para "Confirmado" quando pagamento for concluído
    // Isso garante que a reserva apareça na ficha do quarto
    // Aceita também 'Paga' e 'Pago' para compatibilidade, mas padroniza para 'Confirmado'
    let novoStatus = status || 'Confirmado';
    // Normalizar variações de status pagos para 'Confirmado'
    if (novoStatus === 'Paga' || novoStatus === 'Pago' || novoStatus === 'aprovado') {
      novoStatus = 'Confirmado';
    }
    const metodoPagamento = metodo_pagamento || reserva.metodo_pagamento || 'Cartão';

    console.log(`💳 Atualizando pagamento para reserva ${codigo}`);
    console.log(`   Status atual: ${reserva.status}`);
    console.log(`   Novo status: ${novoStatus}`);
    console.log(`   Quarto ID: ${reserva.quarto_id}`);
    console.log(`   Categoria: ${reserva.categoria}`);

    execute(
      'UPDATE reservas SET status = ?, metodo_pagamento = ? WHERE codigo = ?',
      [novoStatus, metodoPagamento, codigo]
    );
    
    // Salvar banco após atualização
    saveDatabase();

    // Verificar se a atualização foi bem-sucedida
    const reservaAtualizada = queryOne('SELECT * FROM reservas WHERE codigo = ?', [codigo]);
    if (reservaAtualizada) {
      console.log(`✅ Pagamento confirmado para reserva ${codigo} - Status atualizado para: ${reservaAtualizada.status}`);
      console.log(`📋 Quarto ID da reserva: ${reservaAtualizada.quarto_id}`);
      console.log(`📅 Check-out da reserva: ${reservaAtualizada.check_out}`);
      
      // Verificar se a reserva aparecerá na ficha (check-out >= hoje)
      const hoje = new Date().toISOString().split('T')[0];
      const checkOutDate = new Date(reservaAtualizada.check_out + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      if (checkOutDate >= hojeDate) {
        console.log(`✅ Reserva ${codigo} aparecerá na ficha do quarto ${reservaAtualizada.quarto_id} (${reservaAtualizada.categoria})`);
      } else {
        console.log(`⚠️ Reserva ${codigo} não aparecerá na ficha (check-out já passou)`);
      }
    } else {
      console.error(`❌ ERRO: Não foi possível verificar a reserva após atualização!`);
    }

    res.json({ 
      success: true, 
      message: 'Status de pagamento atualizado com sucesso',
      status: novoStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Buscar reserva por ID (para páginas de retorno do pagamento)
app.get('/api/reserva-id/:id', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const reserva = queryOne('SELECT codigo FROM reservas WHERE id = ?', [id]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    res.json({ codigo: reserva.codigo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Buscar reserva por código
app.get('/api/reserva/:codigo', async (req, res) => {
  try {
    if (!db) {
      console.error('❌ Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { codigo } = req.params;
    console.log('🔍 Buscando reserva com código:', codigo);
    
    const reserva = queryOne(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE r.codigo = ?
    `, [codigo]);

    if (!reserva) {
      console.log('❌ Reserva não encontrada:', codigo);
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    console.log('✅ Reserva encontrada:', reserva.id);
    
    const result = formatResult([reserva])[0];
    
    // Parse seguro de adicionais
    try {
      result.adicionais = JSON.parse(result.adicionais || '[]');
    } catch (e) {
      result.adicionais = [];
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Erro ao buscar reserva:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Enviar mensagem de contato (com rate limiting e validação)
app.post('/api/contato', apiLimiter, validateContato, async (req, res) => {
  try {
    if (!db) {
      console.error('❌ Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { name, email, phone, message } = req.body;
    console.log('📝 Recebendo ficha de contato:', { name, email, phone: phone || 'não informado' });

    if (!name || !email || !message) {
      console.error('❌ Campos obrigatórios faltando');
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email e mensagem' });
    }

    // Calcular data de expiração (7 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    // Formato SQLite: YYYY-MM-DD HH:MM:SS
    const expiresAtStr = expiresAt.toISOString().replace('T', ' ').substring(0, 19);

    try {
      // Verificar se a coluna expires_at existe, se não, adicionar
      try {
        const testStmt = db.prepare('SELECT expires_at FROM contact_messages LIMIT 1');
        testStmt.step();
        testStmt.free();
      } catch (colError) {
        if (colError.message && colError.message.includes('no such column')) {
          console.log('⚠️ Coluna expires_at não existe, adicionando...');
          try {
            db.run(`ALTER TABLE contact_messages ADD COLUMN expires_at DATETIME`);
            saveDatabase();
            console.log('✅ Coluna expires_at adicionada com sucesso');
          } catch (alterError) {
            console.error('❌ Erro ao adicionar coluna:', alterError);
          }
        }
      }

      // Inserir a ficha usando a função execute (já salva o banco automaticamente)
      console.log('📝 Inserindo ficha:', { name, email, phone: phone || 'null', message: message.substring(0, 50) + '...', expiresAt: expiresAtStr });
      
      const result = execute(`
        INSERT INTO contact_messages (name, email, phone, message, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `, [name, email, phone || null, message, expiresAtStr]);
      
      console.log('✅ Ficha inserida com ID:', result.lastInsertRowid);
      
      console.log('✅ Ficha de contato salva com sucesso!');
      
      res.json({ success: true, message: 'Mensagem enviada com sucesso' });
    } catch (dbError) {
      console.error('❌ Erro ao salvar ficha de contato:', dbError);
      console.error('Erro completo:', dbError.message);
      if (dbError.stack) {
        console.error('Stack:', dbError.stack);
      }
      res.status(500).json({ error: 'Erro ao salvar mensagem. Por favor, tente novamente.' });
    }
  } catch (error) {
    console.error('❌ Erro geral no endpoint /api/contato:', error);
    res.status(500).json({ error: error.message || 'Erro desconhecido ao processar mensagem' });
  }
});

// Rotas administrativas removidas completamente

// API - Listar fichas de contato (admin)
app.get('/api/admin/contato', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('❌ Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    // Apagar fichas expiradas antes de listar
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log('🧹 Limpando fichas expiradas antes de', now);
    
    try {
      execute(`DELETE FROM contact_messages WHERE expires_at < ?`, [now]);
    } catch (deleteError) {
      console.error('⚠️ Erro ao limpar fichas expiradas (continuando):', deleteError.message);
    }

    // Buscar todas as fichas não expiradas
    console.log('📋 Buscando fichas de contato não expiradas...');
    const fichas = queryAll(`
      SELECT id, name, email, phone, message, created_at, expires_at
      FROM contact_messages
      WHERE expires_at >= ? OR expires_at IS NULL
      ORDER BY created_at DESC
    `, [now]);

    console.log(`✅ Encontradas ${fichas.length} fichas de contato`);
    res.json(fichas || []);
  } catch (error) {
    console.error('❌ Erro ao listar fichas de contato:', error);
    res.status(500).json({ error: error.message || 'Erro desconhecido ao listar fichas' });
  }
});

// API - Apagar fichas de contato expiradas (executar periodicamente)
app.post('/api/admin/contato/limpar-expiradas', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Contar quantas fichas serão deletadas
    const countBefore = queryAll(`SELECT COUNT(*) as count FROM contact_messages WHERE expires_at < ?`, [now]);
    const countToDelete = countBefore[0]?.count || 0;
    
    // Deletar fichas expiradas
    execute(`DELETE FROM contact_messages WHERE expires_at < ?`, [now]);

    console.log(`🗑️ ${countToDelete} fichas expiradas removidas`);
    res.json({ success: true, deleted: countToDelete });
  } catch (error) {
    console.error('❌ Erro ao limpar fichas expiradas:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Gerar link WhatsApp (público)
app.get('/api/whatsapp/:codigo', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { codigo } = req.params;
    const reserva = queryOne(`
      SELECT r.*, q.numero as quarto_numero
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.codigo = ?
    `, [codigo || '']);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

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

// ========== PAINEL ADMINISTRATIVO ==========

// Middleware de autenticação
// Middleware de autenticação agora usa o middleware de segurança
// authenticateToken já está importado de middleware/auth.js

// Rotas estáticas do painel já movidas para antes da rota genérica

// API - Login (com rate limiting e validação)
app.post('/api/admin/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { email, password } = req.body;

    // Validação já feita pelo middleware validateLogin
    const user = queryOne('SELECT * FROM users_admin WHERE email = ?', [email.toLowerCase()]);

    if (!user) {
      logLoginAttempt(req, false, email, 'Usuário não encontrado');
      // Mesma mensagem para não expor se o email existe ou não (segurança)
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logLoginAttempt(req, false, email, 'Senha incorreta');
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }

    // Gerar tokens de acesso e refresh
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logLoginAttempt(req, true, email);

    res.json({
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    logLoginAttempt(req, false, req.body.email, error.message);
    res.status(500).json({ error: 'Erro ao processar login' });
  }
});

// API - Refresh Token
app.post('/api/admin/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token não fornecido' });
    }

    const decoded = await verifyRefreshToken(refreshToken);
    
    // Buscar usuário no banco
    const user = queryOne('SELECT * FROM users_admin WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Gerar novo token de acesso
    const newAccessToken = generateAccessToken(user);

    res.json({
      token: newAccessToken
    });
  } catch (error) {
    return res.status(403).json({ error: 'Refresh token inválido ou expirado' });
  }
});

// API - Verificar token (com rate limiting)
app.get('/api/admin/verify', adminApiLimiter, authenticateToken, (req, res) => {
  res.json({ valid: true, user: { id: req.user.id, email: req.user.email, name: req.user.name } });
});

// API - Listar reservas (com rate limiting e logging)
app.get('/api/admin/reservas', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    // Processar regras automáticas antes de retornar reservas
    try {
    processarRegrasAutomaticas();
    } catch (processError) {
      console.error('Erro ao processar regras automáticas:', processError);
      // Continuar mesmo se houver erro nas regras automáticas
    }

    const { status } = req.query;
    let query = 'SELECT * FROM reservas WHERE 1=1';
    const params = [];

    // SEMPRE excluir reservas canceladas e concluídas da lista de reservas ativas
    // Mesmo que o usuário filtre por status, canceladas e concluídas não devem aparecer aqui
    // Incluir variações possíveis do status (Cancelada, Cancelado)
    query += ' AND status NOT IN (?, ?, ?)';
    params.push('Cancelada', 'Cancelado', 'Concluído');

    // Se houver filtro de status, aplicar apenas se não for Cancelada, Cancelado ou Concluído
    if (status && status !== 'Cancelada' && status !== 'Cancelado' && status !== 'Concluído') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY data_reserva DESC';

    const reservas = queryAll(query, params);
    reservas.forEach(r => {
      if (r.adicionais) {
        try {
          r.adicionais = JSON.parse(r.adicionais);
        } catch (e) {
          r.adicionais = [];
        }
      }
    });

    res.json(reservas || []);
  } catch (error) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({ error: error.message || 'Erro ao carregar reservas' });
  }
});

// Função para processar regras automáticas das reservas
function processarRegrasAutomaticas() {
  if (!db) return;

  try {
    const agora = new Date();
    const agoraISO = agora.toISOString().split('T')[0];
    const agoraHora = agora.getHours();
    const agoraMinuto = agora.getMinutes();
    const agoraTimestamp = agora.getTime();

    // 1. Mover reservas CANCELADAS para o histórico (status já está como Cancelada, só precisa garantir que não apareça em ativas)
    // Isso já é feito na query acima com o filtro NOT IN

    // 2. Excluir reservas PENDENTES com mais de 24 horas (NÃO vão para histórico, são excluídas permanentemente)
    const reservasPendentes = queryAll(`
      SELECT id, data_reserva FROM reservas
      WHERE status = 'Pendente'
    `, []);

    reservasPendentes.forEach(reserva => {
      const dataCriacao = new Date(reserva.data_reserva);
      const horasDecorridas = (agoraTimestamp - dataCriacao.getTime()) / (1000 * 60 * 60);
      
      if (horasDecorridas >= 24) {
        // Excluir permanentemente do banco (NÃO vai para histórico)
        execute('DELETE FROM reservas WHERE id = ?', [reserva.id]);
        console.log(`Reserva pendente ${reserva.id} excluída automaticamente após 24h`);
      }
    });

    // 3. Mover reservas CONCLUÍDAS para o histórico (quando check-out passou de 12:00)
    const reservasParaConcluir = queryAll(`
      SELECT id, check_out FROM reservas
      WHERE status NOT IN ('Concluído', 'Cancelada')
    `, []);

    reservasParaConcluir.forEach(reserva => {
      const checkoutDate = new Date(reserva.check_out + 'T12:00:00');
      
      // Se passou do check-out + 12h, marcar como concluído (vai para histórico automaticamente)
      if (agora >= checkoutDate) {
        execute(`
          UPDATE reservas 
          SET status = 'Concluído' 
          WHERE id = ?
        `, [reserva.id]);
        console.log(`Reserva ${reserva.id} movida para histórico (check-out passou de 12h)`);
        saveDatabase();
      }
    });
  } catch (error) {
    console.error('Erro ao processar regras automáticas:', error);
  }
}

// API - Buscar reserva por ID
app.get('/api/admin/reservas/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const reserva = queryOne('SELECT * FROM reservas WHERE id = ?', [id]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    if (reserva.adicionais) {
      try {
        reserva.adicionais = JSON.parse(reserva.adicionais);
      } catch (e) {
        reserva.adicionais = [];
      }
    }

    res.json(reserva);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Criar reserva manual
app.post('/api/admin/reservas', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const {
      nome_completo, email, telefone, categoria, check_in, check_out,
      adultos, criancas, valor_total, metodo_pagamento, status
    } = req.body;

    if (!nome_completo || !email || !categoria || !check_in || !check_out || !valor_total) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    // Calcular noites
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const totalNoites = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (totalNoites <= 0) {
      return res.status(400).json({ error: 'Data de check-out deve ser posterior ao check-in' });
    }

    // Buscar o quarto único da categoria
    const quarto = queryOne('SELECT * FROM quartos WHERE categoria = ? AND disponivel = 1', [categoria]);
    if (!quarto) {
      return res.status(400).json({ error: 'Quarto não encontrado para esta categoria' });
    }

    // Verificar disponibilidade do quarto único
    const disponibilidade = verificarDisponibilidade(quarto.id, categoria, check_in, check_out);
    if (!disponibilidade.disponivel) {
      const conflito = disponibilidade.conflito;
      if (conflito) {
        const checkInFormatado = new Date(conflito.check_in + 'T00:00:00').toLocaleDateString('pt-BR');
        const checkOutFormatado = new Date(conflito.check_out + 'T00:00:00').toLocaleDateString('pt-BR');
        return res.status(400).json({ 
          error: `Este quarto já está reservado entre ${checkInFormatado} e ${checkOutFormatado}. Por favor, escolha outras datas.`,
          conflito: conflito
        });
      } else {
        return res.status(400).json({ error: 'Este quarto não está disponível para essas datas. Por favor, escolha outras datas.' });
      }
    }
    
    // Gerar código único para a reserva (sempre gerado, nunca NULL)
    const codigo = gerarCodigoReserva();
    
    // Validar que o código foi gerado
    if (!codigo || codigo.trim() === '') {
      console.error('Erro: Código da reserva não foi gerado!');
      return res.status(500).json({ error: 'Erro ao gerar código da reserva' });
    }
    
    const numHospedes = (adultos || 2) + (criancas || 0);

    // Inserir reserva
    const result = execute(`
      INSERT INTO reservas (
        codigo, nome_completo, email, telefone, quarto_id, categoria,
        check_in, check_out, num_hospedes, adultos, criancas, total_noites,
        valor_quarto, valor_total, metodo_pagamento, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, nome_completo, email, telefone || '', quarto.id, categoria,
      check_in, check_out, numHospedes, adultos || 2, criancas || 0, totalNoites,
      parseFloat(valor_total) / totalNoites, parseFloat(valor_total),
      metodo_pagamento || 'Dinheiro', status || 'Confirmado'
    ]);

    res.json({ success: true, id: result.lastInsertRowid, codigo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Atualizar reserva
app.put('/api/admin/reservas/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const {
      nome_completo, email, telefone, check_in, check_out,
      adultos, criancas, valor_total, metodo_pagamento, status, motivo_cancelamento
    } = req.body;

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
    if (check_in !== undefined) {
      updateFields.push('check_in = ?');
      updateValues.push(check_in);
    }
    if (check_out !== undefined) {
      updateFields.push('check_out = ?');
      updateValues.push(check_out);
    }
    if (adultos !== undefined) {
      updateFields.push('adultos = ?');
      updateValues.push(adultos);
    }
    if (criancas !== undefined) {
      updateFields.push('criancas = ?');
      updateValues.push(criancas);
    }
    if (valor_total !== undefined) {
      updateFields.push('valor_total = ?');
      updateValues.push(parseFloat(valor_total));
    }
    if (metodo_pagamento !== undefined) {
      updateFields.push('metodo_pagamento = ?');
      updateValues.push(metodo_pagamento);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (motivo_cancelamento !== undefined) {
      updateFields.push('motivo_cancelamento = ?');
      updateValues.push(motivo_cancelamento);
    }

    // Recalcular noites se datas mudaram
    if (check_in && check_out) {
      const checkInDate = new Date(check_in);
      const checkOutDate = new Date(check_out);
      const totalNoites = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      updateFields.push('total_noites = ?');
      updateValues.push(totalNoites);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updateValues.push(id);
    execute(`UPDATE reservas SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    
    // Salvar banco após atualização
    saveDatabase();
    
    // Se o status foi alterado para Cancelada, garantir que não apareça mais em ativas
    if (status === 'Cancelada' || status === 'Cancelado') {
      console.log(`Reserva ${id} cancelada - será removida da lista de ativas`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Quartos reservados
app.get('/api/admin/quartos-reservados', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const hoje = new Date().toISOString().split('T')[0];
    // Filtrar quartos antigos e casas genéricas, excluindo os 3 antigos e Casa 1, 2, 3, 4
    const quartosAntigos = ['Suíte Standard', 'Suíte Premium', 'Suíte Master Lux', 'Casa 1', 'Casa 2', 'Casa 3', 'Casa 4'];
    const todosQuartos = queryAll('SELECT * FROM quartos ORDER BY numero', []);
    const quartos = todosQuartos.filter(quarto => !quartosAntigos.includes(quarto.categoria));

    const quartosComReservas = quartos.map(quarto => {
      try {
      const reservas = queryAll(`
        SELECT r.*, r.nome_completo as cliente_nome
        FROM reservas r
          WHERE r.quarto_id = ? 
          AND (r.status = 'aprovado' OR r.status = 'Confirmado' OR r.status = 'Paga' OR r.status = 'Pago')
        AND r.check_out >= ?
        ORDER BY r.check_in ASC
        LIMIT 1
      `, [quarto.id, hoje]);

      if (reservas.length > 0) {
        const reserva = reservas[0];
        const checkInDate = new Date(reserva.check_in);
        const checkOutDate = new Date(reserva.check_out);
        const diasOcupados = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        return {
          ...quarto,
          reservado: true,
          check_in: reserva.check_in,
          check_out: reserva.check_out,
          cliente_nome: reserva.cliente_nome,
          dias_ocupados: diasOcupados
        };
      }

      return {
        ...quarto,
        reservado: false
      };
      } catch (mapError) {
        console.error(`Erro ao processar quarto ${quarto.id}:`, mapError);
        return {
          ...quarto,
          reservado: false
        };
      }
    });

    res.json(quartosComReservas || []);
  } catch (error) {
    console.error('Erro ao listar quartos reservados:', error);
    res.status(500).json({ error: error.message || 'Erro ao carregar quartos' });
  }
});

// API - Buscar todas as reservas de um quarto específico
app.get('/api/admin/quartos/:id/reservas', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const quartoId = parseInt(id, 10);
    
    if (isNaN(quartoId) || quartoId <= 0) {
      return res.status(400).json({ error: 'ID do quarto inválido' });
    }

    // Buscar informações do quarto
    const quarto = queryOne('SELECT * FROM quartos WHERE id = ?', [quartoId]);
    
    if (!quarto) {
      return res.status(404).json({ error: 'Quarto não encontrado' });
    }

    // Buscar apenas reservas ATIVAS deste quarto (check-out ainda não passou)
    const hoje = new Date().toISOString().split('T')[0];
    console.log('🔍 Buscando reservas ATIVAS para quarto ID:', quartoId, 'Categoria:', quarto.categoria, 'Data atual:', hoje);
    
    // PRIMEIRO: Buscar TODAS as reservas desta categoria (sem filtro de data ou status) para debug
    const todasReservasCategoria = queryAll(`
      SELECT * FROM reservas
      WHERE categoria = ?
      ORDER BY check_in DESC
    `, [quarto.categoria]);
    
    console.log('📊 Total de reservas encontradas para categoria', quarto.categoria, ':', todasReservasCategoria.length);
    todasReservasCategoria.forEach(r => {
      console.log(`  - Reserva ${r.codigo}: quarto_id=${r.quarto_id}, status=${r.status}, check_out=${r.check_out}, check_in=${r.check_in}`);
    });
    
    // Buscar TODAS as reservas por quarto_id (sem filtro de data primeiro)
    const reservasPorId = queryAll(`
      SELECT * FROM reservas
      WHERE quarto_id = ?
      ORDER BY check_in DESC
    `, [quartoId]);
    
    console.log('📋 Reservas encontradas por quarto_id (sem filtro):', reservasPorId.length);
    reservasPorId.forEach(r => {
      console.log(`  ✓ Reserva ${r.codigo}: status=${r.status}, check_out=${r.check_out}`);
    });
    
    // Buscar TODAS as reservas por categoria (sem filtro de data primeiro)
    const reservasPorCategoria = queryAll(`
      SELECT * FROM reservas
      WHERE categoria = ?
      ORDER BY check_in DESC
    `, [quarto.categoria]);
    
    console.log('📋 Reservas encontradas por categoria:', reservasPorCategoria.length);
    reservasPorCategoria.forEach(r => {
      console.log(`  ✓ Reserva ${r.codigo}: quarto_id=${r.quarto_id}, status=${r.status}, check_out=${r.check_out}`);
    });
    
    // Combinar e remover duplicatas
    const todasReservas = [...reservasPorId];
    reservasPorCategoria.forEach(r => {
      if (!todasReservas.find(existing => existing.id === r.id)) {
        todasReservas.push(r);
      }
    });
    
    // Corrigir reservas que não têm quarto_id ou têm quarto_id incorreto (atualizar para o quarto correto)
    todasReservas.forEach(reserva => {
      if (!reserva.quarto_id || reserva.quarto_id !== quartoId) {
        console.log('🔧 Corrigindo quarto_id da reserva', reserva.id, 'de', reserva.quarto_id, 'para', quartoId);
        execute('UPDATE reservas SET quarto_id = ? WHERE id = ?', [quartoId, reserva.id]);
        reserva.quarto_id = quartoId;
        saveDatabase();
      }
    });
    
    // Filtrar apenas reservas ativas (check-out >= hoje) e garantir que o quarto_id está correto
    const reservas = todasReservas.filter(r => {
      const checkOutDate = new Date(r.check_out + 'T00:00:00');
      const hojeDate = new Date(hoje + 'T00:00:00');
      const aindaAtiva = checkOutDate >= hojeDate;
      
      // Aceitar APENAS reservas confirmadas/pagas: Paga, Pago, Confirmado, aprovado
      // EXCLUIR reservas pendentes da ficha do quarto
      // Excluir: Concluído, Cancelada, Cancelado, Pendente
      const statusConfirmados = ['Confirmado', 'Paga', 'Pago', 'aprovado'];
      const statusExcluidos = ['Concluído', 'Cancelada', 'Cancelado', 'Pendente'];
      // Aceitar apenas se for status confirmado/pago (NÃO incluir pendente)
      // Se não tiver status, rejeitar (para garantir que só reservas válidas apareçam)
      const statusValido = r.status && statusConfirmados.includes(r.status) && !statusExcluidos.includes(r.status);
      
      if (!aindaAtiva) {
        console.log(`  ⏰ Reserva ${r.codigo} não aparece: check-out (${r.check_out}) já passou`);
      }
      if (!statusValido) {
        console.log(`  ❌ Reserva ${r.codigo} não aparece: status inválido (${r.status})`);
      }
      
      return aindaAtiva && statusValido;
    }).map(r => {
      // Garantir que o quarto_id está correto
      r.quarto_id = quartoId;
      return r;
    });
    
    console.log('📋 Reservas encontradas por ID:', reservasPorId.length);
    console.log('📋 Reservas encontradas por categoria:', reservasPorCategoria.length);
    console.log('📋 Total de reservas combinadas:', todasReservas.length);
    console.log('📋 Total de reservas ATIVAS após filtro:', reservas.length, 'para quarto', quartoId);
    
    if (reservas.length > 0) {
      console.log('✅ Reservas que aparecerão na ficha:');
      reservas.forEach((r, index) => {
        console.log(`  ${index + 1}. Reserva ${r.codigo}: status=${r.status}, check_out=${r.check_out}, quarto_id=${r.quarto_id}`);
      });
    } else {
      console.log('⚠️ NENHUMA reserva ativa encontrada para este quarto');
      console.log('💡 Verificando se há reservas com problemas...');
      
      // Verificar se há reservas com quarto_id incorreto
      const reservasComProblema = queryAll(`
        SELECT * FROM reservas
        WHERE categoria = ?
        AND (quarto_id IS NULL OR quarto_id != ?)
      `, [quarto.categoria, quartoId]);
      
      if (reservasComProblema.length > 0) {
        console.log(`🔧 Encontradas ${reservasComProblema.length} reservas com quarto_id incorreto ou NULL. Corrigindo...`);
        reservasComProblema.forEach(r => {
          console.log(`  - Corrigindo reserva ${r.codigo}: quarto_id de ${r.quarto_id} para ${quartoId}`);
          execute('UPDATE reservas SET quarto_id = ? WHERE id = ?', [quartoId, r.id]);
        });
        saveDatabase();
        console.log('✅ Correções aplicadas. Recarregue a ficha do quarto.');
      }
    }

    res.json({
      quarto: quarto,
      reservas: reservas || []
    });
  } catch (error) {
    console.error('Erro ao buscar reservas do quarto:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Histórico
app.get('/api/admin/historico', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const historico = queryAll(`
      SELECT * FROM reservas
      WHERE status IN ('Concluído', 'Cancelada')
      ORDER BY data_reserva DESC
    `, []);

    res.json(historico || []);
  } catch (error) {
    console.error('Erro ao listar histórico:', error);
    res.status(500).json({ error: error.message || 'Erro ao carregar histórico' });
  }
});

// API - Buscar histórico
app.get('/api/admin/historico/buscar', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { termo } = req.query;
    if (!termo || termo.trim() === '') {
      return res.json([]);
    }

    const search = termo.trim();
    const like = `%${search}%`;
    
    // Buscar apenas por código, telefone ou email (nome removido)
    // Se o termo for numérico, também buscar por ID
    const isNumeric = !isNaN(search) && !isNaN(parseFloat(search));
    const idValue = isNumeric ? parseInt(search, 10) : null;
    
    let query = `
      SELECT * FROM reservas
      WHERE status IN ('Concluído', 'Cancelada')
      AND (
        codigo LIKE ? OR
        telefone LIKE ? OR
        email LIKE ?
    `;
    
    const params = [like, like, like];
    
    // Se for numérico, adicionar busca por ID
    if (isNumeric && idValue !== null) {
      query += ` OR id = ?`;
      params.push(idValue);
    }
    
    query += `)
      ORDER BY data_reserva DESC
    `;
    
    console.log('🔍 Buscando histórico com termo:', search);
    console.log('📝 Query:', query);
    console.log('📋 Params:', params);
    
    const historico = queryAll(query, params);
    
    console.log(`✅ Encontrados ${historico.length} registros no histórico`);

    res.json(historico || []);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
  }
});

// API - Buscar reserva específica do histórico por ID
app.get('/api/admin/historico/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'ID da reserva é obrigatório' });
    }

    const reserva = queryOne(`
      SELECT * FROM reservas
      WHERE id = ? AND status IN ('Concluído', 'Cancelada')
    `, [id]);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva não encontrada no histórico' });
    }

    res.json(reserva);
  } catch (error) {
    console.error('Erro ao buscar reserva do histórico:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar reserva' });
  }
});

// API - Excluir ficha do histórico
// Suporte para OPTIONS (preflight CORS)
app.options('/api/admin/historico/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

app.delete('/api/admin/historico/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    console.log('=== TENTATIVA DE EXCLUSÃO DE FICHA ===');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('ID recebido:', req.params.id);
    console.log('Headers:', req.headers);
    
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    
    // Validar ID
    if (!id || id.toString().trim() === '') {
      console.error('ID vazio ou inválido');
      return res.status(400).json({ error: 'ID da ficha não fornecido' });
    }

    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      console.error('ID não é um número válido:', id);
      return res.status(400).json({ error: 'ID da ficha inválido' });
    }
    
    console.log('ID convertido para número:', idNum);
    
    // Verificar se a reserva existe e está no histórico (status Concluído ou Cancelada)
    const reserva = queryOne(`
      SELECT id, status FROM reservas
      WHERE id = ? AND status IN ('Concluído', 'Cancelada')
    `, [idNum]);

    console.log('Reserva encontrada:', reserva);

    if (!reserva) {
      console.error('Reserva não encontrada no histórico com ID:', idNum);
      return res.status(404).json({ error: 'Ficha não encontrada no histórico' });
    }

    // Excluir permanentemente do banco de dados
    console.log('Tentando excluir reserva ID:', idNum);
    
    try {
      // Executar DELETE
      const sanitized = sanitizeParams([idNum]);
      const stmt = db.prepare('DELETE FROM reservas WHERE id = ?');
      stmt.bind(sanitized);
      const executed = stmt.step();
      stmt.free();
      
      // Salvar banco após modificação
      saveDatabase();
      console.log('DELETE executado e banco salvo. ID:', idNum);
      
      // Verificar se a exclusão foi bem-sucedida
      const verificarExclusao = queryOne('SELECT id FROM reservas WHERE id = ?', [idNum]);
      if (verificarExclusao) {
        console.error('Reserva ainda existe após DELETE. ID:', idNum);
        return res.status(500).json({ error: 'Erro ao excluir ficha do banco de dados. A ficha ainda existe.' });
      }

      if (!executed) {
        // Se não foi executado mas a verificação mostra que não existe mais, considerar sucesso
        console.warn('stmt.step() retornou false, mas reserva não existe mais. Considerando sucesso.');
      }

      console.log('✅ Ficha excluída com sucesso. ID:', idNum);
      res.status(200).json({ success: true });
    } catch (deleteError) {
      console.error('Erro ao executar DELETE:', deleteError);
      console.error('Stack trace:', deleteError.stack);
      console.error('Tipo do erro:', typeof deleteError);
      console.error('Mensagem do erro:', deleteError.message);
      return res.status(500).json({ error: 'Erro ao excluir ficha: ' + (deleteError.message || deleteError.toString() || 'Erro desconhecido') });
    }
  } catch (error) {
    console.error('Erro ao excluir ficha do histórico:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message || 'Erro ao excluir ficha' });
  }
});

// API - Usuários
app.get('/api/admin/usuarios', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const usuarios = queryAll('SELECT id, name, email FROM users_admin ORDER BY name', []);
    res.json(usuarios || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/usuarios/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const usuario = queryOne('SELECT id, name, email FROM users_admin WHERE id = ?', [id]);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/usuarios', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios' });
    }

    const existing = queryOne('SELECT id FROM users_admin WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = execute(
      'INSERT INTO users_admin (name, email, password) VALUES (?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword]
    );

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/usuarios/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e e-mail são obrigatórios' });
    }

    const existing = queryOne('SELECT id FROM users_admin WHERE email = ? AND id != ?', [email.toLowerCase(), id]);
    if (existing) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      execute(
        'UPDATE users_admin SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email.toLowerCase(), hashedPassword, id]
      );
    } else {
      execute(
        'UPDATE users_admin SET name = ?, email = ? WHERE id = ?',
        [name, email.toLowerCase(), id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suporte para OPTIONS (preflight CORS) - Usuários
app.options('/api/admin/usuarios/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

app.delete('/api/admin/usuarios/:id', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    console.log('=== TENTATIVA DE EXCLUSÃO DE USUÁRIO ===');
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    console.log('Path:', req.path);
    console.log('ID recebido:', req.params.id);
    
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    
    // Validar ID
    if (!id || id.toString().trim() === '') {
      console.error('ID vazio ou inválido');
      return res.status(400).json({ error: 'ID do usuário não fornecido' });
    }

    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      console.error('ID inválido:', id);
      return res.status(400).json({ error: 'ID do usuário inválido' });
    }
    
    // Verificar se o usuário existe
    const usuario = queryOne('SELECT id FROM users_admin WHERE id = ?', [idNum]);
    if (!usuario) {
      console.error('Usuário não encontrado:', idNum);
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Não permitir excluir o próprio usuário
    if (req.user.id == idNum) {
      console.error('Tentativa de excluir próprio usuário');
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }

    execute('DELETE FROM users_admin WHERE id = ?', [idNum]);
    console.log('Usuário excluído com sucesso:', idNum);
    res.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir usuário' });
  }
});

// API - Valores das suítes

// API - Obter preços atualizados dos quartos (público)
app.get('/api/precos', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    // Buscar preços dos quartos do banco de dados
    const quartos = queryAll('SELECT DISTINCT categoria, preco_base FROM quartos ORDER BY categoria', []);
    
    const precos = {};
    quartos.forEach(quarto => {
      // Incluir todas as categorias (casas e quartos)
      precos[quarto.categoria] = quarto.preco_base;
    });

    res.json(precos);
  } catch (error) {
    console.error('Erro ao buscar preços:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Obter valores das suítes (público) - busca da tabela configuracoes
app.get('/api/valores-suites', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    // Valores padrão caso não existam no banco
    const valoresPadrao = {
      harmonia: 350,
      orquidea: 550,
      imperial: 950
    };

    // Buscar valores da tabela configuracoes
    const configs = queryAll('SELECT chave, valor FROM configuracoes WHERE chave IN (?, ?, ?)', 
      ['preco_harmonia', 'preco_orquidea', 'preco_imperial']);
    
    const valores = { ...valoresPadrao };
    
    configs.forEach(config => {
      const chave = config.chave.replace('preco_', '');
      if (chave === 'harmonia') valores.harmonia = parseFloat(config.valor) || valoresPadrao.harmonia;
      if (chave === 'orquidea') valores.orquidea = parseFloat(config.valor) || valoresPadrao.orquidea;
      if (chave === 'imperial') valores.imperial = parseFloat(config.valor) || valoresPadrao.imperial;
    });

    // Buscar preços de todas as categorias do banco
    const todosQuartos = queryAll('SELECT categoria, preco_base FROM quartos GROUP BY categoria', []);
    const precosMap = {};
    todosQuartos.forEach(quarto => {
      precosMap[quarto.categoria] = quarto.preco_base || 0;
    });
    
    // Retornar no formato esperado pelo frontend (incluindo compatibilidade)
    res.json({
      harmonia: valores.harmonia,
      orquidea: valores.orquidea,
      imperial: valores.imperial,
      ...precosMap
    });
  } catch (error) {
    console.error('Erro ao buscar valores das suítes:', error);
    res.status(500).json({ error: error.message });
  }
});

// API - Renda do mês (formato simplificado para gráfico)
app.get('/api/admin/renda-mes', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    console.log('📊 Rota /api/admin/renda-mes chamada');
    console.log('Query params:', req.query);
    
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { mes, ano } = req.query;
    const mesNum = parseInt(mes) || new Date().getMonth() + 1;
    const anoNum = parseInt(ano) || new Date().getFullYear();
    
    console.log(`Buscando renda para mês ${mesNum}/${anoNum}`);

    // Buscar todas as reservas PAGAS do mês/ano selecionado
    const reservasPagas = queryAll(`
      SELECT * FROM reservas
      WHERE strftime('%m', data_reserva) = ? AND strftime('%Y', data_reserva) = ?
      AND status = 'Paga'
    `, [String(mesNum).padStart(2, '0'), anoNum.toString()]);

    // Calcular total do mês
    const totalMes = reservasPagas
      .reduce((sum, r) => sum + parseFloat(r.valor_total || 0), 0);

    // Criar mapa de dias com valores faturados
    const diasMap = new Map();
    
    // Para cada reserva, distribuir o valor pelos dias
    reservasPagas.forEach(reserva => {
      const checkIn = new Date(reserva.check_in);
      const checkOut = new Date(reserva.check_out);
      const valorTotal = parseFloat(reserva.valor_total || 0);
      
      // Calcular número de dias da reserva
      const diffTime = checkOut.getTime() - checkIn.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const valorPorDia = diffDays > 0 ? valorTotal / diffDays : valorTotal;
      
      // Iterar por cada dia entre check-in e check-out
      const dataAtual = new Date(checkIn);
      while (dataAtual < checkOut) {
        const dia = dataAtual.getDate();
        const mes = dataAtual.getMonth() + 1;
        const ano = dataAtual.getFullYear();
        
        // Só contar se for EXATAMENTE do mês/ano selecionado
        if (mes === mesNum && ano === anoNum) {
          diasMap.set(dia, (diasMap.get(dia) || 0) + valorPorDia);
        }
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    });

    // Converter para array de objetos { dia, valor }
    const dias = Array.from(diasMap.entries())
      .map(([dia, valor]) => ({
        dia: parseInt(dia),
        valor: Math.round(valor * 100) / 100 // Arredondar para 2 casas decimais
      }))
      .sort((a, b) => a.dia - b.dia);

    const resultado = {
      totalMes: Math.round(totalMes * 100) / 100,
      dias: dias
    };
    
    console.log(`✅ Renda calculada: Total R$ ${resultado.totalMes}, ${dias.length} dias com dados`);
    res.json(resultado);
  } catch (error) {
    console.error('❌ Erro ao calcular renda do mês:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message || 'Erro ao carregar dados de renda' });
  }
});

// ===== ROTA: RENDA MENSAL =====
app.get('/api/renda-mensal', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const ano = req.query.ano;
    const mes = req.query.mes;

    if (!ano || !mes) {
      return res.status(400).json({ error: 'Ano e mês são obrigatórios' });
    }

    // Converter mês para número
    const mesNum = Number(mes);
    const anoNum = Number(ano);

    if (isNaN(mesNum) || isNaN(anoNum) || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ error: 'Ano e mês inválidos' });
    }

    // Criar datas do início e fim do mês
    const inicioMes = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
    const fimMes = new Date(anoNum, mesNum, 0).toISOString().split('T')[0]; // Último dia do mês

    // Buscar reservas confirmadas/pagas dentro do mês usando DATE() para comparar apenas a data
    const reservas = queryAll(
      `SELECT valor_total, data_reserva 
       FROM reservas 
       WHERE (status = 'Confirmado' OR status = 'Paga' OR status = 'Pago' OR status = 'aprovado')
       AND DATE(data_reserva) BETWEEN ? AND ?`,
      [inicioMes, fimMes]
    );

    // Quantidade de dias no mês
    const diasNoMes = new Date(anoNum, mesNum, 0).getDate();

    let dias = [];
    let totalMes = 0;

    // Montar renda de cada dia
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const valorDia = reservas
        .filter(r => {
          const dataReserva = new Date(r.data_reserva);
          return dataReserva.getDate() === dia;
        })
        .reduce((sum, r) => sum + Number(r.valor_total || 0), 0);

      dias.push({
        dia,
        valor: valorDia
      });

      totalMes += valorDia;
    }

    return res.json({
      dias,
      totalMes
    });

  } catch (err) {
    console.error('Erro na rota /api/renda-mensal:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.get('/api/admin/renda', adminApiLimiter, authenticateToken, requireAdmin, logAdminRequests, async (req, res) => {
  try {
    if (!db) {
      console.error('Banco de dados não disponível');
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { mes, ano } = req.query;
    const mesNum = parseInt(mes) || new Date().getMonth() + 1;
    const anoNum = parseInt(ano) || new Date().getFullYear();

    // Estatísticas do mês
    const hoje = new Date().toISOString().split('T')[0];
    
    // Total de reservas: apenas reservas PAGAS
    const reservasPagas = queryAll(`
      SELECT * FROM reservas
      WHERE strftime('%m', data_reserva) = ? AND strftime('%Y', data_reserva) = ?
      AND status = 'Paga'
    `, [String(mesNum).padStart(2, '0'), anoNum.toString()]);
    
    const totalReservas = reservasPagas.length;
    
    // Reservas concluídas: baseado na data de checkout (já passou)
    const reservasConcluidas = queryAll(`
      SELECT * FROM reservas
      WHERE strftime('%m', check_out) = ? AND strftime('%Y', check_out) = ?
      AND check_out < ?
      AND status != 'Cancelada'
    `, [String(mesNum).padStart(2, '0'), anoNum.toString(), hoje]);
    
    const reservasCanceladas = queryAll(`
      SELECT * FROM reservas
      WHERE strftime('%m', data_reserva) = ? AND strftime('%Y', data_reserva) = ?
      AND status = 'Cancelada'
    `, [String(mesNum).padStart(2, '0'), anoNum.toString()]);
    
    const totalFaturado = reservasPagas
      .reduce((sum, r) => sum + parseFloat(r.valor_total || 0), 0);

    // Gráfico de ocupação: apenas dias do mês atual que têm reservas
    const graficoLabels = [];
    const graficoDados = [];
    
    // Buscar todas as reservas que passam pelo mês/ano selecionado
    const primeiroDiaMes = `${anoNum}-${String(mesNum).padStart(2, '0')}-01`;
    const ultimoDiaMes = new Date(anoNum, mesNum, 0).toISOString().split('T')[0]; // Último dia do mês
    
    const reservasGrafico = queryAll(`
      SELECT check_in, check_out FROM reservas
      WHERE status != 'Cancelada' AND status != 'Pendente'
      AND check_in <= ? AND check_out >= ?
    `, [ultimoDiaMes, primeiroDiaMes]);
    
    // Criar um mapa de dias com reservas (apenas dias do mês selecionado)
    const diasComReservas = new Map();
    
    reservasGrafico.forEach(reserva => {
      const checkIn = new Date(reserva.check_in);
      const checkOut = new Date(reserva.check_out);
      
      // Iterar por cada dia entre check-in e check-out
      const dataAtual = new Date(checkIn);
      while (dataAtual <= checkOut) {
        const dia = dataAtual.getDate();
        const mes = dataAtual.getMonth() + 1;
        const ano = dataAtual.getFullYear();
        
        // Só contar se for EXATAMENTE do mês/ano selecionado
        if (mes === mesNum && ano === anoNum) {
          diasComReservas.set(dia, (diasComReservas.get(dia) || 0) + 1);
        }
        
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
    });
    
    // Ordenar os dias e criar arrays para o gráfico (apenas dias com reservas do mês atual)
    const diasOrdenados = Array.from(diasComReservas.keys()).sort((a, b) => a - b);
    diasOrdenados.forEach(dia => {
      // Mostrar apenas o número do dia (sem "Dia" para ficar mais limpo)
      graficoLabels.push(String(dia));
      graficoDados.push(diasComReservas.get(dia));
    });

    // Histórico mensal: apenas meses que TÊM reservas (não mostrar meses com 0 vendas)
    const hojeHistorico = new Date();
    const mesAtual = hojeHistorico.getMonth() + 1;
    const anoAtual = hojeHistorico.getFullYear();
    
    // Buscar todos os meses únicos que têm reservas PAGAS
    const mesesComReservas = queryAll(`
      SELECT DISTINCT 
        CAST(strftime('%m', data_reserva) AS INTEGER) as mes,
        CAST(strftime('%Y', data_reserva) AS INTEGER) as ano
      FROM reservas
      WHERE (status = 'Paga' OR status = 'Pago' OR status = 'Confirmado' OR status = 'aprovado')
      ORDER BY ano DESC, mes DESC
    `, []);
    
    const historico = [];
    
    // Processar apenas meses que têm reservas
    mesesComReservas.forEach(mesData => {
      const mesHist = mesData.mes;
      const anoHist = mesData.ano;
      
      // Contar apenas reservas PAGAS/CONFIRMADAS para o histórico
      const reservasHist = queryAll(`
        SELECT * FROM reservas
        WHERE strftime('%m', data_reserva) = ? AND strftime('%Y', data_reserva) = ?
        AND (status = 'Paga' OR status = 'Pago' OR status = 'Confirmado' OR status = 'aprovado')
      `, [String(mesHist).padStart(2, '0'), anoHist.toString()]);

      if (reservasHist.length > 0) {
      const valorTotal = reservasHist
        .reduce((sum, r) => sum + parseFloat(r.valor_total || 0), 0);
      
      const ocupacao = queryAll(`
        SELECT COUNT(DISTINCT quarto_id) as count FROM reservas
        WHERE strftime('%m', check_in) = ? AND strftime('%Y', check_in) = ? 
        AND (status = 'Paga' OR status = 'Pago' OR status = 'Confirmado' OR status = 'aprovado')
      `, [String(mesHist).padStart(2, '0'), anoHist.toString()]);

      const totalQuartos = queryAll('SELECT COUNT(*) as count FROM quartos', [])[0]?.count || 1;
      const percentOcupacao = Math.round((ocupacao[0]?.count || 0) / totalQuartos * 100);
      
      const cancelamentos = queryAll(`
        SELECT COUNT(*) as count FROM reservas
        WHERE strftime('%m', data_reserva) = ? AND strftime('%Y', data_reserva) = ?
        AND status = 'Cancelada'
      `, [String(mesHist).padStart(2, '0'), anoHist.toString()])[0]?.count || 0;

      historico.push({
        mes: mesHist,
        ano: anoHist,
        total_reservas: reservasHist.length,
        valor_total: valorTotal,
        ocupacao: percentOcupacao,
        cancelamentos: cancelamentos
      });
      }
    });
    
    // Ordenar do mais antigo ao mais recente
    historico.sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });

    res.json({
      total_reservas: totalReservas || 0,
      reservas_concluidas: reservasConcluidas.length || 0,
      reservas_canceladas: reservasCanceladas.length || 0,
      total_faturado: totalFaturado || 0,
      grafico_labels: graficoLabels || [],
      grafico_dados: graficoDados || [],
      historico: historico || []
    });
  } catch (error) {
    console.error('Erro ao calcular renda:', error);
    res.status(500).json({ error: error.message || 'Erro ao carregar dados de renda' });
  }
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Rota não encontrada' });
  }
  // Para rotas não-API, servir arquivos estáticos ou página 404
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar servidor
initDatabase().then(() => {
  // Carregar configuração SMTP após banco estar pronto
  transporter = createTransporter();
  if (transporter) {
    console.log('📧 Configuração SMTP carregada do banco de dados');
  } else {
    console.log('⚠️ SMTP não configurado. E-mails não serão enviados até que seja configurado.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`💾 Banco de dados: SQLite (embutido)`);
  });
}).catch(error => {
  console.error('❌ Erro ao inicializar servidor:', error);
  process.exit(1);
});

