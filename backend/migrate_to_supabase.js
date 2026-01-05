
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qrnjpovomhbgyqsnhufe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybmpwb3ZvbWhiZ3lxc25odWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk2MjAsImV4cCI6MjA4MzIxNTYyMH0.3EA04GDKKuEH09s11Tss77z78ow6jjNfeD9O3x6OItA';

if (!SUPABASE_KEY) {
    console.error('Error: SUPABASE_KEY is required.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log('Starting migration...');

    // 1. Migrate Products
    try {
        const catalogPath = path.join(__dirname, 'data', 'catalog.json');
        if (fs.existsSync(catalogPath)) {
            const products = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
            console.log(`Found ${products.length} products locally.`);

            // Upload in batches or all at once? All at once is fine for small size.
            // Map fields if necessary. JSON: { id, nombre, precio, categoria, disponible, active }
            // DB: same columns.

            // Check if products have 'img' property, if not, maybe default or ignore.

            const { error } = await supabase.from('products').upsert(products, { onConflict: 'id' });

            if (error) {
                console.error('Error migrating products:', error);
            } else {
                console.log('Products migrated successfully.');
            }
        } else {
            console.log('No catalog.json found.');
        }
    } catch (err) {
        console.error('Error reading catalog:', err);
    }

    // 2. Migrate Users
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        if (fs.existsSync(usersPath)) {
            const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            console.log(`Found ${users.length} users locally.`);

            const { error } = await supabase.from('users').upsert(users, { onConflict: 'id' });

            if (error) {
                console.error('Error migrating users:', error);
            } else {
                console.log('Users migrated successfully.');
            }
        } else {
            console.log('No users.json found.');
        }
    } catch (err) {
        console.error('Error reading users:', err);
    }
}

migrate();
