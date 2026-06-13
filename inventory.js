import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://euxfpjbfyiswbjqufikm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGZwamJmeWlzd2JqcXVmaWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjUwMjAsImV4cCI6MjA5Njk0MTAyMH0.pfD6J4wPeK6CajEnPoTwLoQ1rWIJR0ZHcSf2BxNB7Ug';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Using a single constant array reference ensures all modules see the same data
export const inventory = [];

// Rate limiter to prevent request spamming (max 10 requests per second)
const apiRateLimiter = {
    calls: [],
    maxCalls: 10,
    windowMs: 1000,

    isAllowed() {
        const now = Date.now();
        this.calls = this.calls.filter(time => now - time < this.windowMs);
        if (this.calls.length < this.maxCalls) {
            this.calls.push(now);
            return true;
        }
        return false;
    }
};

// Retry wrapper for transient network failures
async function withRetry(fn, maxRetries = 3, delayMs = 500) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === maxRetries - 1) throw err;
            // Only retry on network errors, not validation/constraint errors
            const msg = err.message || '';
            if (!msg.includes('constraint') && !msg.includes('invalid')) {
                await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)));
            } else {
                throw err;
            }
        }
    }
}

export async function fetchInventory() {
    if (!apiRateLimiter.isAllowed()) {
        console.warn('Rate limit exceeded for fetchInventory');
        return inventory;
    }

    try {
        const data = await withRetry(async () => {
            const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
            if (error) throw error;
            return data;
        });

        inventory.length = 0;
        inventory.push(...data);
        return inventory;
    } catch (err) {
        console.error('Error fetching inventory:', err);
        return [];
    }
}

export async function addProductToInventory(product) {
    if (!apiRateLimiter.isAllowed()) {
        return { data: null, error: new Error('Rate limit exceeded') };
    }

    try {
        const { id, ...productData } = product;
        // Convert camelCase to snake_case for Supabase
        const dbData = {
            brand: productData.brand,
            title: productData.title,
            price: productData.price,
            old_price: productData.oldPrice,
            is_express: productData.isExpress,
            rating: productData.rating,
            reviews: productData.reviews,
            icon: productData.icon
        };
        const data = await withRetry(async () => {
            const { data, error } = await supabase.from('products').insert([dbData]).select();
            if (error) throw error;
            return data;
        });

        if (data) inventory.push(data[0]);
        return { data, error: null };
    } catch (err) {
        console.error('Error adding product:', err);
        return { data: null, error: err };
    }
}

export async function deleteProductFromInventory(id) {
    if (!apiRateLimiter.isAllowed()) {
        return new Error('Rate limit exceeded');
    }

    try {
        const error = await withRetry(async () => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            return error;
        });

        if (!error) {
            const index = inventory.findIndex(p => Number(p.id) === Number(id));
            if (index !== -1) inventory.splice(index, 1);
        }
        return error;
    } catch (err) {
        console.error('Error deleting product:', err);
        return err;
    }
}

export async function updateProductInInventory(updatedProduct) {
    if (!apiRateLimiter.isAllowed()) {
        return { data: null, error: new Error('Rate limit exceeded') };
    }

    try {
        const { id, ...updateData } = updatedProduct;
        // Convert camelCase to snake_case for Supabase
        const dbData = {
            brand: updateData.brand,
            title: updateData.title,
            price: updateData.price,
            old_price: updateData.oldPrice,
            is_express: updateData.isExpress,
            rating: updateData.rating,
            reviews: updateData.reviews,
            icon: updateData.icon
        };
        const data = await withRetry(async () => {
            const { data, error } = await supabase.from('products').update(dbData).eq('id', id).select();
            if (error) throw error;
            return data;
        });

        if (data) {
            const index = inventory.findIndex(p => Number(p.id) === Number(id));
            if (index !== -1) inventory[index] = data[0];
        }
        return { data, error: null };
    } catch (err) {
        console.error('Error updating product:', err);
        return { data: null, error: err };
    }
}

// Replaces the entire inventory in Supabase with the provided list of products.
// Used by the CSV import feature. Existing rows are deleted and the new rows
// are inserted, letting Supabase generate fresh ids.
export async function replaceInventory(products) {
    if (!apiRateLimiter.isAllowed()) {
        return { data: null, error: new Error('Rate limit exceeded') };
    }

    try {
        const rows = products
            .filter(p => p && (p.brand || p.title))
            .map(({ id, ...rest }) => {
                // Convert camelCase to snake_case for Supabase
                return {
                    brand: rest.brand,
                    title: rest.title,
                    price: rest.price,
                    old_price: rest.oldPrice,
                    is_express: rest.isExpress,
                    rating: rest.rating,
                    reviews: rest.reviews,
                    icon: rest.icon
                };
            });

        await withRetry(async () => {
            const { error } = await supabase.from('products').delete().gte('id', 0);
            if (error) throw error;
        });

        const data = await withRetry(async () => {
            const { data, error } = await supabase.from('products').insert(rows).select();
            if (error) throw error;
            return data;
        });

        if (data) {
            inventory.length = 0;
            inventory.push(...data);
        }
        return { data, error: null };
    } catch (err) {
        console.error('Error replacing inventory:', err);
        return { data: null, error: err };
    }
}

// Escapes a value for safe insertion into HTML, preventing XSS from
// product data that originates from the database or CSV imports.
export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[ch]);
}