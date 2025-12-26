// Menu mobile toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Fechar menu ao clicar em link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Animação ao scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Carrossel do Resort
    let currentResortSlide = 0;
    const resortSlides = document.querySelectorAll('.resort-carousel-slide');
    const resortTrack = document.getElementById('resort-carousel-track');
    const resortPrevBtn = document.getElementById('resort-carousel-prev');
    const resortNextBtn = document.getElementById('resort-carousel-next');
    const resortIndicators = document.getElementById('resort-carousel-indicators');

    if (resortSlides.length > 0) {
        // Criar indicadores
        resortSlides.forEach((_, index) => {
            const indicator = document.createElement('span');
            indicator.className = 'resort-indicator';
            indicator.style.cssText = 'width: 12px; height: 12px; border-radius: 50%; background: ' + (index === 0 ? '#667eea' : '#ccc') + '; cursor: pointer; transition: background 0.3s ease;';
            indicator.onclick = () => goToResortSlide(index);
            resortIndicators.appendChild(indicator);
        });

        // Função para ir para slide específico
        function goToResortSlide(index) {
            currentResortSlide = index;
            updateResortCarousel();
        }

        // Função para atualizar carrossel
        function updateResortCarousel() {
            if (resortTrack) {
                resortTrack.style.transform = `translateX(-${currentResortSlide * 100}%)`;
            }
            
            // Atualizar indicadores
            const indicators = resortIndicators.querySelectorAll('.resort-indicator');
            indicators.forEach((ind, idx) => {
                ind.style.background = idx === currentResortSlide ? '#667eea' : '#ccc';
            });
        }

        // Botão anterior
        if (resortPrevBtn) {
            resortPrevBtn.addEventListener('click', () => {
                currentResortSlide = (currentResortSlide - 1 + resortSlides.length) % resortSlides.length;
                updateResortCarousel();
            });
        }

        // Botão próximo
        if (resortNextBtn) {
            resortNextBtn.addEventListener('click', () => {
                currentResortSlide = (currentResortSlide + 1) % resortSlides.length;
                updateResortCarousel();
            });
        }

        // Velocidade padrão do carrossel (em milissegundos) - TODOS os carrosséis usam esta velocidade
        const CAROUSEL_SPEED = 3000; // 3 segundos
        
        // Auto-play carrossel
        let autoPlayInterval = setInterval(() => {
            currentResortSlide = (currentResortSlide + 1) % resortSlides.length;
            updateResortCarousel();
        }, CAROUSEL_SPEED);

        // Hover para pausar auto-play
        const carouselWrapper = document.querySelector('.resort-carousel-wrapper');
        if (carouselWrapper) {
            carouselWrapper.addEventListener('mouseenter', () => {
                clearInterval(autoPlayInterval);
            });
            carouselWrapper.addEventListener('mouseleave', () => {
                autoPlayInterval = setInterval(() => {
                    currentResortSlide = (currentResortSlide + 1) % resortSlides.length;
                    updateResortCarousel();
                }, CAROUSEL_SPEED);
            });
        }
    }
});





