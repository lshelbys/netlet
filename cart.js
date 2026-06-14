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
    totalEl.textContent = total.toFixed(2);
    itemCountEl.textContent = count;
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
        new Toast('This product is out of stock and cannot be purchased', 'error', 2000);
        removeFromCart(cartItem.id);
        return;
    }

    if (newQty > product.stockQuantity) {
        new Toast(`Only ${product.stockQuantity} item(s) available in stock`, 'error', 2000);
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
    new Toast(`Removed ${removed} item${removed > 1 ? 's' : ''} from cart`, 'success', 2000);

    idToDelete = null;
    modal.classList.remove('active');
    renderCart();
});

cancelBtn.addEventListener('click', () => {
    idToDelete = null;
    modal.classList.remove('active');
});

// Checkout validation
document.querySelector('.checkout-btn')?.addEventListener('click', () => {
    const cartItems = JSON.parse(localStorage.getItem('netletCart')) || [];

    if (cartItems.length === 0) {
        new Toast('Your cart is empty', 'error', 2000);
        return;
    }

    // Validate all items are in stock
    for (const item of cartItems) {
        const product = inventory.find(p => Number(p.id) === Number(item.id));
        if (!product) {
            new Toast('One or more items in your cart no longer exist', 'error', 2000);
            return;
        }
        if (product.stockStatus === 'Out of Stock') {
            new Toast(`${product.brand} is out of stock. Please remove it before checkout.`, 'error', 2000);
            return;
        }
        if (item.quantity > product.stockQuantity) {
            new Toast(`Only ${product.stockQuantity} of ${product.brand} available. Please adjust quantity.`, 'error', 2000);
            return;
        }
    }

    new Toast('Proceeding to checkout...', 'success', 2000);
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
        new Toast('Error loading cart. Please refresh the page.', 'error', 4000);
        console.error('Cart loading error:', err);
    }
});
