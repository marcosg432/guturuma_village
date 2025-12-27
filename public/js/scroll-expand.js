// Scroll Expand Banner - JavaScript Vanilla
document.addEventListener('DOMContentLoaded', function() {
    let scrollProgress = 0;
    let showContent = false;
    let mediaFullyExpanded = false;
    let touchStartY = 0;
    let isMobile = window.innerWidth < 768;

    // Detectar qual versão está visível (desktop ou mobile)
    function getActiveElements() {
        const isMobileView = window.innerWidth < 768;
        return {
            section: document.getElementById(isMobileView ? 'scroll-expand-section-mobile' : 'scroll-expand-section'),
            bgElement: document.getElementById(isMobileView ? 'scroll-expand-bg-mobile' : 'scroll-expand-bg'),
            mediaElement: document.getElementById(isMobileView ? 'scroll-expand-media-mobile' : 'scroll-expand-media'),
            titleFirst: document.getElementById(isMobileView ? 'title-first-mobile' : 'title-first'),
            titleRest: document.getElementById(isMobileView ? 'title-rest-mobile' : 'title-rest'),
            scrollHint: document.getElementById(isMobileView ? 'scroll-hint-mobile' : 'scroll-hint')
        };
    }

    let elements = getActiveElements();
    const section = elements.section;

    if (!section) return;

    // Check if mobile
    function checkMobile() {
        isMobile = window.innerWidth < 768;
        elements = getActiveElements();
    }
    
    checkMobile();

    window.addEventListener('resize', checkMobile);

    // Update UI based on scroll progress
    function updateUI() {
        // Atualizar elementos ativos
        elements = getActiveElements();
        const { bgElement, mediaElement, titleFirst, titleRest, scrollHint } = elements;
        
        const mediaWidth = 300 + scrollProgress * (isMobile ? 650 : 1250);
        const mediaHeight = 400 + scrollProgress * (isMobile ? 200 : 400);
        const textTranslateX = scrollProgress * (isMobile ? 180 : 150);

        // Ajustar tamanhos iniciais para mobile
        const initialWidth = isMobile ? 250 : 300;
        const initialHeight = isMobile ? 300 : 400;
        const finalWidth = initialWidth + scrollProgress * (isMobile ? 650 : 1250);
        const finalHeight = initialHeight + scrollProgress * (isMobile ? 200 : 400);

        // Update media size
        if (mediaElement) {
            mediaElement.style.width = `${finalWidth}px`;
            mediaElement.style.height = `${finalHeight}px`;
            mediaElement.style.maxWidth = '95vw';
            mediaElement.style.maxHeight = '85vh';
        }

        // Update background opacity
        if (bgElement) {
            bgElement.style.opacity = Math.max(0, 1 - scrollProgress);
        }

        // Update media overlay opacity
        const overlay = mediaElement ? mediaElement.querySelector('.media-overlay') : null;
        if (overlay) {
            overlay.style.opacity = Math.max(0, 0.5 - scrollProgress * 0.3);
        }

        // Update text position
        if (titleFirst) {
            titleFirst.style.transform = `translateX(-${textTranslateX}vw)`;
        }
        if (titleRest) {
            titleRest.style.transform = `translateX(${textTranslateX}vw)`;
        }

        // Update scroll hint
        if (scrollHint) {
            scrollHint.style.transform = `translateX(${textTranslateX}vw)`;
            scrollHint.style.opacity = Math.max(0, 1 - scrollProgress);
        }

        // Show/hide content section (removed - no longer needed)
        if (scrollProgress >= 1) {
            mediaFullyExpanded = true;
            showContent = true;
        } else if (scrollProgress < 0.75) {
            showContent = false;
        }
    }

    // Handle wheel scroll
    function handleWheel(e) {
        elements = getActiveElements();
        const section = elements.section;
        if (!section) return;
        
        // Se o banner já foi expandido, permitir scroll normal
        if (mediaFullyExpanded) {
            // Se está tentando rolar para cima e está no topo, resetar
            if (e.deltaY < 0 && window.scrollY <= 5) {
                mediaFullyExpanded = false;
                scrollProgress = 0;
                e.preventDefault();
                updateUI();
            }
            // Caso contrário, permitir scroll normal
            return;
        }
        
        // Se está tentando rolar para baixo e o progresso já está alto, permitir scroll normal
        if (e.deltaY > 0 && scrollProgress > 0.8) {
            // Permitir scroll normal - não fazer preventDefault
            return;
        }
        
        // Apenas interceptar scroll durante a animação inicial do banner
        if (!mediaFullyExpanded && scrollProgress < 0.8) {
            e.preventDefault();
            const scrollDelta = e.deltaY * 0.0009;
            scrollProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
            updateUI();
            
            // Se chegou perto do final, marcar como expandido
            if (scrollProgress >= 0.8) {
                mediaFullyExpanded = true;
                scrollProgress = 1;
                updateUI();
            }
        }
    }

    // Handle touch start
    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    // Contador de tentativas de scroll no mobile
    let mobileScrollAttempts = 0;

    // Handle touch move
    function handleTouchMove(e) {
        elements = getActiveElements();
        const section = elements.section;
        if (!touchStartY || !section) return;

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;

        // No mobile: NUNCA bloquear scroll - sempre permitir scroll natural
        if (isMobile) {
            // Apenas atualizar progresso visualmente se necessário, mas nunca bloquear scroll
            if (deltaY < 0 && scrollProgress < 1) {
                // Atualizar progresso visualmente enquanto permite scroll natural
                scrollProgress = Math.min(1, scrollProgress + 0.1);
                updateUI();
            }
            // NUNCA fazer preventDefault no mobile - permitir scroll natural sempre
            return;
        }

        // DESKTOP: lógica original mantida
        // Se o banner já foi expandido, permitir scroll normal
        if (mediaFullyExpanded) {
            // Se está tentando rolar para cima e está no topo, resetar
            if (deltaY < -20 && window.scrollY <= 5) {
                mediaFullyExpanded = false;
                scrollProgress = 0;
                mobileScrollAttempts = 0;
                e.preventDefault();
                updateUI();
            }
            // Caso contrário, permitir scroll normal (não fazer preventDefault)
            return;
        }

        // Se está tentando rolar para baixo (deltaY negativo) e o progresso já está alto, permitir scroll normal
        if (deltaY < 0 && scrollProgress > 0.5) {
            // Permitir scroll normal - não fazer preventDefault
            mediaFullyExpanded = true;
            scrollProgress = 1;
            updateUI();
            return;
        }

        // Apenas interceptar scroll durante a animação inicial do banner (apenas no desktop)
        if (!mediaFullyExpanded && scrollProgress < 0.5) {
            e.preventDefault();
            const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
            const scrollDelta = deltaY * scrollFactor;
            scrollProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
            updateUI();
            touchStartY = touchY;
        } else if (scrollProgress >= 0.5) {
            // Se chegou perto do final, permitir scroll normal
            mediaFullyExpanded = true;
            scrollProgress = 1;
            updateUI();
        }
    }

    // Handle touch end
    function handleTouchEnd() {
        touchStartY = 0;
        // Se o progresso está alto, marcar como expandido para permitir scroll normal
        if (scrollProgress >= 0.5) {
            mediaFullyExpanded = true;
            scrollProgress = 1;
            updateUI();
        }
        // No mobile: se houve tentativas de scroll, garantir que está liberado
        if (isMobile && mobileScrollAttempts > 0) {
            mediaFullyExpanded = true;
            scrollProgress = 1;
            updateUI();
        }
        // Resetar contador após um tempo
        setTimeout(() => {
            mobileScrollAttempts = 0;
        }, 2000);
    }

    // Handle window scroll
    function handleScroll() {
        // Se o banner já foi expandido, permitir scroll normal
        if (mediaFullyExpanded) {
            return;
        }
        
        // No mobile: SEMPRE permitir scroll - nunca bloquear
        if (isMobile) {
            // Se detectou qualquer movimento de scroll, liberar imediatamente
            if (window.scrollY > 0) {
                mediaFullyExpanded = true;
                scrollProgress = 1;
                updateUI();
            }
            return; // Nunca bloquear scroll no mobile
        }
        
        // Desktop: apenas bloquear scroll se ainda estiver na animação inicial e no topo
        if (window.scrollY > 5) {
            mediaFullyExpanded = true;
            scrollProgress = 1;
            updateUI();
            return;
        }
        
        // Desktop: apenas bloquear scroll se ainda estiver na animação inicial e no topo
        if (!mediaFullyExpanded && window.scrollY > 0 && scrollProgress < 0.7) {
            window.scrollTo(0, 0);
        }
    }

    // No mobile: garantir que scroll funcione sempre
    if (isMobile) {
        // Garantir que o body permita scroll vertical
        document.body.style.overflowY = 'auto';
        document.documentElement.style.overflowY = 'auto';
    }

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    // No mobile: usar listeners passivos para não bloquear scroll
    // No desktop: usar listeners não-passivos para interceptar scroll
    if (isMobile) {
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
    } else {
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    }

    // Initialize
    updateUI();
});

