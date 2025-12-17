// Sistema de Reserva Nova

// Dados da reserva
let reservaData = {
    checkIn: null,
    checkOut: null,
    adultos: 2,
    criancas: 0,
    suiteSelecionada: null,
    totalNoites: 0,
    valorTotal: 0,
    nomeCompleto: '',
    telefone: '',
    email: '',
    hospedesExtras: 0,
    valorHospedesExtras: 0
};

// Dados das suítes
const suites = [
    {
        id: 'casa-1',
        nome: 'Casa Sobrado 2 – Conforto e Espaço com 3 Quartos',
        preco: 250,
        capacidadeAdultos: 8,
        capacidadeCriancas: 4,
        area: '100 m²',
        vista: 'Condomínio',
        descricao: 'Acomode-se nesta casa de temporada com 100 m², ar-condicionado e varanda. Possui 3 quartos separados, sala de estar, cozinha completa com geladeira e forno, além de 4 banheiros. Toalhas e roupa de cama fornecidas. Ótima opção para famílias que precisam de conforto e praticidade.',
        comodidades: ['100 m²', '3 quartos', '4 banheiros', 'Ar-condicionado', 'Cozinha completa', 'Sala de estar', 'Wi-Fi gratuito', 'TV de tela plana', 'Utensílios de cozinha', 'Aceita pets', 'Estacionamento gratuito'],
        imagens: [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'casa-2',
        nome: 'Casa Sobrado 4 – Ampla, Completa e Ideal para Famílias',
        preco: 250,
        capacidadeAdultos: 8,
        capacidadeCriancas: 4,
        area: '100 m²',
        vista: 'Condomínio',
        descricao: 'Casa ampla com 100 m², ar-condicionado, cozinha equipada e 3 quartos separados. Conta com sala de estar, 4 banheiros e todos os utensílios básicos para uma estadia tranquila. Inclui roupas de cama e toalhas. Estacionamento no local e Wi-Fi gratuito.',
        comodidades: ['100 m²', '3 quartos', '4 banheiros', 'Cozinha equipada', 'Sala de estar', 'Ar-condicionado', 'TV', 'Wi-Fi gratuito', 'Estacionamento gratuito'],
        imagens: [
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'casa-3',
        nome: 'Casa Ampla e Confortável – 3 Quartos e 5 Banheiros',
        preco: 250,
        capacidadeAdultos: 10,
        capacidadeCriancas: 5,
        area: '100 m²',
        vista: 'Condomínio',
        descricao: 'Casa completa com 100 m², ar-condicionado, 3 quartos separados, sala de estar, cozinha completa com geladeira e fogão, além de 5 banheiros. Acomoda famílias grandes com conforto. Roupas de cama e toalhas fornecidas.',
        comodidades: ['100 m²', '3 quartos', '5 banheiros', 'Ar-condicionado', 'Cozinha completa', 'Sala de estar', 'Wi-Fi gratuito', 'TV', 'Estacionamento gratuito', 'Recepção 24h'],
        imagens: [
            'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'casa-4',
        nome: 'Casa Sobrado 6 – Ampla, Equipada e com 3 Quartos',
        preco: 250,
        capacidadeAdultos: 8,
        capacidadeCriancas: 4,
        area: '100 m²',
        vista: 'Condomínio',
        descricao: 'Casa completa com 100 m², ar-condicionado em todos ambientes, sala de estar, cozinha completa com geladeira e micro-ondas, além de 4 banheiros. Ideal para grupos e famílias que buscam conforto e privacidade. Inclui toalhas e roupa de cama.',
        comodidades: ['100 m²', '3 quartos', '4 banheiros', 'Ar-condicionado individual', 'Cozinha completa', 'Wi-Fi gratuito', 'TV', 'Estacionamento gratuito', 'Utensílios de cozinha'],
        imagens: [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'harmonia',
        nome: 'Quarto Deluxe com Cama Queen-size',
        preco: 150,
        capacidadeAdultos: 2,
        capacidadeCriancas: 1,
        area: '35 m²',
        vista: 'Vista para o jardim',
        descricao: 'Conforto e elegância em um ambiente acolhedor, perfeita para sua estadia. Ideal para casais ou pequenas famílias.',
        comodidades: ['Wi-Fi', 'TV', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo'],
        imagens: [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'orquidea',
        nome: 'Suíte Orquídea Premium',
        preco: 150,
        capacidadeAdultos: 4,
        capacidadeCriancas: 2,
        area: '45 m²',
        vista: 'Vista para a piscina',
        descricao: 'Luxo e funcionalidade combinados, com vista privilegiada e comodidades exclusivas. Perfeita para famílias.',
        comodidades: ['Wi-Fi', 'TV 55"', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Varanda'],
        imagens: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'imperial',
        nome: 'Suíte Imperial Master',
        preco: 150,
        capacidadeAdultos: 6,
        capacidadeCriancas: 3,
        area: '80 m²',
        vista: 'Vista para o mar',
        descricao: 'O ápice do luxo, com vista panorâmica e todas as comodidades de um resort de primeira linha. Experiência única e inesquecível.',
        comodidades: ['Wi-Fi', 'TV 65"', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Varanda', 'Hidromassagem', 'Minibar'],
        imagens: [
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'premium-vista',
        nome: 'Quarto Deluxe com Cama Queen-size',
        preco: 150,
        capacidadeAdultos: 2,
        capacidadeCriancas: 1,
        area: '45 m²',
        vista: 'Vista para o mar',
        descricao: 'Vista privilegiada para o mar com todas as comodidades para uma estadia inesquecível.',
        comodidades: ['Wi-Fi', 'TV', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Varanda'],
        imagens: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'deluxe',
        nome: 'Suíte Deluxe com Cama Queen-size',
        preco: 150,
        capacidadeAdultos: 2,
        capacidadeCriancas: 1,
        area: '48 m²',
        vista: 'Vista para o jardim',
        descricao: 'Elegância e sofisticação em um ambiente espaçoso com acabamentos de primeira linha.',
        comodidades: ['Wi-Fi', 'TV', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Varanda'],
        imagens: [
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'executiva',
        nome: 'Suíte Executiva',
        preco: 150,
        capacidadeAdultos: 2,
        capacidadeCriancas: 1,
        area: '42 m²',
        vista: 'Vista para a piscina',
        descricao: 'Perfeita para viagens de negócios, com espaço de trabalho e todas as comodidades necessárias.',
        comodidades: ['Wi-Fi', 'TV', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Mesa de trabalho'],
        imagens: [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'familia',
        nome: 'Suíte Família',
        preco: 150,
        capacidadeAdultos: 4,
        capacidadeCriancas: 2,
        area: '65 m²',
        vista: 'Vista para o mar',
        descricao: 'Espaço amplo e confortável ideal para famílias, com múltiplos ambientes e comodidades especiais.',
        comodidades: ['Wi-Fi', 'TV', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Varanda', 'Cama extra'],
        imagens: [
            'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop'
        ]
    },
    {
        id: 'romantica',
        nome: 'Suíte Romântica',
        preco: 150,
        capacidadeAdultos: 2,
        capacidadeCriancas: 1,
        area: '40 m²',
        vista: 'Vista para o jardim',
        descricao: 'Ambiente especial para casais, com decoração elegante e atmosfera acolhedora para momentos únicos.',
        comodidades: ['Wi-Fi', 'TV', 'Ar-condicionado', 'Frigobar', 'Banheiro privativo', 'Varanda', 'Decoração especial'],
        imagens: [
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop'
        ]
    }
];

// Calendário
let mesAtual = new Date();
let calendarioVisivel = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    
    inicializarCalendario();
    inicializarHospedes();
    inicializarInformacoesHospede();
    inicializarBotaoCarrinho();
    verificarBotaoCarrinho();
    atualizarSuites();
    
    // Event delegation para botões "Escolher" (caso sejam recriados)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-escolher')) {
            const suiteId = e.target.getAttribute('data-suite-id');
            if (suiteId) {
                const suite = suites.find(s => s.id === suiteId);
                if (suite) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('Botão Escolher clicado (delegation) para suíte:', suiteId);
                    
                    // Verificar se a suíte já está selecionada (desselecionar)
                    if (reservaData.suiteSelecionada === suiteId) {
                        // Desselecionar
                        reservaData.suiteSelecionada = null;
                        console.log('Suíte desselecionada');
                        
                        // Resetar visual do botão
                        e.target.textContent = 'Escolher';
                        e.target.style.backgroundColor = '';
                        e.target.style.cursor = '';
                        
                        const card = e.target.closest('.suite-card');
                        if (card) {
                            card.classList.remove('selecionado');
                        }
                        
                        // Atualizar visibilidade do botão de hóspedes extras
                        atualizarVisibilidadeHospedesExtras();
                        calcularValorTotal();
                        verificarBotaoCarrinho();
                        atualizarResumo();
                        return;
                    }
                    
                    // Selecionar suíte
                    reservaData.suiteSelecionada = suiteId;
                    console.log('Suíte selecionada:', reservaData.suiteSelecionada);
                    
                    // Ajustar número de adultos se exceder o limite da suíte
                    if (reservaData.adultos > suite.capacidadeAdultos) {
                        reservaData.adultos = suite.capacidadeAdultos;
                        atualizarHospedes();
                    }
                    
                    // Atualizar visibilidade do botão de hóspedes extras
                    atualizarVisibilidadeHospedesExtras();
                    
                    calcularValorTotal();
                    
                    try {
                        validarCapacidade();
                    } catch (error) {
                        console.log('Erro ao validar capacidade:', error);
                    }
                    
                    if (reservaData.nomeCompleto) {
                        validarCampo('nome', reservaData.nomeCompleto);
                    }
                    if (reservaData.telefone) {
                        validarCampo('telefone', reservaData.telefone);
                    }
                    if (reservaData.email) {
                        validarCampo('email', reservaData.email);
                    }
                    
                    verificarBotaoCarrinho();
                    atualizarResumo();
                    
                    // Destacar card selecionado
                    document.querySelectorAll('.suite-card').forEach(c => {
                        c.classList.remove('selecionado');
                        const btn = c.querySelector('.btn-escolher');
                        if (btn && btn !== e.target) {
                            btn.textContent = 'Escolher';
                            btn.style.backgroundColor = '';
                            btn.style.cursor = '';
                        }
                    });
                    
                    const card = e.target.closest('.suite-card');
                    if (card) {
                        card.classList.add('selecionado');
                    }
                    
                    // Feedback visual
                    e.target.textContent = '✓ Selecionado';
                    e.target.style.backgroundColor = '#0F1F4B';
                    e.target.style.cursor = 'pointer'; // Permite clicar novamente para desselecionar
                    
                    console.log('Suíte selecionada com sucesso (delegation)!');
                }
            }
        }
    });
    
    // Pré-selecionar quarto se vier da página de suite
    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    if (categoria) {
        // Mapear categorias da página suite para IDs das suítes
        const categoriaMap = {
            'Suíte Standard': 'harmonia',
            'Suíte Harmonia': 'harmonia',
            'Suíte Premium': 'orquidea',
            'Suíte Orquídea Premium': 'orquidea',
            'Suíte Master Lux': 'imperial',
            'Suíte Imperial Master': 'imperial'
        };
        
        const suiteId = categoriaMap[categoria] || categoria.toLowerCase();
        const suite = suites.find(s => s.id === suiteId || s.nome === categoria);
        
        if (suite) {
            // Aguardar um pouco para garantir que as suítes foram renderizadas
            setTimeout(() => {
                // Procurar o botão "Escolher" da suíte e clicar nele
                const btnEscolher = document.querySelector(`.btn-escolher[data-suite-id="${suite.id}"]`);
                if (btnEscolher) {
                    btnEscolher.click();
                } else {
                    // Se o botão ainda não existe, tentar novamente após atualizar suítes
                    atualizarSuites();
                    setTimeout(() => {
                        const btnEscolher2 = document.querySelector(`.btn-escolher[data-suite-id="${suite.id}"]`);
                        if (btnEscolher2) {
                            btnEscolher2.click();
                        }
                    }, 500);
                }
            }, 1000);
        }
    }
});

// Calendário
function inicializarCalendario() {
    const checkinField = document.getElementById('checkin-field');
    const checkoutField = document.getElementById('checkout-field');
    const calendarioContainer = document.getElementById('calendario-container');
    
    if (!checkinField || !checkoutField || !calendarioContainer) {
        console.error('Elementos do calendário não encontrados');
        return;
    }
    
    // Garantir que o calendário esteja escondido inicialmente
    calendarioContainer.style.display = 'none';
    calendarioVisivel = false;
    
    // Abrir calendário ao clicar nos campos
    checkinField.addEventListener('click', function(e) {
        e.stopPropagation();
        calendarioVisivel = true;
        calendarioContainer.style.display = 'block';
    });
    
    checkoutField.addEventListener('click', function(e) {
        e.stopPropagation();
        calendarioVisivel = true;
        calendarioContainer.style.display = 'block';
    });
    
    // Botões de navegação do calendário
    const btnMesAnterior = document.getElementById('btn-mes-anterior');
    const btnMesProximo = document.getElementById('btn-mes-proximo');
    
    if (btnMesAnterior) {
        btnMesAnterior.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mesAtual.setMonth(mesAtual.getMonth() - 1);
            renderizarCalendario();
        });
    }
    
    if (btnMesProximo) {
        btnMesProximo.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mesAtual.setMonth(mesAtual.getMonth() + 1);
            renderizarCalendario();
        });
    }
    
    // Fechar calendário ao clicar fora
    document.addEventListener('click', function(e) {
        if (calendarioVisivel && 
            calendarioContainer &&
            !calendarioContainer.contains(e.target) && 
            e.target !== checkinField && 
            e.target !== checkoutField) {
            calendarioVisivel = false;
            calendarioContainer.style.display = 'none';
        }
    });
    
    renderizarCalendario();
}

function renderizarCalendario() {
    const mes1 = new Date(mesAtual);
    const mes2 = new Date(mesAtual);
    mes2.setMonth(mes2.getMonth() + 1);
    
    document.getElementById('mes1-titulo').textContent = formatarMes(mes1);
    document.getElementById('mes2-titulo').textContent = formatarMes(mes2);
    
    renderizarMes('calendario-mes1', mes1);
    renderizarMes('calendario-mes2', mes2);
}

function renderizarMes(containerId, mes) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    // Dias da semana
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    diasSemana.forEach(dia => {
        const div = document.createElement('div');
        div.className = 'dia-semana';
        div.textContent = dia;
        container.appendChild(div);
    });
    
    // Primeiro dia do mês
    const primeiroDia = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const diaInicio = primeiroDia.getDay();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Espaços vazios antes do primeiro dia
    for (let i = 0; i < diaInicio; i++) {
        const div = document.createElement('div');
        container.appendChild(div);
    }
    
    // Dias do mês
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const data = new Date(mes.getFullYear(), mes.getMonth(), dia);
        const div = document.createElement('div');
        div.className = 'dia-calendario';
        div.textContent = dia;
        
        // Verificar se é hoje
        if (data.getTime() === hoje.getTime()) {
            div.classList.add('dia-hoje');
        }
        
        // Verificar se é passado
        if (data < hoje) {
            div.classList.add('dia-desabilitado');
        } else {
            div.addEventListener('click', () => selecionarData(data));
        }
        
        // Verificar se está selecionado (normalizar datas para comparação)
        if (reservaData.checkIn) {
            const checkInNormalizado = new Date(reservaData.checkIn);
            checkInNormalizado.setHours(0, 0, 0, 0);
            if (data.getTime() === checkInNormalizado.getTime()) {
                div.classList.add('dia-selecionado');
            }
        }
        
        if (reservaData.checkOut) {
            const checkOutNormalizado = new Date(reservaData.checkOut);
            checkOutNormalizado.setHours(0, 0, 0, 0);
            if (data.getTime() === checkOutNormalizado.getTime()) {
                div.classList.add('dia-selecionado');
            }
        }
        
        // Verificar se está na faixa entre check-in e check-out
        if (reservaData.checkIn && reservaData.checkOut) {
            const checkInNormalizado = new Date(reservaData.checkIn);
            checkInNormalizado.setHours(0, 0, 0, 0);
            const checkOutNormalizado = new Date(reservaData.checkOut);
            checkOutNormalizado.setHours(0, 0, 0, 0);
            
            if (data > checkInNormalizado && data < checkOutNormalizado) {
                div.classList.add('dia-faixa');
            }
        }
        
        container.appendChild(div);
    }
}

function selecionarData(data) {
    // Normalizar data (zerar horas)
    const dataNormalizada = new Date(data);
    dataNormalizada.setHours(0, 0, 0, 0);
    
    if (!reservaData.checkIn || (reservaData.checkIn && reservaData.checkOut)) {
        // Nova seleção: definir check-in
        reservaData.checkIn = new Date(dataNormalizada);
        reservaData.checkOut = null;
        const checkinField = document.getElementById('checkin-field');
        const checkoutField = document.getElementById('checkout-field');
        if (checkinField) checkinField.value = formatarData(dataNormalizada);
        if (checkoutField) checkoutField.value = '';
    } else if (reservaData.checkIn && !reservaData.checkOut) {
        // Normalizar check-in para comparação
        const checkInNormalizado = new Date(reservaData.checkIn);
        checkInNormalizado.setHours(0, 0, 0, 0);
        
        // Selecionar check-out
        if (dataNormalizada.getTime() <= checkInNormalizado.getTime()) {
            alert('A data de check-out deve ser posterior à data de check-in');
            return;
        }
        reservaData.checkOut = new Date(dataNormalizada);
        const checkoutField = document.getElementById('checkout-field');
        if (checkoutField) checkoutField.value = formatarData(dataNormalizada);
        calcularNoites();
        calcularValorTotal();
        atualizarSuites();
        atualizarResumo();
        
        // Fechar calendário após selecionar check-out
        const calendarioContainer = document.getElementById('calendario-container');
        if (calendarioContainer) {
            calendarioVisivel = false;
            calendarioContainer.style.display = 'none';
        }
    }
    
    renderizarCalendario();
    verificarBotaoCarrinho();
}

function calcularNoites() {
    if (reservaData.checkIn && reservaData.checkOut) {
        const diff = reservaData.checkOut.getTime() - reservaData.checkIn.getTime();
        reservaData.totalNoites = Math.ceil(diff / (1000 * 60 * 60 * 24));
    } else {
        reservaData.totalNoites = 0;
    }
}

function formatarData(data) {
    return data.toLocaleDateString('pt-BR');
}

function formatarMes(data) {
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// Hóspedes
function inicializarHospedes() {
    const btnAdultosMais = document.getElementById('btn-adultos-mais');
    const btnAdultosMenos = document.getElementById('btn-adultos-menos');
    
    if (!btnAdultosMais || !btnAdultosMenos) {
        console.error('Botões de hóspedes não encontrados');
        return;
    }
    
    // Adicionar event listeners
    btnAdultosMais.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Verificar limite máximo se houver suíte selecionada
        if (reservaData.suiteSelecionada) {
            const suite = suites.find(s => s.id === reservaData.suiteSelecionada);
            if (suite) {
                // Só incrementa se não ultrapassar o limite
                if (reservaData.adultos < suite.capacidadeAdultos) {
                    reservaData.adultos++;
                    atualizarHospedes();
                }
                // Se atingiu o limite, o botão já estará desabilitado visualmente
            } else {
                reservaData.adultos++;
                atualizarHospedes();
            }
        } else {
            // Se não há suíte selecionada, verificar o maior limite disponível
            const maxCapacidade = Math.max(...suites.map(s => s.capacidadeAdultos));
            if (reservaData.adultos < maxCapacidade) {
                reservaData.adultos++;
                atualizarHospedes();
            }
            // Se atingiu o limite, o botão já estará desabilitado visualmente
        }
    });
    
    btnAdultosMenos.addEventListener('click', function(e) {
        e.stopPropagation();
        if (reservaData.adultos > 1) {
            reservaData.adultos--;
            atualizarHospedes();
        }
    });
    
    atualizarHospedes();
}

function atualizarHospedes() {
    document.getElementById('adultos-valor').textContent = reservaData.adultos;
    
    // Atualizar estado do botão de incrementar adultos
    const btnAdultosMais = document.getElementById('btn-adultos-mais');
    if (btnAdultosMais) {
        if (reservaData.suiteSelecionada) {
            const suite = suites.find(s => s.id === reservaData.suiteSelecionada);
            if (suite) {
                // Desabilitar botão se atingiu o limite
                if (reservaData.adultos >= suite.capacidadeAdultos) {
                    btnAdultosMais.disabled = true;
                    btnAdultosMais.style.opacity = '0.5';
                    btnAdultosMais.style.cursor = 'not-allowed';
                } else {
                    btnAdultosMais.disabled = false;
                    btnAdultosMais.style.opacity = '1';
                    btnAdultosMais.style.cursor = 'pointer';
                }
            }
        } else {
            // Se não há suíte selecionada, verificar limite máximo disponível
            const maxCapacidade = Math.max(...suites.map(s => s.capacidadeAdultos));
            if (reservaData.adultos >= maxCapacidade) {
                btnAdultosMais.disabled = true;
                btnAdultosMais.style.opacity = '0.5';
                btnAdultosMais.style.cursor = 'not-allowed';
            } else {
                btnAdultosMais.disabled = false;
                btnAdultosMais.style.opacity = '1';
                btnAdultosMais.style.cursor = 'pointer';
            }
        }
    }
    
    // Mostrar/esconder botão de hóspedes extras baseado no tipo de acomodação
    atualizarVisibilidadeHospedesExtras();
    
    // Validar capacidade se houver suíte selecionada
    if (reservaData.suiteSelecionada) {
        validarCapacidade();
    }
    
    atualizarSuites();
    atualizarResumo();
    // Verificar botão após pequeno delay
    setTimeout(() => verificarBotaoCarrinho(), 100);
}

// Função para verificar se a acomodação selecionada é uma CASA
function isCasa(suiteId) {
    return suiteId && (suiteId.startsWith('casa-') || suiteId === 'casa-1' || suiteId === 'casa-2' || suiteId === 'casa-3' || suiteId === 'casa-4');
}

// Função para mostrar/esconder botão de hóspedes extras
function atualizarVisibilidadeHospedesExtras() {
    const containerExtras = document.getElementById('container-hospedes-extras');
    if (!containerExtras) return;
    
    if (reservaData.suiteSelecionada && isCasa(reservaData.suiteSelecionada)) {
        containerExtras.style.display = 'block';
        atualizarResumoHospedesExtras();
    } else {
        containerExtras.style.display = 'none';
        // Resetar hóspedes extras se não for casa
        reservaData.hospedesExtras = 0;
        reservaData.valorHospedesExtras = 0;
    }
}

// Função para atualizar resumo de hóspedes extras
function atualizarResumoHospedesExtras() {
    const resumoExtras = document.getElementById('resumo-hospedes-extras');
    const quantidadeExtras = document.getElementById('quantidade-hospedes-extras');
    const valorExtras = document.getElementById('valor-hospedes-extras');
    
    if (!resumoExtras || !quantidadeExtras || !valorExtras) return;
    
    if (reservaData.hospedesExtras > 0) {
        resumoExtras.style.display = 'block';
        quantidadeExtras.textContent = reservaData.hospedesExtras;
        valorExtras.textContent = `R$ ${reservaData.valorHospedesExtras.toFixed(2).replace('.', ',')}`;
    } else {
        resumoExtras.style.display = 'none';
    }
}

function validarCapacidade() {
    const mensagem = document.getElementById('mensagem-capacidade');
    if (!reservaData.suiteSelecionada) {
        mensagem.className = 'mensagem-capacidade';
        return;
    }
    
    const suite = suites.find(s => s.id === reservaData.suiteSelecionada);
    if (!suite) return;
    
    let erro = false;
    let mensagemTexto = '';
    
    if (reservaData.adultos > suite.capacidadeAdultos) {
        erro = true;
        mensagemTexto = `Esta suíte permite no máximo ${suite.capacidadeAdultos} hóspede(s).`;
    }
    
    if (erro) {
        mensagem.className = 'mensagem-capacidade erro';
        mensagem.textContent = mensagemTexto;
    } else {
        mensagem.className = 'mensagem-capacidade sucesso';
        mensagem.textContent = 'Capacidade válida para esta suíte.';
    }
}

// Suítes
function atualizarSuites() {
    const container = document.getElementById('suites-container');
    const blocoSuites = document.querySelector('.bloco-suites');
    
    if (!container || !blocoSuites) return;
    
    container.innerHTML = '';
    
    // Se não há datas selecionadas, mostrar mensagem
    if (!reservaData.checkIn || !reservaData.checkOut) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem; font-size: 1.1rem;">Selecione as datas de check-in e check-out para ver as suítes disponíveis.</p>';
        blocoSuites.style.display = 'block';
        return;
    }
    
    // Filtrar suítes compatíveis
    const suitesCompatíveis = suites.filter(suite => {
        return reservaData.adultos <= suite.capacidadeAdultos;
    });
    
    if (suitesCompatíveis.length === 0 && reservaData.adultos > 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem; font-size: 1.1rem;">Nenhuma suíte disponível para esta quantidade de hóspedes.</p>';
        blocoSuites.style.display = 'block';
        return;
    }
    
    blocoSuites.style.display = 'block';
    
    suitesCompatíveis.forEach(suite => {
        const card = criarCardSuite(suite);
        container.appendChild(card);
    });
}

function criarCardSuite(suite) {
    const card = document.createElement('div');
    card.className = 'suite-card';
    
    const imagensHTML = suite.imagens.map((img, index) => 
        `<img src="${img}" alt="${suite.nome}" class="suite-miniatura ${index === 0 ? 'ativa' : ''}" data-index="${index}">`
    ).join('');
    
    card.innerHTML = `
        <div class="suite-imagens">
            <img src="${suite.imagens[0]}" alt="${suite.nome}" class="suite-imagem-principal" id="img-principal-${suite.id}">
            <div class="suite-miniaturas">
                ${imagensHTML}
            </div>
        </div>
        <div class="suite-conteudo">
            <h3 class="suite-nome">${suite.nome}</h3>
            <div class="suite-info">
                <div class="suite-info-item">
                    <span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>Máx: ${suite.capacidadeAdultos} hóspede(s)</span>
                </div>
                <div class="suite-info-item">
                    <span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>${suite.area}</span>
                </div>
                <div class="suite-info-item">
                    <span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 18V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M2 12H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                    <span>${suite.vista}</span>
                </div>
            </div>
            <p class="suite-descricao">${suite.descricao}</p>
            <div class="suite-comodidades">
                ${suite.comodidades.map(c => `<span class="comodidade-tag">${c}</span>`).join('')}
            </div>
            <div class="suite-preco">
                R$ ${suite.preco.toFixed(2)} <span>por noite</span>
            </div>
            <button class="btn-escolher" data-suite-id="${suite.id}">${reservaData.suiteSelecionada === suite.id ? '✓ Selecionado' : 'Escolher'}</button>
        </div>
    `;
    
    // Se esta suíte está selecionada, destacar o card e o botão
    if (reservaData.suiteSelecionada === suite.id) {
        card.classList.add('selecionado');
        const btnEscolherInicial = card.querySelector('.btn-escolher');
        if (btnEscolherInicial) {
            btnEscolherInicial.style.backgroundColor = '#0F1F4B';
            btnEscolherInicial.style.cursor = 'pointer';
        }
    }
    
    // Event listeners para miniaturas
    const miniaturas = card.querySelectorAll('.suite-miniatura');
    const imgPrincipal = card.querySelector(`#img-principal-${suite.id}`);
    
    miniaturas.forEach((miniatura, index) => {
        miniatura.addEventListener('click', () => {
            imgPrincipal.src = suite.imagens[index];
            miniaturas.forEach(m => m.classList.remove('ativa'));
            miniatura.classList.add('ativa');
        });
    });
    
    // Event listener para botão escolher
    const btnEscolher = card.querySelector('.btn-escolher');
    if (btnEscolher) {
        btnEscolher.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Botão Escolher clicado para suíte:', suite.id);
            
            // Verificar se a suíte já está selecionada (desselecionar)
            if (reservaData.suiteSelecionada === suite.id) {
                // Desselecionar
                reservaData.suiteSelecionada = null;
                console.log('Suíte desselecionada');
                
                // Resetar visual do botão e card
                btnEscolher.textContent = 'Escolher';
                btnEscolher.style.backgroundColor = '';
                btnEscolher.style.cursor = '';
                card.classList.remove('selecionado');
                
                // Atualizar visibilidade do botão de hóspedes extras
                atualizarVisibilidadeHospedesExtras();
                calcularValorTotal();
                verificarBotaoCarrinho();
                atualizarResumo();
                return;
            }
            
            // Selecionar suíte
            reservaData.suiteSelecionada = suite.id;
            console.log('Suíte selecionada:', reservaData.suiteSelecionada);
            
            // Ajustar número de adultos se exceder o limite da suíte
            if (reservaData.adultos > suite.capacidadeAdultos) {
                reservaData.adultos = suite.capacidadeAdultos;
                atualizarHospedes();
            }
            
            // Atualizar visibilidade do botão de hóspedes extras
            atualizarVisibilidadeHospedesExtras();
            
            calcularValorTotal();
            
            // Validar capacidade (pode não ter elemento mensagem-capacidade)
            try {
                validarCapacidade();
            } catch (error) {
                console.log('Erro ao validar capacidade (pode ser normal):', error);
            }
            
            // Validar campos de informações do hóspede se já estiverem preenchidos
            if (reservaData.nomeCompleto) {
                validarCampo('nome', reservaData.nomeCompleto);
            }
            if (reservaData.telefone) {
                validarCampo('telefone', reservaData.telefone);
            }
            if (reservaData.email) {
                validarCampo('email', reservaData.email);
            }
            
            verificarBotaoCarrinho();
            atualizarResumo();
            
            // Destacar card selecionado
            document.querySelectorAll('.suite-card').forEach(c => {
                c.classList.remove('selecionado');
                const btn = c.querySelector('.btn-escolher');
                if (btn && btn !== btnEscolher) {
                    btn.textContent = 'Escolher';
                    btn.style.backgroundColor = '';
                }
            });
            card.classList.add('selecionado');
            
            // Feedback visual
            btnEscolher.textContent = '✓ Selecionado';
            btnEscolher.style.backgroundColor = '#0F1F4B';
            btnEscolher.style.cursor = 'pointer'; // Permite clicar novamente para desselecionar
            
            console.log('Suíte selecionada com sucesso!');
        });
    } else {
        console.error('Botão Escolher não encontrado para suíte:', suite.id);
    }
    
    return card;
}

// Botão Finalizar Reserva
function inicializarBotaoCarrinho() {
    const btnFinalizar = document.getElementById('btn-finalizar-reserva');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', () => {
            irAoCarrinho();
        });
    }
}

function calcularValorTotal() {
    if (reservaData.suiteSelecionada && reservaData.totalNoites > 0) {
        const suite = suites.find(s => s.id === reservaData.suiteSelecionada);
        if (suite) {
            const valorBase = suite.preco * reservaData.totalNoites;
            // Adicionar valor de hóspedes extras se for casa
            reservaData.valorTotal = valorBase + reservaData.valorHospedesExtras;
        }
    } else {
        reservaData.valorTotal = 0;
        reservaData.valorHospedesExtras = 0;
    }
}

// Atualizar resumo da reserva (simplificado - apenas habilita/desabilita botão)
function atualizarResumo() {
    // Função simplificada - apenas recalcula o valor total
    calcularValorTotal();
}


function verificarBotaoCarrinho() {
    const btnFinalizar = document.getElementById('btn-finalizar-reserva');
    
    if (!btnFinalizar) return false;
    
    // Verifica se tem datas, suíte e capacidade válida
    const temCheckIn = !!reservaData.checkIn;
    const temCheckOut = !!reservaData.checkOut;
    const temSuite = !!reservaData.suiteSelecionada;
    const capacidadeValida = validarCapacidadeHospedes();
    
    const dadosBasicosValidos = temCheckIn && temCheckOut && temSuite && capacidadeValida;
    
    // Se dados básicos válidos, valida informações do hóspede
    if (dadosBasicosValidos) {
        // Validar campos novamente para garantir que estão corretos
        const nomeValido = validarCampo('nome', reservaData.nomeCompleto || '', false);
        const telefoneValido = validarCampo('telefone', reservaData.telefone || '', false);
        const emailValido = validarCampo('email', reservaData.email || '', false);
        
        const informacoesValidas = nomeValido && telefoneValido && emailValido;
        
        // Habilitar/desabilitar conforme validação
        btnFinalizar.disabled = !informacoesValidas;
        
        return informacoesValidas;
    } else {
        // Se dados básicos não válidos, desabilitar botão
        btnFinalizar.disabled = true;
        
        return false;
    }
}

function validarCapacidadeHospedes() {
    if (!reservaData.suiteSelecionada) return false;
    
    const suite = suites.find(s => s.id === reservaData.suiteSelecionada);
    if (!suite) return false;
    
    return reservaData.adultos <= suite.capacidadeAdultos;
}

// Informações do Hóspede
function inicializarInformacoesHospede() {
    const nomeInput = document.getElementById('nome-completo-hospede');
    const telefoneInput = document.getElementById('telefone-hospede');
    const emailInput = document.getElementById('email-hospede');
    
    // Máscara para telefone
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                if (value.length <= 10) {
                    value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
                } else {
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
                e.target.value = value;
                reservaData.telefone = value;
            }
            if (reservaData.suiteSelecionada) {
                validarCampo('telefone', value);
            }
            // Sempre verificar botão, mesmo sem suíte selecionada
            setTimeout(() => verificarBotaoCarrinho(), 50);
        });
    }
    
    // Validação em tempo real
    if (nomeInput) {
        nomeInput.addEventListener('input', function(e) {
            reservaData.nomeCompleto = e.target.value.trim();
            if (reservaData.suiteSelecionada) {
                validarCampo('nome', e.target.value.trim());
            }
            // Sempre verificar botão, mesmo sem suíte selecionada
            setTimeout(() => verificarBotaoCarrinho(), 50);
        });
        
        nomeInput.addEventListener('blur', function(e) {
            reservaData.nomeCompleto = e.target.value.trim();
            if (reservaData.suiteSelecionada) {
                validarCampo('nome', e.target.value.trim());
            }
            setTimeout(() => verificarBotaoCarrinho(), 50);
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function(e) {
            reservaData.email = e.target.value.trim();
            if (reservaData.suiteSelecionada) {
                validarCampo('email', e.target.value.trim());
            }
            // Sempre verificar botão, mesmo sem suíte selecionada
            setTimeout(() => verificarBotaoCarrinho(), 50);
        });
        
        emailInput.addEventListener('blur', function(e) {
            reservaData.email = e.target.value.trim();
            if (reservaData.suiteSelecionada) {
                validarCampo('email', e.target.value.trim());
            }
            setTimeout(() => verificarBotaoCarrinho(), 50);
        });
    }
}

// Função removida - campos agora estão sempre visíveis na seção Hóspedes

function validarCampo(tipo, valor, mostrarErro = true) {
    const erroElement = document.getElementById(`erro-${tipo}`);
    
    if (!erroElement) return false;
    
    let valido = false;
    let mensagem = '';
    
    switch(tipo) {
        case 'nome':
            if (!valor || valor.trim().length === 0) {
                mensagem = 'Nome completo é obrigatório';
            } else if (valor.trim().length < 3) {
                mensagem = 'Nome deve ter pelo menos 3 caracteres';
            } else if (valor.trim().split(' ').filter(n => n.length > 0).length < 2) {
                mensagem = 'Digite seu nome completo';
            } else {
                valido = true;
            }
            break;
        case 'telefone':
            const telefoneLimpo = valor ? valor.replace(/\D/g, '') : '';
            if (!telefoneLimpo || telefoneLimpo.length === 0) {
                mensagem = 'Telefone é obrigatório';
            } else if (telefoneLimpo.length < 10) {
                mensagem = 'Digite um telefone válido (10 ou 11 dígitos)';
            } else {
                valido = true;
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!valor || valor.trim().length === 0) {
                mensagem = 'E-mail é obrigatório';
            } else if (!emailRegex.test(valor.trim())) {
                mensagem = 'Digite um e-mail válido';
            } else {
                valido = true;
            }
            break;
    }
    
    if (mostrarErro) {
        if (valido) {
            erroElement.classList.remove('ativo');
            erroElement.textContent = '';
        } else {
            erroElement.classList.add('ativo');
            erroElement.textContent = mensagem;
        }
    }
    
    return valido;
}

function validarInformacoesHospede() {
    // Se não há suíte selecionada, não precisa validar ainda
    if (!reservaData.suiteSelecionada) return false;
    
    // Validar cada campo
    const nomeValido = validarCampo('nome', reservaData.nomeCompleto || '', false);
    const telefoneValido = validarCampo('telefone', reservaData.telefone || '', false);
    const emailValido = validarCampo('email', reservaData.email || '', false);
    
    return nomeValido && telefoneValido && emailValido;
}

function irAoCarrinho() {
    const suite = suites.find(s => s.id === reservaData.suiteSelecionada);
    
    if (!suite) {
        alert('Por favor, selecione uma suíte');
        return;
    }
    
    if (!reservaData.checkIn || !reservaData.checkOut) {
        alert('Por favor, selecione as datas de check-in e check-out');
        return;
    }
    
    // Validar informações do hóspede
    if (!validarInformacoesHospede()) {
        alert('Por favor, preencha corretamente todas as informações do hóspede');
        return;
    }
    
    calcularValorTotal();
    
    // Salvar dados no formato esperado pelo carrinho
    const carrinhoData = {
        checkIn: reservaData.checkIn.toISOString(),
        checkOut: reservaData.checkOut.toISOString(),
        adultos: reservaData.adultos,
        criancas: 0,
        suiteSelecionada: reservaData.suiteSelecionada,
        totalNoites: reservaData.totalNoites,
        valorTotal: reservaData.valorTotal,
        nomeCompleto: reservaData.nomeCompleto,
        telefone: reservaData.telefone,
        email: reservaData.email
    };
    
    localStorage.setItem('carrinhoData', JSON.stringify(carrinhoData));
    
    // Redirecionar para página do carrinho
    window.location.href = '/carrinho';
}

// Inicializar modal de hóspedes extras
function inicializarModalHospedesExtras() {
    const modal = document.getElementById('modal-hospedes-extras');
    const btnAbrir = document.getElementById('btn-adicionar-hospedes-extras');
    const btnFechar = document.getElementById('btn-fechar-modal-extras');
    const btnCancelar = document.getElementById('btn-cancelar-extras');
    const btnConfirmar = document.getElementById('btn-confirmar-extras');
    const btnMenos = document.getElementById('btn-extras-menos');
    const btnMais = document.getElementById('btn-extras-mais');
    
    if (!modal) return;
    
    // Abrir modal
    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => {
            modal.style.display = 'flex';
            atualizarModalHospedesExtras();
        });
    }
    
    // Fechar modal
    const fecharModal = () => {
        modal.style.display = 'none';
    };
    
    if (btnFechar) btnFechar.addEventListener('click', fecharModal);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModal);
    
    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
    
    // Controles do contador
    if (btnMenos) {
        btnMenos.addEventListener('click', () => {
            if (reservaData.hospedesExtras > 0) {
                reservaData.hospedesExtras--;
                atualizarModalHospedesExtras();
            }
        });
    }
    
    if (btnMais) {
        btnMais.addEventListener('click', () => {
            reservaData.hospedesExtras++;
            atualizarModalHospedesExtras();
        });
    }
    
    // Confirmar
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', () => {
            // Calcular valor dos hóspedes extras (R$ 75 por pessoa)
            reservaData.valorHospedesExtras = reservaData.hospedesExtras * 75;
            atualizarResumoHospedesExtras();
            calcularValorTotal();
            atualizarResumo();
            verificarBotaoCarrinho();
            fecharModal();
        });
    }
}

// Atualizar valores exibidos no modal
function atualizarModalHospedesExtras() {
    const valorExtras = document.getElementById('extras-valor');
    const quantidadeExtras = document.getElementById('modal-quantidade-extras');
    const valorTotalExtras = document.getElementById('modal-valor-total-extras');
    
    if (valorExtras) valorExtras.textContent = reservaData.hospedesExtras;
    if (quantidadeExtras) quantidadeExtras.textContent = reservaData.hospedesExtras;
    
    const valorCalculado = reservaData.hospedesExtras * 75;
    if (valorTotalExtras) {
        valorTotalExtras.textContent = `R$ ${valorCalculado.toFixed(2).replace('.', ',')}`;
    }
}

// Adicionar estilo para suite selecionada e modal
const style = document.createElement('style');
style.textContent = `
    .suite-card.selecionado {
        border: 3px solid #0F1F4B;
        box-shadow: 0 8px 30px rgba(64, 224, 208, 0.3);
    }
    
    .btn-hospedes-extras {
        width: 100%;
        padding: 12px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-hospedes-extras:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .modal-hospedes-extras {
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        align-items: center;
        justify-content: center;
    }
    
    .modal-hospedes-extras-content {
        background-color: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }
    
    .modal-hospedes-extras-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-hospedes-extras-header h3 {
        margin: 0;
        color: #2c3e50;
        font-size: 24px;
    }
    
    .modal-close {
        background: none;
        border: none;
        font-size: 32px;
        cursor: pointer;
        color: #999;
        line-height: 1;
        padding: 0;
        width: 32px;
        height: 32px;
    }
    
    .modal-close:hover {
        color: #333;
    }
    
    .modal-hospedes-extras-body {
        padding: 25px;
    }
    
    .modal-hospedes-extras-footer {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }
    
    .btn-cancelar-extras, .btn-confirmar-extras {
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .btn-cancelar-extras {
        background-color: #e0e0e0;
        color: #333;
    }
    
    .btn-cancelar-extras:hover {
        background-color: #d0d0d0;
    }
    
    .btn-confirmar-extras {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }
    
    .btn-confirmar-extras:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
`;
document.head.appendChild(style);

// Inicializar modal quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    inicializarModalHospedesExtras();
});

