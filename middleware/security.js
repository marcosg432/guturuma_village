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
 * Configuração balanceada: segurança sem quebrar o site
 */
const securityHeaders = helmet ? helmet({
  // Content Security Policy - Permite recursos necessários
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para scripts inline no HTML
        "'unsafe-eval'", // Pode ser necessário para algumas bibliotecas (temporário, remover se possível)
        "https://cdn.jsdelivr.net", // Chart.js CDN
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para estilos inline no HTML
        "https://fonts.googleapis.com", // Google Fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Google Fonts
        "data:", // Para fontes em base64
      ],
      imgSrc: [
        "'self'",
        "data:", // Para imagens em base64
        "https:", // Permite todas as imagens HTTPS (Unsplash, etc.)
        "http:", // Permite imagens HTTP também (caso necessário)
      ],
      connectSrc: [
        "'self'",
        "http://localhost:*", // Permitir conexões locais em desenvolvimento
        "http://127.0.0.1:*", // Permitir conexões locais (alternativa)
        "https://fonts.googleapis.com", // Google Fonts API
      ],
      frameSrc: [
        "'self'",
        "https://www.google.com", // Google Maps embed
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"], // Define base URL permitida
      // upgradeInsecureRequests removido - habilitar apenas em produção com HTTPS
    },
  },
  // Outras proteções
  crossOriginEmbedderPolicy: false, // Desabilitado para permitir recursos externos
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite recursos de outros domínios
  hsts: false, // Desabilitado em desenvolvimento (habilitar em produção com HTTPS)
  noSniff: true, // Previne MIME type sniffing
  xssFilter: true, // Ativa filtro XSS do navegador (deprecated mas ainda útil)
  frameguard: { action: 'deny' }, // Previne clickjacking
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Controla referrer
}) : ((req, res, next) => {
  // Fallback básico de headers de segurança
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

/**
 * Sanitização básica de inputs
 * Remove caracteres potencialmente perigosos para prevenir XSS
 * IMPORTANTE: Não sanitiza campos que podem precisar de HTML válido (se necessário)
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Sanitização mais cuidadosa - remove apenas tags e scripts perigosos
  return input
    .trim()
    // Remove tags script e style completamente
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove atributos de eventos (onclick, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove protocolos perigosos em links
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/vbscript:/gi, '')
    // Remove iframes (podem ser perigosos)
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Limpar atributos perigosos mas preservar estrutura básica
    .replace(/\s*style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, ''); // Remove CSS expressions
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
 * Aplica apenas para rotas de API (não para arquivos estáticos)
 */
function sanitizeRequest(req, res, next) {
  // Pular sanitização para arquivos estáticos (CSS, JS, imagens, etc.)
  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|map|json)$/i)) {
    return next();
  }
  
  // Pular sanitização para caminhos de arquivos estáticos conhecidos
  if (req.path.startsWith('/css/') || 
      req.path.startsWith('/js/') || 
      req.path.startsWith('/images/') ||
      req.path.startsWith('/img/')) {
    return next();
  }
  
  // Aplicar sanitização apenas para rotas de API e páginas HTML
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

