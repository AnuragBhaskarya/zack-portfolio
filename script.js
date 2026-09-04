document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Lenis Smooth Scrolling ---
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // --- Align Duplicate Tracks in Portfolio ---
    function alignTracks() {
        const hero = document.querySelector('.hero');
        const portfolio = document.querySelector('.portfolio');
        
        const portLeft = document.getElementById('portfolio-tracks-left');
        const portRight = document.getElementById('portfolio-tracks-right');
        
        if (hero && portfolio && portLeft && portRight) {
            // Calculate distance between top of hero and top of portfolio
            // Since they are both in the same offsetParent (<main>), we can just subtract offsetTops
            const offsetDiff = hero.offsetTop - portfolio.offsetTop;
            
            // The original tracks are at top: 350px relative to hero.
            // To match, the portfolio tracks must be shifted by offsetDiff.
            const newTop = 350 + offsetDiff;
            
            portLeft.style.top = `${newTop}px`;
            portRight.style.top = `${newTop}px`;
        }
    }
    
    window.addEventListener('resize', alignTracks);
    // Use setTimeout to ensure layout is done
    setTimeout(alignTracks, 50);

    // --- Defer Portfolio Track Animations Until Near Viewport ---
    const portfolio = document.getElementById('portfolio');
    if (portfolio) {
        const trackObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    portfolio.querySelectorAll('.tracks-deferred').forEach(el => {
                        el.classList.add('tracks-active');
                    });
                    // Also run alignTracks once portfolio becomes visible
                    alignTracks();
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '300px 0px', threshold: 0 });
        trackObserver.observe(portfolio);
    }

    // --- High-Performance Interactive Marquee Logic (from moviescracked) ---
    function initInteractiveMarquees() {
        const isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const tracks = document.querySelectorAll('.marquee-track');
        
        tracks.forEach(track => {
            if (track.dataset.initialized) return;
            track.dataset.initialized = 'true';

            const isLeft = track.classList.contains('left');
            const baseSpeed = isLeft ? -0.8 : 0.8;
            
            const wrapper = track.closest('.marquee-row-wrapper');
            
            let x = 0;
            let lastRenderedX = NaN;
            let velocity = 0;
            let isDragging = false;
            let hasMoved = false;
            let isScrolling = false;
            let isHovered = false;
            let alive = true;
            let frameCount = 0;
            
            let startX = 0;
            let startY = 0;
            let startTranslate = 0;
            let lastX = 0;
            let lastTime = 0;
            let cachedWrapDist = 0;

            if (isHoverDevice && wrapper) {
                wrapper.addEventListener('mouseenter', () => { isHovered = true; });
                wrapper.addEventListener('mouseleave', () => { isHovered = false; });
            }

            track.style.animation = 'none';
            track.style.transition = 'none';

            const cachedGroup = track.querySelector('.marquee-group');
            function measureWrapDist() {
                if (!track.isConnected || !cachedGroup) { cachedWrapDist = 0; return; }
                const gap = window.innerWidth <= 768 ? 12 : 24;
                cachedWrapDist = cachedGroup.offsetWidth + gap;
            }
            
            let resizeTimeout = null;
            let resizeListener = () => {
                if (resizeTimeout) clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    measureWrapDist();
                    resizeTimeout = null;
                }, 100);
            };
            window.addEventListener('resize', resizeListener);

            function wrapOffset(val) {
                if (cachedWrapDist <= 0) return val;
                val = val % cachedWrapDist;
                if (val > 0) val -= cachedWrapDist;
                return val;
            }

            function onStart(clientX, clientY) {
                isDragging = true;
                hasMoved = false;
                isScrolling = false;
                velocity = 0;
                startX = clientX;
                startY = clientY || 0;
                startTranslate = x;
                lastX = clientX;
                lastTime = performance.now();
                
                window.addEventListener('mousemove', onMouseMoveWindow);
                window.addEventListener('mouseup', onMouseUpWindow);
            }

            function onMove(clientX, clientY, e) {
                if (!isDragging) return;
                
                if (clientY !== undefined && !isScrolling) {
                    const dy = Math.abs(clientY - startY);
                    const dx = Math.abs(clientX - startX);
                    if (dy > dx && dy > 10) {
                        isScrolling = true;
                        isDragging = false;
                        return;
                    }
                }

                if (isScrolling) return;

                if (e && e.cancelable) {
                    e.preventDefault();
                }

                const dx = clientX - startX;
                
                if (Math.abs(dx) > 5) {
                    hasMoved = true;
                }
                
                x = wrapOffset(startTranslate + dx);
                
                const now = performance.now();
                const dt = now - lastTime;
                const dist = clientX - lastX;
                if (dt > 0) {
                    const instantVel = (dist / dt) * 16.666;
                    velocity = velocity * 0.6 + instantVel * 0.4;
                }
                
                lastX = clientX;
                lastTime = now;
                track.style.transform = 'translate3d(' + x + 'px,0,0)';
            }

            function onEnd() {
                if (!isDragging) return;
                isDragging = false;
                
                if (hasMoved) {
                    window._marqueeJustDragged = true;
                    setTimeout(() => { window._marqueeJustDragged = false; }, 100);
                }
                
                window.removeEventListener('mousemove', onMouseMoveWindow);
                window.removeEventListener('mouseup', onMouseUpWindow);
            }

            function onMouseMoveWindow(e) {
                onMove(e.clientX, e.clientY, e);
            }

            function onMouseUpWindow() {
                onEnd();
            }

            track.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                onStart(e.clientX, e.clientY);
            });

            track.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });

            track.addEventListener('touchstart', (e) => {
                onStart(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });

            track.addEventListener('touchmove', (e) => {
                onMove(e.touches[0].clientX, e.touches[0].clientY, e);
            }, { passive: false });

            track.addEventListener('touchend', () => {
                onEnd();
            });

            let lastFrameTime = NaN;

            function tick(now) {
                if (!alive) return;
                if (++frameCount >= 60) {
                    frameCount = 0;
                    if (!track.isConnected) return;
                }

                if (!now) now = performance.now();
                if (isNaN(lastFrameTime)) lastFrameTime = now;
                const dt = now - lastFrameTime;
                lastFrameTime = now;

                const deltaScale = Math.min(100, dt) / 16.666;

                if (!isDragging) {
                    if (Math.abs(velocity) > 0.1) {
                        x += velocity * deltaScale;
                        velocity *= Math.pow(0.94, deltaScale);
                    } else {
                        velocity = 0;
                    }

                    if (!isHovered) {
                        x += baseSpeed * deltaScale;
                    }
                    
                    x = wrapOffset(x);

                    if (x !== lastRenderedX) {
                        lastRenderedX = x;
                        track.style.transform = 'translate3d(' + x + 'px,0,0)';
                    }
                } else {
                    lastFrameTime = now;
                }
                
                requestAnimationFrame(tick);
            }

            requestAnimationFrame(() => {
                if (!alive || !track.isConnected) return;
                measureWrapDist();
                tick();
                
                if (wrapper) {
                    wrapper.classList.add('visible');
                }
            });
        });
    }

    // Initialize the marquees
    initInteractiveMarquees();

    // --- Mobile Menu Toggle ---
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const menuIcon = menuToggle.querySelector('i');
    let isMenuOpen = false;

    menuToggle.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileNav.classList.add('active');
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-xmark');
        } else {
            mobileNav.classList.remove('active');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        }
    });

    // Close menu when a link is clicked
    const navLinks = mobileNav.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            isMenuOpen = false;
            mobileNav.classList.remove('active');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        });
    });

    // --- Accordion Logic (FAQ) ---
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            // Close other items
            accordionItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // --- Testimonials Slider Logic ---
    const sliderTrack = document.getElementById('sliderTrack');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const cards = document.querySelectorAll('.testimonial-card');
    
    let currentIndex = 0;
    
    function updateSliderPosition() {
        if (cards.length === 0) return;
        
        // Calculate the width of one card + gap
        const cardWidth = cards[0].offsetWidth;
        const style = window.getComputedStyle(sliderTrack);
        const gap = parseFloat(style.gap) || 0;
        
        const moveDistance = (cardWidth + gap) * currentIndex;
        sliderTrack.style.transform = `translateX(-${moveDistance}px)`;
    }

    nextBtn.addEventListener('click', () => {
        // Calculate max index based on view width
        const trackWidth = sliderTrack.scrollWidth;
        const containerWidth = sliderTrack.parentElement.offsetWidth;
        // Simple logic: move right until the end
        if (currentIndex < cards.length - 1) {
            currentIndex++;
            updateSliderPosition();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSliderPosition();
        }
    });

    // Update on window resize to keep it aligned
    window.addEventListener('resize', updateSliderPosition);

    // --- Intersection Observer for Lazy Animations ---
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const animObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select elements to lazily animate (excluding hero section which has keyframes)
    const lazyElements = document.querySelectorAll('section:not(.hero) .badge, .faq-container, .section-title, .testimonials-slider, .footer-col');
    
    lazyElements.forEach(el => {
        el.classList.add('lazy-anim');
        animObserver.observe(el);
    });

    // Add slight stagger to footer columns
    const footerCols = document.querySelectorAll('.footer-col');
    footerCols.forEach((col, i) => {
        col.style.transitionDelay = `${i * 0.15}s`;
    });
});
