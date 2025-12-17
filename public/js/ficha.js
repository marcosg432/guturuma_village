// Carregar ficha da reserva
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    let codigo = null;
    
    // Tentar extrair código da URL /ficha/CODIGO
    const pathParts = path.split('/').filter(p => p);
    const fichaIndex = pathParts.indexOf('ficha');
    
    if (fichaIndex !== -1 && pathParts.length > fichaIndex + 1) {
        codigo = pathParts[fichaIndex + 1];
    } else {
        // Se não encontrou no path, tentar query string
        const urlParams = new URLSearchParams(window.location.search);
        codigo = urlParams.get('codigo');
    }
    
    // Verificar se veio de retorno do pagamento
    const urlParams = new URLSearchParams(window.location.search);
    const pagamentoStatus = urlParams.get('pagamento');
    if (pagamentoStatus) {
        // Mostrar mensagem de status do pagamento
        setTimeout(() => {
            if (pagamentoStatus === 'aprovado') {
                alert('✅ Pagamento aprovado com sucesso!');
            } else if (pagamentoStatus === 'rejeitado') {
                alert('❌ Pagamento foi rejeitado. Tente novamente.');
            } else if (pagamentoStatus === 'pending') {
                alert('⏳ Pagamento está pendente. Você receberá uma confirmação por e-mail.');
            }
        }, 1000);
    }
    
    // Remover .html se existir
    if (codigo && codigo.endsWith('.html')) {
        codigo = codigo.replace('.html', '');
    }
    
    // Limpar código de espaços e caracteres inválidos
    if (codigo) {
        codigo = codigo.trim();
    }

    if (codigo && codigo !== 'ficha' && codigo.length > 0) {
        loadFicha(codigo);
    } else {
        const contentDiv = document.getElementById('ficha-content');
        contentDiv.innerHTML = '<div class="error-message"><p>❌ Código de reserva não encontrado.</p><a href="/" class="btn btn-secondary">Voltar ao Início</a></div>';
    }
});

async function loadFicha(codigo) {
    const contentDiv = document.getElementById('ficha-content');
    
    if (!codigo || codigo.trim() === '') {
        contentDiv.innerHTML = `
            <div class="error-message">
                <p>❌ Código de reserva inválido.</p>
                <a href="/" class="btn btn-secondary">Voltar ao Início</a>
            </div>
        `;
        return;
    }
    
    try {
        const codigoLimpo = codigo.trim();
        console.log('🔍 Buscando reserva com código:', codigoLimpo);
        
        // Adicionar timeout para evitar carregamento infinito
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos
        
        const response = await fetch(`/api/reserva/${encodeURIComponent(codigoLimpo)}`, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        clearTimeout(timeoutId);
        
        console.log('📥 Resposta da API:', response.status, response.statusText);
        
        if (!response.ok) {
            let errorMessage = 'Reserva não encontrada';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // Se não conseguir parsear o JSON, usar mensagem padrão
                if (response.status === 404) {
                    errorMessage = 'Reserva não encontrada. Verifique o código.';
                } else if (response.status === 503) {
                    errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.';
                } else {
                    errorMessage = `Erro ${response.status}: ${response.statusText}`;
                }
            }
            
            contentDiv.innerHTML = `
                <div class="error-message">
                    <p>❌ ${errorMessage}</p>
                    <a href="/" class="btn btn-secondary">Voltar ao Início</a>
                </div>
            `;
            return;
        }
        
        const reserva = await response.json();
        console.log('✅ Reserva carregada:', reserva);
        
        if (!reserva || !reserva.codigo) {
            contentDiv.innerHTML = `
                <div class="error-message">
                    <p>❌ Dados da reserva inválidos.</p>
                    <a href="/" class="btn btn-secondary">Voltar ao Início</a>
                </div>
            `;
            return;
        }
        
        displayFicha(reserva);
    } catch (error) {
        console.error('❌ Erro ao carregar ficha:', error);
        
        let errorMessage = 'Erro ao carregar reserva. Por favor, tente novamente.';
        if (error.name === 'AbortError') {
            errorMessage = 'Tempo de espera esgotado. Verifique sua conexão e tente novamente.';
        } else if (error.message) {
            errorMessage = `Erro: ${error.message}`;
        }
        
        contentDiv.innerHTML = `
            <div class="error-message">
                <p>❌ ${errorMessage}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Tentar Novamente</button>
                <a href="/" class="btn btn-secondary" style="margin-top: 1rem; margin-left: 10px;">Voltar ao Início</a>
            </div>
        `;
    }
}

function displayFicha(reserva) {
    let adicionais = [];
    try {
        if (Array.isArray(reserva.adicionais)) {
            adicionais = reserva.adicionais;
        } else if (typeof reserva.adicionais === 'string') {
            adicionais = JSON.parse(reserva.adicionais || '[]');
        }
    } catch (e) {
        console.error('Erro ao parsear adicionais:', e);
        adicionais = [];
    }

    const adicionaisMap = {
        'passeio': 'Passeio Turístico',
        'romantico': 'Pacote Romântico',
        'upgrade_vista': 'Upgrade de Vista',
        'cama_extra': 'Cama Extra',
        'decoracao': 'Decoração Especial'
    };

    const statusMap = {
        'Confirmado': { text: 'Confirmado', class: 'confirmado' },
        'Pendente': { text: 'Pendente', class: 'pendente' },
        'Pagamento não confirmado': { text: 'Pagamento não confirmado', class: 'pendente' },
        'Pagamento pendente': { text: 'Pagamento pendente', class: 'pendente' },
        'Pago': { text: 'Pago', class: 'confirmado' },
        'Pagamento rejeitado': { text: 'Pagamento rejeitado', class: 'rejeitado' },
        'Hospedado': { text: 'Hospedado', class: 'hospedado' },
        'Concluído': { text: 'Hospedagem Encerrada', class: 'concluido' }
    };

    const status = statusMap[reserva.status] || { text: reserva.status || 'Pendente', class: 'pendente' };
    
    // Verificar se está no contexto admin (tem token)
    const isAdmin = localStorage.getItem('admin_token');
    const editButton = isAdmin ? `<button onclick="editReservaFromFicha(${reserva.id})" class="btn btn-edit-ficha">Editar</button>` : '';

    const html = `
        <div class="ficha-card">
            <h2 class="ficha-title">🧾 Ficha do Cliente</h2>
            
            <div class="ficha-section">
                <div class="ficha-info">
                    <div class="info-item">
                        <span class="info-label">Código:</span>
                        <span class="info-value"><strong>${reserva.codigo || 'N/A'}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Nome:</span>
                        <span class="info-value">${reserva.nome_completo || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${reserva.email || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Telefone:</span>
                        <span class="info-value">${reserva.telefone || 'Não informado'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Categoria:</span>
                        <span class="info-value">${reserva.categoria || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Número do Quarto:</span>
                        <span class="info-value">${reserva.quarto_numero || reserva.quarto_id || 'A definir'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Check-in:</span>
                        <span class="info-value">${formatDate(reserva.check_in)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Check-out:</span>
                        <span class="info-value">${formatDate(reserva.check_out)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Número de Hóspedes:</span>
                        <span class="info-value">${reserva.num_hospedes || 2}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Adicionais:</span>
                        <span class="info-value">${adicionais.length > 0 ? adicionais.map(a => adicionaisMap[a] || a).join(', ') : 'Nenhum'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Valor Total:</span>
                        <span class="info-value"><strong>R$ ${parseFloat(reserva.valor_total || 0).toFixed(2)}</strong></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </div>
                </div>
            </div>

            <div class="ficha-actions">
                ${editButton}
                <button onclick="gerarWhatsAppFicha('${reserva.codigo}')" class="btn btn-whatsapp" style="background: #25D366; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-right: 10px;">📱 Enviar por WhatsApp</button>
                <button onclick="window.print()" class="btn btn-primary">Imprimir</button>
                <a href="/" class="btn btn-secondary">Voltar</a>
            </div>
        </div>
    `;

    const contentDiv = document.getElementById('ficha-content');
    contentDiv.innerHTML = html;
    
}

// Função para editar reserva a partir da ficha (se estiver no admin)
async function editReservaFromFicha(id) {
    const authToken = localStorage.getItem('admin_token');
    if (!authToken) {
        if (confirm('Você precisa estar logado no painel administrativo para editar. Deseja ir para o login?')) {
            window.location.href = '/admin/login.html';
        }
        return;
    }

    // Redirecionar para o painel admin com a reserva selecionada para edição
    window.location.href = `/admin/dashboard.html?edit=${id}`;
}

// Função para gerar link WhatsApp a partir da ficha
async function gerarWhatsAppFicha(codigo) {
    try {
        const response = await fetch(`/api/whatsapp/${codigo}`);
        const data = await response.json();

        if (response.ok && data.link) {
            // Abrir WhatsApp em nova aba
            window.open(data.link, '_blank');
        } else {
            alert('Erro: ' + (data.error || 'Não foi possível gerar o link do WhatsApp. Verifique se a reserva tem telefone cadastrado.'));
        }
    } catch (error) {
        console.error('Erro ao gerar WhatsApp:', error);
        alert('Erro ao gerar link do WhatsApp');
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString; // Retorna a string original se não for uma data válida
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}






