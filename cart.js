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
    const cartIds = JSON.parse(localStorage.getItem('netletCart')) || [];

    console.log('renderCart called. Inventory products:', inventory.length, 'Cart IDs:', cartIds);

    if (inventory.length === 0) {
        console.warn('NetLet: Inventory is currently empty or still loading.');
        // If inventory is empty, we wait a moment or try to reload
    }

    if (cartIds.length === 0) {
        cartItemsContainer.innerHTML = `<div class="empty-cart">Your cart is empty. <br><br> <i class="fas fa-shopping-basket" style="font-size: 50px; opacity: 0.2;"></i></div>`;
        updateTotals(0, 0);
        return;
    }

    // Count occurrences of each ID
    const counts = {};
    cartIds.forEach(id => counts[id] = (counts[id] || 0) + 1);

    let html = '';
    let totalCost = 0;

    Object.keys(counts).forEach(id => {
        const product = inventory.find(p => Number(p.id) === Number(id));
        console.log(`Looking for product ID ${id}: found=${!!product}`, product ? { id: product.id, brand: product.brand } : 'NOT FOUND');
        if (product) {
            const qty = counts[id];
            totalCost += product.price * qty;
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
                        <div class="item-qty">Quantity: ${qty}</div>
                        <button class="remove-btn" onclick="removeFromCart(${product.id})">Remove</button>
                    </div>
                    <div class="item-price">KWD ${(product.price * qty).toFixed(2)}</div>
                </div>
            `;
        }
    });

    cartItemsContainer.innerHTML = html;
    updateTotals(totalCost, cartIds.length);
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

confirmBtn.addEventListener('click', () => {
    if (idToDelete === null) return;

    let cart = JSON.parse(localStorage.getItem('netletCart')) || [];
    const prevLength = cart.length;
    cart = cart.filter(itemId => Number(itemId) !== Number(idToDelete));
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
