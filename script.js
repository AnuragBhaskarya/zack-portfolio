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
                    } else {
                        x += (baseSpeed * 0.15) * deltaScale;
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
    const originalCards = Array.from(document.querySelectorAll('.testimonial-card'));
    const numCards = originalCards.length;
    
    // 1. Clone cards for infinite loop
    originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        sliderTrack.appendChild(clone);
    });
    // Clone to start (reverse to maintain order when using insertBefore)
    originalCards.slice().reverse().forEach(card => {
        const clone = card.cloneNode(true);
        sliderTrack.insertBefore(clone, sliderTrack.firstChild);
    });
    
    const allCards = document.querySelectorAll('.testimonial-card');
    
    let currentIndex = numCards; // Start at the first original card
    let cachedCardWidth = 0;
    let cachedGap = 0;

    function calculateSliderMetrics() {
        if (allCards.length === 0) return;
        cachedCardWidth = allCards[0].offsetWidth;
        const style = window.getComputedStyle(sliderTrack);
        cachedGap = parseFloat(style.gap) || 0;
    }

    // Initial calculation
    calculateSliderMetrics();
    
    function updateSliderPosition(animate = true) {
        if (allCards.length === 0) return;
        
        if (!animate) {
            sliderTrack.style.transition = 'none';
        } else {
            sliderTrack.style.transition = '';
        }
        
        const moveDistance = (cachedCardWidth + cachedGap) * currentIndex;
        sliderTrack.style.transform = `translateX(-${moveDistance}px)`;
        
        // Force reflow if we disabled transition, so it applies instantly
        if (!animate) {
            sliderTrack.offsetHeight; 
            sliderTrack.style.transition = ''; 
        }
    }

    // Initial positioning without animation
    updateSliderPosition(false);

    let isAnimating = false;

    function lockAnimation() {
        isAnimating = true;
        setTimeout(() => {
            isAnimating = false;
        }, 500); // matches the 0.5s CSS transition
    }

    // Seamless jump after transition ends
    sliderTrack.addEventListener('transitionend', () => {
        if (currentIndex >= numCards * 2) {
            currentIndex -= numCards;
            updateSliderPosition(false);
        } else if (currentIndex < numCards) {
            currentIndex += numCards;
            updateSliderPosition(false);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (isAnimating) return;
        currentIndex++;
        updateSliderPosition(true);
        lockAnimation();
    });

    prevBtn.addEventListener('click', () => {
        if (isAnimating) return;
        currentIndex--;
        updateSliderPosition(true);
        lockAnimation();
    });

    // Update on window resize to keep it aligned
    window.addEventListener('resize', () => {
        calculateSliderMetrics();
        updateSliderPosition(false); // Snap to position on resize
    });

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
    const lazyElements = document.querySelectorAll('section:not(.hero) .badge, .faq-banner-container, .section-title, .accordion-item, .footer-col');
    
    lazyElements.forEach(el => {
        el.classList.add('lazy-anim');
        animObserver.observe(el);
    });

    // Add slight stagger to footer columns
    const footerCols = document.querySelectorAll('.footer-col');
    footerCols.forEach((col, i) => {
        col.style.transitionDelay = `${i * 0.15}s`;
    });

    // Only add lazy load animation to the originally visible first 3 testimonial cards
    const lazyTestimonialCards = document.querySelectorAll('.testimonial-card');
    // We added numCards clones at the beginning, so original cards start at index numCards
    lazyTestimonialCards.forEach((card, i) => {
        if (i >= numCards && i < numCards + 3) {
            card.classList.add('lazy-anim');
            card.style.transitionDelay = `${(i - numCards) * 0.15}s`;
            animObserver.observe(card);
        }
    });


    // --- Handwriting Animations ---
    const handwrittenElements = document.querySelectorAll('.handwritten-annotation, .faq-handwritten');
    
    handwrittenElements.forEach(container => {
        const textSpan = container.querySelector('span');
        const arrow = container.querySelector('svg, i');
        
        if (textSpan) {
            const text = textSpan.textContent;
            textSpan.textContent = '';
            textSpan.classList.add('handwriting-text');
            
            let delayCount = 0;
            for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.textContent = text[i] === ' ' ? '\u00A0' : text[i];
                if (text[i] !== ' ') {
                    charSpan.style.animationDelay = `${delayCount * 0.05}s`;
                    delayCount++;
                }
                textSpan.appendChild(charSpan);
            }
        }
        
        if (arrow) {
            arrow.classList.add('handwriting-arrow');
        }
    });

    setTimeout(() => {
        const heroHandwritten = document.querySelector('.hero-cta .handwritten-annotation');
        if (heroHandwritten) {
            const arrow = heroHandwritten.querySelector('.handwriting-arrow');
            const text = heroHandwritten.querySelector('.handwriting-text');
            if (arrow) arrow.classList.add('animate');
            setTimeout(() => {
                if (text) text.classList.add('animate');
            }, 150); 
        }
    }, 1800); 

    // --- FAQ Banner Animations ---
    const faqBannerContainer = document.querySelector('.faq-banner-container');
    if (faqBannerContainer) {
        const orangeSpan = faqBannerContainer.querySelector('.orange-banner span');
        const whiteSpan = faqBannerContainer.querySelector('.white-banner span');
        
        const splitText = (span, baseDelay) => {
            if (!span) return;
            const text = span.textContent;
            span.textContent = '';
            let delayCount = 0;
            for (let i = 0; i < text.length; i++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'banner-char';
                charSpan.textContent = text[i] === ' ' ? '\u00A0' : text[i];
                if (text[i] !== ' ') {
                    // Calculate precise delay: base + stagger
                    charSpan.style.animationDelay = `${baseDelay + (delayCount * 0.04)}s`;
                    delayCount++;
                }
                span.appendChild(charSpan);
            }
        };

        // Orange banner bg wipe takes 0.4s, start text at 0.2s
        splitText(orangeSpan, 0.2);
        // Orange text finishes around 1.1s. Start white bg wipe at 1.1s, start text at 1.3s
        splitText(whiteSpan, 1.3);

        const bannerObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('start-anim');
                    observer.unobserve(entry.target);
                    
                    // Trigger "Let's clear things up" after banners finish (approx 2300ms)
                    setTimeout(() => {
                        const faqHandwritten = document.querySelector('.faq-handwritten');
                        if (faqHandwritten) {
                            const arrow = faqHandwritten.querySelector('.handwriting-arrow');
                            const text = faqHandwritten.querySelector('.handwriting-text');
                            if (arrow) arrow.classList.add('animate');
                            setTimeout(() => {
                                if (text) text.classList.add('animate');
                            }, 150);
                        }
                    }, 2300);
                }
            });
        }, { threshold: 0.5 });
        
        bannerObserver.observe(faqBannerContainer);
    }

    const hwObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const arrow = entry.target.querySelector('.handwriting-arrow');
                const text = entry.target.querySelector('.handwriting-text');
                if (arrow) arrow.classList.add('animate');
                setTimeout(() => {
                    if (text) text.classList.add('animate');
                }, 150);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
});
