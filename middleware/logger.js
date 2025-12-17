/**
 * Logger de Segurança
 * Registra eventos de segurança para auditoria
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs', 'security');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Formatar data para log
 */
function formatDate() {
  return new Date().toISOString();
}

/**
 * Formatar IP do cliente
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
}

/**
 * Escrever log de segurança
 */
function writeSecurityLog(type, message, req, additionalData = {}) {
  const logEntry = {
    timestamp: formatDate(),
    type,
    message,
    ip: getClientIP(req),
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent') || 'unknown',
    ...additionalData
  };
  
  const logFile = path.join(logDir, `security-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Erro ao escrever log de segurança:', err);
    }
  });
  
  // Também logar no console em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SECURITY ${type}]`, message, logEntry);
  }
}

/**
 * Log de tentativa de login
 */
function logLoginAttempt(req, success, email = null, reason = null) {
  writeSecurityLog(
    success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
    success ? 'Login bem-sucedido' : 'Tentativa de login falhou',
    req,
    {
      email: email ? email.toLowerCase() : null,
      reason: reason || null
    }
  );
}

/**
 * Log de tentativa de acesso não autorizado
 */
function logUnauthorizedAccess(req, reason) {
  writeSecurityLog(
    'UNAUTHORIZED_ACCESS',
    `Tentativa de acesso não autorizado: ${reason}`,
    req,
    { reason }
  );
}

/**
 * Log de ação administrativa
 */
function logAdminAction(req, action, resource, resourceId = null) {
  writeSecurityLog(
    'ADMIN_ACTION',
    `Ação administrativa: ${action}`,
    req,
    {
      action,
      resource,
      resourceId,
      userId: req.user ? req.user.id : null,
      userEmail: req.user ? req.user.email : null
    }
  );
}

/**
 * Log de tentativa suspeita
 */
function logSuspiciousActivity(req, activity, details = {}) {
  writeSecurityLog(
    'SUSPICIOUS_ACTIVITY',
    `Atividade suspeita detectada: ${activity}`,
    req,
    details
  );
}

/**
 * Log de erro de validação
 */
function logValidationError(req, errors) {
  writeSecurityLog(
    'VALIDATION_ERROR',
    'Erro de validação de input',
    req,
    { errors }
  );
}

/**
 * Middleware para logar todas as requisições administrativas
 */
function logAdminRequests(req, res, next) {
  if (req.path.startsWith('/api/admin') && req.user) {
    logAdminAction(req, req.method, req.path);
  }
  next();
}

module.exports = {
  logLoginAttempt,
  logUnauthorizedAccess,
  logAdminAction,
  logSuspiciousActivity,
  logValidationError,
  logAdminRequests,
  getClientIP
};

