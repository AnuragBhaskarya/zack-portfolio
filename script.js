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

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    lenis.scrollTo(0, { immediate: true });
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.addEventListener('beforeunload', () => {
        window.scrollTo(0, 0);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    lenis.scrollTo(targetEl, { duration: 1.2 });
                    history.pushState(null, '', targetId);
                }
            }
        });
    });

    // Mobile Menu
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

    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            isMenuOpen = false;
            mobileNav.classList.remove('active');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        });
    });

    // Static Animations (Independent of dynamic data)
    initStaticAnimations();

    // Load Dynamic Data
    loadDynamicContent();

    async function loadDynamicContent() {
        try {
            const response = await fetch('/api/public/content');
            if (!response.ok) throw new Error('Failed to fetch content');
            const data = await response.json();
            
            renderThumbnails(data.thumbnails);
            renderFAQs(data.faqs);
            renderReviews(data.reviews);
            
            // Initialize components depending on dynamic data
            initInteractiveMarquees();
            alignTracks(); // Trigger track alignment
            initAccordion();
            initSlider();
            initMobileGrid();
            observeLazyElements();
        } catch (err) {
            console.error("Error loading dynamic content:", err);
            // Fallback or handle error
        }
    }

    function renderThumbnails(thumbnails) {
        if (!thumbnails || thumbnails.length === 0) return;

        // Populate Mobile Grid
        const grid = document.getElementById('portfolioGrid');
        if (grid) {
            grid.innerHTML = '';
            thumbnails.forEach(t => {
                const wrapper = document.createElement('div');
                wrapper.className = 'thumb-wrapper';
                
                const img = document.createElement('img');
                img.src = t.url || t.image_base64; // Handle both formats just in case
                img.alt = 'Thumbnail';
                img.className = 'grid-thumb';
                img.loading = 'lazy';
                
                wrapper.appendChild(img);
                grid.appendChild(wrapper);
            });
        }

        // Populate Marquees
        // Distribute thumbnails evenly across 3 tracks
        const track1 = document.getElementById('marqueeTrack1');
        const track2 = document.getElementById('marqueeTrack2');
        const track3 = document.getElementById('marqueeTrack3');
        
        if (track1 && track2 && track3) {
            const third = Math.ceil(thumbnails.length / 3);
            const p1 = thumbnails.slice(0, third);
            const p2 = thumbnails.slice(third, third * 2);
            const p3 = thumbnails.slice(third * 2);

            const buildGroup = (arr) => arr.map(t => `<img src="${t.image_base64}" alt="Thumbnail" class="thumb-card">`).join('');
            
            track1.innerHTML = `<div class="marquee-group">${buildGroup(p1)}</div><div class="marquee-group">${buildGroup(p1)}</div>`;
            track2.innerHTML = `<div class="marquee-group">${buildGroup(p2)}</div><div class="marquee-group">${buildGroup(p2)}</div>`;
            track3.innerHTML = `<div class="marquee-group">${buildGroup(p3)}</div><div class="marquee-group">${buildGroup(p3)}</div>`;
        }
    }

    function renderFAQs(faqs) {
        const acc = document.getElementById('faqAccordion');
        if (!acc || !faqs || faqs.length === 0) return;
        acc.innerHTML = '';
        faqs.forEach((faq, index) => {
            acc.innerHTML += `
                <div class="accordion-item">
                    <div class="accordion-header">
                        <h3>${index + 1}. ${faq.question}</h3>
                        <div class="icon-toggle"><i class="fa-solid fa-plus"></i></div>
                    </div>
                    <div class="accordion-content">
                        <p>${faq.answer}</p>
                    </div>
                </div>
            `;
        });
    }

    function renderReviews(reviews) {
        const track = document.getElementById('sliderTrack');
        if (!track || !reviews || reviews.length === 0) return;
        track.innerHTML = '';
        reviews.forEach(r => {
            const stars = Array(r.rating).fill('<i class="fa-solid fa-star"></i>').join('');
            track.innerHTML += `
                <div class="testimonial-card">
                    <p class="quote">"${r.quote}"</p>
                    <div class="testimonial-footer">
                        <div class="client-info">
                            <img src="${r.avatar_base64 || 'https://files.catbox.moe/1z0zdx.png'}" alt="Client" class="client-avatar">
                            <div>
                                <h5 class="client-name">${r.client_name}</h5>
                                <span class="client-role">— ${r.role}</span>
                            </div>
                        </div>
                        <div class="rating">${stars}</div>
                    </div>
                </div>
            `;
        });
    }

    function initAccordion() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        accordionItems.forEach(item => {
            const header = item.querySelector('.accordion-header');
            header.addEventListener('click', () => {
                accordionItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
            });
        });
    }

    function initSlider() {
        const sliderTrack = document.getElementById('sliderTrack');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        const originalCards = Array.from(document.querySelectorAll('.testimonial-card'));
        if (originalCards.length === 0) return;
        
        const numCards = originalCards.length;
        
        originalCards.forEach(card => {
            sliderTrack.appendChild(card.cloneNode(true));
        });
        originalCards.slice().reverse().forEach(card => {
            sliderTrack.insertBefore(card.cloneNode(true), sliderTrack.firstChild);
        });
        
        const allCards = document.querySelectorAll('.testimonial-card');
        let currentIndex = numCards;
        let cachedCardWidth = 0;
        let cachedGap = 0;

        function calculateSliderMetrics() {
            cachedCardWidth = allCards[0].offsetWidth;
            const style = window.getComputedStyle(sliderTrack);
            cachedGap = parseFloat(style.gap) || 0;
        }
        calculateSliderMetrics();
        
        function updateSliderPosition(animate = true) {
            if (!animate) sliderTrack.style.transition = 'none';
            else sliderTrack.style.transition = '';
            
            const moveDistance = (cachedCardWidth + cachedGap) * currentIndex;
            sliderTrack.style.transform = `translateX(-${moveDistance}px)`;
            
            if (!animate) {
                sliderTrack.offsetHeight; 
                sliderTrack.style.transition = ''; 
            }
        }
        updateSliderPosition(false);

        let isAnimating = false;
        function lockAnimation() {
            isAnimating = true;
            setTimeout(() => { isAnimating = false; }, 500);
        }

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

        window.addEventListener('resize', () => {
            calculateSliderMetrics();
            updateSliderPosition(false);
        });
    }

    function initMobileGrid() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const portfolioGrid = document.getElementById('portfolioGrid');
        if (!loadMoreBtn || !portfolioGrid) return;

        const gridWrappers = portfolioGrid.querySelectorAll('.thumb-wrapper');
        const initialCount = 12;
        let shown = initialCount;

        gridWrappers.forEach((wrapper, i) => {
            if (i >= initialCount) wrapper.classList.add('grid-thumb-hidden');
        });

        if (shown >= gridWrappers.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = '';
        }

        function whenImageLoaded(img, callback) {
            if (img.complete && img.naturalWidth > 0) callback();
            else {
                const handleDone = () => {
                    img.removeEventListener('load', handleDone);
                    img.removeEventListener('error', handleDone);
                    callback();
                };
                img.addEventListener('load', handleDone);
                img.addEventListener('error', handleDone);
            }
        }

        function staggerReveal(wrappers, baseDelay) {
            let delay = baseDelay || 0;
            const ITEM_DELAY = 120;
            const ordered = [];
            for (let i = 0; i < wrappers.length; i += 2) {
                ordered.push(wrappers[i]);
                if (i + 1 < wrappers.length) ordered.push(wrappers[i + 1]);
            }
            ordered.forEach((wrapper) => {
                setTimeout(() => {
                    const img = wrapper.querySelector('.grid-thumb');
                    whenImageLoaded(img, () => {
                        requestAnimationFrame(() => {
                            img.classList.add('grid-thumb-visible');
                        });
                    });
                }, delay);
                delay += ITEM_DELAY;
            });
        }

        const initialWrappers = Array.from(gridWrappers).slice(0, initialCount);
        staggerReveal(initialWrappers, 150);

        const scrollObserver = new IntersectionObserver((entries) => {
            const newlyVisible = [];
            entries.forEach((entry) => {
                const img = entry.target.querySelector('.grid-thumb');
                if (entry.isIntersecting && img && !img.classList.contains('grid-thumb-visible')) {
                    newlyVisible.push(entry.target);
                    scrollObserver.unobserve(entry.target);
                }
            });
            if (newlyVisible.length > 0) staggerReveal(newlyVisible, 0);
        }, { threshold: 0.15 });

        gridWrappers.forEach((wrapper) => {
            if (!initialWrappers.includes(wrapper)) scrollObserver.observe(wrapper);
        });

        // Use clone to remove old event listeners if loadDynamicContent is called multiple times
        const newBtn = loadMoreBtn.cloneNode(true);
        loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);

        newBtn.addEventListener('click', () => {
            const nextShow = Math.min(shown + 6, gridWrappers.length);
            const newWrappers = [];
            for (let i = shown; i < nextShow; i++) {
                gridWrappers[i].classList.remove('grid-thumb-hidden');
                newWrappers.push(gridWrappers[i]);
                scrollObserver.observe(gridWrappers[i]);
            }
            shown = nextShow;
            if (shown >= gridWrappers.length) newBtn.style.display = 'none';
            requestAnimationFrame(() => {
                const inView = [];
                newWrappers.forEach((wrapper) => {
                    const rect = wrapper.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        inView.push(wrapper);
                        scrollObserver.unobserve(wrapper);
                    }
                });
                if (inView.length > 0) staggerReveal(inView, 0);
            });
        });
    }

    function observeLazyElements() {
        const observerOptions = { rootMargin: '0px 0px -10% 0px', threshold: 0.1 };
        const animObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        const lazyElements = document.querySelectorAll('section:not(.hero) .badge, .faq-banner-container, .section-title, .accordion-item, .footer-col');
        lazyElements.forEach(el => {
            el.classList.add('lazy-anim');
            animObserver.observe(el);
        });

        const lazyTestimonialCards = document.querySelectorAll('.testimonial-card');
        const numOriginalCards = lazyTestimonialCards.length / 3; // roughly since cloned
        lazyTestimonialCards.forEach((card, i) => {
            if (i >= numOriginalCards && i < numOriginalCards + 3) {
                card.classList.add('lazy-anim');
                card.style.transitionDelay = `${(i - numOriginalCards) * 0.15}s`;
                animObserver.observe(card);
            }
        });
    }

    function alignTracks() {
        const hero = document.querySelector('.hero');
        const portfolio = document.querySelector('.portfolio');
        const portLeft = document.getElementById('portfolio-tracks-left');
        const portRight = document.getElementById('portfolio-tracks-right');
        
        if (hero && portfolio && portLeft && portRight) {
            const offsetDiff = hero.offsetTop - portfolio.offsetTop;
            const newTop = 350 + offsetDiff;
            portLeft.style.top = `${newTop}px`;
            portRight.style.top = `${newTop}px`;
        }
    }

    function initStaticAnimations() {
        window.addEventListener('resize', alignTracks);
        setTimeout(alignTracks, 50);

        const portfolio = document.getElementById('portfolio');
        if (portfolio) {
            const trackObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        portfolio.querySelectorAll('.tracks-deferred').forEach(el => {
                            el.classList.add('tracks-active');
                        });
                        alignTracks();
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '300px 0px', threshold: 0 });
            trackObserver.observe(portfolio);
        }

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
                    charSpan.textContent = text[i] === ' ' ? ' ' : text[i];
                    if (text[i] !== ' ') {
                        charSpan.style.animationDelay = `${delayCount * 0.05}s`;
                        delayCount++;
                    }
                    textSpan.appendChild(charSpan);
                }
            }
            if (arrow) arrow.classList.add('handwriting-arrow');
        });

        setTimeout(() => {
            const heroHandwritten = document.querySelector('.hero-cta .handwritten-annotation');
            if (heroHandwritten) {
                const arrow = heroHandwritten.querySelector('.handwriting-arrow');
                const text = heroHandwritten.querySelector('.handwriting-text');
                if (arrow) arrow.classList.add('animate');
                setTimeout(() => { if (text) text.classList.add('animate'); }, 150); 
            }
        }, 1600); 

        const hiwCards = document.querySelectorAll('.hiw-card.hiw-anim');
        if (hiwCards.length > 0) {
            const hiwObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('hiw-in-view');
                        entry.target.classList.add('hiw-card-visible');
                    } else {
                        entry.target.classList.remove('hiw-in-view');
                    }
                });
            }, { rootMargin: '0px 0px -5% 0px', threshold: 0.15 });
            hiwCards.forEach(card => hiwObserver.observe(card));
        }

        const faqBannerContainers = document.querySelectorAll('.faq-banner-container');
        faqBannerContainers.forEach(container => {
            const orangeSpan = container.querySelector('.orange-banner span');
            const whiteSpan = container.querySelector('.white-banner span');
            
            const splitText = (span, baseDelay) => {
                if (!span) return;
                const text = span.textContent;
                span.textContent = '';
                let delayCount = 0;
                for (let i = 0; i < text.length; i++) {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'banner-char';
                    charSpan.textContent = text[i] === ' ' ? ' ' : text[i];
                    if (text[i] !== ' ') {
                        charSpan.style.animationDelay = `${baseDelay + (delayCount * 0.04)}s`;
                        delayCount++;
                    }
                    span.appendChild(charSpan);
                }
            };

            splitText(orangeSpan, 0.2);
            splitText(whiteSpan, 1.0);

            const bannerObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('start-anim');
                        observer.unobserve(entry.target);
                        setTimeout(() => {
                            const faqHandwritten = entry.target.closest('.faq')?.querySelector('.faq-handwritten');
                            if (faqHandwritten) {
                                const arrow = faqHandwritten.querySelector('.handwriting-arrow');
                                const text = faqHandwritten.querySelector('.handwriting-text');
                                if (arrow) arrow.classList.add('animate');
                                setTimeout(() => { if (text) text.classList.add('animate'); }, 150);
                            }
                        }, 2000);
                    }
                });
            }, { threshold: 0.5 });
            bannerObserver.observe(container);
        });

        const hwObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const arrow = entry.target.querySelector('.handwriting-arrow');
                    const text = entry.target.querySelector('.handwriting-text');
                    if (arrow) arrow.classList.add('animate');
                    setTimeout(() => { if (text) text.classList.add('animate'); }, 150);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
    }

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
                if (e && e.cancelable) e.preventDefault();
                
                const dx = clientX - startX;
                if (Math.abs(dx) > 5) hasMoved = true;
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

            function onMouseMoveWindow(e) { onMove(e.clientX, e.clientY, e); }
            function onMouseUpWindow() { onEnd(); }

            track.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                onStart(e.clientX, e.clientY);
            });
            track.addEventListener('dragstart', (e) => e.preventDefault());
            track.addEventListener('touchstart', (e) => {
                onStart(e.touches[0].clientX, e.touches[0].clientY);
            }, { passive: true });
            track.addEventListener('touchmove', (e) => {
                onMove(e.touches[0].clientX, e.touches[0].clientY, e);
            }, { passive: false });
            track.addEventListener('touchend', () => onEnd());

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
                    if (!isHovered) x += baseSpeed * deltaScale;
                    else x += (baseSpeed * 0.15) * deltaScale;
                    
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
                if (wrapper) wrapper.classList.add('visible');
            });
        });
    }

    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG' || e.target.closest('.portfolio') || e.target.closest('.portfolio-grid')) {
            e.preventDefault();
            return false;
        }
    });

    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
            return false;
        }
    });
});
