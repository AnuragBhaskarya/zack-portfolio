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
        initSortable(list, 'thumbnails');
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
        initSortable(list, 'faqs');
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
    //  UNIFIED POINTER DRAG ENGINE (Custom)
    // ══════════════════════════════════════════════
    let _drag = {
        active: false,
        item: null,
        ghost: null,
        placeholder: null,
        offsetY: 0,
        scrollRAF: null,
        container: null,
        apiType: null
    };

    function initSortable(container, type) {
        const items = container.querySelectorAll('.list-item');
        items.forEach(item => {
            const handle = item.querySelector('.fa-grip-vertical');
            if(!handle) return;
            
            // Mouse
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                dragStart(item, e.clientY, container, type);
                function onMouseMove(e) { e.preventDefault(); dragMove(e.clientY); }
                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    dragEnd();
                }
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            // Touch
            handle.addEventListener('touchstart', (e) => {
                e.preventDefault();
                dragStart(item, e.touches[0].clientY, container, type);
            }, { passive: false });

            item.addEventListener('touchmove', (e) => {
                if (!_drag.active || _drag.item !== item) return;
                e.preventDefault();
                dragMove(e.touches[0].clientY);
            }, { passive: false });

            item.addEventListener('touchend', () => {
                if (_drag.active && _drag.item === item) dragEnd();
            });
        });
    }

    function dragStart(item, pointerY, container, type) {
        const rect = item.getBoundingClientRect();
        _drag.active = true;
        _drag.item = item;
        _drag.container = container;
        _drag.apiType = type;
        _drag.offsetY = pointerY - rect.top;

        // Create floating ghost
        const ghost = item.cloneNode(true);
        ghost.className = 'list-item sort-ghost';
        ghost.style.width = rect.width + 'px';
        ghost.style.height = rect.height + 'px';
        ghost.style.top = rect.top + 'px';
        ghost.style.left = rect.left + 'px';
        // Remove animation from ghost to prevent weird rendering
        ghost.style.animation = 'none';
        document.body.appendChild(ghost);
        _drag.ghost = ghost;

        // Create placeholder
        const ph = document.createElement('div');
        ph.className = 'sort-placeholder';
        ph.style.height = rect.height + 'px';
        _drag.placeholder = ph;

        // Hide original
        item.classList.add('dragging');
        startEdgeScroll();
    }

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
            item.style.transition = 'none';
            item.style.transform = `translateY(${deltaY}px)`;
            requestAnimationFrame(() => {
                item.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)';
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
        const list = _drag.container;

        ghost.style.top = (pointerY - _drag.offsetY) + 'px';
        _drag.lastPointerY = pointerY;

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

        const phParent = _drag.placeholder.parentNode;
        const phNext = _drag.placeholder.nextSibling;
        if (targetNode === null && phParent && phNext === null) return;
        if (targetNode && phNext === targetNode) return;

        const posMap = recordPositions(list);
        if (phParent) phParent.removeChild(_drag.placeholder);
        
        if (targetNode) {
            list.insertBefore(_drag.placeholder, targetNode);
        } else {
            list.appendChild(_drag.placeholder);
        }
        playFLIP(posMap);
    }

    async function dragEnd() {
        if (!_drag.active) return;
        const list = _drag.container;
        const placedItem = _drag.item;
        const apiType = _drag.apiType;

        const posMap = recordPositions(list);
        if (_drag.placeholder.parentNode) {
            list.insertBefore(placedItem, _drag.placeholder);
            _drag.placeholder.parentNode.removeChild(_drag.placeholder);
        }

        placedItem.classList.remove('dragging');
        if (_drag.ghost && _drag.ghost.parentNode) {
            _drag.ghost.parentNode.removeChild(_drag.ghost);
        }
        stopEdgeScroll();
        playFLIP(posMap);

        _drag.active = false;
        _drag.item = null;
        _drag.ghost = null;
        _drag.placeholder = null;
        _drag.container = null;

        // Save order to server
        const currentItems = Array.from(list.children);
        const updates = currentItems.map((el, index) => {
            return { id: el.dataset.id, display_order: index };
        });
        await apiRequest(`/api/admin/${apiType}`, 'PUT', updates);
    }

    function startEdgeScroll() {
        const EDGE = 50;
        const SPEED = 6;
        function tick() {
            if (!_drag.active) return;
            const y = _drag.lastPointerY || 0;
            if (y < EDGE) {
                window.scrollBy(0, -SPEED);
            } else if (y > window.innerHeight - EDGE) {
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

});
