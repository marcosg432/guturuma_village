-- Banco de dados MySQL para Brisa Imperial Resort
-- Execute este script no MySQL para criar o banco e as tabelas

CREATE DATABASE IF NOT EXISTS brisa_imperial CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE brisa_imperial;

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS users_admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    two_factor_code VARCHAR(6),
    two_factor_expires_at DATETIME
);

-- Tabela de emails autorizados
CREATE TABLE IF NOT EXISTS allowed_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- Tabela de páginas dinâmicas
CREATE TABLE IF NOT EXISTS pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_name VARCHAR(255) UNIQUE NOT NULL,
    html_content LONGTEXT
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500)
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    service_id INT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- Tabela de mensagens de contato
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas antigas (para compatibilidade com sistema de reservas)
CREATE TABLE IF NOT EXISTS quartos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria VARCHAR(255) NOT NULL,
    numero INT NOT NULL,
    capacidade INT NOT NULL,
    vista VARCHAR(255) NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    preco_base DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    quarto_id INT,
    categoria VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    num_hospedes INT NOT NULL,
    valor_quarto DECIMAL(10, 2) NOT NULL,
    adicionais TEXT,
    valor_adicionais DECIMAL(10, 2) DEFAULT 0,
    desconto DECIMAL(10, 2) DEFAULT 0,
    valor_total DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Confirmado',
    data_reserva TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quarto_id) REFERENCES quartos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL
);

-- Inserir dados padrão
-- Senha padrão: Boob.08. (hash bcrypt)
INSERT IGNORE INTO users_admin (name, email, password) VALUES 
('Administrador', 'murilodiasms15@gmail.com', '$2a$10$rK8Q8Q8Q8Q8Q8Q8Q8Q8Q8u8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8');

INSERT IGNORE INTO allowed_emails (name, email) VALUES 
('Administrador', 'murilodiasms15@gmail.com');

-- Inserir quartos padrão
INSERT IGNORE INTO quartos (categoria, numero, capacidade, vista, preco_base) VALUES
('Suíte Harmonia', 1, 3, 'jardim', 350.00),
('Suíte Harmonia', 2, 3, 'jardim', 350.00),
('Suíte Harmonia', 3, 3, 'jardim', 350.00),
('Suíte Harmonia', 4, 3, 'jardim', 350.00),
('Suíte Harmonia', 5, 3, 'jardim', 350.00),
('Suíte Harmonia', 6, 3, 'jardim', 350.00),
('Suíte Harmonia', 7, 3, 'jardim', 350.00),
('Suíte Harmonia', 8, 3, 'jardim', 350.00),
('Suíte Harmonia', 9, 3, 'jardim', 350.00),
('Suíte Harmonia', 10, 3, 'jardim', 350.00),
('Suíte Harmonia', 11, 3, 'jardim', 350.00),
('Suíte Harmonia', 12, 3, 'jardim', 350.00),
('Suíte Harmonia', 13, 3, 'jardim', 350.00),
('Suíte Harmonia', 14, 3, 'jardim', 350.00),
('Suíte Harmonia', 15, 3, 'jardim', 350.00),
('Suíte Harmonia', 16, 3, 'jardim', 350.00),
('Suíte Harmonia', 17, 3, 'jardim', 350.00),
('Suíte Harmonia', 18, 3, 'jardim', 350.00),
('Suíte Harmonia', 19, 3, 'jardim', 350.00),
('Suíte Harmonia', 20, 3, 'jardim', 350.00),
('Suíte Orquídea Premium', 101, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 102, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 103, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 104, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 105, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 106, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 107, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 108, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 109, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 110, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 111, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 112, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 113, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 114, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 115, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 116, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 117, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 118, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 119, 4, 'piscina', 550.00),
('Suíte Orquídea Premium', 120, 4, 'piscina', 550.00),
('Suíte Imperial Master', 201, 6, 'mar', 950.00),
('Suíte Imperial Master', 202, 6, 'mar', 950.00),
('Suíte Imperial Master', 203, 6, 'mar', 950.00),
('Suíte Imperial Master', 204, 6, 'mar', 950.00),
('Suíte Imperial Master', 205, 6, 'mar', 950.00),
('Suíte Imperial Master', 206, 6, 'mar', 950.00),
('Suíte Imperial Master', 207, 6, 'mar', 950.00),
('Suíte Imperial Master', 208, 6, 'mar', 950.00),
('Suíte Imperial Master', 209, 6, 'mar', 950.00),
('Suíte Imperial Master', 210, 6, 'mar', 950.00);

-- Inserir configurações padrão
INSERT IGNORE INTO configuracoes (chave, valor) VALUES
('preco_harmonia', '350'),
('preco_orquidea', '550'),
('preco_imperial', '950'),
('preco_passeio', '150'),
('preco_romantico', '200'),
('preco_upgrade_vista', '80'),
('preco_cama_extra', '50'),
('preco_decoracao', '100');
