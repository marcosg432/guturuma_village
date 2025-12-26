// Sistema completo de reserva
let reservaData = {
    categoria: '',
    check_in: '',
    check_out: '',
    num_hospedes: 2,
    hospedes_nomes: [],
    nome_completo: '',
    email: '',
    telefone: '',
    cupom: '',
    desconto: 0,
    valor_quarto: 0,
    valor_adicionais: 0,
    valor_total: 0
};

// Preços base por categoria (serão carregados do servidor)
let precos = {
    'Casa Sobrado 2 – Conforto e Espaço com 3 Quartos': 250,
    'Casa Sobrado 4 – Ampla, Completa e Ideal para Famílias': 250,
    'Casa Ampla e Confortável – 3 Quartos e 3 Banheiros': 250,
    'Casa Sobrado 6 – Ampla, Equipada e com 3 Quartos': 250,
    'Quarto Deluxe com Cama Queen-size': 350,
    'Suíte Orquídea Premium': 550,
    'Suíte Imperial Master': 950,
    'Suíte Deluxe com Cama Queen-size': 480,
    'Quarto Duplo': 150,
    'Suíte de 1 Quarto': 150
};

// Carregar preços atualizados do servidor
async function carregarPrecos() {
    try {
        const response = await fetch('/api/precos');
        if (response.ok) {
            const precosAtualizados = await response.json();
            precos = { ...precos, ...precosAtualizados };
        }
    } catch (error) {
        console.error('Erro ao carregar preços:', error);
    }
}

// Carregar preços ao iniciar
carregarPrecos();


// Função para salvar dados no localStorage
function saveReservaData() {
    try {
        localStorage.setItem('reservaData', JSON.stringify(reservaData));
        console.log('Dados salvos no localStorage:', reservaData);
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

// Função para carregar dados do localStorage
function loadReservaData() {
    try {
        const saved = localStorage.getItem('reservaData');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(reservaData, parsed);
            console.log('Dados carregados do localStorage:', reservaData);
            return true;
        }
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
    }
    return false;
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    // Carregar dados salvos do localStorage
    loadReservaData();
    
    // Verificar categoria na URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    if (categoria) {
        const radio = document.querySelector(`input[value="${categoria}"]`);
        if (radio) {
            radio.checked = true;
            reservaData.categoria = categoria;
            updateRoomSelection(categoria);
            saveReservaData();
        }
    }

    // Restaurar valores dos campos se existirem
    if (reservaData.categoria) {
        const radio = document.querySelector(`input[value="${reservaData.categoria}"]`);
        if (radio) {
            radio.checked = true;
            updateRoomSelection(reservaData.categoria);
        }
    }
    
    if (reservaData.check_in) {
        const checkInInput = document.getElementById('check-in');
        if (checkInInput) checkInInput.value = reservaData.check_in;
    }
    
    if (reservaData.check_out) {
        const checkOutInput = document.getElementById('check-out');
        if (checkOutInput) checkOutInput.value = reservaData.check_out;
    }
    
    if (reservaData.nome_completo) {
        const nomeInput = document.getElementById('nome-completo');
        if (nomeInput) nomeInput.value = reservaData.nome_completo;
    }
    
    if (reservaData.email) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = reservaData.email;
    }
    
    if (reservaData.telefone) {
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) telefoneInput.value = reservaData.telefone;
    }

    // Restaurar quantidade de hóspedes (padrão 2)
    const hospedesInput = document.getElementById('num-hospedes');
    if (hospedesInput) {
        if (!reservaData.num_hospedes || reservaData.num_hospedes < 1) {
            reservaData.num_hospedes = parseInt(hospedesInput.value || '2', 10);
        } else {
            hospedesInput.value = reservaData.num_hospedes;
        }
    }

    // Renderizar campos de nomes dos hóspedes com base na quantidade
    function renderGuestInputs() {
        const container = document.getElementById('guest-names-container');
        if (!container) return;

        container.innerHTML = '';

        const total = parseInt(reservaData.num_hospedes || 0, 10);
        if (!reservaData.hospedes_nomes || !Array.isArray(reservaData.hospedes_nomes)) {
            reservaData.hospedes_nomes = [];
        }

        for (let i = 0; i < total; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'guest-name-item';

            const input = document.createElement('input');
            input.type = 'text';
            input.required = true;
            input.id = `hospede-nome-${i + 1}`;
            input.name = 'hospedes[]';
            input.placeholder = `Nome do hóspede ${i + 1}`;
            input.value = reservaData.hospedes_nomes[i] || '';

            input.addEventListener('input', function () {
                reservaData.hospedes_nomes[i] = this.value;
                saveReservaData();
            });

            wrapper.appendChild(input);
            container.appendChild(wrapper);
        }
    }

    renderGuestInputs();

    // Data mínima (hoje)
    const today = new Date().toISOString().split('T')[0];
    const checkInInput = document.getElementById('check-in');
    if (checkInInput) {
        checkInInput.setAttribute('min', today);
    }
    const checkOutInput = document.getElementById('check-out');
    if (checkOutInput) {
        checkOutInput.setAttribute('min', today);
    }

    // Event listeners
    document.querySelectorAll('input[name="categoria"]').forEach(radio => {
        radio.addEventListener('change', function() {
            reservaData.categoria = this.value;
            updateRoomSelection(this.value);
            saveReservaData();
        });
    });

    if (checkInInput) {
        checkInInput.addEventListener('change', function() {
            reservaData.check_in = this.value;
            saveReservaData();
            const checkInDate = new Date(this.value);
            checkInDate.setDate(checkInDate.getDate() + 1);
            if (checkOutInput) {
                checkOutInput.setAttribute('min', checkInDate.toISOString().split('T')[0]);
            }
        });
    }
    
    if (checkOutInput) {
        checkOutInput.addEventListener('change', function() {
            reservaData.check_out = this.value;
            saveReservaData();
        });
    }

    // Atualizar número de hóspedes
    if (hospedesInput) {
        hospedesInput.addEventListener('change', function() {
            const valor = parseInt(this.value, 10);
            if (isNaN(valor) || valor < 1) {
                this.value = '1';
                reservaData.num_hospedes = 1;
            } else {
                reservaData.num_hospedes = valor;
            }
            saveReservaData();
            // Recriar campos de nomes dos hóspedes
            renderGuestInputs();
            // Recalcular sempre que o número de hóspedes mudar
            if (reservaData.check_in && reservaData.check_out && reservaData.categoria) {
                calculateTotal();
                updateResumo();
            }
        });
    }

    // Verificar se estamos no passo 4 e atualizar automaticamente
    const step4 = document.getElementById('step-4');
    if (step4 && step4.classList.contains('active')) {
        // Carregar dados do sessionStorage
        loadReservaData();
        // Garantir que todos os valores estão calculados
        setTimeout(() => {
            calculateTotal();
            updateResumo();
        }, 300);
    }
    
    // Observer para detectar quando o passo 4 é ativado
    if (step4) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const step4Element = document.getElementById('step-4');
                    if (step4Element && step4Element.classList.contains('active')) {
                        console.log('Passo 4 ativado, atualizando resumo...');
                        loadReservaData();
                        setTimeout(() => {
                            calculateTotal();
                            updateResumo();
                        }, 200);
                    }
                }
            });
        });
        
        observer.observe(step4, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Observer para detectar quando o passo 4 é ativado
    if (step4) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const step4Element = document.getElementById('step-4');
                    if (step4Element && step4Element.classList.contains('active')) {
                        console.log('Passo 4 ativado, atualizando resumo...');
                        loadReservaData();
                        setTimeout(() => {
                            calculateTotal();
                            updateResumo();
                        }, 200);
                    }
                }
            });
        });
        
        observer.observe(step4, { attributes: true, attributeFilter: ['class'] });
    }

    // Submit form
    const reservaForm = document.getElementById('reserva-form');
    if (reservaForm) {
        reservaForm.addEventListener('submit', handleSubmit);
    }

    // Fechar modal
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            document.getElementById('confirm-modal').style.display = 'none';
        });
    }

    window.addEventListener('click', function(event) {
        const modal = document.getElementById('confirm-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function updateRoomSelection(categoria) {
    document.querySelectorAll('.room-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selected = document.querySelector(`.room-option[data-categoria="${categoria}"]`);
    if (selected) {
        selected.classList.add('selected');
    }
}

function nextStep(step) {
    if (step === 2) {
        if (!reservaData.categoria) {
            alert('Por favor, selecione uma categoria de quarto');
            return false;
        }
    }
    
    // Validação do passo 3 (Dados Pessoais) antes de ir para passo 4
    if (step === 4) {
        const nomeCompleto = document.getElementById('nome-completo').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const numHospedes = parseInt(reservaData.num_hospedes || 0, 10);
        
        if (!nomeCompleto) {
            alert('Por favor, preencha o campo Nome Completo');
            document.getElementById('nome-completo').focus();
            return false;
        }
        
        if (!email) {
            alert('Por favor, preencha o campo E-mail');
            document.getElementById('email').focus();
            return false;
        }
        
        // Validação básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Por favor, insira um e-mail válido');
            document.getElementById('email').focus();
            return false;
        }
        
        if (!telefone) {
            alert('Por favor, preencha o campo Telefone');
            document.getElementById('telefone').focus();
            return false;
        }

        // Validar nomes de todos os hóspedes
        const container = document.getElementById('guest-names-container');
        const inputsHospedes = container ? container.querySelectorAll('input[name="hospedes[]"]') : [];
        const nomes = [];

        inputsHospedes.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                nomes.push(input.value.trim());
            }
        });

        if (!numHospedes || nomes.length !== numHospedes) {
            alert('Por favor, informe o nome de todos os hóspedes (adultos e crianças).');
            if (inputsHospedes.length) {
                (inputsHospedes[0] as HTMLInputElement).focus?.();
            }
            return false;
        }
        
        // Salvar dados
        reservaData.nome_completo = nomeCompleto;
        reservaData.email = email;
        reservaData.telefone = telefone;
        reservaData.hospedes_nomes = nomes;
        
        // Garantir que check_in e check_out estão salvos
        if (!reservaData.check_in) {
            const checkInInput = document.getElementById('check-in');
            if (checkInInput) reservaData.check_in = checkInInput.value;
        }
        if (!reservaData.check_out) {
            const checkOutInput = document.getElementById('check-out');
            if (checkOutInput) reservaData.check_out = checkOutInput.value;
        }
        
        // Salvar no sessionStorage
        saveReservaData();
    }

    // Trocar de passo ANTES de atualizar o resumo
    const activeStep = document.querySelector('.form-step.active');
    if (activeStep) {
        activeStep.classList.remove('active');
    }
    
    const nextStepElement = document.getElementById(`step-${step}`);
    if (!nextStepElement) {
        console.error(`Elemento step-${step} não encontrado`);
        alert('Erro: Passo não encontrado. Por favor, recarregue a página.');
        return false;
    }
    
    // Adicionar classe active ao próximo passo
    nextStepElement.classList.add('active');
    
    // Scroll suave para o topo do formulário
    const formElement = document.querySelector('.reserva-form');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Atualizar resumo quando entrar no passo 4 (após trocar de passo)
    if (step === 4) {
        // Garantir que todos os dados estão salvos
        saveReservaData();
        
        // Carregar dados do sessionStorage caso necessário
        loadReservaData();
        
        // Garantir que todos os valores estão calculados
        calculateTotal();
        
        // Pequeno delay para garantir que o DOM foi atualizado
        setTimeout(() => {
            updateResumo();
            // Forçar atualização novamente após mais um delay para garantir
            setTimeout(() => {
                calculateTotal();
                updateResumo();
            }, 300);
        }, 150);
    }
    
    return true;
}

function prevStep(step) {
    document.querySelector('.form-step.active').classList.remove('active');
    document.getElementById(`step-${step}`).classList.add('active');
}

async function checkAvailability() {
    const categoria = reservaData.categoria;
    const check_in = document.getElementById('check-in').value;
    const check_out = document.getElementById('check-out').value;

    if (!categoria || !check_in || !check_out) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    reservaData.check_in = check_in;
    reservaData.check_out = check_out;
    saveReservaData();

    const availabilityCheck = document.getElementById('availability-check');
    availabilityCheck.textContent = 'Verificando disponibilidade...';
    availabilityCheck.className = 'availability-check';
    availabilityCheck.style.display = 'block';

    try {
        // Primeiro verificar disponibilidade com a nova API
        const disponibilidadeResponse = await fetch(`/api/quartos/${encodeURIComponent(categoria)}/datas-livres?check_in=${check_in}&check_out=${check_out}`);
        
        if (disponibilidadeResponse.status === 400) {
            // Quarto não disponível - mostrar datas livres
            const errorData = await disponibilidadeResponse.json();
            let mensagem = '✗ Este quarto não está disponível para essas datas.';
            
            if (errorData.conflito) {
                const checkInFormatado = new Date(errorData.conflito.check_in + 'T00:00:00').toLocaleDateString('pt-BR');
                const checkOutFormatado = new Date(errorData.conflito.check_out + 'T00:00:00').toLocaleDateString('pt-BR');
                mensagem += `\n\nO quarto está reservado entre ${checkInFormatado} e ${checkOutFormatado}.`;
            }
            
            if (errorData.datas_livres && errorData.datas_livres.length > 0) {
                mensagem += '\n\nDatas disponíveis:';
                errorData.datas_livres.slice(0, 5).forEach(data => {
                    const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR');
                    mensagem += `\n• ${dataFormatada}`;
                });
                if (errorData.datas_livres.length > 5) {
                    mensagem += `\n... e mais ${errorData.datas_livres.length - 5} datas disponíveis.`;
                }
            }
            
            availabilityCheck.innerHTML = mensagem.replace(/\n/g, '<br>');
            availabilityCheck.classList.add('unavailable');
            availabilityCheck.classList.remove('available');
            return;
        }

        // Se chegou aqui, verificar com a API antiga para compatibilidade
        const response = await fetch(`/api/quartos/${encodeURIComponent(categoria)}?check_in=${check_in}&check_out=${check_out}`);
        
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }

        const quartos = await response.json();

        // Verificar se quartos é um array válido
        if (Array.isArray(quartos) && quartos.length > 0) {
            availabilityCheck.textContent = `✓ Quarto disponível para essas datas!`;
            availabilityCheck.classList.add('available');
            availabilityCheck.classList.remove('unavailable');
            reservaData.valor_quarto = precos[categoria];
            nextStep(3);
        } else {
            availabilityCheck.textContent = '✗ Não há quartos disponíveis para essas datas. Por favor, escolha outras datas.';
            availabilityCheck.classList.add('unavailable');
            availabilityCheck.classList.remove('available');
        }
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        availabilityCheck.textContent = 'Erro ao verificar disponibilidade. Tente novamente.';
        availabilityCheck.classList.add('unavailable');
        availabilityCheck.classList.remove('available');
    }
}


function aplicarCupom() {
    const cupomInput = document.getElementById('cupom');
    if (!cupomInput) return;
    
    const cupom = cupomInput.value.toUpperCase().trim();
    reservaData.cupom = cupom;
    saveReservaData();

    // Garantir que valor_quarto está calculado antes de aplicar desconto
    if (!reservaData.valor_quarto || reservaData.valor_quarto === 0) {
        calculateTotal();
    }

    if (cupom === 'BRISA10') {
        reservaData.desconto = reservaData.valor_quarto * 0.10;
        alert('Cupom BRISA10 aplicado! 10% de desconto.');
        calculateTotal();
        updateResumo();
    } else if (cupom === 'BRISA20') {
        reservaData.desconto = reservaData.valor_quarto * 0.20;
        alert('Cupom BRISA20 aplicado! 20% de desconto.');
        calculateTotal();
        updateResumo();
    } else if (cupom) {
        alert('Cupom inválido');
        reservaData.cupom = '';
        reservaData.desconto = 0;
        calculateTotal();
        updateResumo();
    } else {
        // Cupom vazio, remover desconto
        reservaData.cupom = '';
        reservaData.desconto = 0;
        calculateTotal();
        updateResumo();
    }
}

function calculateTotal() {
    // Validar dados necessários
    if (!reservaData.check_in || !reservaData.check_out || !reservaData.categoria) {
        console.warn('Dados incompletos para calcular total:', reservaData);
        return;
    }
    
    // Calcular noites
    const checkIn = new Date(reservaData.check_in);
    const checkOut = new Date(reservaData.check_out);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.error('Datas inválidas:', reservaData.check_in, reservaData.check_out);
        return;
    }
    
    const noites = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    if (noites <= 0) {
        console.error('Número de noites inválido:', noites);
        return;
    }
    
    // Garantir número de hóspedes
    let hospedes = parseInt(reservaData.num_hospedes, 10);
    if (isNaN(hospedes) || hospedes < 1) {
        hospedes = 1;
        reservaData.num_hospedes = 1;
    }

    // Valor por pessoa (base da suíte)
    const precoPorPessoa = precos[reservaData.categoria] || 0;
    if (precoPorPessoa === 0) {
        console.error('Preço base não encontrado para categoria:', reservaData.categoria);
        return;
    }
    
    // Fórmula: noites × quantidade de pessoas × valor por pessoa
    reservaData.valor_quarto = noites * hospedes * precoPorPessoa;

    // Valor dos adicionais (removido, mas mantendo compatibilidade)
    reservaData.valor_adicionais = 0;

    // Recalcular desconto baseado no cupom
    if (reservaData.cupom === 'BRISA10') {
        reservaData.desconto = reservaData.valor_quarto * 0.10;
    } else if (reservaData.cupom === 'BRISA20') {
        reservaData.desconto = reservaData.valor_quarto * 0.20;
    } else {
        reservaData.desconto = 0;
    }

    // Total
    reservaData.valor_total = reservaData.valor_quarto - reservaData.desconto;
    
    // Garantir que valores não sejam negativos
    if (reservaData.valor_total < 0) {
        reservaData.valor_total = 0;
    }
    
    // Salvar no localStorage
    saveReservaData();

    // Atualizar UI (manter compatibilidade)
    const subtotalEl = document.getElementById('subtotal');
    if (subtotalEl) {
        subtotalEl.textContent = `R$ ${reservaData.valor_quarto.toFixed(2)}`;
    }
    
    const totalFinalEl = document.getElementById('total-final');
    if (totalFinalEl) {
        totalFinalEl.textContent = `R$ ${reservaData.valor_total.toFixed(2)}`;
    }
    
    const descontoEl = document.getElementById('desconto');
    const descontoRowEl = document.getElementById('desconto-row');
    if (descontoEl && descontoRowEl) {
        if (reservaData.desconto > 0) {
            descontoEl.textContent = `- R$ ${reservaData.desconto.toFixed(2)}`;
            descontoRowEl.style.display = 'flex';
        } else {
            descontoRowEl.style.display = 'none';
        }
    }
    
    const descontoRow = document.getElementById('desconto-row');
    if (reservaData.desconto > 0) {
        document.getElementById('desconto').textContent = `- R$ ${reservaData.desconto.toFixed(2)}`;
        descontoRow.style.display = 'flex';
    } else {
        descontoRow.style.display = 'none';
    }

    document.getElementById('total-final').textContent = `R$ ${reservaData.valor_total.toFixed(2)}`;
}

function updateResumo() {
    // Validar que temos os dados necessários
    if (!reservaData.check_in || !reservaData.check_out || !reservaData.categoria) {
        console.warn('Dados incompletos para atualizar resumo, tentando carregar do localStorage:', reservaData);
        loadReservaData();
        if (!reservaData.check_in || !reservaData.check_out || !reservaData.categoria) {
            console.error('Ainda faltam dados após carregar do sessionStorage');
            return;
        }
    }
    
    const checkIn = new Date(reservaData.check_in);
    const checkOut = new Date(reservaData.check_out);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.error('Datas inválidas:', reservaData.check_in, reservaData.check_out);
        return;
    }
    
    const noites = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    if (noites <= 0) {
        console.error('Número de noites inválido:', noites);
        return;
    }

    // Calcular total antes de mostrar
    calculateTotal();
    
    // Garantir que valores foram calculados
    if (!reservaData.valor_quarto || reservaData.valor_quarto === 0) {
        console.warn('Valor do quarto não calculado, recalculando...');
        calculateTotal();
    }

    // Dados das suítes
    const suiteData = {
        'Casa Sobrado 2 – Conforto e Espaço com 3 Quartos': {
            image: 'images/casa-sobrado-2/casa-sobrado-2-1.png',
            maxOccupancy: 'Até 8 pessoas',
            area: '100 m²',
            view: 'Condomínio',
            description: 'Acomode-se nesta casa de temporada com 100 m², ar-condicionado e varanda. Possui 3 quartos separados, sala de estar, cozinha completa com geladeira e forno, além de 4 banheiros.'
        },
        'Casa Sobrado 4 – Ampla, Completa e Ideal para Famílias': {
            image: 'images/casa-sobrado-4/casa-sobrado-4-1.png',
            maxOccupancy: 'Até 8 pessoas',
            area: '100 m²',
            view: 'Condomínio',
            description: 'Casa ampla com 100 m², ar-condicionado, cozinha equipada e 3 quartos separados. Conta com sala de estar, 4 banheiros e todos os utensílios básicos para uma estadia tranquila.'
        },
        'Casa Ampla e Confortável – 3 Quartos e 3 Banheiros': {
            image: 'images/casa-ampla-confortavel/casa-ampla-confortavel-1.png',
            maxOccupancy: 'Até 10 pessoas',
            area: '100 m²',
            view: 'Condomínio',
            description: 'Casa completa com 100 m², ar-condicionado, 3 quartos separados, sala de estar, cozinha completa com geladeira e fogão, além de 3 banheiros. Acomoda famílias grandes com conforto.'
        },
        'Casa Sobrado 6 – Ampla, Equipada e com 3 Quartos': {
            image: 'images/casa-sobrado-6/casa-sobrado-6-1.png',
            maxOccupancy: 'Até 8 pessoas',
            area: '100 m²',
            view: 'Condomínio',
            description: 'Casa completa com 100 m², ar-condicionado em todos ambientes, sala de estar, cozinha completa com geladeira e micro-ondas, além de 4 banheiros. Ideal para grupos e famílias.'
        },
        'Quarto Deluxe com Cama Queen-size': {
            image: 'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-1.png',
            maxOccupancy: 'Até 3 pessoas',
            area: '35 m²',
            view: 'Vista para o jardim',
            description: 'Conforto e elegância em um ambiente acolhedor, perfeita para sua estadia. Ideal para casais ou pequenas famílias.'
        },
        'Quarto Deluxe Premium Vista': {
            image: 'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-1.png',
            maxOccupancy: 'Até 3 pessoas',
            area: '45 m²',
            view: 'Vista privilegiada',
            description: 'Vista privilegiada da região com todas as comodidades para uma estadia inesquecível.'
        },
        'Suíte Orquídea Premium': {
            image: 'images/suite-2/suite-2-1.png',
            maxOccupancy: 'Até 6 pessoas',
            area: '45 m²',
            view: 'Vista para o condomínio',
            description: 'Luxo e funcionalidade combinados, com vista privilegiada e comodidades exclusivas. Perfeita para famílias.'
        },
        'Suíte Imperial Master': {
            image: 'images/suite-3/suite-3-1.png',
            maxOccupancy: 'Até 9 pessoas',
            area: '80 m²',
            view: 'Vista panorâmica',
            description: 'O ápice do luxo, com todas as comodidades de um ambiente exclusivo e completo. Experiência única e inesquecível.'
        },
        'Suíte Deluxe com Cama Queen-size': {
            image: 'images/suite-deluxe/suite-deluxe-1.png',
            maxOccupancy: 'Até 3 pessoas',
            area: '48 m²',
            view: 'Vista para o jardim',
            description: 'Elegância e sofisticação em um ambiente espaçoso com acabamentos de primeira linha.'
        },
        'Quarto Duplo': {
            image: 'images/quarto-duplo/quarto-duplo-1.png',
            maxOccupancy: 'Até 2 pessoas',
            area: '25 m²',
            view: 'Vista para o condomínio',
            description: '25 m² • WiFi Gratuito • Banheiro privativo. Tamanho 25 m². 1 cama de casal. Camas confortáveis, nota 7.4 – Com base em 10 avaliações. Esta suíte possui banheiro privativo e área para refeições. A unidade possui 1 cama.'
        },
        'Suíte de 1 Quarto': {
            image: 'images/suite-romantica/suite-romantica-1.png',
            maxOccupancy: 'Até 2 pessoas',
            area: '25 m²',
            view: 'Vista para o jardim',
            description: '25 m² • WiFi Gratuito • Banheiro privativo. Tamanho 25 m². 1 cama de casal. Camas confortáveis, nota 7.4 – Com base em 10 avaliações. Esta suíte possui banheiro privativo e área para refeições. A unidade oferece 1 cama.'
        }
    };

    const suite = suiteData[reservaData.categoria] || suiteData['Quarto Deluxe com Cama Queen-size'];
    const precoBase = precos[reservaData.categoria] || 0;
    const precoPorNoite = precoBase;
    const hospedes = parseInt(reservaData.num_hospedes || 1, 10);

    // Atualizar resumo do topo
    if (document.getElementById('suite-img-summary')) {
        document.getElementById('suite-img-summary').src = suite.image;
        document.getElementById('suite-name-summary').textContent = reservaData.categoria;
        document.getElementById('suite-category-summary').textContent = 'Village Residences';
        document.getElementById('checkin-summary').textContent = formatDate(reservaData.check_in);
        document.getElementById('checkout-summary').textContent = formatDate(reservaData.check_out);
        document.getElementById('nights-summary').textContent = `${noites} ${noites === 1 ? 'noite' : 'noites'}`;
        const guestsSummary = document.getElementById('guests-summary');
        if (guestsSummary) {
            guestsSummary.textContent = hospedes;
        }
    }

    // Atualizar detalhes da tarifa
    if (document.getElementById('price-per-night')) {
        document.getElementById('price-per-night').textContent = `R$ ${precoPorNoite.toFixed(2)}`;
        document.getElementById('nights-count').textContent = noites;
        document.getElementById('subtotal-detail').textContent = `R$ ${reservaData.valor_quarto.toFixed(2)}`;
    }

    // Atualizar carrinho
    if (document.getElementById('cart-dates')) {
        const checkInFormatted = formatDate(reservaData.check_in);
        const checkOutFormatted = formatDate(reservaData.check_out);
        document.getElementById('cart-dates').textContent = `${checkInFormatted} → ${checkOutFormatted} (${noites} ${noites === 1 ? 'noite' : 'noites'})`;
        document.getElementById('cart-subtotal').textContent = `R$ ${reservaData.valor_quarto.toFixed(2)}`;
        
        const descontoRow = document.getElementById('cart-discount-row');
        if (reservaData.desconto > 0) {
            document.getElementById('cart-discount').textContent = `- R$ ${reservaData.desconto.toFixed(2)}`;
            descontoRow.style.display = 'flex';
        } else {
            descontoRow.style.display = 'none';
        }
        
        document.getElementById('cart-total').textContent = `R$ ${reservaData.valor_total.toFixed(2)}`;
    }

    // Atualizar elementos extras solicitados
    const mostrarCheckin = document.getElementById('mostrarCheckin');
    const mostrarCheckout = document.getElementById('mostrarCheckout');
    const mostrarPessoas = document.getElementById('mostrarPessoas');
    const mostrarNoites = document.getElementById('mostrarNoites');
    const mostrarTotal = document.getElementById('mostrarTotal');

    if (mostrarCheckin) mostrarCheckin.textContent = formatDate(reservaData.check_in);
    if (mostrarCheckout) mostrarCheckout.textContent = formatDate(reservaData.check_out);
    if (mostrarPessoas) mostrarPessoas.textContent = hospedes;
    if (mostrarNoites) mostrarNoites.textContent = noites;
    if (mostrarTotal) mostrarTotal.textContent = `R$ ${reservaData.valor_total.toFixed(2)}`;

    // Atualizar bloco de hóspedes e responsável
    const responsavelSummary = document.getElementById('responsavel-summary');
    const emailSummary = document.getElementById('email-summary');
    const phoneSummary = document.getElementById('phone-summary');
    const guestsNamesSummary = document.getElementById('guests-names-summary');

    if (responsavelSummary) responsavelSummary.textContent = reservaData.nome_completo || '-';
    if (emailSummary) emailSummary.textContent = reservaData.email || '-';
    if (phoneSummary) phoneSummary.textContent = reservaData.telefone || '-';

    if (guestsNamesSummary) {
        if (Array.isArray(reservaData.hospedes_nomes) && reservaData.hospedes_nomes.length > 0) {
            guestsNamesSummary.textContent = reservaData.hospedes_nomes.join(', ');
        } else {
            guestsNamesSummary.textContent = '-';
        }
    }

    // Manter compatibilidade com o antigo resumo (se ainda existir)
    const oldResumo = document.getElementById('resumo-content');
    if (oldResumo) {
        oldResumo.innerHTML = `
            <div class="resumo-item">
                <span class="resumo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <div class="resumo-text">
                    <span class="resumo-label">Categoria</span>
                    <span class="resumo-value">${reservaData.categoria}</span>
                </div>
            </div>
            <div class="resumo-divider"></div>
            <div class="resumo-item">
                <span class="resumo-icon">📅</span>
                <div class="resumo-text">
                    <span class="resumo-label">Check-in</span>
                    <span class="resumo-value">${formatDate(reservaData.check_in)}</span>
                </div>
            </div>
            <div class="resumo-divider"></div>
            <div class="resumo-item">
                <span class="resumo-icon">📅</span>
                <div class="resumo-text">
                    <span class="resumo-label">Check-out</span>
                    <span class="resumo-value">${formatDate(reservaData.check_out)}</span>
                </div>
            </div>
            <div class="resumo-divider"></div>
            <div class="resumo-item">
                <span class="resumo-icon">🌙</span>
                <div class="resumo-text">
                    <span class="resumo-label">Noites</span>
                    <span class="resumo-value">${noites} ${noites === 1 ? 'noite' : 'noites'}</span>
                </div>
            </div>
            <div class="resumo-total">
                <div class="resumo-total-label">Total da Reserva</div>
                <div class="resumo-total-value">R$ ${reservaData.valor_total.toFixed(2)}</div>
            </div>
        `;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

async function handleSubmit(e) {
    e.preventDefault();

    // Validar que todos os dados necessários estão presentes
    if (!reservaData.nome_completo || !reservaData.email || !reservaData.telefone) {
        const nomeCompleto = document.getElementById('nome-completo')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const telefone = document.getElementById('telefone')?.value.trim();
        
        if (!nomeCompleto || !email || !telefone) {
            alert('Por favor, preencha todos os dados pessoais');
            return;
        }
        
        reservaData.nome_completo = nomeCompleto;
        reservaData.email = email;
        reservaData.telefone = telefone;
    }
    
    // Validar categoria
    if (!reservaData.categoria) {
        alert('Por favor, selecione uma categoria de suíte');
        return;
    }
    
    // Validar datas
    if (!reservaData.check_in || !reservaData.check_out) {
        alert('Por favor, selecione as datas de check-in e check-out');
        return;
    }

    // Recalcular total antes de enviar
    calculateTotal();
    
    // Validar valores calculados
    if (!reservaData.valor_quarto || reservaData.valor_quarto <= 0) {
        alert('Erro ao calcular valor da reserva. Por favor, verifique os dados e tente novamente.');
        console.error('Valor do quarto inválido:', reservaData);
        return;
    }
    
    if (isNaN(reservaData.valor_total) || reservaData.valor_total <= 0) {
        alert('Erro ao calcular valor total. Por favor, verifique os dados e tente novamente.');
        console.error('Valor total inválido:', reservaData);
        return;
    }

    // Preparar dados para envio (com todos os campos necessários)
    const dados = {
        nome_completo: reservaData.nome_completo.trim(),
        email: reservaData.email.trim(),
        telefone: reservaData.telefone.trim(),
        categoria: reservaData.categoria,
        check_in: reservaData.check_in,
        check_out: reservaData.check_out,
        num_hospedes: parseInt(reservaData.num_hospedes || 1, 10),
        metodo_pagamento: 'Mercado Pago',
        cupom: reservaData.cupom || '',
        valor_quarto: reservaData.valor_quarto,
        valor_adicionais: reservaData.valor_adicionais || 0,
        desconto: reservaData.desconto || 0,
        valor_total: reservaData.valor_total
    };
    
    // Validar que nenhum campo obrigatório está vazio
    const camposObrigatorios = ['nome_completo', 'email', 'telefone', 'categoria', 'check_in', 'check_out'];
    for (const campo of camposObrigatorios) {
        if (!dados[campo] || dados[campo].toString().trim() === '') {
            alert(`Erro: Campo obrigatório não preenchido: ${campo}`);
            console.error('Dados incompletos:', dados);
            return;
        }
    }
    
    console.log('Enviando dados da reserva:', dados);

    try {
        const response = await fetch('/api/reserva', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showConfirmation(result);
        } else {
            alert(result.error || 'Erro ao processar reserva. Tente novamente.');
        }
    } catch (error) {
        alert('Erro ao processar reserva. Tente novamente.');
        console.error(error);
    }
}

function showConfirmation(result) {
    const confirmContent = `
        <h2 style="color: var(--azul-turquesa-escuro); margin-bottom: 1rem;">✓ Reserva Confirmada!</h2>
        <p><strong>Código da Reserva:</strong> ${result.codigo}</p>
        <p>Um e-mail de confirmação foi enviado para ${reservaData.email}</p>
        <p>Valor Total: R$ ${result.valor_total.toFixed(2)}</p>
        <div style="margin-top: 2rem;">
            <a href="/ficha/${result.codigo}" class="btn btn-primary" style="display: inline-block; text-decoration: none; margin-right: 1rem;">Ver Ficha</a>
            <button onclick="window.location.href='/'" class="btn btn-secondary">Voltar ao Início</button>
        </div>
    `;

    document.getElementById('confirm-content').innerHTML = confirmContent;
    document.getElementById('confirm-modal').style.display = 'block';
}





