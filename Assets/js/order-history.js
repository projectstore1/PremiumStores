document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);
    themeToggleBtn.addEventListener('click', () => {
        const t = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme', t);
        localStorage.setItem('theme', t);
    });

    loadOrders();
    loadReviews();

    // Auto-refresh every 30 seconds
    setInterval(loadOrders, 30000);

    let selectedRating = 5;
    const stars = document.querySelectorAll('#starRating i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = Number(star.getAttribute('data-rating'));
            stars.forEach((s, idx) => {
                if (idx < selectedRating) s.classList.add('active');
                else s.classList.remove('active');
            });
        });
    });

    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const twitter = document.getElementById('reviewTwitter').value;
        const text = document.getElementById('reviewText').value;

        try {
            await db.collection('reviews').add({
                twitter: twitter,
                text: text,
                rating: selectedRating,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Review submitted successfully!');
            document.getElementById('reviewForm').reset();
            loadReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review.');
        }
    });
});

async function loadOrders() {
    const container = document.getElementById('ordersListContainer');
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').limit(30).get();
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No orders found.</p>';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            const dateStr = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'Just now';
            const statusClass = `status-${order.status || 'pending'}`;

            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div>
                    <h4 style="margin-bottom: 4px;">#${order.orderId} - ${order.productName} (${order.plan})</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">${order.userFieldLabel || 'Username'}: ${order.userInfo}</p>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 4px;">${dateStr}</p>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="product-price">$${Number(order.price).toFixed(2)}</span>
                    <span class="product-badge ${order.status || 'pending'}">${order.status || 'pending'}</span>
                    <a href="invoice.html?orderId=${order.orderId}" class="copy-btn" style="text-decoration:none;">Invoice</a>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function loadReviews() {
    const container = document.getElementById('reviewsListContainer');
    try {
        const snapshot = await db.collection('reviews').orderBy('timestamp', 'desc').limit(10).get();
        if (snapshot.empty) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No reviews yet.</p>';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach(doc => {
            const rev = doc.data();
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<i class="fas fa-star ${i <= rev.rating ? 'active' : ''}" style="color: ${i <= rev.rating ? '#eab308' : '#cbd5e1'}; font-size:0.9rem;"></i>`;
            }

            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <strong>${rev.twitter}</strong>
                    <div>${starsHtml}</div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">${rev.text}</p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}
