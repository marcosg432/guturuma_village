const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'brisa_imperial_secret_key_2024';

// Configuração SQLite - banco embutido
const dbPath = path.join(__dirname, 'database', 'brisa_imperial.db');
const dbDir = path.join(__dirname, 'database');

// Criar diretório se não existir
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Banco de dados SQLite
let db;
let SQL;

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
  db.run(`
    CREATE TABLE IF NOT EXISTS users_admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      two_factor_code TEXT,
      two_factor_expires_at TEXT
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      valor_quarto REAL NOT NULL,
      adicionais TEXT,
      valor_adicionais REAL DEFAULT 0,
      desconto REAL DEFAULT 0,
      valor_total REAL NOT NULL,
      metodo_pagamento TEXT,
      status TEXT DEFAULT 'Confirmado',
      data_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE SET NULL
    )
  `);

  // Tabela configuracoes
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT UNIQUE NOT NULL,
      valor TEXT NOT NULL
    )
  `);

  // Tabela de bloqueios de quartos
  db.exec(`
    CREATE TABLE IF NOT EXISTS bloqueios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quarto_id INTEGER,
      categoria TEXT NOT NULL,
      data_inicio TEXT NOT NULL,
      data_fim TEXT NOT NULL,
      motivo TEXT,
      criado_por INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE CASCADE,
      FOREIGN KEY (criado_por) REFERENCES users_admin(id) ON DELETE SET NULL
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

  // Criar índices para melhor performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_check_in ON reservas(check_in)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_check_out ON reservas(check_out)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_reservas_status ON reservas(status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_bloqueios_datas ON bloqueios(data_inicio, data_fim)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_historico_reserva ON historico_check(reserva_id)`);
}

function insertDefaultData() {
  // Verificar se já existe admin
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users_admin').get();
  if (adminExists.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users_admin (name, email, password)
      VALUES (?, ?, ?)
    `).run('Administrador', 'admin@brisaimperial.com', hashedPassword);
    console.log('👤 Usuário admin criado: admin@brisaimperial.com / admin123');
  }

  // Inserir quartos padrão se não existirem
  const quartosCount = db.prepare('SELECT COUNT(*) as count FROM quartos').get();
  if (quartosCount.count === 0) {
    const quartos = [
      { categoria: 'Suíte Harmonia', numero: 101, capacidade: 2, vista: 'Jardim', preco_base: 250 },
      { categoria: 'Suíte Harmonia', numero: 102, capacidade: 2, vista: 'Jardim', preco_base: 250 },
      { categoria: 'Suíte Harmonia', numero: 103, capacidade: 2, vista: 'Jardim', preco_base: 250 },
      { categoria: 'Suíte Orquídea Premium', numero: 201, capacidade: 2, vista: 'Mar', preco_base: 350 },
      { categoria: 'Suíte Orquídea Premium', numero: 202, capacidade: 2, vista: 'Mar', preco_base: 350 },
      { categoria: 'Suíte Orquídea Premium', numero: 203, capacidade: 2, vista: 'Mar', preco_base: 350 },
      { categoria: 'Suíte Imperial Master', numero: 301, capacidade: 4, vista: 'Mar', preco_base: 500 },
      { categoria: 'Suíte Imperial Master', numero: 302, capacidade: 4, vista: 'Mar', preco_base: 500 }
    ];

    const insertQuarto = db.prepare(`
      INSERT INTO quartos (categoria, numero, capacidade, vista, disponivel, preco_base)
      VALUES (?, ?, ?, ?, 1, ?)
    `);

    for (const quarto of quartos) {
      insertQuarto.run(quarto.categoria, quarto.numero, quarto.capacidade, quarto.vista, quarto.preco_base);
    }
    console.log('🏨 Quartos padrão criados');
  }

  // Inserir configurações padrão
  const configsCount = db.prepare('SELECT COUNT(*) as count FROM configuracoes').get();
  if (configsCount.count === 0) {
    const configs = [
      { chave: 'preco_passeio', valor: '150' },
      { chave: 'preco_romantico', valor: '200' },
      { chave: 'preco_upgrade_vista', valor: '80' },
      { chave: 'preco_cama_extra', valor: '50' },
      { chave: 'preco_decoracao', valor: '100' }
    ];

    const insertConfig = db.prepare('INSERT INTO configuracoes (chave, valor) VALUES (?, ?)');
    for (const config of configs) {
      insertConfig.run(config.chave, config.valor);
    }
    console.log('⚙️  Configurações padrão criadas');
  }
}

// Função auxiliar para converter resultados SQLite para formato compatível
function formatResult(rows) {
  if (!rows) return [];
  if (Array.isArray(rows)) {
    return rows.map(row => {
      const obj = {};
      for (const key in row) {
        obj[key] = row[key];
      }
      return obj;
    });
  }
  return rows;
}

// Função para atualizar status automático de reservas
function atualizarStatusReservas() {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    // Atualizar reservas com check-out passado para "Concluído"
    db.prepare(`
      UPDATE reservas 
      SET status = 'Concluído' 
      WHERE status NOT IN ('Concluído', 'Cancelado') 
      AND check_out < ?
    `).run(hoje);
  } catch (error) {
    console.error('Erro ao atualizar status das reservas:', error);
  }
}

// Executar atualização a cada hora
setInterval(atualizarStatusReservas, 60 * 60 * 1000);
// Executar imediatamente ao iniciar
atualizarStatusReservas();

// Configuração de email (opcional)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'admin@villageresidences.com',
    pass: 'your-app-password'
  }
});

// ROTAS ESTÁTICAS

// Home - com suporte a páginas dinâmicas
app.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }

    const stmt = db.prepare('SELECT html_content FROM pages WHERE page_name = ?');
    const page = stmt.get('home');

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

// Painel admin
app.get('/painel-brisa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/painel-brisa/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

// Páginas dinâmicas (deve vir depois das rotas estáticas e admin)
app.get('/:page', async (req, res) => {
  const pageName = req.params.page;
  
  // Ignorar rotas do painel admin para evitar conflito
  if (pageName.startsWith('painel-brisa')) {
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

    const stmt = db.prepare('SELECT html_content FROM pages WHERE page_name = ?');
    const page = stmt.get(pageName);

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
    const stmt = db.prepare('SELECT * FROM services ORDER BY name');
    const rows = stmt.all();
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
    const existing = db.prepare('SELECT * FROM appointments WHERE date = ? AND time = ?').get(date, time);
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

// Função auxiliar para verificar disponibilidade considerando reservas e bloqueios
function verificarDisponibilidade(quartoId, categoria, checkIn, checkOut) {
  // Verificar reservas ativas
  const reservas = db.prepare(`
    SELECT * FROM reservas 
    WHERE quarto_id = ? 
    AND status NOT IN ('Concluído', 'Cancelado')
    AND (
      (check_in <= ? AND check_out >= ?) OR
      (check_in <= ? AND check_out >= ?) OR
      (check_in >= ? AND check_out <= ?)
    )
  `).all(quartoId, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut);

  if (reservas.length > 0) {
    return false;
  }

  // Verificar bloqueios
  const bloqueios = db.prepare(`
    SELECT * FROM bloqueios 
    WHERE (quarto_id = ? OR categoria = ?)
    AND (
      (data_inicio <= ? AND data_fim >= ?) OR
      (data_inicio <= ? AND data_fim >= ?) OR
      (data_inicio >= ? AND data_fim <= ?)
    )
  `).all(quartoId, categoria, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut);

  if (bloqueios.length > 0) {
    return false;
  }

  return true;
}

// API - Listar quartos disponíveis
app.get('/api/quartos/:categoria', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { categoria } = req.params;
    const { check_in, check_out } = req.query;

    if (check_in && check_out) {
      const todosQuartos = db.prepare('SELECT * FROM quartos WHERE categoria = ? AND disponivel = 1').all(categoria);
      
      const quartosDisponiveis = todosQuartos.filter(quarto => {
        return verificarDisponibilidade(quarto.id, categoria, check_in, check_out);
      });
      
      return res.json(formatResult(quartosDisponiveis));
    }

    const stmt = db.prepare('SELECT * FROM quartos WHERE categoria = ? AND disponivel = 1');
    const rows = stmt.all(categoria);
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Criar reserva
app.post('/api/reserva', async (req, res) => {
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
      adicionais,
      metodo_pagamento,
      cupom
    } = req.body;

    // Buscar quartos da categoria
    const todosQuartos = db.prepare('SELECT * FROM quartos WHERE categoria = ? AND disponivel = 1').all(categoria);

    // Verificar disponibilidade
    let quartoDisponivel = null;
    for (const quarto of todosQuartos) {
      if (verificarDisponibilidade(quarto.id, categoria, check_in, check_out)) {
        quartoDisponivel = quarto;
        break;
      }
    }

    if (!quartoDisponivel) {
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
    
    const precos = db.prepare('SELECT chave, valor FROM configuracoes WHERE chave LIKE ?').all('preco_%');
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
    const insertReserva = db.prepare(`
      INSERT INTO reservas (
        codigo, nome_completo, email, telefone, quarto_id, categoria,
        check_in, check_out, num_hospedes, valor_quarto, adicionais,
        valor_adicionais, desconto, valor_total, metodo_pagamento, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertReserva.run(
      codigo, nome_completo, email, telefone, quarto.id, categoria,
      check_in, check_out, num_hospedes, valorQuarto, JSON.stringify(adicionaisArray),
      valorAdicionais, desconto, valorTotal, metodo_pagamento, 'Confirmado'
    );

    // Enviar email de confirmação (opcional)
    try {
      await transporter.sendMail({
        from: 'admin@villageresidences.com',
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
            <li>Valor Total: R$ ${valorTotal.toFixed(2)}</li>
          </ul>
          <p>Acesse sua ficha em: <a href="${req.protocol}://${req.get('host')}/ficha/${codigo}">Ver Ficha</a></p>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    res.json({ success: true, codigo, valor_total: valorTotal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Buscar reserva por código
app.get('/api/reserva/:codigo', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { codigo } = req.params;
    const stmt = db.prepare(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE r.codigo = ?
    `);
    const reserva = stmt.get(codigo);

    if (!reserva) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }

    const result = formatResult([reserva])[0];
    result.adicionais = JSON.parse(result.adicionais || '[]');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Enviar mensagem de contato
app.post('/api/contato', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email e mensagem' });
    }

    db.prepare(`
      INSERT INTO contact_messages (name, email, phone, message)
      VALUES (?, ?, ?, ?)
    `).run(name, email, phone || null, message);

    res.json({ success: true, message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// ROTAS ADMINISTRATIVAS

// Login - Passo 1: Verificar email e senha
app.post('/api/admin/login', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados não conectado. O login administrativo requer banco de dados.' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const stmt = db.prepare('SELECT * FROM users_admin WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar código 2FA
    const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    db.prepare(`
      UPDATE users_admin 
      SET two_factor_code = ?, two_factor_expires_at = ?
      WHERE id = ?
    `).run(twoFactorCode, expiresAt.toISOString(), user.id);

    // Enviar código por email (opcional)
    try {
      await transporter.sendMail({
        from: 'admin@villageresidences.com',
        to: email,
        subject: 'Código de Verificação - Village Residences',
        html: `<p>Seu código de verificação é: <strong>${twoFactorCode}</strong></p><p>Este código expira em 10 minutos.</p>`
      });
    } catch (emailError) {
      console.error('Erro ao enviar email 2FA:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Código de verificação enviado',
      twoFactorRequired: true 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login - Passo 2: Verificar código 2FA
app.post('/api/admin/verify-2fa', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Banco de dados não conectado. A verificação 2FA requer banco de dados.' });
    }

    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }

    const stmt = db.prepare('SELECT * FROM users_admin WHERE email = ?');
    const user = stmt.get(email);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    if (!user.two_factor_code || user.two_factor_code !== code) {
      return res.status(401).json({ error: 'Código inválido' });
    }

    const expiresAt = new Date(user.two_factor_expires_at);
    if (expiresAt < new Date()) {
      return res.status(401).json({ error: 'Código expirado' });
    }

    // Limpar código 2FA
    db.prepare('UPDATE users_admin SET two_factor_code = NULL, two_factor_expires_at = NULL WHERE id = ?').run(user.id);

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      success: true, 
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Ocupação
app.get('/api/admin/ocupacao', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }
    const stmt = db.prepare(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE r.status != 'Concluído'
      ORDER BY r.check_in ASC
    `);
    const rows = stmt.all();
    
    const formatted = formatResult(rows);
    formatted.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Listar todas as reservas
app.get('/api/admin/reservas', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { mes, nome, categoria, status } = req.query;
    
    let query = 'SELECT r.*, q.numero as quarto_numero FROM reservas r LEFT JOIN quartos q ON r.quarto_id = q.id WHERE 1=1';
    const params = [];

    if (mes) {
      query += ' AND strftime("%m", data_reserva) = ?';
      params.push(mes.padStart(2, '0'));
    }
    if (nome) {
      query += ' AND nome_completo LIKE ?';
      params.push(`%${nome}%`);
    }
    if (categoria) {
      query += ' AND categoria = ?';
      params.push(categoria);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY data_reserva DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    
    const formatted = formatResult(rows);
    formatted.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Dashboard
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const hoje = new Date().toISOString().split('T')[0];

    // Total de reservas confirmadas
    const confirmadas = db.prepare('SELECT COUNT(*) as total FROM reservas WHERE status = ?').get('Confirmado');

    // Reservas pendentes
    const pendentes = db.prepare('SELECT COUNT(*) as total FROM reservas WHERE status = ?').get('Pendente');

    // Taxa de ocupação
    const ocupadosHoje = db.prepare(`
      SELECT COUNT(DISTINCT quarto_id) as total FROM reservas 
      WHERE status NOT IN ('Concluído', 'Cancelado')
      AND check_in <= ? AND check_out >= ?
    `).get(hoje, hoje);

    const totalQuartos = db.prepare('SELECT COUNT(*) as total FROM quartos WHERE disponivel = 1').get();

    const taxaOcupacao = totalQuartos.total > 0 
      ? ((ocupadosHoje.total / totalQuartos.total) * 100).toFixed(2)
      : 0;

    // Total faturado
    const faturado = db.prepare(`
      SELECT COALESCE(SUM(valor_total), 0) as total FROM reservas 
      WHERE status IN ('Confirmado', 'Concluído')
    `).get();

    // Reservas do mês atual
    const mesAtual = db.prepare(`
      SELECT COUNT(*) as total, COALESCE(SUM(valor_total), 0) as faturado 
      FROM reservas 
      WHERE strftime("%m", data_reserva) = strftime("%m", date('now'))
      AND strftime("%Y", data_reserva) = strftime("%Y", date('now'))
      AND status IN ('Confirmado', 'Concluído')
    `).get();

    res.json({
      reservasConfirmadas: confirmadas.total || 0,
      reservasPendentes: pendentes.total || 0,
      taxaOcupacao: parseFloat(taxaOcupacao),
      totalFaturado: parseFloat(faturado.total || 0),
      mesAtual: {
        reservas: mesAtual.total || 0,
        faturado: parseFloat(mesAtual.faturado || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Quartos Reservados
app.get('/api/admin/quartos-reservados', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare(`
      SELECT r.*, q.numero as quarto_numero, q.categoria as quarto_categoria
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.status NOT IN ('Concluído', 'Cancelado')
      ORDER BY r.check_in ASC
    `);
    const rows = stmt.all();

    const formatted = formatResult(rows);
    formatted.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Bloqueios
app.get('/api/admin/bloqueios', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare(`
      SELECT b.*, q.numero as quarto_numero, q.categoria as quarto_categoria,
             u.name as criado_por_nome
      FROM bloqueios b
      LEFT JOIN quartos q ON b.quarto_id = q.id
      LEFT JOIN users_admin u ON b.criado_por = u.id
      ORDER BY b.data_inicio DESC
    `);
    const rows = stmt.all();

    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/bloqueios', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { quarto_id, categoria, data_inicio, data_fim, motivo } = req.body;

    if (!categoria || !data_inicio || !data_fim) {
      return res.status(400).json({ error: 'Campos obrigatórios: categoria, data_inicio e data_fim' });
    }

    if (new Date(data_inicio) >= new Date(data_fim)) {
      return res.status(400).json({ error: 'Data de início deve ser anterior à data de fim' });
    }

    const result = db.prepare(`
      INSERT INTO bloqueios (quarto_id, categoria, data_inicio, data_fim, motivo, criado_por)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(quarto_id || null, categoria, data_inicio, data_fim, motivo || null, req.user.id);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/bloqueios/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM bloqueios WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Histórico de Check-in/Check-out
app.get('/api/admin/historico-check', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { reserva_id } = req.query;
    
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

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/check-in-out', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { reserva_id, tipo, observacoes } = req.body;

    if (!reserva_id || !tipo || !['check_in', 'check_out'].includes(tipo)) {
      return res.status(400).json({ error: 'Campos obrigatórios: reserva_id e tipo (check_in ou check_out)' });
    }

    // Registrar no histórico
    db.prepare(`
      INSERT INTO historico_check (reserva_id, tipo, data_hora, observacoes, realizado_por)
      VALUES (?, ?, datetime('now'), ?, ?)
    `).run(reserva_id, tipo, observacoes || null, req.user.id);

    // Se for check-out, atualizar status da reserva
    if (tipo === 'check_out') {
      db.prepare('UPDATE reservas SET status = ? WHERE id = ?').run('Concluído', reserva_id);
    }

    res.json({ success: true });
  } catch (error) {
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
    const stmt = db.prepare(`
      SELECT r.*, q.numero as quarto_numero
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.codigo = ?
    `);
    const reserva = stmt.get(codigo);

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

// API - Gerar link WhatsApp (admin)
app.get('/api/admin/whatsapp/:reserva_id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { reserva_id } = req.params;
    const stmt = db.prepare(`
      SELECT r.*, q.numero as quarto_numero
      FROM reservas r
      LEFT JOIN quartos q ON r.quarto_id = q.id
      WHERE r.id = ?
    `);
    const reserva = stmt.get(reserva_id);

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

// API - Atualizar status da reserva
app.put('/api/admin/reserva/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const { 
      nome_completo, email, telefone, categoria, quarto_id, 
      num_hospedes, check_in, check_out, adicionais, status, valor_total
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
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updateValues.push(id);
    const query = `UPDATE reservas SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...updateValues);

    res.json({ success: true, message: 'Reserva atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Clientes chegando hoje
app.get('/api/admin/chegadas-hoje', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const hoje = new Date().toISOString().split('T')[0];
    const stmt = db.prepare(`
      SELECT r.*, q.numero as quarto_numero 
      FROM reservas r 
      LEFT JOIN quartos q ON r.quarto_id = q.id 
      WHERE date(r.check_in) = ? AND r.status != 'Concluído'
      ORDER BY r.check_in ASC
    `);
    const rows = stmt.all(hoje);

    const formatted = formatResult(rows);
    formatted.forEach(row => {
      row.adicionais = JSON.parse(row.adicionais || '[]');
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Relatório de vendas
app.get('/api/admin/relatorio-vendas', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { mes } = req.query;
    
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
      query += ` AND strftime("%m", data_reserva) = ?`;
      params.push(mes.padStart(2, '0'));
    }

    query += ` GROUP BY categoria`;

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

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
      totalQuery += ` AND strftime("%m", data_reserva) = ?`;
      totalParams.push(mes.padStart(2, '0'));
    }

    const totalStmt = db.prepare(totalQuery);
    const totals = totalStmt.get(...totalParams);

    res.json({
      resumo: totals || { total_reservas: 0, total_vendido: 0, ticket_medio: 0 },
      por_categoria: formatResult(rows)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Configurações
app.get('/api/admin/configuracoes', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare('SELECT * FROM configuracoes');
    const rows = stmt.all();

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
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const configs = req.body;
    const updateStmt = db.prepare('UPDATE configuracoes SET valor = ? WHERE chave = ?');

    for (const [chave, valor] of Object.entries(configs)) {
      updateStmt.run(valor, chave);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Páginas
app.get('/api/admin/pages', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare('SELECT id, page_name FROM pages ORDER BY page_name');
    const rows = stmt.all();
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM pages WHERE id = ?');
    const page = stmt.get(id);

    if (!page) {
      return res.status(404).json({ error: 'Página não encontrada' });
    }

    res.json(formatResult([page])[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/pages', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { page_name, html_content } = req.body;

    if (!page_name) {
      return res.status(400).json({ error: 'Nome da página é obrigatório' });
    }

    try {
      const result = db.prepare('INSERT INTO pages (page_name, html_content) VALUES (?, ?)').run(page_name, html_content || '');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (dbError) {
      if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Já existe uma página com este nome' });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const { page_name, html_content } = req.body;

    db.prepare('UPDATE pages SET page_name = ?, html_content = ? WHERE id = ?').run(page_name, html_content || '', id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/pages/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Funcionários
app.get('/api/admin/funcionarios', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare('SELECT * FROM allowed_emails ORDER BY name');
    const rows = stmt.all();
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/funcionarios', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { name, email } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Nome é obrigatório e deve ser um texto válido' });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({ error: 'Email é obrigatório e deve ser um texto válido' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    try {
      const result = db.prepare('INSERT INTO allowed_emails (name, email) VALUES (?, ?)').run(name.trim(), email.trim().toLowerCase());
      res.json({ success: true, id: result.lastInsertRowid, message: 'Funcionário adicionado com sucesso' });
    } catch (dbError) {
      if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Este email já está cadastrado' });
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/funcionarios/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM allowed_emails WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Serviços
app.get('/api/admin/services', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare('SELECT * FROM services ORDER BY name');
    const rows = stmt.all();
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/services', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { name, description, price, image_url } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }

    const result = db.prepare('INSERT INTO services (name, description, price, image_url) VALUES (?, ?, ?, ?)').run(name, description || null, price, image_url || null);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/services/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    const { name, description, price, image_url } = req.body;

    db.prepare('UPDATE services SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?').run(name, description || null, price, image_url || null, id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/services/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM services WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Histórico
app.get('/api/admin/historico', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare(`
      SELECT * FROM reservas
      WHERE status IN ('Concluído', 'Cancelada')
      ORDER BY data_reserva DESC
    `);
    const rows = stmt.all();
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Buscar histórico
app.get('/api/admin/historico/buscar', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { termo } = req.query;
    if (!termo || termo.trim() === '') {
      return res.json([]);
    }

    const termoBusca = `%${termo.trim()}%`;
    
    const stmt = db.prepare(`
      SELECT * FROM reservas
      WHERE status IN ('Concluído', 'Cancelada')
      AND (
        codigo LIKE ? OR
        telefone LIKE ? OR
        email LIKE ?
      )
      ORDER BY data_reserva DESC
    `);
    const rows = stmt.all(termoBusca, termoBusca, termoBusca);
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Excluir ficha do histórico
// Suporte para OPTIONS (preflight CORS)
app.options('/api/admin/historico/:id', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

app.delete('/api/admin/historico/:id', authenticateToken, async (req, res) => {
  try {
    console.log('=== TENTATIVA DE EXCLUSÃO DE FICHA (server-sqlite.js) ===');
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
      return res.status(400).json({ error: 'ID da ficha não fornecido' });
    }

    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      console.error('ID não é um número válido:', id);
      return res.status(400).json({ error: 'ID da ficha inválido' });
    }
    
    console.log('ID convertido para número:', idNum);
    
    // Verificar se a reserva existe e está no histórico (status Concluído ou Cancelada)
    const reserva = db.prepare('SELECT id, status FROM reservas WHERE id = ? AND status IN (\'Concluído\', \'Cancelada\')').get(idNum);

    console.log('Reserva encontrada:', reserva);

    if (!reserva) {
      console.error('Reserva não encontrada no histórico com ID:', idNum);
      return res.status(404).json({ error: 'Ficha não encontrada no histórico' });
    }

    // Excluir permanentemente do banco de dados
    console.log('Tentando excluir reserva ID:', idNum);
    const deleteStmt = db.prepare('DELETE FROM reservas WHERE id = ?');
    const result = deleteStmt.run(idNum);

    console.log('Resultado do DELETE:', result);

    if (result.changes === 0) {
      console.error('Nenhuma linha foi excluída. ID:', idNum);
      return res.status(404).json({ error: 'Ficha não encontrada ou já foi excluída' });
    }

    console.log('✅ Ficha excluída com sucesso. ID:', idNum, 'Linhas afetadas:', result.changes);
    res.status(200).json({ success: true, message: 'Ficha excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ficha do histórico:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message || 'Erro ao excluir ficha' });
  }
});

// API - Buscar agendamentos
app.get('/api/admin/appointments', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { nome, data } = req.query;
    
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

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/appointments/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    db.prepare('DELETE FROM appointments WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API - Gerenciar Mensagens
app.get('/api/admin/messages', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const stmt = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC');
    const rows = stmt.all();
    res.json(formatResult(rows));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/messages/:id/read', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    db.prepare('UPDATE contact_messages SET read_status = 1 WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/messages/:id', authenticateToken, async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: 'Banco de dados não disponível' });
    }

    const { id } = req.params;
    
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicializar servidor
initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Painel admin: http://localhost:${PORT}/painel-brisa`);
  console.log(`💾 Banco de dados: SQLite (embutido)`);
});

