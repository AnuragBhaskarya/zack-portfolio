document.addEventListener('DOMContentLoaded', () => {
    
    const loginOverlay = document.getElementById('loginOverlay');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('loginForm');
    let token = localStorage.getItem('zackAdminToken');

    if (token) {
        verifyAndLoad();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('password').value;
        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });
            const data = await res.json();
            if (data.success) {
                token = data.token;
                localStorage.setItem('zackAdminToken', token);
                verifyAndLoad();
            } else {
                document.getElementById('loginError').textContent = data.error || 'Invalid Password';
            }
        } catch (err) {
            document.getElementById('loginError').textContent = 'Server Error';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('zackAdminToken');
        location.reload();
    });

    async function apiRequest(url, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        const res = await fetch(url, options);
        if (res.status === 401) {
            localStorage.removeItem('zackAdminToken');
            location.reload();
        }
        return res.json();
    }

    async function verifyAndLoad() {
        loginOverlay.classList.add('hidden');
        dashboard.classList.remove('hidden');
        loadAllData();
    }

    // Tabs logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Data Load
    let appData = { thumbnails: [], faqs: [], reviews: [] };

    async function loadAllData() {
        try {
            // Fetch with a cache-busting timestamp so the admin panel sees changes immediately
            const res = await fetch('/api/public/content?t=' + Date.now(), { cache: 'no-store' });
            const data = await res.json();
            appData = data;
            renderThumbnails();
            renderFaqs();
            renderReviews();
        } catch (e) {
            console.error(e);
        }
    }

    // --- Compress Image using Canvas ---
    function compressImage(file, maxWidth = 800, quality = 0.7) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const base64 = canvas.toDataURL('image/webp', quality);
                    resolve(base64);
                };
            };
        });
    }

    // --- Thumbnails ---
    async function renderThumbnails() {
        const list = document.getElementById('thumbnailsList');
        list.innerHTML = '';
        appData.thumbnails.forEach((t, i) => {
            list.innerHTML += `
                <div class="list-item" data-id="${t.id}" style="opacity: 0; animation: fadeSlideUp 0.4s ease-out forwards ${i * 0.05}s;">
                    <div class="item-content">
                        <i class="fa-solid fa-grip-vertical text-muted"></i>
                        <img src="${t.image_base64}" class="thumb-preview">
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-danger icon-btn" onclick="deleteItem('thumbnails', '${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        initDragEngine();
    }

    document.getElementById('thumbnailUpload').addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        for (let file of files) {
            const base64 = await compressImage(file, 800, 0.7); // 800px width, 70% quality webp
            await apiRequest('/api/admin/thumbnails', 'POST', { image_base64: base64 });
        }
        e.target.value = '';
        loadAllData();
    });

    // --- FAQs ---
    function renderFaqs() {
        const list = document.getElementById('faqsList');
        list.innerHTML = '';
        appData.faqs.forEach((f, i) => {
            list.innerHTML += `
                <div class="list-item" data-id="${f.id}" style="opacity: 0; animation: fadeSlideUp 0.4s ease-out forwards ${i * 0.05}s;">
                    <div class="item-content">
                        <i class="fa-solid fa-grip-vertical drag-handle"></i>
                        <div>
                            <strong>${f.question}</strong>
                            <p style="font-size: 13px; color: #888;">${f.answer.substring(0, 60)}...</p>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-secondary" onclick="editFaq('${f.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteItem('faqs', '${f.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        initDragEngine();
    }

    // --- Reviews ---
    function renderReviews() {
        const list = document.getElementById('reviewsList');
        list.innerHTML = '';
        appData.reviews.forEach((r, i) => {
            list.innerHTML += `
                <div class="list-item" data-id="${r.id}" style="opacity: 0; animation: fadeSlideUp 0.4s ease-out forwards ${i * 0.05}s;">
                    <div class="item-content">
                        <i class="fa-solid fa-grip-vertical drag-handle"></i>
                        <img src="${r.avatar_base64 || 'https://files.catbox.moe/1z0zdx.png'}" style="width: 40px; height: 40px; border-radius: 50%;">
                        <div>
                            <strong>${r.client_name}</strong>
                            <p style="font-size: 13px; color: #888;">${r.quote.substring(0, 60)}...</p>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-secondary" onclick="editReview('${r.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deleteItem('reviews', '${r.id}')">Delete</button>
                    </div>
                </div>
            `;
        });
        initSortable(list, 'reviews');
    }

    // --- Custom Confirm Modal ---
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalText = document.getElementById('confirmModalText');
    const confirmModalCancel = document.getElementById('confirmModalCancel');
    const confirmModalConfirm = document.getElementById('confirmModalConfirm');

    function showConfirm(msg) {
        return new Promise((resolve) => {
            confirmModalText.innerText = msg;
            confirmModal.classList.remove('hidden');
            
            const cleanup = () => {
                confirmModalCancel.removeEventListener('click', onCancel);
                confirmModalConfirm.removeEventListener('click', onConfirm);
                confirmModal.classList.add('hidden');
            };
            
            const onCancel = () => { cleanup(); resolve(false); };
            const onConfirm = () => { cleanup(); resolve(true); };
            
            confirmModalCancel.addEventListener('click', onCancel);
            confirmModalConfirm.addEventListener('click', onConfirm);
        });
    }

    // --- Generic Delete ---
    window.deleteItem = async (type, id) => {
        const confirmed = await showConfirm('Are you sure you want to delete this item? This action cannot be undone.');
        if (!confirmed) return;
        await apiRequest(`/api/admin/${type}?id=${id}`, 'DELETE');
        loadAllData();
    };

    // --- Modals Logic ---
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        });
    });

    // FAQ Form
    const faqModal = document.getElementById('faqModal');
    const faqForm = document.getElementById('faqForm');
    document.getElementById('addFaqBtn').addEventListener('click', () => {
        document.getElementById('faqModalTitle').innerText = 'Add FAQ';
        faqForm.reset();
        document.getElementById('faqId').value = '';
        faqModal.classList.remove('hidden');
    });

    window.editFaq = (id) => {
        const f = appData.faqs.find(x => x.id === id);
        if (!f) return;
        document.getElementById('faqModalTitle').innerText = 'Edit FAQ';
        document.getElementById('faqId').value = f.id;
        document.getElementById('faqQuestion').value = f.question;
        document.getElementById('faqAnswer').value = f.answer;
        faqModal.classList.remove('hidden');
    };

    faqForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('faqId').value;
        const payload = {
            question: document.getElementById('faqQuestion').value,
            answer: document.getElementById('faqAnswer').value
        };
        if (id) {
            payload.id = id;
            await apiRequest('/api/admin/faqs', 'PUT', payload);
        } else {
            await apiRequest('/api/admin/faqs', 'POST', payload);
        }
        faqModal.classList.add('hidden');
        loadAllData();
    });

    // Review Form
    const reviewModal = document.getElementById('reviewModal');
    const reviewForm = document.getElementById('reviewForm');
    
    let currentAvatarBase64 = '';
    document.getElementById('reviewAvatar').addEventListener('change', async (e) => {
        if (e.target.files[0]) {
            currentAvatarBase64 = await compressImage(e.target.files[0], 200, 0.8);
            document.getElementById('reviewAvatarPreview').src = currentAvatarBase64;
            document.getElementById('reviewAvatarPreview').classList.remove('hidden');
        }
    });

    document.getElementById('addReviewBtn').addEventListener('click', () => {
        document.getElementById('reviewModalTitle').innerText = 'Add Review';
        reviewForm.reset();
        document.getElementById('reviewId').value = '';
        currentAvatarBase64 = '';
        document.getElementById('reviewAvatarPreview').classList.add('hidden');
        reviewModal.classList.remove('hidden');
    });

    window.editReview = (id) => {
        const r = appData.reviews.find(x => x.id === id);
        if (!r) return;
        document.getElementById('reviewModalTitle').innerText = 'Edit Review';
        document.getElementById('reviewId').value = r.id;
        document.getElementById('reviewName').value = r.client_name;
        document.getElementById('reviewRole').value = r.role;
        document.getElementById('reviewQuote').value = r.quote;
        document.getElementById('reviewRating').value = r.rating;
        currentAvatarBase64 = r.avatar_base64 || '';
        if (currentAvatarBase64) {
            document.getElementById('reviewAvatarPreview').src = currentAvatarBase64;
            document.getElementById('reviewAvatarPreview').classList.remove('hidden');
        } else {
            document.getElementById('reviewAvatarPreview').classList.add('hidden');
        }
        reviewModal.classList.remove('hidden');
    };

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('reviewId').value;
        const payload = {
            client_name: document.getElementById('reviewName').value,
            role: document.getElementById('reviewRole').value,
            quote: document.getElementById('reviewQuote').value,
            rating: parseInt(document.getElementById('reviewRating').value),
            avatar_base64: currentAvatarBase64
        };
        if (id) {
            payload.id = id;
            await apiRequest('/api/admin/reviews', 'PUT', payload);
        } else {
            await apiRequest('/api/admin/reviews', 'POST', payload);
        }
        reviewModal.classList.add('hidden');
        loadAllData();
    });

    // ══════════════════════════════════════════════
    //  UNIFIED POINTER DRAG ENGINE
    //  Exact port from serialhub — mouse + touch
    // ══════════════════════════════════════════════
    let _drag = {
        active: false,
        item: null,
        ghost: null,
        placeholder: null,
        startY: 0,
        offsetY: 0,
        lastPointerY: 0,
        scrollRAF: null,
    };

    // ── Core drag functions ──

    function dragStart(item, pointerY) {
        const list = item.parentNode;
        const rect = item.getBoundingClientRect();

        _drag.active = true;
        _drag.item = item;
        _drag.offsetY = pointerY - rect.top;
        _drag.lastPointerY = pointerY;

        // Create floating ghost clone
        const ghost = item.cloneNode(true);
        ghost.className = 'list-item sort-ghost';
        ghost.style.width = rect.width + 'px';
        ghost.style.top = rect.top + 'px';
        ghost.style.left = rect.left + 'px';
        document.body.appendChild(ghost);
        _drag.ghost = ghost;

        // Create placeholder (green insertion line)
        const ph = document.createElement('div');
        ph.className = 'sort-placeholder';
        _drag.placeholder = ph;

        // Hide original
        item.classList.add('dragging');

        // Start edge-scroll loop
        startEdgeScroll();
    }

    // ── FLIP Animation Helper ──
    function recordPositions(list) {
        const items = [...list.querySelectorAll('.list-item:not(.dragging)')];
        const map = new Map();
        items.forEach(item => map.set(item, item.getBoundingClientRect()));
        return map;
    }

    function playFLIP(posMap) {
        posMap.forEach((oldRect, item) => {
            const newRect = item.getBoundingClientRect();
            const deltaY = oldRect.top - newRect.top;
            if (Math.abs(deltaY) < 1) return;

            // Instantly jump to old position
            item.style.transition = 'none';
            item.style.transform = `translateY(${deltaY}px)`;

            // Next frame: animate to new position
            requestAnimationFrame(() => {
                item.style.transition = 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)';
                item.style.transform = '';
                item.addEventListener('transitionend', function cleanup() {
                    item.style.transition = '';
                    item.style.transform = '';
                    item.removeEventListener('transitionend', cleanup);
                });
            });
        });
    }

    function dragMove(pointerY) {
        if (!_drag.active) return;
        const ghost = _drag.ghost;
        const list = _drag.item.parentNode;

        // Move ghost to follow pointer
        ghost.style.top = (pointerY - _drag.offsetY) + 'px';

        // Store pointer Y for edge-scroll
        _drag.lastPointerY = pointerY;

        // Find which item we're hovering over
        const items = [...list.querySelectorAll('.list-item:not(.dragging)')];

        let targetNode = null;
        for (const target of items) {
            const r = target.getBoundingClientRect();
            const midY = r.top + r.height / 2;
            if (pointerY < midY) {
                targetNode = target;
                break;
            }
        }

        // Check if placeholder is already in the right spot
        const phParent = _drag.placeholder.parentNode;
        const phNext = _drag.placeholder.nextSibling;
        if (targetNode === null && phParent && phNext === null) return;
        if (targetNode && phNext === targetNode) return;

        // Record positions before the move
        const posMap = recordPositions(list);

        // Remove old placeholder
        if (phParent) phParent.removeChild(_drag.placeholder);

        // Insert at new position
        if (targetNode) {
            list.insertBefore(_drag.placeholder, targetNode);
        } else {
            list.appendChild(_drag.placeholder);
        }

        // Animate the shift
        playFLIP(posMap);
    }

    function dragEnd() {
        if (!_drag.active) return;

        const list = _drag.item.parentNode;
        const placedItem = _drag.item;

        // Record positions before the final move
        const posMap = recordPositions(list);

        // Move the real item to placeholder position
        if (_drag.placeholder.parentNode) {
            list.insertBefore(placedItem, _drag.placeholder);
            _drag.placeholder.parentNode.removeChild(_drag.placeholder);
        }

        // Show the item again
        placedItem.classList.remove('dragging');

        // Green flash animation
        placedItem.classList.add('just-placed');
        setTimeout(() => placedItem.classList.remove('just-placed'), 700);

        // Remove ghost
        if (_drag.ghost && _drag.ghost.parentNode) {
            _drag.ghost.parentNode.removeChild(_drag.ghost);
        }

        stopEdgeScroll();

        // Animate surrounding items into their new positions
        playFLIP(posMap);

        // Save new order
        saveNewOrder(list.id);

        _drag.active = false;
        _drag.item = null;
        _drag.ghost = null;
        _drag.placeholder = null;
    }

    // ── Edge Auto-Scroll ──
    function startEdgeScroll() {
        const EDGE = 60;
        const SPEED = 8;

        function tick() {
            if (!_drag.active) return;
            const y = _drag.lastPointerY || 0;
            const vh = window.innerHeight;

            if (y < EDGE) {
                window.scrollBy(0, -SPEED);
            } else if (y > vh - EDGE) {
                window.scrollBy(0, SPEED);
            }
            _drag.scrollRAF = requestAnimationFrame(tick);
        }
        _drag.scrollRAF = requestAnimationFrame(tick);
    }

    function stopEdgeScroll() {
        if (_drag.scrollRAF) {
            cancelAnimationFrame(_drag.scrollRAF);
            _drag.scrollRAF = null;
        }
    }

    // ── Attach mouse + touch events to each list item ──
    function attachDragListeners(item) {
        const handle = item.querySelector('.fa-grip-vertical');
        if (!handle) return;

        // MOUSE (desktop)
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            dragStart(item, e.clientY);

            function onMouseMove(e) { e.preventDefault(); dragMove(e.clientY); }
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                dragEnd();
            }
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // TOUCH (iOS / Android)
        // touchstart on handle, but move/end/cancel on document for reliability
        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            dragStart(item, e.touches[0].clientY);

            function onTouchMove(e) {
                if (!_drag.active) return;
                e.preventDefault();
                dragMove(e.touches[0].clientY);
            }
            function onTouchEnd() {
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                document.removeEventListener('touchcancel', onTouchEnd);
                dragEnd();
            }
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
            document.addEventListener('touchcancel', onTouchEnd);
        }, { passive: false });
    }

    // ── initDragEngine: attach listeners to all .list-item elements ──
    function initDragEngine() {
        const lists = [
            document.getElementById('thumbnailsList'),
            document.getElementById('faqsList')
        ];
        lists.forEach(list => {
            if (!list) return;
            const items = list.querySelectorAll('.list-item');
            items.forEach(item => attachDragListeners(item));
        });
    }

    async function saveNewOrder(listId) {
        const items = [...document.querySelectorAll(`#${listId} .list-item`)];
        const newOrder = items.map((item, index) => ({ id: item.dataset.id, order_index: index }));
        try {
            await apiRequest(`/api/admin/${listId.replace('List', '')}`, 'PUT', newOrder);
        } catch (e) {
            console.error('Reorder error:', e);
        }
    }

});
