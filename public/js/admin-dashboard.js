// Sistema do Painel Administrativo

// Configuração
const API_BASE = '/api/admin';
let currentUser = null;

// Dados das suítes (mesmo do reserva-nova.js)
const suites = {
    'casa-1': { nome: 'Casa Sobrado 2 – Conforto e Espaço com 3 Quartos', preco: 250 },
    'casa-2': { nome: 'Casa Sobrado 4 – Ampla, Completa e Ideal para Famílias', preco: 250 },
    'casa-3': { nome: 'Casa Ampla e Confortável – 3 Quartos e 5 Banheiros', preco: 250 },
    'casa-4': { nome: 'Casa Sobrado 6 – Ampla, Equipada e com 3 Quartos', preco: 250 },
    harmonia: { nome: 'Quarto Deluxe com Cama Queen-size', preco: 150 },
    orquidea: { nome: 'Suíte Orquídea Premium', preco: 150 },
    imperial: { nome: 'Suíte Imperial Master', preco: 150 },
    'premium-vista': { nome: 'Quarto Deluxe com Cama Queen-size', preco: 150 },
    deluxe: { nome: 'Suíte Deluxe com Cama Queen-size', preco: 150 },
    executiva: { nome: 'Suíte Executiva', preco: 150 },
    familia: { nome: 'Suíte Família', preco: 150 },
    romantica: { nome: 'Suíte Romântica', preco: 150 }
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    const token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    const userData = localStorage.getItem('admin_user');
    if (userData) {
        currentUser = JSON.parse(userData);
        document.getElementById('user-name').textContent = currentUser.name || 'Admin';
    }

    // Configurar navegação
    setupNavigation();
    
    // Configurar eventos
    setupEvents();
    
    // Carregar dados iniciais
    loadReservas();
    
    // Configurar data atual para renda
    const hoje = new Date();
    document.getElementById('renda-mes').value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
});

// Navegação entre abas
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    const titles = {
        reservas: 'Reservas',
        quartos: 'Quartos Reservados',
        historico: 'Histórico de Agendamentos',
        usuarios: 'Gerenciar Acesso ao Painel',
        agendar: 'Agendar Hospedagem Manualmente',
        renda: 'Renda do Mês',
        contato: 'Contato'
    };

    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tab = this.dataset.tab;

            // Atualizar navegação
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            // Atualizar conteúdo
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`tab-${tab}`).classList.add('active');

            // Atualizar título
            pageTitle.textContent = titles[tab] || 'Painel';

            // Carregar dados da aba
            switch(tab) {
                case 'reservas':
                    loadReservas();
                    break;
                case 'quartos':
                    loadQuartos();
                    break;
                case 'historico':
                    loadHistorico();
                    break;
                case 'usuarios':
                    loadUsuarios();
                    break;
                case 'renda':
                    loadRenda();
                    break;
                case 'contato':
                    loadContato();
                    break;
            }
        });
    });
}

// Configurar eventos
function setupEvents() {
    // Logout
    document.getElementById('btn-logout').addEventListener('click', function() {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
    });

    // Filtro de status
    document.getElementById('filter-status').addEventListener('change', loadReservas);
    document.getElementById('btn-refresh-reservas').addEventListener('click', loadReservas);

    // Formulário de agendamento manual
    document.getElementById('form-agendar').addEventListener('submit', handleAgendarManual);

    // Botão de atualizar contato
    const btnRefreshContato = document.getElementById('btn-refresh-contato');
    if (btnRefreshContato) {
        btnRefreshContato.addEventListener('click', loadContato);
    }

    // Modal de reserva
    setupModalReserva();

    // Modal de usuário
    setupModalUsuario();

    // Renda
    document.getElementById('btn-atualizar-renda').addEventListener('click', loadRenda);
    
    // Busca no histórico
    const btnBuscarHistorico = document.getElementById('btn-buscar-historico');
    const inputBuscaHistorico = document.getElementById('input-busca-historico');
    if (btnBuscarHistorico) {
        btnBuscarHistorico.addEventListener('click', buscarHistorico);
    }
    if (inputBuscaHistorico) {
        inputBuscaHistorico.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarHistorico();
            }
        });
    }

    // Calcular valor ao mudar datas no agendamento
    const checkinInput = document.getElementById('agendar-checkin');
    const checkoutInput = document.getElementById('agendar-checkout');
    const suiteSelect = document.getElementById('agendar-suite');
    
    [checkinInput, checkoutInput, suiteSelect].forEach(input => {
        input.addEventListener('change', calcularValorAgendamento);
    });
}

// Função para fazer requisições autenticadas
async function apiRequest(endpoint, options = {}) {
    try {
    const token = localStorage.getItem('admin_token');
        if (!token) {
            console.error('Token não encontrado. Redirecionando para login...');
            window.location.href = '/admin/login';
            return null;
        }

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

        // Adicionar timeout para evitar carregamento infinito
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

        try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
                signal: controller.signal,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });

            clearTimeout(timeoutId);

            if (response.status === 401 || response.status === 403) {
                console.error('Token inválido ou expirado. Redirecionando para login...');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
        return null;
    }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}: ${response.statusText}` }));
                console.error('Erro na requisição:', errorData);
                throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
            }

    return response;
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                throw new Error('Tempo de espera esgotado. O servidor não respondeu a tempo.');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('Erro na requisição API:', error);
        throw error;
    }
}

// Função para verificar se uma reserva é de CASA
function isCasaReserva(categoria) {
    if (!categoria) return false;
    const categoriaLower = categoria.toLowerCase();
    return categoriaLower.includes('casa') || 
           categoriaLower.includes('sobrado') || 
           categoriaLower === 'casa 1' || 
           categoriaLower === 'casa 2' || 
           categoriaLower === 'casa 3' || 
           categoriaLower === 'casa 4';
}

// ========== ABA: RESERVAS ==========
async function loadReservas() {
    const status = document.getElementById('filter-status').value;
    const container = document.getElementById('reservas-grid');
    container.innerHTML = '<div class="loading">Carregando reservas...</div>';

    try {
        const url = status ? `/reservas?status=${status}` : '/reservas';
        const response = await apiRequest(url);
        if (!response) {
            container.innerHTML = '<div class="error-message">Erro: Não foi possível conectar ao servidor</div>';
            return;
        }

        const reservas = await response.json();

        if (!reservas || !Array.isArray(reservas)) {
            container.innerHTML = '<div class="error-message">Erro: Dados inválidos recebidos do servidor</div>';
            return;
        }

        if (reservas.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhuma reserva encontrada</div></div>';
            return;
        }

        container.innerHTML = reservas.map(reserva => createReservaCard(reserva)).join('');
        
        // Adicionar event listeners aos cards
        container.querySelectorAll('.reserva-card').forEach(card => {
            card.addEventListener('click', () => openModalReserva(card.dataset.id));
        });
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        container.innerHTML = `<div class="error-message">Erro ao carregar reservas: ${error.message || 'Erro desconhecido'}</div>`;
    }
}

function createReservaCard(reserva) {
    const statusLower = reserva.status.toLowerCase();
    let statusClass = statusLower;
    let statusLabel = reserva.status;
    
    // Mapear status para exibição
    if (statusLower.includes('paga') || statusLower.includes('pago') || statusLower.includes('confirmado') || statusLower.includes('confirmada')) {
        statusClass = 'paga';
        statusLabel = 'Paga';
    } else if (statusLower.includes('pendente')) {
        statusClass = 'pendente';
        statusLabel = 'Pendente';
    } else if (statusLower.includes('cancelada') || statusLower.includes('cancelado')) {
        statusClass = 'cancelada';
        statusLabel = 'Cancelada';
    } else {
        // Status padrão para outros casos
        statusClass = 'pendente';
        statusLabel = reserva.status;
    }

    return `
        <div class="reserva-card" data-id="${reserva.id}">
            <div class="reserva-card-header">
                <span class="reserva-codigo">${reserva.codigo}</span>
                <span class="reserva-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="reserva-info">
                <div class="reserva-info-label">Cliente</div>
                <div class="reserva-info-value">${reserva.nome_completo}</div>
            </div>
            <div class="reserva-info">
                <div class="reserva-info-label">Suíte</div>
                <div class="reserva-info-value">${reserva.categoria}</div>
            </div>
            <div class="reserva-info">
                <div class="reserva-info-label">Check-in / Check-out</div>
                <div class="reserva-info-value">${formatDate(reserva.check_in)} → ${formatDate(reserva.check_out)}</div>
            </div>
            <div class="reserva-info">
                <div class="reserva-info-label">Noites</div>
                <div class="reserva-info-value">${reserva.total_noites || 0} ${(reserva.total_noites || 0) === 1 ? 'noite' : 'noites'}</div>
            </div>
            <div class="reserva-info">
                <div class="reserva-info-label">Hóspedes</div>
                <div class="reserva-info-value">
                    ${reserva.adultos || reserva.num_hospedes} adultos${isCasaReserva(reserva.categoria) ? (reserva.hospedes_extras > 0 ? `, ${reserva.hospedes_extras} pessoa(s) a mais (R$ ${parseFloat(reserva.valor_hospedes_extras || 0).toFixed(2).replace('.', ',')})` : '') : (reserva.criancas ? `, ${reserva.criancas} crianças` : '')}${!isCasaReserva(reserva.categoria) && reserva.hospedes_extras > 0 ? `, ${reserva.hospedes_extras} extra(s) (R$ ${parseFloat(reserva.valor_hospedes_extras || 0).toFixed(2).replace('.', ',')})` : ''}
                </div>
            </div>
            <div class="reserva-info">
                <div class="reserva-info-label">Pagamento</div>
                <div class="reserva-info-value">${reserva.metodo_pagamento || 'Não informado'}</div>
            </div>
            <div class="reserva-valor">R$ ${parseFloat(reserva.valor_total).toFixed(2)}</div>
        </div>
    `;
}

// ========== ABA: QUARTOS RESERVADOS ==========
async function loadQuartos() {
    const container = document.getElementById('quartos-container');
    container.innerHTML = '<div class="loading">Carregando quartos...</div>';

    try {
        const response = await apiRequest('/quartos-reservados');
        if (!response) {
            container.innerHTML = '<div class="error-message">Erro: Não foi possível conectar ao servidor</div>';
            return;
        }

        const todosQuartos = await response.json();

        if (!todosQuartos || !Array.isArray(todosQuartos)) {
            container.innerHTML = '<div class="error-message">Erro: Dados inválidos recebidos do servidor</div>';
            return;
        }

        // Filtrar quartos antigos e casas genéricas (remover os 3 antigos e Casa 1, 2, 3, 4)
        const quartosAntigos = ['Suíte Standard', 'Suíte Premium', 'Suíte Master Lux', 'Casa 1', 'Casa 2', 'Casa 3', 'Casa 4'];
        const quartos = todosQuartos.filter(quarto => !quartosAntigos.includes(quarto.categoria));

        if (quartos.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhum quarto reservado no momento</div></div>';
            return;
        }

        container.innerHTML = quartos.map(quarto => createQuartoCard(quarto)).join('');
        
        // Adicionar event listeners para abrir ficha do quarto
        container.querySelectorAll('.quarto-card').forEach(card => {
            card.addEventListener('click', function() {
                const quartoId = this.getAttribute('data-quarto-id');
                if (quartoId) {
                    abrirFichaQuarto(quartoId);
                }
            });
        });
    } catch (error) {
        console.error('Erro ao carregar quartos:', error);
        container.innerHTML = `<div class="error-message">Erro ao carregar quartos: ${error.message || 'Erro desconhecido'}</div>`;
    }
}

async function abrirFichaQuarto(quartoId) {
    try {
        console.log('🔍 Abrindo ficha do quarto ID:', quartoId);
        const response = await apiRequest(`/quartos/${quartoId}/reservas`);
        if (!response) {
            console.error('❌ Resposta vazia da API');
            return;
        }

        const data = await response.json();
        const quarto = data.quarto;
        const reservas = data.reservas || [];

        console.log('📋 Dados recebidos - Quarto:', quarto?.categoria, 'Reservas:', reservas.length);
        if (reservas.length > 0) {
            console.log('📝 Primeira reserva:', {
                codigo: reservas[0].codigo,
                quarto_id: reservas[0].quarto_id,
                status: reservas[0].status
            });
        }

        // Criar modal ou seção para mostrar a ficha
        mostrarFichaQuarto(quarto, reservas);
    } catch (error) {
        console.error('Erro ao carregar ficha do quarto:', error);
        alert('Erro ao carregar informações do quarto: ' + (error.message || 'Erro desconhecido'));
    }
}

function mostrarFichaQuarto(quarto, reservas) {
    let modal = document.getElementById('modal-quarto');
    if (!modal) {
        // Criar modal se não existir
        criarModalQuarto();
        modal = document.getElementById('modal-quarto');
    }
    
    const modalContent = document.getElementById('modal-quarto-content');
    if (!modalContent) return;

    // Verificar se é CASA
    const isCasa = isCasaReserva(quarto.categoria);

    let reservasHTML = '';
    console.log('📊 Exibindo ficha - Total de reservas:', reservas.length);
    if (reservas.length === 0) {
        reservasHTML = '<div class="empty-state"><div class="empty-state-text">Nenhuma reserva encontrada para este quarto.</div></div>';
    } else {
        reservasHTML = reservas.map(reserva => {
            const statusClass = reserva.status ? reserva.status.toLowerCase().replace(/\s+/g, '-') : 'pendente';
            const totalPessoas = (reserva.adultos || reserva.num_hospedes || 0) + (reserva.criancas || 0) + (reserva.hospedes_extras || 0);
            const statusDisplay = reserva.status || 'Pendente';
            
            console.log('📝 Renderizando reserva:', reserva.codigo, 'Status:', statusDisplay);
            
            // Para CASAS: não mostrar crianças, mostrar apenas "Pessoas a Mais"
            let pessoasHTML = '';
            if (isCasa) {
                // Para CASAS: adultos + pessoas a mais
                const totalAdultos = reserva.adultos || reserva.num_hospedes || 0;
                pessoasHTML = `<div><strong>Pessoas:</strong> ${totalAdultos} adulto(s)`;
                if (reserva.hospedes_extras > 0) {
                    pessoasHTML += `, <strong style="color: #667eea;">${reserva.hospedes_extras} pessoa(s) a mais</strong> - R$ ${parseFloat(reserva.valor_hospedes_extras || 0).toFixed(2).replace('.', ',')}`;
                }
                pessoasHTML += '</div>';
            } else {
                // Para SUÍTES: adultos + crianças + extras (se houver)
                const totalAdultos = reserva.adultos || reserva.num_hospedes || 0;
                pessoasHTML = `<div><strong>Pessoas:</strong> ${totalAdultos} adulto(s)`;
                if (reserva.criancas > 0) {
                    pessoasHTML += `, ${reserva.criancas} criança(s)`;
                }
                if (reserva.hospedes_extras > 0) {
                    pessoasHTML += `, ${reserva.hospedes_extras} hóspede(s) extra(s) - R$ ${parseFloat(reserva.valor_hospedes_extras || 0).toFixed(2).replace('.', ',')}`;
                }
                pessoasHTML += '</div>';
            }
            
            return `
                <div class="reserva-ficha-item" style="background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div class="reserva-ficha-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e0e0e0;">
                        <span class="reserva-ficha-codigo" style="font-weight: 600; color: #40E0D0;">Reserva #${reserva.codigo}</span>
                        <span class="reserva-status ${statusClass}">${statusDisplay}</span>
                    </div>
                    <div class="reserva-ficha-info" style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <div><strong>Cliente:</strong> ${reserva.nome_completo || 'Não informado'}</div>
                        <div><strong>E-mail:</strong> ${reserva.email || 'Não informado'}</div>
                        <div><strong>Telefone:</strong> ${reserva.telefone || 'Não informado'}</div>
                        <div><strong>Período:</strong> ${formatDate(reserva.check_in)} → ${formatDate(reserva.check_out)}</div>
                        ${totalPessoas > 0 ? pessoasHTML : ''}
                        <div><strong>Situação:</strong> <span class="reserva-status ${statusClass}">${statusDisplay}</span></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    modalContent.innerHTML = `
        <div class="modal-quarto-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0;">
            <h2 style="margin: 0; color: #2c3e50;">Ficha do ${quarto.categoria}</h2>
            <span class="modal-close" style="font-size: 2rem; cursor: pointer; color: #999;">&times;</span>
        </div>
        <div class="modal-quarto-body">
            <div class="quarto-info-ficha" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <div style="margin-bottom: 0.5rem;"><strong>Categoria:</strong> ${quarto.categoria}</div>
                <div><strong>Capacidade:</strong> ${quarto.capacidade} pessoas</div>
            </div>
            <div class="reservas-ficha-container">
                <h3 style="margin-bottom: 1rem; color: #2c3e50;">Reservas</h3>
                ${reservasHTML}
            </div>
        </div>
    `;

    // Adicionar event listener para fechar modal
    const closeBtn = modalContent.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    modal.classList.add('active');
}

function criarModalQuarto() {
    const modal = document.createElement('div');
    modal.id = 'modal-quarto';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" id="modal-quarto-content" style="max-width: 800px;">
            <!-- Conteúdo será preenchido dinamicamente -->
        </div>
    `;
    document.body.appendChild(modal);

    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function createQuartoCard(quarto) {
    return `
        <div class="quarto-card" data-quarto-id="${quarto.id}" style="cursor: pointer;">
            <div class="quarto-header">
                <span class="quarto-numero">${quarto.categoria}</span>
            </div>
            <div class="quarto-info">
                <strong>Capacidade:</strong> ${quarto.capacidade} pessoas
            </div>
            ${quarto.reservado ? `
                <div class="quarto-datas">
                    <div class="quarto-data-item">
                        <span>Cliente:</span>
                        <strong>${quarto.cliente_nome}</strong>
                    </div>
                    <div class="quarto-data-item">
                        <span>Check-in:</span>
                        <strong>${formatDate(quarto.check_in)}</strong>
                    </div>
                    <div class="quarto-data-item">
                        <span>Check-out:</span>
                        <strong>${formatDate(quarto.check_out)}</strong>
                    </div>
                    <div class="quarto-data-item">
                        <span>Dias ocupados:</span>
                        <strong>${quarto.dias_ocupados}</strong>
                    </div>
                </div>
            ` : '<div class="quarto-info" style="margin-top: 10px; color: #666;">Clique para ver reservas deste quarto</div>'}
        </div>
    `;
}

// ========== ABA: QUARTOS (Nova Aba - Lista Completa) ==========
async function loadQuartosLista() {
    const container = document.getElementById('quartos-lista-container');
    container.innerHTML = '<div class="loading">Carregando quartos...</div>';

    try {
        // Buscar todos os quartos do banco
        const response = await apiRequest('/quartos-reservados');
        if (!response) {
            container.innerHTML = '<div class="error-message">Erro: Não foi possível conectar ao servidor</div>';
            return;
        }

        const todosQuartos = await response.json();

        if (!todosQuartos || !Array.isArray(todosQuartos)) {
            container.innerHTML = '<div class="error-message">Erro: Dados inválidos recebidos do servidor</div>';
            return;
        }

        // Filtrar quartos antigos e casas genéricas (remover os 3 antigos e Casa 1, 2, 3, 4)
        const quartosAntigos = ['Suíte Standard', 'Suíte Premium', 'Suíte Master Lux', 'Casa 1', 'Casa 2', 'Casa 3', 'Casa 4'];
        const quartosNovos = todosQuartos.filter(quarto => !quartosAntigos.includes(quarto.categoria));

        if (quartosNovos.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Nenhum quarto encontrado</div></div>';
            return;
        }

        container.innerHTML = quartosNovos.map(quarto => createQuartoListaCard(quarto)).join('');
        
        // Adicionar event listeners para abrir ficha do quarto
        container.querySelectorAll('.quarto-lista-card').forEach(card => {
            card.addEventListener('click', function() {
                const quartoId = this.getAttribute('data-quarto-id');
                if (quartoId) {
                    abrirFichaQuartoLista(quartoId);
                }
            });
        });
    } catch (error) {
        console.error('Erro ao carregar lista de quartos:', error);
        container.innerHTML = `<div class="error-message">Erro ao carregar quartos: ${error.message || 'Erro desconhecido'}</div>`;
    }
}

function createQuartoListaCard(quarto) {
    return `
        <div class="quarto-lista-card" data-quarto-id="${quarto.id}" style="cursor: pointer; background: white; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 1.2rem;">${quarto.categoria}</h3>
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">ID: ${quarto.id}</p>
                </div>
                <div style="color: #40E0D0; font-weight: 600;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>
        </div>
    `;
}

async function abrirFichaQuartoLista(quartoId) {
    try {
        console.log('🔍 Abrindo ficha do quarto ID:', quartoId);
        const response = await apiRequest(`/quartos/${quartoId}/reservas`);
        if (!response) {
            console.error('❌ Resposta vazia da API');
            return;
        }

        const data = await response.json();
        const quarto = data.quarto;
        const reservas = data.reservas || [];

        console.log('📋 Dados recebidos - Quarto:', quarto?.categoria, 'Reservas:', reservas.length);

        // Criar modal para mostrar a ficha completa
        mostrarFichaQuartoLista(quarto, reservas);
    } catch (error) {
        console.error('Erro ao carregar ficha do quarto:', error);
        alert('Erro ao carregar informações do quarto: ' + (error.message || 'Erro desconhecido'));
    }
}

function mostrarFichaQuartoLista(quarto, reservas) {
    let modal = document.getElementById('modal-quarto-lista');
    if (!modal) {
        // Criar modal se não existir
        criarModalQuartoLista();
        modal = document.getElementById('modal-quarto-lista');
    }
    
    const modalContent = document.getElementById('modal-quarto-lista-content');
    if (!modalContent) return;

    // Verificar se é CASA
    const isCasa = isCasaReserva(quarto.categoria);

    // Formatar reservas
    let reservasHTML = '';
    if (reservas.length === 0) {
        reservasHTML = '<div class="empty-state" style="padding: 2rem; text-align: center; color: #666;"><div class="empty-state-text">Nenhuma reserva encontrada para este quarto.</div></div>';
    } else {
        reservasHTML = reservas.map(reserva => {
            const statusClass = reserva.status ? reserva.status.toLowerCase().replace(/\s+/g, '-') : 'pendente';
            const statusDisplay = reserva.status || 'Pendente';
            
            // Calcular total de pessoas baseado no tipo (CASA ou SUÍTE)
            let totalPessoas = (reserva.adultos || reserva.num_hospedes || 0) + (reserva.hospedes_extras || 0);
            if (!isCasa) {
                totalPessoas += (reserva.criancas || 0);
            }
            
            // HTML para exibir hóspedes
            let hospedesHTML = `<div style="font-weight: 600;">${totalPessoas} pessoa(s)`;
            if (isCasa && reserva.hospedes_extras > 0) {
                hospedesHTML += `<br><small style="color: #667eea; font-weight: 600;">${reserva.hospedes_extras} pessoa(s) a mais - R$ ${parseFloat(reserva.valor_hospedes_extras || 0).toFixed(2).replace('.', ',')}</small>`;
            } else if (!isCasa && reserva.hospedes_extras > 0) {
                hospedesHTML += `<br><small style="color: #667eea;">${reserva.hospedes_extras} extra(s) - R$ ${parseFloat(reserva.valor_hospedes_extras || 0).toFixed(2).replace('.', ',')}</small>`;
            }
            hospedesHTML += '</div>';
            
            return `
                <div class="reserva-ficha-item" style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-bottom: 1rem; border-left: 4px solid #40E0D0;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem;">${reserva.nome_completo || 'Não informado'}</div>
                            <div style="color: #666; font-size: 0.9rem;">Código: <strong>${reserva.codigo}</strong></div>
                        </div>
                        <span class="reserva-status ${statusClass}" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${statusDisplay}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; color: #555;">
                        <div>
                            <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Check-in</div>
                            <div style="font-weight: 600;">${formatDate(reserva.check_in)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Check-out</div>
                            <div style="font-weight: 600;">${formatDate(reserva.check_out)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Hóspedes</div>
                            ${hospedesHTML}
                        </div>
                        <div>
                            <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Valor</div>
                            <div style="font-weight: 600; color: #40E0D0;">R$ ${parseFloat(reserva.valor_total || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    modalContent.innerHTML = `
        <div class="modal-quarto-lista-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0;">
            <div>
                <h2 style="margin: 0 0 0.5rem 0; color: #2c3e50; font-size: 1.5rem;">${quarto.categoria}</h2>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">ID Interno: <strong>${quarto.id}</strong></p>
            </div>
            <span class="modal-close" style="font-size: 2rem; cursor: pointer; color: #999; line-height: 1;">&times;</span>
        </div>
        <div class="modal-quarto-lista-body">
            <div class="quarto-info-ficha" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Categoria</div>
                        <div style="font-weight: 600; color: #2c3e50;">${quarto.categoria}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Capacidade</div>
                        <div style="font-weight: 600; color: #2c3e50;">${quarto.capacidade} pessoas</div>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; color: #999; margin-bottom: 0.25rem;">Vista</div>
                        <div style="font-weight: 600; color: #2c3e50;">${quarto.vista || 'N/A'}</div>
                    </div>
                </div>
            </div>
            <div class="reservas-ficha-container">
                <h3 style="margin-bottom: 1.5rem; color: #2c3e50; font-size: 1.2rem;">Reservas (${reservas.length})</h3>
                ${reservasHTML}
            </div>
        </div>
    `;

    // Adicionar event listener para fechar modal
    const closeBtn = modalContent.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    modal.classList.add('active');
}

function criarModalQuartoLista() {
    const modal = document.createElement('div');
    modal.id = 'modal-quarto-lista';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" id="modal-quarto-lista-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <!-- Conteúdo será preenchido dinamicamente -->
        </div>
    `;
    document.body.appendChild(modal);
}

// ========== ABA: HISTÓRICO ==========
async function loadHistorico(termoBusca = '') {
    const container = document.getElementById('historico-container');
    container.innerHTML = '<div class="loading">Carregando histórico...</div>';

    try {
        let url = '/historico';
        if (termoBusca) {
            url += `/buscar?termo=${encodeURIComponent(termoBusca)}`;
        }
        
        const response = await apiRequest(url);
        if (!response) {
            container.innerHTML = '<div class="error-message">Erro: Não foi possível conectar ao servidor</div>';
            return;
        }

        const historico = await response.json();

        if (!historico || !Array.isArray(historico)) {
            container.innerHTML = '<div class="error-message">Erro: Dados inválidos recebidos do servidor</div>';
            return;
        }

        if (historico.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 20V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 20V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhum histórico encontrado</div></div>';
            return;
        }

        container.innerHTML = historico.map(item => createHistoricoItem(item)).join('');
        
        // Adicionar event listeners para botões de ver ficha
        container.querySelectorAll('.btn-ver-ficha-historico').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                if (id) {
                    // Abrir modal em modo somente leitura (histórico)
                    openModalReservaReadOnly(id);
                } else {
                    alert('Erro: ID da ficha não encontrado');
                }
            });
        });
        
        // Adicionar event listeners para botões de excluir
        container.querySelectorAll('.btn-excluir-historico').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const id = this.getAttribute('data-id');
                if (id) {
                    excluirFichaHistorico(id);
                } else {
                    alert('Erro: ID da ficha não encontrado');
                }
            });
        });
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = `<div class="error-message">Erro ao carregar histórico: ${error.message || 'Erro desconhecido'}</div>`;
    }
}

function buscarHistorico() {
    const termo = document.getElementById('input-busca-historico').value.trim();
    loadHistorico(termo);
}

async function excluirFichaHistorico(id) {
    // Validar ID
    if (!id) {
        alert('Erro: ID da ficha não encontrado');
        console.error('ID não fornecido para exclusão');
        return;
    }

    // Converter para número se necessário
    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum <= 0) {
        alert('Erro: ID da ficha inválido');
        console.error('ID inválido:', id);
        return;
    }

    console.log('Tentando excluir ficha com ID:', idNum);

    if (!confirm('Tem certeza que deseja excluir esta ficha? Esta ação é permanente.')) {
        return;
    }

    try {
        const url = `/historico/${idNum}`;
        console.log('Enviando requisição DELETE para:', `${API_BASE}${url}`);
        console.log('ID da ficha:', idNum);
        
        const response = await apiRequest(url, {
            method: 'DELETE'
        });

        if (!response) {
            alert('Erro: Não foi possível conectar ao servidor. Verifique sua conexão.');
            console.error('Resposta nula do servidor - possível problema de autenticação ou conexão');
            return;
        }

        console.log('Resposta recebida:', response.status, response.statusText);

        if (response.ok) {
            let result;
            try {
                result = await response.json();
                console.log('Ficha excluída com sucesso:', result);
            } catch (e) {
                console.warn('Resposta OK mas sem JSON válido:', e);
            }
            
            // Remover o item da lista sem recarregar toda a página
            const item = document.querySelector(`.historico-item[data-id="${idNum}"]`);
            if (item) {
                item.style.transition = 'opacity 0.3s';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    
                    // Verificar se ainda há itens na lista
                    const container = document.getElementById('historico-container');
                    const itemsRestantes = container.querySelectorAll('.historico-item');
                    
                    if (itemsRestantes.length === 0) {
                        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 20V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 20V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhum histórico encontrado</div></div>';
                    }
                }, 300);
            } else {
                // Se não encontrou o item, recarregar a lista
                loadHistorico();
            }
            
            // Mostrar mensagem de sucesso de forma mais elegante
            const successMsg = document.createElement('div');
            successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 5px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
            successMsg.textContent = '✅ Ficha excluída com sucesso!';
            document.body.appendChild(successMsg);
            setTimeout(() => {
                successMsg.style.opacity = '0';
                successMsg.style.transition = 'opacity 0.3s';
                setTimeout(() => successMsg.remove(), 300);
            }, 2000);
        } else {
            // Tentar ler a mensagem de erro
            let errorMessage = 'Erro ao excluir ficha';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
                console.error('Erro do servidor:', errorData);
            } catch (e) {
                if (response.status === 404) {
                    errorMessage = 'Rota não encontrada. Verifique se o servidor está rodando corretamente.';
                } else {
                errorMessage = `Erro ${response.status}: ${response.statusText || 'Erro desconhecido'}`;
                }
                console.error('Erro ao ler resposta JSON:', e);
                console.error('Status da resposta:', response.status);
                console.error('URL chamada:', `${API_BASE}${url}`);
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Erro ao excluir ficha:', error);
        console.error('Stack trace:', error.stack);
        console.error('URL tentada:', `${API_BASE}/historico/${idNum}`);
        alert('Erro ao excluir ficha: ' + (error.message || 'Erro desconhecido. Verifique o console para mais detalhes.'));
    }
}

function createHistoricoItem(item) {
    const statusClass = item.status.toLowerCase();
    return `
        <div class="historico-item" data-id="${item.id}">
            <div class="historico-info">
                <div class="historico-cliente">${item.nome_completo}</div>
                <div class="historico-detalhes">
                    ${item.categoria} | ${formatDate(item.check_in)} → ${formatDate(item.check_out)} | 
                    Status: <span class="reserva-status ${statusClass}">${item.status}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button class="btn-secondary btn-ver-ficha-historico" data-id="${item.id}" style="padding: 8px 16px; font-size: 14px;">Ver Ficha</button>
                <div class="historico-valor" style="margin-left: auto;">R$ ${parseFloat(item.valor_total).toFixed(2)}</div>
                <button class="btn-secondary btn-excluir-historico" data-id="${item.id}" style="padding: 8px 16px; font-size: 14px;">Excluir</button>
            </div>
        </div>
    `;
}

// ========== ABA: USUÁRIOS ==========
async function loadUsuarios() {
    const container = document.getElementById('usuarios-list');
    container.innerHTML = '<div class="loading">Carregando usuários...</div>';

    try {
        const response = await apiRequest('/usuarios');
        if (!response) {
            container.innerHTML = '<div class="error-message">Erro: Não foi possível conectar ao servidor</div>';
            return;
        }

        const usuarios = await response.json();

        if (!usuarios || !Array.isArray(usuarios)) {
            container.innerHTML = '<div class="error-message">Erro: Dados inválidos recebidos do servidor</div>';
            return;
        }

        if (usuarios.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhum usuário cadastrado</div></div>';
            return;
        }

        container.innerHTML = usuarios.map(usuario => createUsuarioItem(usuario)).join('');
        
        // Event listeners
        container.querySelectorAll('.btn-edit-usuario').forEach(btn => {
            btn.addEventListener('click', () => openModalUsuario(btn.dataset.id));
        });
        container.querySelectorAll('.btn-delete-usuario').forEach(btn => {
            btn.addEventListener('click', () => deleteUsuario(btn.dataset.id));
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        container.innerHTML = `<div class="error-message">Erro ao carregar usuários: ${error.message || 'Erro desconhecido'}</div>`;
    }
}

function createUsuarioItem(usuario) {
    return `
        <div class="usuario-item" data-id="${usuario.id}">
            <div class="usuario-info">
                <div class="usuario-nome">${usuario.name}</div>
                <div class="usuario-email">${usuario.email}</div>
            </div>
            <div class="usuario-actions">
                <button class="btn-primary btn-edit-usuario" data-id="${usuario.id}">Editar</button>
                <button class="btn-secondary btn-delete-usuario" data-id="${usuario.id}">Excluir</button>
            </div>
        </div>
    `;
}

document.getElementById('btn-add-usuario').addEventListener('click', () => openModalUsuario(null));

// ========== ABA: AGENDAR MANUALMENTE ==========
function calcularValorAgendamento() {
    const checkin = document.getElementById('agendar-checkin').value;
    const checkout = document.getElementById('agendar-checkout').value;
    const suiteId = document.getElementById('agendar-suite').value;

    if (!checkin || !checkout || !suiteId) return;

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const noites = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));

    if (noites <= 0) {
        document.getElementById('agendar-valor').value = '';
        return;
    }

    const suite = suites[suiteId];
    if (suite) {
        const valorTotal = suite.preco * noites;
        document.getElementById('agendar-valor').value = valorTotal.toFixed(2);
    }
}

async function handleAgendarManual(e) {
    e.preventDefault();

    const dados = {
        nome_completo: document.getElementById('agendar-nome').value,
        telefone: document.getElementById('agendar-telefone').value,
        email: document.getElementById('agendar-email').value,
        categoria: suites[document.getElementById('agendar-suite').value].nome,
        check_in: document.getElementById('agendar-checkin').value,
        check_out: document.getElementById('agendar-checkout').value,
        adultos: parseInt(document.getElementById('agendar-adultos').value),
        criancas: parseInt(document.getElementById('agendar-criancas').value) || 0,
        valor_total: parseFloat(document.getElementById('agendar-valor').value),
        metodo_pagamento: document.getElementById('agendar-pagamento').value,
        status: 'Confirmado'
    };

    try {
        const response = await apiRequest('/reservas', {
            method: 'POST',
            body: JSON.stringify(dados)
        });

        if (response && response.ok) {
            alert('Reserva criada com sucesso!');
            document.getElementById('form-agendar').reset();
            // Mudar para aba de reservas
            document.querySelector('.nav-item[data-tab="reservas"]').click();
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao criar reserva');
        }
    } catch (error) {
        console.error('Erro ao criar reserva:', error);
        alert('Erro ao criar reserva');
    }
}

// ========== ABA: RENDA ==========
async function loadRenda() {
    const mes = document.getElementById('renda-mes').value;
    const [ano, mesNum] = mes.split('-');

    try {
        const response = await apiRequest(`/renda?mes=${mesNum}&ano=${ano}`);
        if (!response) return;

        const data = await response.json();
        displayRendaStats(data);
        displayRendaHistorico(data.historico);
    } catch (error) {
        console.error('Erro ao carregar renda:', error);
    }
}

function displayRendaStats(data) {
    const container = document.getElementById('renda-stats');
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.total_reservas || 0}</div>
            <div class="stat-label">Total de Reservas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.reservas_concluidas || 0}</div>
            <div class="stat-label">Reservas Concluídas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.reservas_canceladas || 0}</div>
            <div class="stat-label">Reservas Canceladas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">R$ ${(data.total_faturado || 0).toFixed(2)}</div>
            <div class="stat-label">Total Faturado</div>
        </div>
    `;
}

function displayRendaHistorico(historico) {
    const container = document.getElementById('renda-historico');
    if (!historico || historico.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-text">Nenhum histórico disponível</div></div>';
        return;
    }

    container.innerHTML = historico.map(item => `
        <div class="historico-mensal-item">
            <div>
                <strong>${item.mes}/${item.ano}</strong>
                <div style="font-size: 13px; color: #666; margin-top: 5px;">
                    ${item.total_reservas} reservas | Ocupação: ${item.ocupacao}% | Cancelamentos: ${item.cancelamentos}
                </div>
            </div>
            <div class="historico-valor">R$ ${parseFloat(item.valor_total).toFixed(2)}</div>
        </div>
    `).join('');
}

// ========== MODAL DE RESERVA ==========
function setupModalReserva() {
    const modal = document.getElementById('modal-reserva');
    const closeBtns = modal.querySelectorAll('.modal-close');
    const form = document.getElementById('form-editar-reserva');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
            // Reabilitar campos ao fechar (para próxima abertura)
            enableModalFields(true);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            // Reabilitar campos ao fechar (para próxima abertura)
            enableModalFields(true);
        }
    });

    // Observar mudança de status
    document.getElementById('edit-status').addEventListener('change', function() {
        const motivoGroup = document.getElementById('motivo-cancelamento-group');
        if (this.value === 'Cancelada') {
            motivoGroup.style.display = 'block';
        } else {
            motivoGroup.style.display = 'none';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveReserva();
    });
    
    // Event listener para o botão "Cancelar Reserva"
    const btnCancelarReserva = document.getElementById('btn-cancelar-reserva');
    if (btnCancelarReserva) {
        btnCancelarReserva.addEventListener('click', async function() {
            if (!reservaAtual) {
                alert('Erro: Dados da reserva não encontrados');
                return;
            }
            
            if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
                try {
                    const dados = {
                        ...reservaAtual,
                        status: 'Cancelada'
                    };
                    
                    const response = await apiRequest(`/reservas/${reservaAtual.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(dados)
                    });
                    
                    if (response && response.ok) {
                        alert('Reserva cancelada com sucesso. Ela foi movida para o histórico.');
                        document.getElementById('modal-reserva').classList.remove('active');
                        
                        // Remover a reserva cancelada da lista imediatamente
                        const reservaCard = document.querySelector(`.reserva-card[data-id="${reservaAtual.id}"]`);
                        if (reservaCard) {
                            reservaCard.style.transition = 'opacity 0.3s';
                            reservaCard.style.opacity = '0';
                            setTimeout(() => {
                                reservaCard.remove();
                                // Verificar se ainda há reservas na lista
                                const container = document.getElementById('reservas-grid');
                                const reservasRestantes = container.querySelectorAll('.reserva-card');
                                if (reservasRestantes.length === 0) {
                                    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhuma reserva encontrada</div></div>';
                                }
                            }, 300);
                        } else {
                            // Se não encontrou o card, recarregar a lista
                        loadReservas();
                        }
                    } else {
                        const error = await response.json();
                        alert(error.error || 'Erro ao cancelar reserva');
                    }
                } catch (error) {
                    console.error('Erro ao cancelar reserva:', error);
                    alert('Erro ao cancelar reserva');
                }
            }
        });
    }
}

// Variável global para armazenar a reserva atual
let reservaAtual = null;

async function openModalReserva(id) {
    const modal = document.getElementById('modal-reserva');
    modal.classList.add('active');
    
    // Habilitar todos os campos (modo edição)
    enableModalFields(true);

    try {
        const response = await apiRequest(`/reservas/${id}`);
        if (!response) return;

        const reserva = await response.json();
        reservaAtual = reserva; // Armazenar reserva atual
        fillModalReserva(reserva);
    } catch (error) {
        console.error('Erro ao carregar reserva:', error);
        alert('Erro ao carregar dados da reserva');
    }
}

// Função para abrir modal em modo somente leitura (histórico)
async function openModalReservaReadOnly(id) {
    const modal = document.getElementById('modal-reserva');
    modal.classList.add('active');
    
    // Desabilitar todos os campos (modo somente leitura)
    enableModalFields(false);

    try {
        const response = await apiRequest(`/reservas/${id}`);
        if (!response) return;

        const reserva = await response.json();
        fillModalReserva(reserva);
    } catch (error) {
        console.error('Erro ao carregar reserva:', error);
        alert('Erro ao carregar dados da reserva');
    }
}

// Função para habilitar/desabilitar campos do modal
function enableModalFields(enabled) {
    // Lista de todos os campos editáveis
    const fields = [
        'edit-nome',
        'edit-telefone',
        'edit-email',
        'edit-status',
        'edit-checkin',
        'edit-checkout',
        'edit-adultos',
        'edit-criancas',
        'edit-valor',
        'edit-pagamento',
        'edit-motivo-cancelamento'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = !enabled;
            field.readOnly = !enabled;
        }
    });
    
    // Ocultar/mostrar botões de ação
    const formActions = document.querySelector('#form-editar-reserva .form-actions');
    if (formActions) {
        const saveBtn = formActions.querySelector('button[type="submit"]');
        const cancelReservaBtn = document.getElementById('btn-cancelar-reserva');
        const cancelBtn = formActions.querySelector('.modal-close');
        
        if (enabled) {
            // Modo edição: mostrar botões de ação
            if (saveBtn) saveBtn.style.display = '';
            if (cancelReservaBtn) cancelReservaBtn.style.display = '';
            if (cancelBtn) cancelBtn.style.display = '';
        } else {
            // Modo somente leitura: ocultar botões de ação, manter apenas fechar
            if (saveBtn) saveBtn.style.display = 'none';
            if (cancelReservaBtn) cancelReservaBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = '';
        }
    }
    
    // Atualizar título do modal
    const modalTitle = document.querySelector('#modal-reserva h2');
    if (modalTitle) {
        modalTitle.textContent = enabled ? 'Detalhes da Reserva' : 'Visualizar Ficha';
    }
}

function fillModalReserva(reserva) {
    document.getElementById('reserva-id').value = reserva.id;
    document.getElementById('edit-nome').value = reserva.nome_completo;
    document.getElementById('edit-telefone').value = reserva.telefone || '';
    document.getElementById('edit-email').value = reserva.email;
    document.getElementById('edit-status').value = reserva.status;
    document.getElementById('edit-checkin').value = reserva.check_in;
    document.getElementById('edit-checkout').value = reserva.check_out;
    document.getElementById('edit-suite').value = reserva.categoria;
    document.getElementById('edit-noites').value = reserva.total_noites || 0;
    document.getElementById('edit-adultos').value = reserva.adultos || reserva.num_hospedes || 2;
    
    // Verificar se é CASA para ajustar campos
    const editCriancasField = document.getElementById('edit-criancas');
    const editCriancasLabel = editCriancasField ? editCriancasField.previousElementSibling : null;
    const isCasaEdit = reserva.categoria && isCasaReserva(reserva.categoria);
    
    if (isCasaEdit) {
        // Para CASAS: esconder campo de crianças
        if (editCriancasField) {
            editCriancasField.style.display = 'none';
            editCriancasField.value = 0; // Garantir que crianças = 0 para CASAS
        }
        if (editCriancasLabel && editCriancasLabel.tagName === 'LABEL') {
            editCriancasLabel.style.display = 'none';
        }
    } else {
        // Para SUÍTES: mostrar campo de crianças normalmente
        if (editCriancasField) {
            editCriancasField.style.display = 'block';
            editCriancasField.value = reserva.criancas || 0;
        }
        if (editCriancasLabel && editCriancasLabel.tagName === 'LABEL') {
            editCriancasLabel.style.display = 'block';
        }
    }
    document.getElementById('edit-valor').value = parseFloat(reserva.valor_total).toFixed(2);
    document.getElementById('edit-pagamento').value = reserva.metodo_pagamento || 'Dinheiro';
    
    const motivoGroup = document.getElementById('motivo-cancelamento-group');
    if (reserva.status === 'Cancelada') {
        motivoGroup.style.display = 'block';
        document.getElementById('edit-motivo-cancelamento').value = reserva.motivo_cancelamento || '';
    } else {
        motivoGroup.style.display = 'none';
    }
}

async function saveReserva() {
    // Verificar se está em modo somente leitura (botão salvar oculto)
    const saveBtn = document.querySelector('#form-editar-reserva button[type="submit"]');
    if (saveBtn && saveBtn.style.display === 'none') {
        console.warn('Tentativa de salvar em modo somente leitura bloqueada');
        return;
    }
    
    const id = document.getElementById('reserva-id').value;
    const categoriaReserva = document.getElementById('edit-suite').value;
    const isCasaEditSave = categoriaReserva && isCasaReserva(categoriaReserva);
    
    const dados = {
        nome_completo: document.getElementById('edit-nome').value,
        telefone: document.getElementById('edit-telefone').value,
        email: document.getElementById('edit-email').value,
        status: document.getElementById('edit-status').value,
        check_in: document.getElementById('edit-checkin').value,
        check_out: document.getElementById('edit-checkout').value,
        adultos: parseInt(document.getElementById('edit-adultos').value),
        criancas: isCasaEditSave ? 0 : (parseInt(document.getElementById('edit-criancas').value) || 0), // Para CASAS: sempre 0
        valor_total: parseFloat(document.getElementById('edit-valor').value),
        metodo_pagamento: document.getElementById('edit-pagamento').value
    };

    if (dados.status === 'Cancelada') {
        dados.motivo_cancelamento = document.getElementById('edit-motivo-cancelamento').value;
    }

    try {
        const response = await apiRequest(`/reservas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });

        if (response && response.ok) {
            alert('Reserva atualizada com sucesso!');
            document.getElementById('modal-reserva').classList.remove('active');
            
            // Se a reserva foi cancelada, remover da lista imediatamente (vai para histórico)
            if (dados.status === 'Cancelada' || dados.status === 'Cancelado') {
                const reservaCard = document.querySelector(`.reserva-card[data-id="${id}"]`);
                if (reservaCard) {
                    reservaCard.style.transition = 'opacity 0.3s';
                    reservaCard.style.opacity = '0';
                    setTimeout(() => {
                    reservaCard.remove();
                    // Verificar se ainda há reservas na lista
                    const container = document.getElementById('reservas-grid');
                    const reservasRestantes = container.querySelectorAll('.reserva-card');
                    if (reservasRestantes.length === 0) {
                        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhuma reserva encontrada</div></div>';
                    }
                    }, 300);
                } else {
                    // Se não encontrou o card, recarregar a lista
                    loadReservas();
                }
            } else {
                // Recarregar lista de reservas apenas se não foi cancelada
            loadReservas();
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao atualizar reserva');
        }
    } catch (error) {
        console.error('Erro ao salvar reserva:', error);
        alert('Erro ao salvar reserva');
    }
}

// ========== MODAL DE USUÁRIO ==========
function setupModalUsuario() {
    const modal = document.getElementById('modal-usuario');
    const closeBtns = modal.querySelectorAll('.modal-close');
    const form = document.getElementById('form-usuario');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
            form.reset();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            form.reset();
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveUsuario();
    });
}

async function openModalUsuario(id) {
    const modal = document.getElementById('modal-usuario');
    const title = document.getElementById('modal-usuario-title');
    const form = document.getElementById('form-usuario');
    
    form.reset();
    document.getElementById('usuario-id').value = id || '';

    if (id) {
        title.textContent = 'Editar Usuário';
        try {
            const response = await apiRequest(`/usuarios/${id}`);
            if (!response) return;

            const usuario = await response.json();
            document.getElementById('usuario-nome').value = usuario.name;
            document.getElementById('usuario-email').value = usuario.email;
            document.getElementById('usuario-senha').required = false;
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        }
    } else {
        title.textContent = 'Adicionar Usuário';
        document.getElementById('usuario-senha').required = true;
    }

    modal.classList.add('active');
}

async function saveUsuario() {
    const id = document.getElementById('usuario-id').value;
    const dados = {
        name: document.getElementById('usuario-nome').value,
        email: document.getElementById('usuario-email').value
    };

    const senha = document.getElementById('usuario-senha').value;
    if (senha) {
        dados.password = senha;
    }

    try {
        const url = id ? `/usuarios/${id}` : '/usuarios';
        const method = id ? 'PUT' : 'POST';
        
        const response = await apiRequest(url, {
            method: method,
            body: JSON.stringify(dados)
        });

        if (response && response.ok) {
            alert(id ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
            document.getElementById('modal-usuario').classList.remove('active');
            loadUsuarios();
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao salvar usuário');
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        alert('Erro ao salvar usuário');
    }
}

async function deleteUsuario(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é permanente.')) {
        return;
    }

    try {
        const idNum = parseInt(id, 10);
        if (isNaN(idNum)) {
            alert('Erro: ID do usuário inválido');
            return;
        }

        const url = `/usuarios/${idNum}`;
        console.log('Enviando requisição DELETE para:', url);
        console.log('ID do usuário:', idNum);
        
        const response = await apiRequest(url, {
            method: 'DELETE'
        });

        if (!response) {
            alert('Erro: Não foi possível conectar ao servidor. Verifique sua conexão.');
            console.error('Resposta nula do servidor - possível problema de autenticação ou conexão');
            return;
        }

        console.log('Resposta recebida:', response.status, response.statusText);

        if (response.ok) {
            const data = await response.json();
            console.log('Dados da resposta:', data);
            
            // Remover o item da lista imediatamente
            const item = document.querySelector(`.usuario-item[data-id="${idNum}"]`);
            if (item) {
                item.style.transition = 'opacity 0.3s';
                item.style.opacity = '0';
                setTimeout(() => {
                    item.remove();
                    
                    // Verificar se ainda há itens na lista
                    const container = document.getElementById('usuarios-list');
                    const itemsRestantes = container.querySelectorAll('.usuario-item');
                    
                    if (itemsRestantes.length === 0) {
                        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-state-text">Nenhum usuário cadastrado</div></div>';
                    }
                }, 300);
            } else {
                // Se não encontrou o item, recarregar a lista
            loadUsuarios();
            }
            
            // Mostrar mensagem de sucesso de forma mais elegante
            const successMsg = document.createElement('div');
            successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px 20px; border-radius: 5px; z-index: 10000; box-shadow: 0 2px 10px rgba(0,0,0,0.2);';
            successMsg.textContent = '✅ Usuário excluído com sucesso!';
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.style.transition = 'opacity 0.3s';
                successMsg.style.opacity = '0';
                setTimeout(() => successMsg.remove(), 300);
            }, 3000);
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            const errorMessage = errorData.error || `Erro ao excluir usuário: ${response.status} ${response.statusText}`;
            alert(errorMessage);
            console.error('Erro ao excluir usuário:', errorMessage);
        }
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert(`Erro ao excluir usuário: ${error.message || 'Erro desconhecido'}`);
    }
}

// ========== CONTATO ==========
let contatoInterval = null;

async function loadContato() {
    try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            console.error('Token não encontrado');
            return;
        }

        console.log('📥 Carregando fichas de contato...');
        const response = await fetch(`${API_BASE}/contato`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('Erro na resposta:', response.status, errorData);
            throw new Error(errorData.error || 'Erro ao carregar fichas de contato');
        }

        const fichas = await response.json();
        console.log(`✅ ${fichas.length} fichas carregadas`);
        displayContatoFichas(fichas);

        // Limpar intervalo anterior se existir
        if (contatoInterval) {
            clearInterval(contatoInterval);
        }

        // Atualizar contadores a cada segundo
        contatoInterval = setInterval(() => {
            updateContatoCounters();
        }, 1000);

        // Limpar fichas expiradas periodicamente (a cada 5 minutos)
        setTimeout(() => {
            limparFichasExpiradas();
        }, 1000);
    } catch (error) {
        console.error('❌ Erro ao carregar fichas de contato:', error);
        const grid = document.getElementById('contato-fichas-grid');
        if (grid) {
            grid.innerHTML = `<p style="color: red; grid-column: 1 / -1; text-align: center; padding: 2rem;">
                Erro ao carregar fichas de contato: ${error.message || 'Erro desconhecido'}<br>
                <button onclick="loadContato()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0e8d7f; color: white; border: none; border-radius: 5px; cursor: pointer;">Tentar Novamente</button>
            </p>`;
        }
    }
}

function displayContatoFichas(fichas) {
    const grid = document.getElementById('contato-fichas-grid');
    
    if (!fichas || fichas.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666; padding: 2rem;">Nenhuma ficha de contato encontrada.</p>';
        return;
    }

    grid.innerHTML = fichas.map(ficha => createContatoCard(ficha)).join('');
    updateContatoCounters();
}

function createContatoCard(ficha) {
    const dataHora = formatDateTime(ficha.created_at);
    
    // Verificar se expires_at existe e é válido
    let expiresAt;
    if (!ficha.expires_at) {
        console.warn('Ficha sem expires_at:', ficha);
        // Se não tiver expires_at, calcular agora (7 dias)
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        ficha.expires_at = expiresAt.toISOString().replace('T', ' ').substring(0, 19);
    } else {
        // Converter formato SQLite (YYYY-MM-DD HH:MM:SS) para Date
        // Se já estiver em formato ISO, usar diretamente
        if (ficha.expires_at.includes('T')) {
            expiresAt = new Date(ficha.expires_at);
        } else {
            // Formato SQLite: YYYY-MM-DD HH:MM:SS -> converter para ISO
            expiresAt = new Date(ficha.expires_at.replace(' ', 'T'));
        }
    }
    
    const now = new Date();
    const timeLeft = expiresAt - now;

    return `
        <div class="contato-ficha-card" data-id="${ficha.id}" data-expires="${ficha.expires_at}" style="background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #2c3e50; font-size: 1.2rem;">${escapeHtml(ficha.name)}</h3>
                <span style="font-size: 0.85rem; color: #999;">${dataHora}</span>
            </div>
            <div style="margin-bottom: 1rem;">
                <p style="margin: 0.5rem 0; color: #555;">
                    <strong>Email:</strong> <a href="mailto:${escapeHtml(ficha.email)}" style="color: #0e8d7f;">${escapeHtml(ficha.email)}</a>
                </p>
                ${ficha.phone ? `
                    <p style="margin: 0.5rem 0; color: #555;">
                        <strong>Telefone:</strong> <a href="tel:${escapeHtml(ficha.phone)}" style="color: #0e8d7f;">${escapeHtml(ficha.phone)}</a>
                    </p>
                ` : ''}
                <p style="margin: 0.5rem 0; color: #555;">
                    <strong>Mensagem:</strong><br>
                    <span style="display: block; margin-top: 0.5rem; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; line-height: 1.6;">${escapeHtml(ficha.message)}</span>
                </p>
            </div>
            <div style="padding: 1rem; background: ${timeLeft > 0 ? '#fff3cd' : '#f8d7da'}; border-radius: 8px; border-left: 4px solid ${timeLeft > 0 ? '#ffc107' : '#dc3545'};">
                <p style="margin: 0; font-weight: 600; color: ${timeLeft > 0 ? '#856404' : '#721c24'};">
                    ${timeLeft > 0 ? '⏱️ Faltam: <span class="contato-timer" data-expires="' + ficha.expires_at + '">Calculando...</span>' : '⏰ Esta ficha expirou e será removida em breve'}
                </p>
            </div>
        </div>
    `;
}

function updateContatoCounters() {
    const timers = document.querySelectorAll('.contato-timer');
    const now = new Date();

    timers.forEach(timer => {
        if (!timer.dataset.expires) {
            timer.textContent = 'Data inválida';
            return;
        }
        
        let expiresAt;
        const expiresStr = timer.dataset.expires;
        
        // Converter formato SQLite para Date
        if (expiresStr.includes('T')) {
            expiresAt = new Date(expiresStr);
        } else {
            // Formato SQLite: YYYY-MM-DD HH:MM:SS
            expiresAt = new Date(expiresStr.replace(' ', 'T'));
        }
        
        // Verificar se a data é válida
        if (isNaN(expiresAt.getTime())) {
            timer.textContent = 'Data inválida';
            return;
        }
        
        const timeLeft = expiresAt - now;

        if (timeLeft <= 0) {
            timer.textContent = 'Expirado';
            timer.parentElement.style.background = '#f8d7da';
            timer.parentElement.style.borderLeftColor = '#dc3545';
            timer.parentElement.style.color = '#721c24';
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        let timeText = '';
        if (days > 0) {
            timeText = `${days} dia${days > 1 ? 's' : ''} e ${hours}h`;
        } else if (hours > 0) {
            timeText = `${hours}h e ${minutes}min`;
        } else if (minutes > 0) {
            timeText = `${minutes}min e ${seconds}s`;
        } else {
            timeText = `${seconds}s`;
        }

        timer.textContent = timeText;
    });
}

async function limparFichasExpiradas() {
    try {
        const token = localStorage.getItem('admin_token');
        await fetch(`${API_BASE}/contato/limpar-expiradas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Recarregar fichas após limpeza
        loadContato();
    } catch (error) {
        console.error('Erro ao limpar fichas expiradas:', error);
    }
}

// ========== UTILITÁRIOS ==========
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

