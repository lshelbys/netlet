import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://euxfpjbfyiswbjqufikm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGZwamJmeWlzd2JqcXVmaWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNjUwMjAsImV4cCI6MjA5Njk0MTAyMH0.pfD6J4wPeK6CajEnPoTwLoQ1rWIJR0ZHcSf2BxNB7Ug';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Using a single constant array reference ensures all modules see the same data
export const inventory = [];

export async function fetchInventory() {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) {
        console.error('Error fetching inventory:', error);
        return [];
    }
    inventory.length = 0;
    inventory.push(...data);
    return inventory;
}

export async function addProductToInventory(product) {
    // Remove id to let Supabase generate it
    const { id, ...productData } = product; 
    const { data, error } = await supabase.from('products').insert([productData]).select();
    if (!error && data) inventory.push(data[0]);
    return { data, error };
}

export async function deleteProductFromInventory(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
        const index = inventory.findIndex(p => Number(p.id) === Number(id));
        if (index !== -1) inventory.splice(index, 1);
    }
    return error;
}

export async function updateProductInInventory(updatedProduct) {
    const { id, ...updateData } = updatedProduct;
    const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select();
    if (!error && data) {
        const index = inventory.findIndex(p => Number(p.id) === Number(id));
        if (index !== -1) inventory[index] = data[0];
    }
    return { data, error };
}

// Replaces the entire inventory in Supabase with the provided list of products.
// Used by the CSV import feature. Existing rows are deleted and the new rows
// are inserted, letting Supabase generate fresh ids.
export async function replaceInventory(products) {
    const rows = products
        .filter(p => p && (p.brand || p.title))
        .map(({ id, ...rest }) => rest);

    // Supabase requires a filter on delete; ids are always >= 0.
    const { error: deleteError } = await supabase.from('products').delete().gte('id', 0);
    if (deleteError) return { data: null, error: deleteError };

    const { data, error } = await supabase.from('products').insert(rows).select();
    if (!error && data) {
        inventory.length = 0;
        inventory.push(...data);
    }
    return { data, error };
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