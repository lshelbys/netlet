import { inventory, fetchInventory, escapeHtml } from './inventory.js';
import { Toast, LoadingOverlay } from './utils.js';

const cartItemsContainer = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const itemCountEl = document.getElementById('itemCount');
const mobileCartBadge = document.querySelector('.mobile-cart-badge');

const modal = document.getElementById('confirmModal');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
let idToDelete = null;

// Promo Codes Database
const PROMO_CODES = {
    'NETLET10': { type: 'percentage', value: 10 },
    'NETLET20': { type: 'percentage', value: 20 },
    'WELCOME15': { type: 'percentage', value: 15 },
    'SUMMER25': { type: 'percentage', value: 25 },
    'SAVE5': { type: 'fixed', value: 5 }
};

let appliedPromo = null;

function renderCart() {
    const cartItems = JSON.parse(localStorage.getItem('netletCart')) || [];

    console.log('renderCart called. Inventory products:', inventory.length, 'Cart items:', cartItems);

    if (inventory.length === 0) {
        console.warn('NetLet: Inventory is currently empty or still loading.');
    }

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = `<div class="empty-cart">Your cart is empty. <br><br> <i class="fas fa-shopping-basket" style="font-size: 50px; opacity: 0.2;"></i></div>`;
        updateTotals(0, 0);
        return;
    }

    let html = '';
    let totalCost = 0;
    let totalItems = 0;

    cartItems.forEach((cartItem, idx) => {
        const productId = typeof cartItem === 'object' ? cartItem.id : cartItem;
        const qty = typeof cartItem === 'object' ? (cartItem.quantity || 1) : 1;
        const product = inventory.find(p => Number(p.id) === Number(productId));

        console.log(`Looking for product ID ${productId}: found=${!!product}`, product ? { id: product.id, brand: product.brand } : 'NOT FOUND');

        if (product) {
            totalCost += product.price * qty;
            totalItems += qty;
            const images = Array.isArray(product.images) ? product.images : [];
            const imageMarkup = images.length > 0
                ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}" style="width:100%; height:100%; object-fit:contain; mix-blend-mode:multiply;" onerror="this.outerHTML='<i class=\\'fas ${escapeHtml(product.icon)}\\'></i>';">`
                : `<i class="fas ${escapeHtml(product.icon)}"></i>`;
            html += `
                <div class="cart-item">
                    <a href="product.html?id=${product.id}" class="item-image" style="overflow:hidden;">${imageMarkup}</a>
                    <div class="item-details">
                        <div class="item-brand">${escapeHtml(product.brand)}</div>
                        <h3 class="item-title"><a href="product.html?id=${product.id}" style="color:inherit;">${escapeHtml(product.title)}</a></h3>
                        <div class="item-qty" style="display: flex; align-items: center; gap: 12px; margin: 12px 0;">
                            <span>Qty:</span>
                            <button class="qty-btn" onclick="changeQuantity(${idx}, ${qty - 1})" style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid #e2e5f1; background: #f9f9f9; cursor: pointer; font-weight: 600;">−</button>
                            <span style="min-width: 30px; text-align: center;">${qty}</span>
                            <button class="qty-btn" onclick="changeQuantity(${idx}, ${qty + 1})" style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid #e2e5f1; background: #f9f9f9; cursor: pointer; font-weight: 600;">+</button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart(${product.id})">Remove</button>
                    </div>
                    <div class="item-price">KWD ${(product.price * qty).toFixed(2)}</div>
                </div>
            `;
        }
    });

    cartItemsContainer.innerHTML = html;
    updateTotals(totalCost, totalItems);
}

function updateTotals(total, count) {
    subtotalEl.textContent = total.toFixed(2);
    itemCountEl.textContent = count;

    let finalTotal = total;
    const discountRow = document.getElementById('discountRow');
    const discountAmount = document.getElementById('discountAmount');
    const discountLabel = document.getElementById('discountLabel');

    if (appliedPromo) {
        const promo = PROMO_CODES[appliedPromo];
        let discount = 0;

        if (promo.type === 'percentage') {
            discount = (total * promo.value) / 100;
        } else if (promo.type === 'fixed') {
            discount = Math.min(promo.value, total); // Don't discount more than total
        }

        finalTotal = total - discount;

        discountAmount.textContent = discount.toFixed(2);
        discountLabel.textContent = promo.type === 'percentage'
            ? `Discount (${promo.value}%)`
            : 'Discount (Fixed)';
        discountRow.style.display = 'flex';
    } else {
        discountRow.style.display = 'none';
    }

    totalEl.textContent = finalTotal.toFixed(2);
    if (mobileCartBadge) mobileCartBadge.textContent = count;
}

window.removeFromCart = function(id) {
    idToDelete = id;
    modal.classList.add('active');
};

window.changeQuantity = function(index, newQty) {
    let cart = JSON.parse(localStorage.getItem('netletCart')) || [];
    const cartItem = cart[index];
    const product = inventory.find(p => Number(p.id) === Number(cartItem.id));

    if (newQty < 1) {
        removeFromCart(cartItem.id);
        return;
    }

    if (!product || product.stockStatus === 'Out of Stock') {
        new Toast('This product is out of stock and cannot be purchased', 'error', 6000);
        removeFromCart(cartItem.id);
        return;
    }

    if (newQty > product.stockQuantity) {
        new Toast(`Only ${product.stockQuantity} item(s) available in stock`, 'error', 6000);
        return;
    }

    cart[index].quantity = newQty;
    localStorage.setItem('netletCart', JSON.stringify(cart));
    renderCart();
};

confirmBtn.addEventListener('click', () => {
    if (idToDelete === null) return;

    let cart = JSON.parse(localStorage.getItem('netletCart')) || [];
    const prevLength = cart.length;
    cart = cart.filter(item => {
        const itemId = typeof item === 'object' ? item.id : item;
        return Number(itemId) !== Number(idToDelete);
    });
    localStorage.setItem('netletCart', JSON.stringify(cart));

    const removed = prevLength - cart.length;
    new Toast(`Removed ${removed} item${removed > 1 ? 's' : ''} from cart`, 'success', 6000);

    idToDelete = null;
    modal.classList.remove('active');
    renderCart();
});

cancelBtn.addEventListener('click', () => {
    idToDelete = null;
    modal.classList.remove('active');
});

// Promo Code Handler
function applyPromoCode() {
    const promoInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promoMessage');
    const code = promoInput.value.trim().toUpperCase();

    // Clear previous message
    promoMessage.style.display = 'none';
    promoMessage.textContent = '';

    if (!code) {
        promoMessage.textContent = 'Please enter a promo code';
        promoMessage.className = 'promo-message error';
        promoMessage.style.display = 'block';
        return;
    }

    if (!PROMO_CODES[code]) {
        promoMessage.textContent = 'Invalid promo code';
        promoMessage.className = 'promo-message error';
        promoMessage.style.display = 'block';
        return;
    }

    appliedPromo = code;
    const promo = PROMO_CODES[code];
    const message = promo.type === 'percentage'
        ? `${promo.value}% discount applied!`
        : `KWD ${promo.value.toFixed(2)} discount applied!`;

    promoMessage.textContent = message;
    promoMessage.className = 'promo-message success';
    promoMessage.style.display = 'block';

    promoInput.disabled = true;
    document.getElementById('applyPromoBtn').disabled = true;

    // Re-render cart to update totals with discount
    const cartItems = JSON.parse(localStorage.getItem('netletCart')) || [];
    let totalCost = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
        const product = inventory.find(p => Number(p.id) === Number(item.id));
        if (product) {
            const qty = typeof item === 'object' ? (item.quantity || 1) : 1;
            totalCost += product.price * qty;
            totalItems += qty;
        }
    });

    updateTotals(totalCost, totalItems);

    new Toast(`Promo code "${code}" applied successfully!`, 'success', 4000);
}

function removePromoCode() {
    appliedPromo = null;
    const promoInput = document.getElementById('promoCode');
    const promoMessage = document.getElementById('promoMessage');
    const discountRow = document.getElementById('discountRow');

    promoInput.value = '';
    promoInput.disabled = false;
    document.getElementById('applyPromoBtn').disabled = false;
    promoMessage.style.display = 'none';
    discountRow.style.display = 'none';

    // Re-render cart to update totals without discount
    const cartItems = JSON.parse(localStorage.getItem('netletCart')) || [];
    let totalCost = 0;
    let totalItems = 0;

    cartItems.forEach(item => {
        const product = inventory.find(p => Number(p.id) === Number(item.id));
        if (product) {
            const qty = typeof item === 'object' ? (item.quantity || 1) : 1;
            totalCost += product.price * qty;
            totalItems += qty;
        }
    });

    updateTotals(totalCost, totalItems);

    new Toast('Promo code removed', 'info', 3000);
}

document.getElementById('applyPromoBtn')?.addEventListener('click', applyPromoCode);

// Allow Enter key to apply promo code
document.getElementById('promoCode')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyPromoCode();
});

// Remove promo code button
document.getElementById('removePromoBtn')?.addEventListener('click', removePromoCode);

// Checkout validation
document.querySelector('.checkout-btn')?.addEventListener('click', () => {
    const cartItems = JSON.parse(localStorage.getItem('netletCart')) || [];

    if (cartItems.length === 0) {
        new Toast('Your cart is empty', 'error', 6000);
        return;
    }

    // Validate all items are in stock
    for (const item of cartItems) {
        const product = inventory.find(p => Number(p.id) === Number(item.id));
        if (!product) {
            new Toast('One or more items in your cart no longer exist', 'error', 6000);
            return;
        }
        if (product.stockStatus === 'Out of Stock') {
            new Toast(`${product.brand} is out of stock. Please remove it before checkout.`, 'error', 6000);
            return;
        }
        if (item.quantity > product.stockQuantity) {
            new Toast(`Only ${product.stockQuantity} of ${product.brand} available. Please adjust quantity.`, 'error', 6000);
            return;
        }
    }

    new Toast('Proceeding to checkout...', 'success', 6000);
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        LoadingOverlay.show('Loading cart...');
        const start = performance.now();

        await fetchInventory();
        renderCart();

        const elapsed = Math.max(200 - (performance.now() - start), 0);
        setTimeout(() => LoadingOverlay.hide(), elapsed);
    } catch (err) {
        LoadingOverlay.hide();
        new Toast('Error loading cart. Please refresh the page.', 'error', 6000);
        console.error('Cart loading error:', err);
    }
});
