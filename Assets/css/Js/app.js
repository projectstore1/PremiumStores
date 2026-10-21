document.addEventListener('DOMContentLoaded', () => {
    // Theme Management
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    htmlEl.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    // Load Notice
    loadNotice();

    // Load Banners
    loadBanners();

    // Load Products
    loadProducts();
});

async function loadNotice() {
    try {
        const doc = await db.collection('settings').doc('notice').get();
        if (doc.exists && doc.data().text) {
            document.getElementById('noticeText').textContent = doc.data().text;
        }
    } catch (error) {
        console.error('Error loading notice:', error);
    }
}

async function loadBanners() {
    try {
        const snapshot = await db.collection('banners').orderBy('order', 'asc').get();
        const slider = document.getElementById('bannerSlider');
        const dotsContainer = document.getElementById('bannerDots');
        
        if (snapshot.empty) return;

        slider.innerHTML = '';
        dotsContainer.innerHTML = '';

        let slides = [];
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            const slideDiv = document.createElement('div');
            slideDiv.className = `banner-slide ${index === 0 ? 'active' : ''}`;
            slideDiv.innerHTML = `<img src="${data.image}" alt="Banner Image">`;
            slider.appendChild(slideDiv);

            const dot = document.createElement('button');
            dot.className = `banner-dot ${index === 0 ? 'active' : ''}`;
            dot.addEventListener('click', () => currentSlide(index));
            dotsContainer.appendChild(dot);

            slides.push(slideDiv);
        });

        if (slides.length > 1) {
            let currentIndex = 0;
            setInterval(() => {
                slides[currentIndex].classList.remove('active');
                dotsContainer.children[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % slides.length;
                slides[currentIndex].classList.add('active');
                dotsContainer.children[currentIndex].classList.add('active');
            }, 5000);
        }
    } catch (error) {
        console.error('Error loading banners:', error);
    }
}

async function loadProducts() {
    const grid = document.getElementById('productGrid');
    try {
        const snapshot = await db.collection('products').get();
        grid.innerHTML = '';

        if (snapshot.empty) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No products available right now.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const product = doc.data();
            const productId = doc.id;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-img">
                    <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.name}">
                    <span class="product-badge ${product.status || 'available'}">${product.status || 'available'}</span>
                </div>
                <div class="product-card-title">${product.name}</div>
                <div class="product-card-footer">
                    <span class="product-price">$${Number(product.price).toFixed(2)}</span>
                    <span class="product-box-badge">📦 box auto</span>
                </div>
            `;

            card.addEventListener('click', () => {
                localStorage.setItem('selectedProductId', productId);
                window.location.href = 'product-details.html';
            });

            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Failed to load products.</p>';
    }
}
