const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://podwybovgtwzefwcbmck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZHd5Ym92Z3R3emVmd2NibWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzc2OTcsImV4cCI6MjA4ODcxMzY5N30.T57yMBexvzr9GVgDv5K0Hx-JqPCDIJkV0sIjGxTIkfo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log('Fetching products...');
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Data:', data);
    }
}

testFetch();
