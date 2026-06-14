import { inventory, fetchInventory, escapeHtml } from './inventory.js';
import { Toast, LoadingOverlay } from './utils.js';

const root = document.getElementById('wishlistRoot');

function getWishlist() {
    return JSON.parse(localStorage.getItem('netletWishlist')) || [];
}

function getCart() {
    return JSON.parse(localStorage.getItem('netletCart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('netletCart', JSON.stringify(cart));
}

function saveWishlist(wishlist) {
    localStorage.setItem('netletWishlist', JSON.stringify(wishlist));
}

function renderWishlist() {
    const wishlistIds = getWishlist();

    if (wishlistIds.length === 0) {
        root.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h2>Your wishlist is empty</h2>
                <p>Start adding your favorite products to your wishlist!</p>
                <a href="index.html">Continue Shopping</a>
            </div>
        `;
        return;
    }

    const items = inventory.filter(p => wishlistIds.includes(p.id));

    root.innerHTML = `
        <div class="wishlist-grid">
            ${items.map(product => {
                const images = Array.isArray(product.images) ? product.images : [];
                const imageMarkup = images.length > 0
                    ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}">`
                    : `<i class="fas ${escapeHtml(product.icon)}"></i>`;

                return `
                    <div class="wishlist-card" data-id="${product.id}">
                        <div class="card-image">${imageMarkup}</div>
                        <div class="card-brand">${escapeHtml(product.brand)}</div>
                        <div class="card-title">${escapeHtml(product.title)}</div>
                        <div class="card-price">KWD ${Number(product.price).toFixed(2)}</div>
                        <div class="card-actions">
                            <button class="btn-add-cart" data-id="${product.id}">
                                <i class="fas fa-shopping-cart"></i> ADD TO CART
                            </button>
                            <button class="btn-remove" data-id="${product.id}" aria-label="Remove from wishlist">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Event listeners for buttons
    root.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            const product = inventory.find(p => p.id === productId);
            if (product) {
                const cart = getCart();
                cart.push(productId);
                saveCart(cart);
                new Toast(`Added ${product.brand} to cart`, 'success', 2000);
            }
        });
    });

    root.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.id);
            const wishlist = getWishlist();
            const newWishlist = wishlist.filter(id => id !== productId);
            saveWishlist(newWishlist);
            new Toast('Removed from wishlist', 'info', 1500);
            renderWishlist();
        });
    });

    // Click card to view product
    root.querySelectorAll('.wishlist-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-add-cart') && !e.target.closest('.btn-remove')) {
                const productId = card.dataset.id;
                window.location.href = `product.html?id=${productId}`;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        LoadingOverlay.show('Loading wishlist...');
        const start = performance.now();

        await fetchInventory();
        renderWishlist();

        const elapsed = Math.max(200 - (performance.now() - start), 0);
        setTimeout(() => LoadingOverlay.hide(), elapsed);
    } catch (err) {
        LoadingOverlay.hide();
        new Toast('Error loading wishlist. Please refresh the page.', 'error', 4000);
        console.error('Wishlist loading error:', err);
    }
});
