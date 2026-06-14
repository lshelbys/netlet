import { inventory, fetchInventory, escapeHtml } from './inventory.js';
import { Toast } from './utils.js';

const root = document.getElementById('productRoot');
const crumbTitle = document.getElementById('crumbTitle');
const cartBadge = document.querySelector('.cart-badge');

// Read the product id from the query string (?id=123)
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'), 10);
}

function getCart() {
    return JSON.parse(localStorage.getItem('netletCart')) || [];
}

function getWishlist() {
    return JSON.parse(localStorage.getItem('netletWishlist')) || [];
}

function updateCartBadge() {
    if (cartBadge) cartBadge.textContent = getCart().length;
}

function renderError(message) {
    root.innerHTML = `
        <div class="error-state">
            <i class="fas fa-box-open"></i>
            <h2>${escapeHtml(message)}</h2>
            <p><a href="index.html" style="color: var(--netlet-blue); font-weight: 700;">← Back to shopping</a></p>
        </div>`;
}

function renderProduct(product) {
    crumbTitle.textContent = product.title;
    document.title = `${product.title} | NetLet`;

    const images = Array.isArray(product.images) ? product.images : [];
    const hasImages = images.length > 0;
    const isWishlisted = getWishlist().includes(product.id);

    const price = Number(product.price) || 0;
    const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null;
    const savePct = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;

    const mainImageMarkup = hasImages
        ? `<img id="mainImage" src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}"
              onerror="this.outerHTML='<i class=\\'fas ${escapeHtml(product.icon)} icon-fallback\\'></i>';">`
        : `<i class="fas ${escapeHtml(product.icon)} icon-fallback"></i>`;

    const thumbsMarkup = images.length > 1
        ? `<div class="thumbs">
            ${images.map((url, i) => `
                <div class="thumb ${i === 0 ? 'active' : ''}" data-src="${escapeHtml(url)}">
                    <img src="${escapeHtml(url)}" alt="${escapeHtml(product.title)} image ${i + 1}"
                         onerror="this.parentElement.style.display='none';">
                </div>`).join('')}
           </div>`
        : '';

    root.innerHTML = `
        <div class="product-layout">
            <div class="gallery">
                <div class="main-image-wrap">${mainImageMarkup}</div>
                ${thumbsMarkup}
            </div>
            <div class="info-box">
                <div class="info-brand">${escapeHtml(product.brand)}</div>
                <h1 class="info-title">${escapeHtml(product.title)}</h1>
                <div class="info-rating">
                    <i class="fas fa-star star-icon"></i>
                    <strong>${escapeHtml(product.rating)}</strong>
                    <span class="rating-count">(${escapeHtml(product.reviews)} reviews)</span>
                </div>
                ${product.isExpress ? `<div class="express-badge"><i class="fas fa-bolt"></i> NetLet Express</div>` : ''}
                <div class="price-block">
                    <span class="price-now">KWD ${price.toFixed(2)}</span>
                    ${oldPrice ? `<span class="price-old">KWD ${oldPrice.toFixed(2)}</span>` : ''}
                    ${savePct > 0 ? `<span class="price-save">Save ${savePct}%</span>` : ''}
                </div>
                <hr class="divider">
                <p class="info-desc">${escapeHtml(product.title)} by ${escapeHtml(product.brand)}.
                    ${product.isExpress ? 'Eligible for fast NetLet Express delivery.' : 'Standard delivery available.'}
                    Backed by ${escapeHtml(product.reviews)} customer reviews with an average rating of ${escapeHtml(product.rating)} out of 5.</p>
                <div class="actions">
                    <button class="add-cart-btn" id="addCartBtn">
                        <i class="fas fa-shopping-cart"></i> ADD TO CART
                    </button>
                    <button class="wishlist-btn" id="wishlistBtn" aria-label="Toggle wishlist">
                        <i class="fa${isWishlisted ? 's' : 'r'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Thumbnail switching
    root.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            const mainImage = document.getElementById('mainImage');
            if (mainImage) mainImage.src = thumb.dataset.src;
            root.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });

    // Add to cart
    document.getElementById('addCartBtn').addEventListener('click', () => {
        const cart = getCart();
        cart.push(product.id);
        localStorage.setItem('netletCart', JSON.stringify(cart));
        updateCartBadge();
        new Toast(`Added ${product.brand} to cart`, 'success', 2000);
    });

    // Wishlist toggle
    document.getElementById('wishlistBtn').addEventListener('click', (e) => {
        const wishlist = getWishlist();
        const idx = wishlist.indexOf(product.id);
        const icon = e.currentTarget.querySelector('i');
        if (idx > -1) {
            wishlist.splice(idx, 1);
            icon.className = 'far fa-heart';
            new Toast('Removed from wishlist', 'info', 1500);
        } else {
            wishlist.push(product.id);
            icon.className = 'fas fa-heart';
            new Toast('Added to wishlist', 'success', 1500);
        }
        localStorage.setItem('netletWishlist', JSON.stringify(wishlist));
    });
}

async function init() {
    const id = getProductId();
    updateCartBadge();

    if (!id && id !== 0) {
        renderError('No product specified.');
        return;
    }

    try {
        await fetchInventory();
        const product = inventory.find(p => Number(p.id) === Number(id));
        if (!product) {
            renderError('Product not found.');
            return;
        }
        renderProduct(product);
    } catch (err) {
        console.error('Error loading product:', err);
        renderError('Something went wrong loading this product.');
    }
}

document.addEventListener('DOMContentLoaded', init);
