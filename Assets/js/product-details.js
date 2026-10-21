document.addEventListener('DOMContentLoaded', async () => {
    // Theme setup
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);
    themeToggleBtn.addEventListener('click', () => {
        const t = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
    });

    const productId = localStorage.getItem('selectedProductId');
    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    const container = document.getElementById('productDetailsContainer');
    try {
        const docSnap = await db.collection('products').doc(productId).get();
        if (!docSnap.exists) {
            container.innerHTML = '<p>Product not found.</p>';
            return;
        }

        const product = docSnap.data();
        const itemsSnap = await db.collection('products').doc(productId).collection('items').get();
        let items = [];
        itemsSnap.forEach(itemDoc => items.push({ id: itemDoc.id, ...itemDoc.data() }));

        let selectedItem = items.length > 0 ? items[0] : { id: 'default', name: 'Standard Plan', price: product.price };

        container.innerHTML = `
            <div class="product-img-large">
                <img src="${product.image || 'https://via.placeholder.com/400'}" alt="${product.name}">
            </div>
            <div class="details-card">
                <h1 class="details-title">${product.name}</h1>
                <div class="price-row">
                    <span class="price-usd" id="displayUsd">$${Number(selectedItem.price).toFixed(2)}</span>
                    <span class="price-naira" id="displayNaira">₦${(selectedItem.price * 1440).toLocaleString()}</span>
                </div>
                <div class="description-box">
                    ${product.description || 'No description available for this digital subscription.'}
                </div>
                <div>
                    <h3 style="margin-bottom: 10px;">Select Your Item</h3>
                    <div class="items-grid" id="itemsGrid"></div>
                </div>
                <div class="btn-group">
                    <a href="index.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back</a>
                    <button id="buyNowBtn" class="btn btn-success"><i class="fas fa-shopping-cart"></i> Buy Now</button>
                </div>
            </div>
        `;

        const itemsGrid = document.getElementById('itemsGrid');
        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `item-option-card ${index === 0 ? 'active' : ''}`;
            card.innerHTML = `
                <div class="item-option-name">${item.name}</div>
                <div class="item-option-price">$${Number(item.price).toFixed(2)}</div>
            `;
            card.addEventListener('click', () => {
                document.querySelectorAll('.item-option-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                selectedItem = item;
                document.getElementById('displayUsd').textContent = `$${Number(item.price).toFixed(2)}`;
                document.getElementById('displayNaira').textContent = `₦${(item.price * 1440).toLocaleString()}`;
            });
            itemsGrid.appendChild(card);
        });

        document.getElementById('buyNowBtn').addEventListener('click', () => {
            const selectedProductData = {
                productId: productId,
                productName: product.name,
                planId: selectedItem.id,
                plan: selectedItem.name,
                price: Number(selectedItem.price),
                nairaPrice: Number(selectedItem.price) * 1440,
                userFieldLabel: product.userFieldLabel || 'Username',
                userFieldPlaceholder: product.userFieldPlaceholder || '@username',
                userFieldRequired: product.userFieldRequired !== false
            };
            localStorage.setItem('selectedProduct', JSON.stringify(selectedProductData));
            window.location.href = 'payment.html';
        });

    } catch (error) {
        console.error('Error loading product details:', error);
        container.innerHTML = '<p>Error loading product information.</p>';
    }
});
