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
        
        if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
            mediaFullyExpanded = false;
            scrollProgress = 0;
            e.preventDefault();
            updateUI();
        } else if (!mediaFullyExpanded) {
            e.preventDefault();
            const scrollDelta = e.deltaY * 0.0009;
            scrollProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
            updateUI();
        }
    }

    // Handle touch start
    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    // Handle touch move
    function handleTouchMove(e) {
        elements = getActiveElements();
        const section = elements.section;
        if (!touchStartY || !section) return;

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;

        if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
            mediaFullyExpanded = false;
            scrollProgress = 0;
            e.preventDefault();
            updateUI();
        } else if (!mediaFullyExpanded) {
            e.preventDefault();
            const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
            const scrollDelta = deltaY * scrollFactor;
            scrollProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
            updateUI();
            touchStartY = touchY;
        }
    }

    // Handle touch end
    function handleTouchEnd() {
        touchStartY = 0;
    }

    // Handle window scroll
    function handleScroll() {
        if (!mediaFullyExpanded) {
            window.scrollTo(0, 0);
        }
    }

    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    // Initialize
    updateUI();
});

