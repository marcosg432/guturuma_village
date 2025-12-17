/**
 * Middleware de Autenticação e Autorização
 * RBAC (Role-Based Access Control)
 */

const jwt = require('jsonwebtoken');

// Logger com fallback
let logUnauthorizedAccess, logSuspiciousActivity;
try {
  const logger = require('./logger');
  logUnauthorizedAccess = logger.logUnauthorizedAccess;
  logSuspiciousActivity = logger.logSuspiciousActivity;
} catch (e) {
  // Fallback se logger não estiver disponível
  logUnauthorizedAccess = () => {};
  logSuspiciousActivity = () => {};
}

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'brisa_imperial_secret_key_2024_secure';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'brisa_imperial_refresh_secret_2024_secure';

// Roles disponíveis no sistema
const ROLES = {
  ADMIN: 'admin',
  FUNCIONARIO: 'funcionario',
  HOSPEDE: 'hospede'
};

/**
 * Middleware de autenticação JWT
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logUnauthorizedAccess(req, 'Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        logUnauthorizedAccess(req, `Token inválido: ${err.message}`);
        return res.status(403).json({ error: 'Token inválido ou expirado' });
      }
      
      req.user = user;
      next();
    });
  } catch (error) {
    logSuspiciousActivity(req, 'Erro no middleware de autenticação', { error: error.message });
    return res.status(500).json({ error: 'Erro ao processar autenticação' });
  }
}

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem a role necessária
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      logUnauthorizedAccess(req, 'Usuário não autenticado');
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userRole = req.user.role || ROLES.ADMIN; // Default para admin se não especificado
    
    if (!allowedRoles.includes(userRole)) {
      logUnauthorizedAccess(req, `Role insuficiente. Necessário: ${allowedRoles.join(', ')}, Tem: ${userRole}`);
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }

    next();
  };
}

/**
 * Middleware para verificar se o usuário é admin
 */
function requireAdmin(req, res, next) {
  return requireRole(ROLES.ADMIN)(req, res, next);
}

/**
 * Middleware para verificar se o usuário é admin ou funcionário
 */
function requireStaff(req, res, next) {
  return requireRole(ROLES.ADMIN, ROLES.FUNCIONARIO)(req, res, next);
}

/**
 * Gerar token de acesso
 */
function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || ROLES.ADMIN
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Gerar refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verificar refresh token
 */
function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

/**
 * Verificar se o usuário pode acessar um recurso específico
 * Previne IDOR (Insecure Direct Object Reference)
 */
function checkResourceOwnership(resourceUserId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Admin pode acessar qualquer recurso
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Usuário só pode acessar seus próprios recursos
    if (req.user.id !== resourceUserId) {
      logUnauthorizedAccess(req, `Tentativa de acessar recurso de outro usuário. Recurso: ${resourceUserId}, Usuário: ${req.user.id}`);
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para acessar este recurso.' });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStaff,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  checkResourceOwnership,
  ROLES
};

