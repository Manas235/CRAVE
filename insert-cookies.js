const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://podwybovgtwzefwcbmck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZHd5Ym92Z3R3emVmd2NibWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzc2OTcsImV4cCI6MjA4ODcxMzY5N30.T57yMBexvzr9GVgDv5K0Hx-JqPCDIJkV0sIjGxTIkfo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    // First, show all existing products
    console.log('=== EXISTING PRODUCTS ===');
    const { data: existing, error: fetchErr } = await supabase.from('products').select('*');
    if (fetchErr) {
        console.error('Fetch error:', JSON.stringify(fetchErr));
        return;
    }
    existing.forEach(p => {
        const keys = Object.keys(p);
        console.log('---');
        keys.forEach(k => console.log(`  ${k}: ${JSON.stringify(p[k])}`));
    });

    // Build new cookie objects based on same schema as existing products
    const sample = existing[0] || {};
    const hasTag = 'tag' in sample;
    const hasDescription = 'description' in sample;
    const hasImage = 'image' in sample;

    const newCookies = [
        {
            id: 'c_biscoff',
            name: 'Biscoff Cookie',
            description: hasDescription ? 'Luxurious Lotus Biscoff spread layered between two soft-baked cookies with a caramelised crunch.' : undefined,
            price: 249,
            image: hasImage ? 'assets/biscoff_cookie.png' : undefined,
            tag: hasTag ? 'Fan Favourite' : undefined,
        },
        {
            id: 'c_triple',
            name: 'Triple Chocolate Cookie',
            description: hasDescription ? 'An indulgent trio of dark, milk, and white chocolate chips baked into one decadent, fudgy cookie.' : undefined,
            price: 269,
            image: hasImage ? 'assets/triple_choc_cookie.png' : undefined,
            tag: hasTag ? 'Best Seller' : undefined,
        }
    ].map(c => {
        // Remove undefined keys
        return Object.fromEntries(Object.entries(c).filter(([_, v]) => v !== undefined));
    });

    console.log('\n=== INSERTING NEW COOKIES ===');
    for (const cookie of newCookies) {
        console.log('Inserting:', cookie.name);
        // Use upsert so re-runs don't fail
        const { data, error } = await supabase
            .from('products')
            .upsert([cookie], { onConflict: 'id' });
        if (error) {
            console.error('Insert error for', cookie.name, ':', JSON.stringify(error));
        } else {
            console.log('Success:', cookie.name);
        }
    }

    console.log('\n=== FINAL PRODUCTS LIST ===');
    const { data: final } = await supabase.from('products').select('id,name,price').order('id');
    final.forEach(p => console.log(p.id, '|', p.name, '|', p.price));
}

main();
