// Sistema de Carrinho

// Dados das suítes (mesmo do reserva-nova.js)
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
            'images/casa-sobrado-2/casa-sobrado-2-1.png',
            'images/casa-sobrado-2/casa-sobrado-2-2.png',
            'images/casa-sobrado-2/casa-sobrado-2-3.png',
            'images/casa-sobrado-2/casa-sobrado-2-4.png',
            'images/casa-sobrado-2/casa-sobrado-2-5.png',
            'images/casa-sobrado-2/casa-sobrado-2-6.png',
            'images/casa-sobrado-2/casa-sobrado-2-7.png',
            'images/casa-sobrado-2/casa-sobrado-2-8.png'
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
            'images/casa-sobrado-4/casa-sobrado-4-1.png',
            'images/casa-sobrado-4/casa-sobrado-4-2.png',
            'images/casa-sobrado-4/casa-sobrado-4-3.png',
            'images/casa-sobrado-4/casa-sobrado-4-4.png',
            'images/casa-sobrado-4/casa-sobrado-4-5.png',
            'images/casa-sobrado-4/casa-sobrado-4-6.png'
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
            'images/casa-ampla-confortavel/casa-ampla-confortavel-1.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-2.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-3.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-4.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-5.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-6.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-7.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-8.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-9.png',
            'images/casa-ampla-confortavel/casa-ampla-confortavel-10.png'
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
            'images/casa-sobrado-6/casa-sobrado-6-1.png',
            'images/casa-sobrado-6/casa-sobrado-6-2.png',
            'images/casa-sobrado-6/casa-sobrado-6-3.png',
            'images/casa-sobrado-6/casa-sobrado-6-4.png',
            'images/casa-sobrado-6/casa-sobrado-6-5.png',
            'images/casa-sobrado-6/casa-sobrado-6-6.png',
            'images/casa-sobrado-6/casa-sobrado-6-7.png',
            'images/casa-sobrado-6/casa-sobrado-6-8.png',
            'images/casa-sobrado-6/casa-sobrado-6-9.png',
            'images/casa-sobrado-6/casa-sobrado-6-10.png',
            'images/casa-sobrado-6/casa-sobrado-6-11.png',
            'images/casa-sobrado-6/casa-sobrado-6-12.png',
            'images/casa-sobrado-6/casa-sobrado-6-13.png'
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
            'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-1.png',
            'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-2.png',
            'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-3.png'
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
            'images/suite-2/suite-2-1.png',
            'images/suite-2/suite-2-2.png',
            'images/suite-2/suite-2-3.png',
            'images/suite-2/suite-2-4.png'
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
            'images/suite-3/suite-3-1.png',
            'images/suite-3/suite-3-2.png',
            'images/suite-3/suite-3-3.png',
            'images/suite-3/suite-3-4.png'
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
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-1.png',
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-2.png',
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-3.png',
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-4.png'
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
            'images/suite-deluxe/suite-deluxe-1.png',
            'images/suite-deluxe/suite-deluxe-2.png',
            'images/suite-deluxe/suite-deluxe-3.png',
            'images/suite-deluxe/suite-deluxe-4.png'
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
            'images/quarto-duplo/quarto-duplo-1.png',
            'images/quarto-duplo/quarto-duplo-2.png',
            'images/quarto-duplo/quarto-duplo-3.png',
            'images/quarto-duplo/quarto-duplo-4.png'
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
            'images/suite-deluxe-familia/suite-deluxe-familia-1.png',
            'images/suite-deluxe-familia/suite-deluxe-familia-2.png',
            'images/suite-deluxe-familia/suite-deluxe-familia-3.png',
            'images/suite-deluxe-familia/suite-deluxe-familia-4.png'
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
            'images/suite-romantica/suite-romantica-1.png',
            'images/suite-romantica/suite-romantica-2.png',
            'images/suite-romantica/suite-romantica-3.png'
        ]
    }
];

// Carregar dados do localStorage
let carrinhoData = {
    checkIn: null,
    checkOut: null,
    adultos: 2,
    criancas: 0,
    suiteSelecionada: null,
    totalNoites: 0,
    valorTotal: 0,
    nomeCompleto: '',
    telefone: '',
    email: ''
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosCarrinho();
    preencherCarrinho();
    verificarBotaoReservar();
    
    // Event listener para o botão de reservar
    document.getElementById('btn-reservar-agora').addEventListener('click', function() {
        processarReserva();
    });
});

function carregarDadosCarrinho() {
    // Tentar carregar do localStorage
    const dadosSalvos = localStorage.getItem('carrinhoData');
    if (dadosSalvos) {
        try {
            const dados = JSON.parse(dadosSalvos);
            carrinhoData = {
                checkIn: dados.checkIn ? new Date(dados.checkIn) : null,
                checkOut: dados.checkOut ? new Date(dados.checkOut) : null,
                adultos: dados.adultos || 2,
                criancas: dados.criancas || 0,
                suiteSelecionada: dados.suiteSelecionada || null,
                totalNoites: dados.totalNoites || 0,
                valorTotal: dados.valorTotal || 0,
                nomeCompleto: dados.nomeCompleto || '',
                telefone: dados.telefone || '',
                email: dados.email || ''
            };
        } catch (e) {
            console.error('Erro ao carregar dados do carrinho:', e);
        }
    }
}

function preencherCarrinho() {
    // Preencher cabeçalho
    document.getElementById('carrinho-checkin-data').textContent = 
        carrinhoData.checkIn ? formatarData(carrinhoData.checkIn) : '-';
    document.getElementById('carrinho-checkout-data').textContent = 
        carrinhoData.checkOut ? formatarData(carrinhoData.checkOut) : '-';
    document.getElementById('carrinho-noites-total').textContent = 
        carrinhoData.totalNoites > 0 ? `${carrinhoData.totalNoites} ${carrinhoData.totalNoites === 1 ? 'noite' : 'noites'}` : '-';
    
    // Preencher informações do hóspede
    document.getElementById('carrinho-nome-hospede').textContent = 
        carrinhoData.nomeCompleto || '-';
    document.getElementById('carrinho-telefone-hospede').textContent = 
        carrinhoData.telefone || '-';
    document.getElementById('carrinho-email-hospede').textContent = 
        carrinhoData.email || '-';
    
    // Preencher informações da suíte
    if (carrinhoData.suiteSelecionada) {
        const suite = suites.find(s => s.id === carrinhoData.suiteSelecionada);
        if (suite) {
            console.log('📸 Carregando suíte:', suite.nome, 'ID:', suite.id);
            document.getElementById('suite-nome-carrinho').textContent = suite.nome;
            document.getElementById('suite-ocupacao').textContent = 
                `Máx: ${suite.capacidadeAdultos} adultos e ${suite.capacidadeCriancas} criança(s)`;
            document.getElementById('suite-area').textContent = suite.area;
            document.getElementById('suite-vista').textContent = suite.vista;
            document.getElementById('suite-descricao').textContent = suite.descricao;
            
            // Preencher imagem - usar a imagem principal do quartos-data.js
            const imgElement = document.getElementById('suite-imagem-principal');
            if (imgElement) {
                // Verificar se temos a imagem no quartosImagens (fonte centralizada)
                let imagemParaUsar = null;
                if (typeof quartosImagens !== 'undefined' && quartosImagens[suite.id]) {
                    imagemParaUsar = quartosImagens[suite.id].principal;
                    console.log('✅ Imagem principal encontrada no quartos-data.js:', imagemParaUsar);
                } else if (suite.imagens && suite.imagens.length > 0) {
                    // Fallback para imagens do suite se quartosImagens não estiver disponível
                    imagemParaUsar = suite.imagens[0];
                    console.log('⚠️ Usando imagem do suite (fallback):', imagemParaUsar);
                }
                
                if (imagemParaUsar) {
                    imgElement.src = imagemParaUsar;
                    imgElement.alt = suite.nome;
                    imgElement.style.display = 'block';
                    console.log('✅ Imagem carregada:', imagemParaUsar);
                } else {
                    console.error('❌ Nenhuma imagem disponível para a suíte:', suite.id);
                }
            } else {
                console.error('❌ Elemento de imagem não encontrado');
            }
        } else {
            console.error('❌ Suíte não encontrada:', carrinhoData.suiteSelecionada);
        }
    } else {
        document.getElementById('suite-nome-carrinho').textContent = '-';
        document.getElementById('suite-ocupacao').textContent = '-';
        document.getElementById('suite-area').textContent = '-';
        document.getElementById('suite-vista').textContent = '-';
        document.getElementById('suite-descricao').textContent = '-';
    }
    
    // Preencher preços
    if (carrinhoData.suiteSelecionada && carrinhoData.totalNoites > 0) {
        const suite = suites.find(s => s.id === carrinhoData.suiteSelecionada);
        if (suite) {
            // Recalcular valor total se necessário
            if (!carrinhoData.valorTotal || carrinhoData.valorTotal === 0) {
                carrinhoData.valorTotal = suite.preco * carrinhoData.totalNoites;
                console.log('💰 Valor recalculado:', carrinhoData.valorTotal, '(', suite.preco, 'x', carrinhoData.totalNoites, ')');
            }
            const precoPorNoite = suite.preco.toFixed(2).replace('.', ',');
            const valorTotal = carrinhoData.valorTotal.toFixed(2).replace('.', ',');
            
            document.getElementById('preco-por-noite').textContent = `R$ ${precoPorNoite}`;
            document.getElementById('total-estadia').textContent = `R$ ${valorTotal}`;
            
            console.log('✅ Preços atualizados - Por noite:', precoPorNoite, 'Total:', valorTotal);
        } else {
            console.error('❌ Suíte não encontrada para calcular preços');
            document.getElementById('preco-por-noite').textContent = 'R$ 0,00';
            document.getElementById('total-estadia').textContent = 'R$ 0,00';
        }
    } else {
        console.log('⚠️ Dados incompletos - Suite:', carrinhoData.suiteSelecionada, 'Noites:', carrinhoData.totalNoites);
        document.getElementById('preco-por-noite').textContent = 'R$ 0,00';
        document.getElementById('total-estadia').textContent = 'R$ 0,00';
    }
    
    // Preencher hóspedes
    document.getElementById('info-adultos').textContent = carrinhoData.adultos;
    document.getElementById('info-criancas').textContent = carrinhoData.criancas || 0;
    
    // Exibir hóspedes extras se existirem
    const infoExtras = document.getElementById('info-hospedes-extras');
    const infoExtrasValor = document.getElementById('info-hospedes-extras-valor');
    if (infoExtras && infoExtrasValor && carrinhoData.hospedesExtras > 0) {
        infoExtras.style.display = 'flex';
        infoExtrasValor.textContent = `${carrinhoData.hospedesExtras} (R$ ${(carrinhoData.valorHospedesExtras || 0).toFixed(2).replace('.', ',')})`;
    } else if (infoExtras) {
        infoExtras.style.display = 'none';
    }
}

function formatarData(data) {
    return data.toLocaleDateString('pt-BR');
}

function verificarBotaoReservar() {
    const btn = document.getElementById('btn-reservar-agora');
    const valido = carrinhoData.checkIn && 
                   carrinhoData.checkOut && 
                   carrinhoData.suiteSelecionada &&
                   carrinhoData.totalNoites > 0;
    
    btn.disabled = !valido;
}

async function processarReserva() {
    if (!carrinhoData.checkIn || !carrinhoData.checkOut || !carrinhoData.suiteSelecionada || carrinhoData.totalNoites <= 0) {
        alert('Por favor, complete todas as informações antes de reservar.');
        return;
    }
    
    if (!carrinhoData.nomeCompleto || !carrinhoData.email || !carrinhoData.telefone) {
        alert('Por favor, preencha todas as informações do hóspede.');
        return;
    }
    
    const suite = suites.find(s => s.id === carrinhoData.suiteSelecionada);
    const btnReservar = document.getElementById('btn-reservar-agora');
    
    // Desabilitar botão durante o processamento
    btnReservar.disabled = true;
    btnReservar.textContent = 'Processando...';
    
    try {
        // 1. Criar reserva no backend
        const dadosReserva = {
            nome_completo: carrinhoData.nomeCompleto,
            email: carrinhoData.email,
            telefone: carrinhoData.telefone,
            categoria: suite.nome,
            check_in: carrinhoData.checkIn.toISOString().split('T')[0],
            check_out: carrinhoData.checkOut.toISOString().split('T')[0],
            num_hospedes: carrinhoData.adultos + carrinhoData.criancas + (carrinhoData.hospedesExtras || 0),
            adultos: carrinhoData.adultos,
            criancas: carrinhoData.criancas,
            hospedes_extras: carrinhoData.hospedesExtras || 0,
            valor_hospedes_extras: carrinhoData.valorHospedesExtras || 0,
            total_noites: carrinhoData.totalNoites,
            valor_total: carrinhoData.valorTotal,
            valor_quarto: suite.preco,
            metodo_pagamento: 'Pendente',
            status: 'Pendente'
        };
        
        const response = await fetch('/api/reserva', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosReserva)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            alert(result.error || 'Erro ao processar reserva. Tente novamente.');
            btnReservar.disabled = false;
            btnReservar.textContent = 'Reservar Agora';
            return;
        }
        
        // 2. Redirecionar para a ficha da reserva
        localStorage.removeItem('carrinhoData');
        window.location.href = `/ficha/${result.codigo}`;
        
    } catch (error) {
        console.error('Erro ao processar reserva:', error);
        alert('Erro de conexão. Verifique sua internet e tente novamente.');
        btnReservar.disabled = false;
        btnReservar.textContent = 'Reservar Agora';
    }
}

