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
    if (cartBadge) {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => {
            return sum + (typeof item === 'object' ? (item.quantity || 1) : 1);
        }, 0);
        cartBadge.textContent = totalItems;
    }
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
                <div class="thumb ${i === 0 ? 'active' : ''}" data-src="${escapeHtml(url)}" data-index="${i}">
                    <img src="${escapeHtml(url)}" alt="${escapeHtml(product.title)} image ${i + 1}"
                         onerror="this.parentElement.style.display='none';">
                </div>`).join('')}
           </div>`
        : '';

    const navMarkup = images.length > 1
        ? `<button class="gallery-nav-btn prev" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>
           <button class="gallery-nav-btn next" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>`
        : '';

    const fullscreenMarkup = hasImages
        ? `<button class="fullscreen-btn" id="fullscreenBtn" aria-label="Fullscreen"><i class="fas fa-expand"></i></button>`
        : '';

    root.innerHTML = `
        <div class="product-layout">
            <div class="gallery">
                <div class="gallery-nav-wrapper">
                    <div class="main-image-wrap" id="mainImageWrap">${mainImageMarkup}</div>
                    ${navMarkup}
                    ${fullscreenMarkup}
                </div>
                ${thumbsMarkup}
            </div>
            <div class="info-box">
                <div class="info-brand">${escapeHtml(product.brand)}</div>
                ${product.sku ? `<div style="font-size: 14px; color: #7E859B; margin: 12px 0 8px 0; font-weight: 500;">SKU: <span style="color: #9EA4B5;">${escapeHtml(product.sku)}</span></div>` : ''}
                ${product.category ? `<div style="font-size: 14px; color: #7E859B; margin: 12px 0 8px 0; font-weight: 500;">Category: <span style="color: #9EA4B5;">${escapeHtml(product.category)}</span></div>` : ''}
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
                <div style="margin-bottom: 16px;">
                    ${product.inStock
                        ? `<div style="color: #28a745; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-check-circle"></i> In Stock</div>`
                        : `<div style="color: #E61C38; font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fas fa-times-circle"></i> Out of Stock</div>`}
                </div>
                ${product.description
                    ? `<p class="info-desc" style="white-space: pre-wrap;">${escapeHtml(product.description)}</p>`
                    : `<p class="info-desc">${escapeHtml(product.title)} by ${escapeHtml(product.brand)}.
                        ${product.isExpress ? 'Eligible for fast NetLet Express delivery.' : 'Standard delivery available.'}
                        Backed by ${escapeHtml(product.reviews)} customer reviews with an average rating of ${escapeHtml(product.rating)} out of 5.</p>`}
                <div class="actions">
                    <button class="add-cart-btn" id="addCartBtn" ${!product.inStock ? 'disabled' : ''} style="${!product.inStock ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                        <i class="fas fa-shopping-cart"></i> ADD TO CART
                    </button>
                    <button class="wishlist-btn" id="wishlistBtn" aria-label="Toggle wishlist">
                        <i class="fa${isWishlisted ? 's' : 'r'} fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>

        <div class="gallery-fullscreen" id="galleryFullscreen">
            <div class="fullscreen-image-wrap">
                <img id="fullscreenImage" src="${hasImages ? escapeHtml(images[0]) : ''}" alt="Fullscreen view" style="display:${hasImages ? 'block' : 'none'};">
                ${images.length > 1 ? `
                    <button class="fullscreen-nav-btn prev" aria-label="Previous"><i class="fas fa-chevron-left"></i></button>
                    <button class="fullscreen-nav-btn next" aria-label="Next"><i class="fas fa-chevron-right"></i></button>
                    <div class="fullscreen-counter"><span id="imageCounter">1</span> / <span id="imageTotal">${images.length}</span></div>
                ` : ''}
                <button class="fullscreen-close" aria-label="Close fullscreen"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `;

    // Track current image index
    let currentIndex = 0;

    const switchImage = (index) => {
        if (index < 0 || index >= images.length) return;
        currentIndex = index;

        const mainImage = document.getElementById('mainImage');
        const fullscreenImage = document.getElementById('fullscreenImage');
        const url = images[index];

        if (mainImage) mainImage.src = url;
        if (fullscreenImage) fullscreenImage.src = url;

        root.querySelectorAll('.thumb').forEach((t, i) => {
            t.classList.toggle('active', i === index);
        });

        updateNavButtons();
        const counter = document.getElementById('imageCounter');
        if (counter) counter.textContent = index + 1;
    };

    const updateNavButtons = () => {
        const prevBtns = root.querySelectorAll('.gallery-nav-btn.prev, .fullscreen-nav-btn.prev');
        const nextBtns = root.querySelectorAll('.gallery-nav-btn.next, .fullscreen-nav-btn.next');

        prevBtns.forEach(btn => btn.disabled = currentIndex === 0);
        nextBtns.forEach(btn => btn.disabled = currentIndex === images.length - 1);
    };

    // Thumbnail switching
    root.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            switchImage(parseInt(thumb.dataset.index));
        });
    });

    // Gallery navigation buttons
    root.querySelectorAll('.gallery-nav-btn.prev').forEach(btn => {
        btn.addEventListener('click', () => switchImage(currentIndex - 1));
    });
    root.querySelectorAll('.gallery-nav-btn.next').forEach(btn => {
        btn.addEventListener('click', () => switchImage(currentIndex + 1));
    });

    // Fullscreen navigation
    const fullscreenModal = document.getElementById('galleryFullscreen');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenClose = document.querySelector('.fullscreen-close');

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            fullscreenModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (fullscreenClose) {
        fullscreenClose.addEventListener('click', () => {
            fullscreenModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    fullscreenModal.addEventListener('click', (e) => {
        if (e.target === fullscreenModal) {
            fullscreenModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    root.querySelectorAll('.fullscreen-nav-btn.prev').forEach(btn => {
        btn.addEventListener('click', () => switchImage(currentIndex - 1));
    });
    root.querySelectorAll('.fullscreen-nav-btn.next').forEach(btn => {
        btn.addEventListener('click', () => switchImage(currentIndex + 1));
    });

    // Keyboard navigation
    const handleKeyDown = (e) => {
        if (fullscreenModal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') switchImage(currentIndex - 1);
            if (e.key === 'ArrowRight') switchImage(currentIndex + 1);
            if (e.key === 'Escape') {
                fullscreenModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        } else if (images.length > 1) {
            if (e.key === 'ArrowLeft') switchImage(currentIndex - 1);
            if (e.key === 'ArrowRight') switchImage(currentIndex + 1);
        }
    };

    document.addEventListener('keydown', handleKeyDown);

    updateNavButtons();

    // Add to cart
    document.getElementById('addCartBtn').addEventListener('click', () => {
        if (!product.inStock) {
            new Toast('This product is out of stock', 'error', 2000);
            return;
        }
        const cart = getCart();
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({ id: product.id, quantity: 1 });
        }
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
