/**
 * Middleware de Validação
 * Validações comuns para diferentes tipos de dados
 */

/**
 * Validação de email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
}

/**
 * Validação de telefone brasileiro
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  // Telefone brasileiro: 10 ou 11 dígitos (com DDD)
  return cleaned.length >= 10 && cleaned.length <= 11;
}

/**
 * Validação de CEP brasileiro
 */
function validateCEP(cep) {
  if (!cep || typeof cep !== 'string') {
    return false;
  }
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
}

/**
 * Validação de CPF
 */
function validateCPF(cpf) {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Validação de senha forte
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // Mínimo 8 caracteres, pelo menos uma letra e um número
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * Validar data no formato YYYY-MM-DD
 */
function validateDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Validar que data1 é anterior a data2
 */
function validateDateRange(date1, date2) {
  if (!validateDate(date1) || !validateDate(date2)) {
    return false;
  }
  return new Date(date1) < new Date(date2);
}

/**
 * Middleware de validação de login
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];
  
  if (!email || !validateEmail(email)) {
    errors.push('E-mail inválido');
  }
  
  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Senha é obrigatória');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }
  
  next();
}

/**
 * Middleware de validação de reserva
 */
function validateReserva(req, res, next) {
  // Usar nome_completo que é o campo usado no server.js, mas aceitar também 'nome' para compatibilidade
  // Aceitar categoria OU quarto_id (o sistema usa categoria para buscar o quarto)
  const { nome_completo, nome, email, telefone, check_in, checkin, checkout, check_out, adultos, criancas, quarto_id, categoria } = req.body;
  const reservaNome = nome_completo || nome;
  const reservaCheckIn = check_in || checkin;
  const reservaCheckOut = check_out || checkout;
  const errors = [];
  
  if (!reservaNome || typeof reservaNome !== 'string' || reservaNome.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }
  
  if (!email || !validateEmail(email)) {
    errors.push('E-mail inválido');
  }
  
  if (!telefone || !validatePhone(telefone)) {
    errors.push('Telefone inválido');
  }
  
  if (!reservaCheckIn || !validateDate(reservaCheckIn)) {
    errors.push('Data de check-in inválida');
  }
  
  if (!reservaCheckOut || !validateDate(reservaCheckOut)) {
    errors.push('Data de check-out inválida');
  }
  
  if (reservaCheckIn && reservaCheckOut && !validateDateRange(reservaCheckIn, reservaCheckOut)) {
    errors.push('Data de check-out deve ser posterior ao check-in');
  }
  
  if (!adultos || !Number.isInteger(Number(adultos)) || Number(adultos) < 1) {
    errors.push('Número de adultos inválido');
  }
  
  if (criancas !== undefined && (!Number.isInteger(Number(criancas)) || Number(criancas) < 0)) {
    errors.push('Número de crianças inválido');
  }
  
  // Aceitar categoria OU quarto_id (o carrinho envia categoria)
  if ((!quarto_id || typeof quarto_id !== 'string') && (!categoria || typeof categoria !== 'string')) {
    errors.push('Quarto é obrigatório');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }
  
  next();
}

/**
 * Middleware de validação de contato
 */
function validateContato(req, res, next) {
  // Ajustado para campos usados no server.js: name, email, phone, message
  const { name, email, phone, message } = req.body;
  const errors = [];
  
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }
  
  if (!email || !validateEmail(email)) {
    errors.push('E-mail inválido');
  }
  
  // Phone é opcional, mas se fornecido deve ser válido
  if (phone && !validatePhone(phone)) {
    errors.push('Telefone inválido');
  }
  
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    errors.push('Mensagem deve ter pelo menos 10 caracteres');
  }
  
  if (message && message.length > 5000) {
    errors.push('Mensagem muito longa (máximo 5000 caracteres)');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }
  
  next();
}

module.exports = {
  validateEmail,
  validatePhone,
  validateCEP,
  validateCPF,
  validatePassword,
  validateDate,
  validateDateRange,
  validateLogin,
  validateReserva,
  validateContato
};

