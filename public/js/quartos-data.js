// Estrutura de dados compartilhada para imagens dos quartos
// Esta estrutura garante que cards e página de detalhes usem as mesmas imagens
// A imagem principal DEVE ser sempre de cama/quarto (não banheiro ou cozinha)

// Função auxiliar para reorganizar array colocando a imagem principal primeiro
function reorganizarImagens(imagemPrincipal, todasImagens) {
    const todas = [...todasImagens];
    const indexPrincipal = todas.indexOf(imagemPrincipal);
    
    if (indexPrincipal > 0) {
        // Remove a imagem principal da posição atual
        todas.splice(indexPrincipal, 1);
        // Coloca no início
        todas.unshift(imagemPrincipal);
    }
    
    return todas;
}

// Função para processar e garantir que a imagem principal seja a primeira
function processarImagensQuarto(quartoData) {
    const todas = [...quartoData.todas];
    const principal = quartoData.principal;
    
    // Reorganizar para que a principal seja sempre a primeira
    const indexPrincipal = todas.indexOf(principal);
    if (indexPrincipal > 0) {
        todas.splice(indexPrincipal, 1);
        todas.unshift(principal);
    } else if (indexPrincipal === -1) {
        // Se a principal não estiver no array, adicionar no início
        todas.unshift(principal);
    }
    
    return {
        principal: principal,
        todas: todas
    };
}

const quartosImagensRaw = {
    'casa-1': {
        // IMPORTANTE: Esta deve ser a imagem de CAMA/QUARTO
        // Se não for, altere para a imagem correta (ex: 'images/casa-sobrado-2/casa-sobrado-2-5.png')
        principal: 'images/casa-sobrado-2/casa-sobrado-2-1.png',
        todas: [
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
    'casa-2': {
        principal: 'images/casa-sobrado-4/casa-sobrado-4-1.png',
        todas: [
            'images/casa-sobrado-4/casa-sobrado-4-1.png',
            'images/casa-sobrado-4/casa-sobrado-4-2.png',
            'images/casa-sobrado-4/casa-sobrado-4-3.png',
            'images/casa-sobrado-4/casa-sobrado-4-4.png',
            'images/casa-sobrado-4/casa-sobrado-4-5.png',
            'images/casa-sobrado-4/casa-sobrado-4-6.png'
        ]
    },
    'casa-3': {
        principal: 'images/casa-ampla-confortavel/casa-ampla-confortavel-1.png',
        todas: [
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
    'casa-4': {
        principal: 'images/casa-sobrado-6/casa-sobrado-6-1.png',
        todas: [
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
    'harmonia': {
        principal: 'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-1.png',
        todas: [
            'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-1.png',
            'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-2.png',
            'images/quarto-deluxe-cama-queen/quarto-deluxe-cama-queen-3.png'
        ]
    },
    'orquidea': {
        // IMPORTANTE: Esta deve ser a imagem de CAMA/QUARTO
        principal: 'images/suite-2/suite-2-1.png',
        todas: [
            'images/suite-2/suite-2-1.png',
            'images/suite-2/suite-2-2.png',
            'images/suite-2/suite-2-3.png',
            'images/suite-2/suite-2-4.png'
        ]
    },
    'imperial': {
        // IMPORTANTE: Esta deve ser a imagem de CAMA/QUARTO
        principal: 'images/suite-3/suite-3-1.png',
        todas: [
            'images/suite-3/suite-3-1.png',
            'images/suite-3/suite-3-2.png',
            'images/suite-3/suite-3-3.png',
            'images/suite-3/suite-3-4.png'
        ]
    },
    'premium-vista': {
        principal: 'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-1.png',
        todas: [
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-1.png',
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-2.png',
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-3.png',
            'images/quarto-deluxe-premium-vista/quarto-deluxe-premium-vista-4.png'
        ]
    },
    'deluxe': {
        principal: 'images/suite-deluxe/suite-deluxe-1.png',
        todas: [
            'images/suite-deluxe/suite-deluxe-1.png',
            'images/suite-deluxe/suite-deluxe-2.png',
            'images/suite-deluxe/suite-deluxe-3.png',
            'images/suite-deluxe/suite-deluxe-4.png'
        ]
    },
    'executiva': {
        principal: 'images/quarto-duplo/quarto-duplo-1.png',
        todas: [
            'images/quarto-duplo/quarto-duplo-1.png',
            'images/quarto-duplo/quarto-duplo-2.png',
            'images/quarto-duplo/quarto-duplo-3.png',
            'images/quarto-duplo/quarto-duplo-4.png'
        ]
    },
    'familia': {
        principal: 'images/suite-deluxe-familia/suite-deluxe-familia-1.png',
        todas: [
            'images/suite-deluxe-familia/suite-deluxe-familia-1.png',
            'images/suite-deluxe-familia/suite-deluxe-familia-2.png',
            'images/suite-deluxe-familia/suite-deluxe-familia-3.png',
            'images/suite-deluxe-familia/suite-deluxe-familia-4.png'
        ]
    },
    'romantica': {
        principal: 'images/suite-romantica/suite-romantica-1.png',
        todas: [
            'images/suite-romantica/suite-romantica-1.png',
            'images/suite-romantica/suite-romantica-2.png',
            'images/suite-romantica/suite-romantica-3.png'
        ]
    }
};

// Processar todos os quartos para garantir que a imagem principal seja sempre a primeira
const quartosImagens = {};
Object.keys(quartosImagensRaw).forEach(quartoId => {
    quartosImagens[quartoId] = processarImagensQuarto(quartosImagensRaw[quartoId]);
});

