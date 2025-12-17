/**
 * Middlewares de Segurança
 * Implementa proteções contra vulnerabilidades comuns (OWASP Top 10)
 */

// Rate limiting e segurança
let rateLimit, helmet;

try {
  rateLimit = require('express-rate-limit');
  helmet = require('helmet');
} catch (e) {
  console.warn('⚠️ Dependências de segurança não instaladas. Execute: npm install express-rate-limit helmet');
  // Fallback básico
  rateLimit = null;
  helmet = null;
}

/**
 * Rate Limiting para Login - Previne brute force
 */
const loginLimiter = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // não contar requisições bem-sucedidas
}) : ((req, res, next) => next()); // Fallback se não estiver instalado

/**
 * Rate Limiting para APIs públicas (reservas, contato)
 */
const apiLimiter = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
}) : ((req, res, next) => next()); // Fallback

/**
 * Rate Limiting para APIs administrativas
 */
const adminApiLimiter = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requisições por IP
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
}) : ((req, res, next) => next()); // Fallback

/**
 * Headers de Segurança com Helmet
 * Configuração mínima para não interferir com o site
 */
const securityHeaders = helmet ? helmet({
  contentSecurityPolicy: false, // Desabilitado para evitar conflitos
  crossOriginEmbedderPolicy: false,
  hsts: false,
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' }
}) : ((req, res, next) => {
  // Fallback básico de headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

/**
 * Sanitização básica de inputs
 * Remove caracteres potencialmente perigosos
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e > para prevenir XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers inline
}

/**
 * Sanitizar objeto recursivamente
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware de sanitização de request body
 */
function sanitizeRequest(req, res, next) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = {
  loginLimiter,
  apiLimiter,
  adminApiLimiter,
  securityHeaders,
  sanitizeRequest,
  sanitizeInput,
  sanitizeObject
};

