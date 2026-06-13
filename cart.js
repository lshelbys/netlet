import { inventory, fetchInventory } from './inventory.js';

const cartItemsContainer = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const totalEl = document.getElementById('total');
const itemCountEl = document.getElementById('itemCount');

const modal = document.getElementById('confirmModal');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
let idToDelete = null;

function renderCart() {
    const cartIds = JSON.parse(localStorage.getItem('netletCart')) || [];
    
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
        if (product) {
            const qty = counts[id];
            totalCost += product.price * qty;
            html += `
                <div class="cart-item">
                    <div class="item-image"><i class="fas ${product.icon}"></i></div>
                    <div class="item-details">
                        <div class="item-brand">${product.brand}</div>
                        <h3 class="item-title">${product.title}</h3>
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
}

window.removeFromCart = function(id) {
    idToDelete = id;
    modal.classList.add('active');
};

confirmBtn.addEventListener('click', () => {
    if (idToDelete === null) return;
    
    let cart = JSON.parse(localStorage.getItem('netletCart')) || [];
    cart = cart.filter(itemId => itemId !== idToDelete);
    localStorage.setItem('netletCart', JSON.stringify(cart));
    
    idToDelete = null;
    modal.classList.remove('active');
    renderCart();
});

cancelBtn.addEventListener('click', () => {
    idToDelete = null;
    modal.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', async () => {
    await fetchInventory();
    renderCart();
});