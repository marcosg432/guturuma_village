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
        // Se não for, altere para a imagem correta (ex: 'images/casa-1-img-5.jpg')
        principal: 'images/casa-1-img-1.jpg',
        todas: [
            'images/casa-1-img-1.jpg',
            'images/casa-1-img-2.jpg',
            'images/casa-1-img-3.jpg',
            'images/casa-1-img-4.jpg',
            'images/casa-1-img-5.jpg',
            'images/casa-1-img-6.jpg',
            'images/casa-1-img-7.jpg',
            'images/casa-1-img-8.jpg',
            'images/casa-1-img-9.jpg',
            'images/casa-1-img-10.jpg',
            'images/casa-1-img-11.jpg',
            'images/casa-1-img-12.jpg',
            'images/casa-1-img-13.jpg',
            'images/casa-1-img-14.jpg',
            'images/casa-1-img-15.jpg',
            'images/casa-1-img-16.jpg'
        ]
    },
    'casa-2': {
        principal: 'images/casa-2-img-1.jpg',
        todas: [
            'images/casa-2-img-1.jpg',
            'images/casa-2-img-2.jpg',
            'images/casa-2-img-3.jpg',
            'images/casa-2-img-4.jpg',
            'images/casa-2-img-5.jpg',
            'images/casa-2-img-6.jpg',
            'images/casa-2-img-7.jpg',
            'images/casa-2-img-8.jpg',
            'images/casa-2-img-9.jpg',
            'images/casa-2-img-10.jpg',
            'images/casa-2-img-11.jpg',
            'images/casa-2-img-12.jpg',
            'images/casa-2-img-13.jpg',
            'images/casa-2-img-14.jpg',
            'images/casa-2-img-15.jpg',
            'images/casa-2-img-16.jpg',
            'images/casa-2-img-17.jpg',
            'images/casa-2-img-18.jpg',
            'images/casa-2-img-19.jpg',
            'images/casa-2-img-20.jpg',
            'images/casa-2-img-21.jpg',
            'images/casa-2-img-22.jpg',
            'images/casa-2-img-23.jpg',
            'images/casa-2-img-24.jpg',
            'images/casa-2-img-25.jpg'
        ]
    },
    'casa-3': {
        principal: 'images/casa-3-img-1.jpg',
        todas: [
            'images/casa-3-img-1.jpg',
            'images/casa-3-img-2.jpg',
            'images/casa-3-img-3.jpg',
            'images/casa-3-img-4.jpg',
            'images/casa-3-img-5.jpg',
            'images/casa-3-img-6.jpg',
            'images/casa-3-img-7.jpg',
            'images/casa-3-img-8.jpg',
            'images/casa-3-img-9.jpg',
            'images/casa-3-img-10.jpg',
            'images/casa-3-img-11.jpg',
            'images/casa-3-img-12.jpg',
            'images/casa-3-img-13.jpg',
            'images/casa-3-img-14.jpg',
            'images/casa-3-img-15.jpg',
            'images/casa-3-img-16.jpg',
            'images/casa-3-img-17.jpg',
            'images/casa-3-img-18.jpg',
            'images/casa-3-img-19.jpg',
            'images/casa-3-img-20.jpg',
            'images/casa-3-img-21.jpg',
            'images/casa-3-img-22.jpg',
            'images/casa-3-img-23.jpg'
        ]
    },
    'casa-4': {
        principal: 'images/casa-4-img-1.jpg',
        todas: [
            'images/casa-4-img-1.jpg',
            'images/casa-4-img-2.jpg',
            'images/casa-4-img-3.jpg',
            'images/casa-4-img-4.jpg',
            'images/casa-4-img-5.jpg',
            'images/casa-4-img-6.jpg',
            'images/casa-4-img-7.jpg',
            'images/casa-4-img-8.jpg',
            'images/casa-4-img-9.jpg',
            'images/casa-4-img-10.jpg',
            'images/casa-4-img-11.jpg',
            'images/casa-4-img-12.jpg',
            'images/casa-4-img-13.jpg',
            'images/casa-4-img-14.jpg',
            'images/casa-4-img-15.jpg',
            'images/casa-4-img-16.jpg',
            'images/casa-4-img-17.jpg',
            'images/casa-4-img-18.jpg',
            'images/casa-4-img-19.jpg',
            'images/casa-4-img-20.jpg',
            'images/casa-4-img-21.jpg',
            'images/casa-4-img-22.jpg',
            'images/casa-4-img-23.jpg',
            'images/casa-4-img-24.jpg',
            'images/casa-4-img-25.jpg',
            'images/casa-4-img-26.jpg',
            'images/casa-4-img-27.jpg'
        ]
    },
    'harmonia': {
        principal: 'images/WhatsApp Image 2025-12-18 at 13.50.03.jpeg',
        todas: [
            'images/WhatsApp Image 2025-12-18 at 13.50.03.jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.05 (1).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.05 (2).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.05 (3).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.05 (4).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.05 (5).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.05.jpeg'
        ]
    },
    'orquidea': {
        principal: 'images/suite-2-img-1.jpeg',
        todas: [
            'images/suite-2-img-1.jpeg',
            'images/suite-2-img-2.jpeg',
            'images/suite-2-img-3.jpeg',
            'images/suite-2-img-4.jpeg'
        ]
    },
    'imperial': {
        principal: 'images/WhatsApp Image 2025-12-18 at 13.50.06.jpeg',
        todas: [
            'images/WhatsApp Image 2025-12-18 at 13.50.06.jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.06 (1).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.06 (2).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.06 (3).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.06 (4).jpeg',
            'images/WhatsApp Image 2025-12-18 at 13.50.06 (5).jpeg'
        ]
    },
    'premium-vista': {
        principal: 'images/suite-4-img-1.jpeg',
        todas: [
            'images/suite-4-img-1.jpeg',
            'images/suite-4-img-2.jpeg',
            'images/suite-4-img-3.jpeg',
            'images/suite-4-img-4.jpeg',
            'images/suite-4-img-5.jpeg',
            'images/suite-4-img-6.jpeg',
            'images/suite-4-img-7.jpeg'
        ]
    },
    'deluxe': {
        principal: 'images/suite-5-img-1.jpg',
        todas: [
            'images/suite-5-img-1.jpg',
            'images/suite-5-img-2.jpg',
            'images/suite-5-img-3.jpg',
            'images/suite-5-img-4.jpg'
        ]
    },
    'executiva': {
        principal: 'images/suite-6-img-1.jpg',
        todas: [
            'images/suite-6-img-1.jpg',
            'images/suite-6-img-2.jpg',
            'images/suite-6-img-3.jpg',
            'images/suite-6-img-4.jpg',
            'images/suite-6-img-5.jpg',
            'images/suite-6-img-6.jpg'
        ]
    },
    'familia': {
        principal: 'images/suite-7-img-1.jpg',
        todas: [
            'images/suite-7-img-1.jpg',
            'images/suite-7-img-2.jpg',
            'images/suite-7-img-3.jpg',
            'images/suite-7-img-4.jpg'
        ]
    },
    'romantica': {
        principal: 'images/suite-8-img-1.jpg',
        todas: [
            'images/suite-8-img-1.jpg',
            'images/suite-8-img-2.jpg',
            'images/suite-8-img-3.jpg',
            'images/suite-8-img-4.jpg'
        ]
    }
};

// Processar todos os quartos para garantir que a imagem principal seja sempre a primeira
const quartosImagens = {};
Object.keys(quartosImagensRaw).forEach(quartoId => {
    quartosImagens[quartoId] = processarImagensQuarto(quartosImagensRaw[quartoId]);
});

