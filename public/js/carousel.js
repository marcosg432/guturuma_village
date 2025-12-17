// Sistema de carrossel para quartos
let currentSlide = {};

function initCarousel(carouselId) {
    const carousel = document.getElementById(`carousel-${carouselId}`);
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    const indicators = document.getElementById(`indicators-${carouselId}`);
    
    currentSlide[carouselId] = 0;

    // Criar indicadores
    if (indicators) {
        indicators.innerHTML = '';
        slides.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = 'carousel-indicator' + (index === 0 ? ' active' : '');
            indicator.onclick = () => goToSlide(carouselId, index);
            indicators.appendChild(indicator);
        });
    }
}

function moveCarousel(carouselId, direction) {
    const carousel = document.getElementById(`carousel-${carouselId}`);
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;

    currentSlide[carouselId] = (currentSlide[carouselId] + direction + totalSlides) % totalSlides;
    
    carousel.style.transform = `translateX(-${currentSlide[carouselId] * 100}%)`;
    
    // Atualizar indicadores
    const indicators = document.querySelectorAll(`#indicators-${carouselId} .carousel-indicator`);
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide[carouselId]);
    });
}

function goToSlide(carouselId, slideIndex) {
    const carousel = document.getElementById(`carousel-${carouselId}`);
    if (!carousel) return;

    currentSlide[carouselId] = slideIndex;
    carousel.style.transform = `translateX(-${currentSlide[carouselId] * 100}%)`;
    
    // Atualizar indicadores
    const indicators = document.querySelectorAll(`#indicators-${carouselId} .carousel-indicator`);
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide[carouselId]);
    });
}

// Inicializar carrosséis ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    initCarousel('harmonia');
    initCarousel('orquidea');
    initCarousel('imperial');

    // Auto-play opcional (descomentar se desejar)
    // setInterval(() => {
    //     Object.keys(currentSlide).forEach(id => {
    //         moveCarousel(id, 1);
    //     });
    // }, 5000);
});





