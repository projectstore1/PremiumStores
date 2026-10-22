document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlEl.setAttribute('data-theme', savedTheme);
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const t = htmlEl.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            htmlEl.setAttribute('data-theme', t);
            localStorage.setItem('theme', t);
            themeToggleBtn.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
        themeToggleBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    const productDataStr = localStorage.getItem('selectedProduct');
    if (!productDataStr) {
        window.location.href = 'index.html';
        return;
    }
    const product = JSON.parse(productDataStr);

    document.getElementById('productSummary').innerHTML = `
        <div class="summary-row"><span>Product:</span> <span>${product.productName}</span></div>
        <div class="summary-row"><span>Plan:</span> <span>${product.plan}</span></div>
        <div class="summary-row"><span>Price (USD):</span> <span>$${Number(product.price).toFixed(2)}</span></div>
        <div class="summary-row"><span>Price (Naira):</span> <span>₦${(product.nairaPrice || product.price * 1440).toLocaleString()}</span></div>
    `;

    document.getElementById('userFieldLabel').textContent = product.userFieldLabel || 'Username';
    const userInput = document.getElementById('userInfoInput');
    userInput.placeholder = product.userFieldPlaceholder || '@username';

    let selectedCurrency = 'crypto';
    document.querySelectorAll('.currency-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.currency-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedCurrency = card.getAttribute('data-currency');
            if (selectedCurrency === 'crypto') {
                document.getElementById('cryptoDetails').style.display = 'block';
                document.getElementById('nairaDetails').style.display = 'none';
            } else {
                document.getElementById('cryptoDetails').style.display = 'none';
                document.getElementById('nairaDetails').style.display = 'block';
            }
        });
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const textToCopy = btn.getAttribute('data-copy');
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => btn.innerHTML = originalHtml, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        });
    });

    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';

        try {
            const counterRef = db.collection('settings').doc('orderCounter');
            const orderId = await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(counterRef);
                let newId = 5127;
                if (doc.exists) {
                    newId = (doc.data().counter || 5126) + 1;
                }
                transaction.set(counterRef, { counter: newId });
                return newId;
            });

            const orderData = {
                orderId: orderId,
                productId: product.productId,
                productName: product.productName,
                planId: product.planId,
                plan: product.plan,
                userInfo: userInput.value,
                userFieldLabel: product.userFieldLabel || 'Username',
                price: Number(product.price),
                nairaPrice: Number(product.nairaPrice || product.price * 1440),
                currency: selectedCurrency,
                paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Naira',
                status: 'pending',
                invoiceCreated: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const orderRef = await db.collection('orders').add(orderData);

            const invoiceData = {
                invoiceId: `INV-${orderId}`,
                orderId: orderId,
                orderDocId: orderRef.id,
                productName: product.productName,
                plan: product.plan,
                userInfo: userInput.value,
                userFieldLabel: product.userFieldLabel || 'Username',
                price: Number(product.price),
                nairaPrice: Number(product.nairaPrice || product.price * 1440),
                currency: selectedCurrency,
                paymentMethod: selectedCurrency === 'crypto' ? 'Crypto' : 'Naira',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('invoices').add(invoiceData);

            window.location.href = `invoice-link.html?orderId=${orderId}`;
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to process order. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Confirm Order';
        }
    });
});
