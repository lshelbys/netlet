import { inventory, fetchInventory, escapeHtml } from './inventory.js';
import { Toast, LoadingOverlay } from './utils.js';

const root = document.getElementById('dealsRoot');

function getCart() {
    return JSON.parse(localStorage.getItem('netletCart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('netletCart', JSON.stringify(cart));
}

function getWishlist() {
    return JSON.parse(localStorage.getItem('netletWishlist')) || [];
}

function saveWishlist(wishlist) {
    localStorage.setItem('netletWishlist', JSON.stringify(wishlist));
}

function renderDeals() {
    // Filter products that are on sale (have oldPrice and oldPrice > price)
    const dealProducts = inventory.filter(p => {
        const price = Number(p.price) || 0;
        const oldPrice = p.oldPrice != null ? Number(p.oldPrice) : null;
        return oldPrice && oldPrice > price;
    });

    if (dealProducts.length === 0) {
        root.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tag"></i>
                <h2>No Deals Available</h2>
                <p>Check back soon for amazing deals!</p>
                <a href="index.html">Continue Shopping</a>
            </div>
        `;
        return;
    }

    root.innerHTML = `
        <div class="deals-grid">
            ${dealProducts.map(product => {
                const images = Array.isArray(product.images) ? product.images : [];
                const imageMarkup = images.length > 0
                    ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}">`
                    : `<i class="fas ${escapeHtml(product.icon)}"></i>`;

                const price = Number(product.price) || 0;
                const oldPrice = Number(product.oldPrice) || 0;
                const savePct = oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
                const isWishlisted = getWishlist().includes(product.id);

                return `
                    <div class="deal-card" data-id="${product.id}">
                        <div class="card-image">${imageMarkup}</div>
                        ${savePct > 0 ? `<div class="sale-badge">-${savePct}%</div>` : ''}
                        <div class="card-brand">${escapeHtml(product.brand)}</div>
                        <div class="card-title">${escapeHtml(product.title)}</div>
                        <div class="card-prices">
                            <span class="card-price">KWD ${price.toFixed(2)}</span>
                            ${oldPrice > price ? `<span class="card-old-price">KWD ${oldPrice.toFixed(2)}</span>` : ''}
                        </div>
                        <div class="card-actions">
                            <button class="btn-add-cart" data-id="${product.id}">
                                <i class="fas fa-shopping-cart"></i> ADD TO CART
                            </button>
                            <button class="btn-wishlist" data-id="${product.id}" aria-label="Toggle wishlist">
                                <i class="fa${isWishlisted ? 's' : 'r'} fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Event listeners for add to cart buttons
    root.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            const product = inventory.find(p => p.id === productId);
            if (product) {
                if (product.stockStatus === 'Out of Stock') {
                    new Toast('This product is out of stock', 'error', 2000);
                    return;
                }
                const cart = getCart();
                const existingItem = cart.find(item => item.id === productId);
                if (existingItem) {
                    existingItem.quantity = (existingItem.quantity || 1) + 1;
                } else {
                    cart.push({ id: productId, quantity: 1 });
                }
                saveCart(cart);
                new Toast(`Added ${product.brand} to cart`, 'success', 2000);
            }
        });
    });

    // Event listeners for wishlist buttons
    root.querySelectorAll('.btn-wishlist').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            const wishlist = getWishlist();
            const idx = wishlist.indexOf(productId);
            const icon = btn.querySelector('i');
            if (idx > -1) {
                wishlist.splice(idx, 1);
                icon.className = 'far fa-heart';
                new Toast('Removed from wishlist', 'info', 1500);
            } else {
                wishlist.push(productId);
                icon.className = 'fas fa-heart';
                new Toast('Added to wishlist', 'success', 1500);
            }
            saveWishlist(wishlist);
        });
    });

    // Click card to view product
    root.querySelectorAll('.deal-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-add-cart') && !e.target.closest('.btn-wishlist')) {
                const productId = card.dataset.id;
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        LoadingOverlay.show('Loading deals...');
        const start = performance.now();

        await fetchInventory();
        renderDeals();

        const elapsed = Math.max(200 - (performance.now() - start), 0);
        setTimeout(() => LoadingOverlay.hide(), elapsed);
    } catch (err) {
        LoadingOverlay.hide();
        new Toast('Error loading deals. Please refresh the page.', 'error', 4000);
        console.error('Deals loading error:', err);
    }
});
