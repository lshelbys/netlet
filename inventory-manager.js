import { inventory, fetchInventory, addProductToInventory, deleteProductFromInventory, updateProductInInventory, replaceInventory, escapeHtml } from './inventory.js';
import { Toast, LoadingOverlay } from './utils.js';

const productForm = document.getElementById('productForm');
const inventoryTableBody = document.querySelector('#inventoryTable tbody');
const alertMessage = document.getElementById('alertMessage');
const searchInput = document.getElementById('searchInput');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const totalItemsEl = document.getElementById('totalItems');
const totalValueEl = document.getElementById('totalValue');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const formContainer = document.getElementById('formContainer');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const imagesContainer = document.getElementById('imagesContainer');
const addImageBtn = document.getElementById('addImageBtn');

let editingProductId = null;

// Render a single image input slot with remove button
function createImageInput(url = '') {
    const div = document.createElement('div');
    div.className = 'image-input-slot';
    div.style.cssText = 'display:flex; gap:8px; align-items:flex-start;';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'image-input';
    input.placeholder = 'https://example.com/image.jpg';
    input.value = url;
    input.style.cssText = 'flex:1; padding:10px; border:1px solid #e2e5f1; border-radius:4px; font-size:14px;';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger';
    removeBtn.style.cssText = 'padding:10px 15px; white-space:nowrap;';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        div.remove();
    });

    div.appendChild(input);
    div.appendChild(removeBtn);
    return div;
}

// Collect all image URLs from the input slots
function getImageUrls() {
    const inputs = imagesContainer.querySelectorAll('.image-input');
    return Array.from(inputs)
        .map(input => input.value.trim())
        .filter(url => url.length > 0);
}

// Add a new empty image input slot
function addImageSlot(url = '') {
    imagesContainer.appendChild(createImageInput(url));
}

// Clear all image slots
function clearImageSlots() {
    imagesContainer.innerHTML = '';
}

// Initialize with one empty slot
addImageSlot();

addImageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addImageSlot();
});

// Use toast notifications instead of inline alerts
function showAlert(message, type = 'success') {
    const toastType = type === 'error' ? 'error' : 'success';
    new Toast(message, toastType, 3000);
}

// Function to render the inventory table
function renderInventory(filterText = '') {
    inventoryTableBody.innerHTML = ''; // Clear existing rows

    const filtered = inventory.filter(p =>
        p.brand.toLowerCase().includes(filterText.toLowerCase()) ||
        p.title.toLowerCase().includes(filterText.toLowerCase())
    );

    filtered.forEach(product => {
        const row = inventoryTableBody.insertRow();
        const price = Number(product.price) || 0;
        const oldPrice = product.oldPrice != null ? Number(product.oldPrice) : null;
        const images = Array.isArray(product.images) ? product.images : [];
        const thumb = images.length > 0
            ? `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.title)}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.outerHTML='<i class=\\'fas ${escapeHtml(product.icon)}\\'></i>';">`
            : `<i class="fas ${escapeHtml(product.icon)}"></i>`;
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${thumb}${images.length > 1 ? ` <small>+${images.length - 1}</small>` : ''}</td>
            <td>${escapeHtml(product.brand)}</td>
            <td>${escapeHtml(product.title)}</td>
            <td>KWD ${price.toFixed(2)}</td>
            <td>${oldPrice != null ? `KWD ${oldPrice.toFixed(2)}` : 'N/A'}</td>
            <td>${product.isExpress ? 'Yes' : 'No'}</td>
            <td>${escapeHtml(product.rating)}</td>
            <td>${escapeHtml(product.reviews)}</td>
            <td><i class="fas ${escapeHtml(product.icon)}"></i> ${escapeHtml(product.icon)}</td>
            <td class="product-actions">
                <button class="btn btn-edit" data-id="${product.id}" style="background-color: #ffc107; color: black;">Edit</button>
                <button class="btn btn-danger btn-delete" data-id="${product.id}">Delete</button>
            </td>
        `;
    });

    updateStats();
}

// Event listener for adding a new product
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productData = {
        id: editingProductId, // Supabase handles new ID generation
        brand: document.getElementById('brand').value,
        title: document.getElementById('title').value,
        price: parseFloat(document.getElementById('price').value),
        oldPrice: document.getElementById('oldPrice').value ? parseFloat(document.getElementById('oldPrice').value) : null,
        isExpress: document.getElementById('isExpress').checked,
        rating: parseFloat(document.getElementById('rating').value),
        reviews: parseInt(document.getElementById('reviews').value, 10),
        icon: document.getElementById('icon').value,
        images: getImageUrls()
    };

    if (isNaN(productData.price) || (productData.oldPrice !== null && isNaN(productData.oldPrice)) || isNaN(productData.rating) || isNaN(productData.reviews)) {
        showAlert('Please enter valid numbers for price, rating, and reviews.', 'error');
        return;
    }

    if (editingProductId) {
        const { error } = await updateProductInInventory(productData);
        if (!error) showAlert('Product updated successfully!');
        else showAlert(`Error updating product: ${error.message || error}`, 'error');
    } else {
        const { error } = await addProductToInventory(productData);
        if (!error) showAlert('Product added successfully!');
        else showAlert(`Error adding product: ${error.message || error}`, 'error');
    }

    // Pass search value to maintain current filter after adding/editing
    renderInventory(searchInput.value);
    resetForm();
});

// Event listener for actions (using event delegation)
inventoryTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-delete')) {
        const productId = parseInt(e.target.dataset.id, 10);
        if (confirm(`Are you sure you want to delete product ID ${productId}?`)) {
            await deleteProductFromInventory(productId);
            renderInventory();
            showAlert('Product deleted successfully!', 'success');
        }
    } else if (e.target.classList.contains('btn-edit')) {
        const productId = parseInt(e.target.dataset.id, 10);
        startEdit(productId);
    }
});

function startEdit(id) {
    const product = inventory.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    formContainer.style.display = 'block';
    document.getElementById('brand').value = product.brand;
    document.getElementById('title').value = product.title;
    document.getElementById('price').value = product.price;
    document.getElementById('oldPrice').value = product.oldPrice || '';
    document.getElementById('isExpress').checked = product.isExpress;
    document.getElementById('rating').value = product.rating;
    document.getElementById('reviews').value = product.reviews;
    document.getElementById('icon').value = product.icon;

    // Populate image slots
    clearImageSlots();
    const images = Array.isArray(product.images) ? product.images : [];
    if (images.length > 0) {
        images.forEach(url => addImageSlot(url));
    } else {
        addImageSlot(); // Add one empty slot if no images
    }

    formTitle.textContent = 'Edit Product';
    submitBtn.textContent = 'Update Product';
    cancelBtn.style.display = 'inline-block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    editingProductId = null;
    productForm.reset();
    clearImageSlots();
    addImageSlot(); // Add one empty slot
    formTitle.textContent = 'Add New Product';
    submitBtn.textContent = 'Add Product';
    cancelBtn.style.display = 'none';
    formContainer.style.display = 'none';
}

function updateStats() {
    const totalValue = inventory.reduce((sum, p) => sum + p.price, 0);
    totalItemsEl.textContent = inventory.length;
    totalValueEl.textContent = totalValue.toFixed(2);
}

cancelBtn.addEventListener('click', resetForm);

searchInput.addEventListener('input', (e) => {
    renderInventory(e.target.value);
});

toggleFormBtn.addEventListener('click', () => {
    resetForm();
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });
});

// --- EXPORT TO CSV (EXCEL) ---
exportBtn.addEventListener('click', () => {
    if (inventory.length === 0) return showAlert('Inventory is empty!', 'error');

    const headers = ['id', 'brand', 'title', 'price', 'oldPrice', 'isExpress', 'rating', 'reviews', 'icon', 'images'];

    const csvRows = [
        headers.join(','), // Header row
        ...inventory.map(p => headers.map(header => {
            let val = p[header] === null || p[header] === undefined ? '' : p[header];
            // Serialize the images array as a JSON string so it survives CSV round-trips
            if (header === 'images') val = JSON.stringify(Array.isArray(val) ? val : []);
            // Escape quotes and wrap strings in quotes to handle commas within the data
            if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
            return val;
        }).join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `netlet_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- IMPORT FROM CSV ---
importBtn.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim() !== '');
        const headers = rows[0].split(',').map(h => h.trim());

        try {
            const importedInventory = rows.slice(1).map(row => {
                // Simple regex to handle quoted strings containing commas
                const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
                const cleanedValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));

                const product = {};
                headers.forEach((header, index) => {
                    let val = cleanedValues[index];
                    // Type conversion
                    if (header === 'id' || header === 'reviews') product[header] = parseInt(val, 10);
                    else if (header === 'price' || header === 'rating') product[header] = parseFloat(val);
                    else if (header === 'oldPrice') product[header] = val ? parseFloat(val) : null;
                    else if (header === 'isExpress') product[header] = (val || '').toLowerCase() === 'true';
                    else if (header === 'images') {
                        try { product[header] = JSON.parse(val || '[]'); }
                        catch { product[header] = val ? [val] : []; }
                    }
                    else product[header] = val;
                });
                return product;
            });

            if (confirm(`Are you sure you want to replace current inventory with ${importedInventory.length} items?`)) {
                const { error } = await replaceInventory(importedInventory);
                if (error) {
                    showAlert('Error importing inventory to the database.', 'error');
                } else {
                    renderInventory();
                    showAlert('Inventory imported successfully!');
                }
            }
        } catch (err) {
            showAlert('Error parsing CSV. Ensure the format is correct.', 'error');
        }
        importFile.value = ''; // Reset input
    };
    reader.readAsText(file);
});

// Initial render when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        LoadingOverlay.show('Loading inventory...');
        const start = performance.now();

        await fetchInventory();
        renderInventory();

        const elapsed = Math.max(200 - (performance.now() - start), 0);
        setTimeout(() => LoadingOverlay.hide(), elapsed);
    } catch (err) {
        LoadingOverlay.hide();
        new Toast('Error loading inventory. Please refresh the page.', 'error', 4000);
        console.error('Inventory loading error:', err);
    }
});
