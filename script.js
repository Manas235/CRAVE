// Initialize Supabase Client
const supabaseUrl = 'https://podwybovgtwzefwcbmck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZHd5Ym92Z3R3emVmd2NibWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzc2OTcsImV4cCI6MjA4ODcxMzY5N30.T57yMBexvzr9GVgDv5K0Hx-JqPCDIJkV0sIjGxTIkfo';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Product Data (will be fetched from Supabase)
let products = [];

// App State
let cart = [];

// DOM Elements
const productsContainer = document.getElementById('products-container');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const checkoutBtn = document.getElementById('checkout-btn');

const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const toastContainer = document.getElementById('toast-container');

// Checkout Elements
const checkoutOverlay = document.getElementById('checkout-overlay');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutBtn = document.getElementById('close-checkout-btn');
const checkoutForm = document.getElementById('checkout-form');
const checkoutFinalTotal = document.getElementById('checkout-final-total');

// Mobile Menu Elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMobileMenuBtn = document.getElementById('close-mobile-menu');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
const mobileLinks = document.querySelectorAll('.mobile-link');
const navbar = document.querySelector('.navbar');

// Initialize App
async function init() {
    setupEventListeners();
    initScrollAnimations();
    initActiveNav();
    await fetchProducts();
    loadCart();
    document.getElementById('current-year').textContent = new Date().getFullYear();
}

function renderSkeletons(count = 3) {
    productsContainer.innerHTML = Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line price"></div>
            </div>
        </div>
    `).join('');
}

async function fetchProducts() {
    renderSkeletons(3);
    
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .or('name.ilike.%biscoff%,name.ilike.%triple%,name.ilike.%classic choc%')
            .order('id', { ascending: true });
            
        if (error) throw error;
        
        products = data || [];
        renderProducts();
    } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: var(--accent);">Failed to load products. Please try again later.</p>';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Cart Toggle
    openCartBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    // Empty cart "Browse Cookies" link closes the cart
    const emptyShopLink = document.getElementById('empty-cart-shop-link');
    if (emptyShopLink) {
        emptyShopLink.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    closeMobileMenuBtn.addEventListener('click', toggleMobileMenu);
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMobileMenu);
    });

    // Checkout Modals
    checkoutBtn.addEventListener('click', openCheckout);
    closeCheckoutBtn.addEventListener('click', closeCheckout);
    checkoutOverlay.addEventListener('click', closeCheckout);
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Scroll effect for Navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Render Products
function renderProducts() {
    productsContainer.innerHTML = '';
    
    products.forEach((product, index) => {
        const productEl = document.createElement('div');
        productEl.classList.add('product-card');
        
        const tagHtml = product.tag ? `<div class="product-tag">${product.tag}</div>` : '';
        
        productEl.innerHTML = `
            <div class="product-image-wrapper">
                ${tagHtml}
                <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy"
                    onerror="this.style.background='var(--bg-secondary)'; this.style.display='flex'; this.alt='🍪';">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-stars">
                    <span class="stars">★★★★★</span>
                    <span class="rating-text">4.9 (120+)</span>
                </div>
                <p class="product-desc">${product.description}</p>
                <div class="product-footer">
                    <div class="product-price">₹${product.price}</div>
                    <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" aria-label="Add ${product.name} to cart">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        `;
        
        // Stagger scroll animation for each card
        productEl.classList.add('animate-on-scroll');
        productEl.style.transitionDelay = `${index * 0.08}s`;
        productsContainer.appendChild(productEl);
    });

    // Re-observe newly added product cards
    document.querySelectorAll('.product-card.animate-on-scroll').forEach(el => scrollObserver.observe(el));
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartUI();
    saveCart();
    
    // Animation bump for cart icon
    cartCount.classList.add('bump');
    setTimeout(() => {
        cartCount.classList.remove('bump');
    }, 300);
    
    showToast(`Added ${product.name} to cart`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
    saveCart();
}

function changeQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
        saveCart();
    }
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (totalItems > 0) {
        cartCount.classList.add('has-items');
        emptyCartMsg.style.display = 'none';
        checkoutBtn.disabled = false;
    } else {
        cartCount.classList.remove('has-items');
        emptyCartMsg.style.display = 'block';
        checkoutBtn.disabled = true;
    }

    // Update Items List
    // Remove existing items before re-rendering
    const existingDomItems = document.querySelectorAll('.cart-item');
    existingDomItems.forEach(el => el.remove());

    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        
        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${(item.price * item.quantity)}</div>
                <div class="cart-item-actions">
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="changeQuantity('${item.id}', -1)">−</button>
                        <span class="item-qty">${item.quantity}</span>
                        <button class="qty-btn" onclick="changeQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">Remove</button>
                </div>
            </div>
        `;
        
        cartItemsContainer.appendChild(itemEl);
    });

    // Update Total Price
    cartTotalPrice.textContent = `₹${totalPrice}`;
}

// UI Toggles
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
    // Prevent background scrolling when cart is open
    document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : 'auto';
}

function toggleMobileMenu() {
    mobileMenuOverlay.classList.toggle('active');
    document.body.style.overflow = mobileMenuOverlay.classList.contains('active') ? 'hidden' : 'auto';
}

// Toast Notifications
function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-accent"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate out and remove after 3s
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// Local Storage
function saveCart() {
    localStorage.setItem('craveCart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('craveCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCartUI();
        } catch (e) {
            console.error('Could not parse saved cart');
        }
    }
}

// Checkout Logic
function openCheckout() {
    // Hide cart
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    
    // Show checkout
    checkoutOverlay.classList.add('active');
    checkoutModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set total
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutFinalTotal.textContent = `₹${total}`;
}

function closeCheckout() {
    checkoutOverlay.classList.remove('active');
    checkoutModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    // Collect order details
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    const payment = document.getElementById('order-payment').value;
    
    // Get cart summary
    let orderSummary = cart.map(item => `   - ${item.quantity}x ${item.name}`).join('\n');
    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Change Button State
    const originalBtnText = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Processing...';
    checkoutBtn.disabled = true;

    try {
        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([
                {
                    customer_name: name,
                    phone: phone,
                    address: address,
                    payment_mode: payment,
                    total_amount: total,
                    order_summary: orderSummary
                }
            ]);

        if (error) throw error;

        // Google Form link
        const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdWrC4lviHY1NPpgH8QOITSf-uN7rou1rQ9T_09gLeHFkX0uQ/viewform?usp=publish-editor';

        // Build WhatsApp Message for store owner (includes form link to forward to customer)
        const message = `*New Cookie Order!* 🍪\n\n*Customer Details:*\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\n*Order Summary:*\n${orderSummary}\n\n*Total Amount:* ₹${total}\n*Payment Mode:* ${payment.toUpperCase()}\n\n📋 *Send this form link to the customer:*\n${googleFormUrl}`;
        
        // Replace this with your actual WhatsApp business number (including country code, e.g., 919876543210)
        const storeOwnerWhatsAppNumber = '918310624104'; 
        
        const whatsappUrl = `https://wa.me/${storeOwnerWhatsAppNumber}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp to notify store owner
        window.open(whatsappUrl, '_blank');
        
        // Open Google Form for the customer to fill out order details
        window.open(googleFormUrl, '_blank');
        
        // Clean up cart
        cart = [];
        saveCart();
        updateCartUI();
        closeCheckout();
        checkoutForm.reset();
        
        showToast(`Order placed! WhatsApp & order form have been opened for you.`);

    } catch (error) {
        console.error('Error saving order:', error);
        showToast(`Failed to place order. Please try again!`);
    } finally {
        checkoutBtn.textContent = originalBtnText;
        checkoutBtn.disabled = false;
    }
}

// =========================================
//  Scroll Animations — IntersectionObserver
// =========================================
let scrollObserver;

function initScrollAnimations() {
    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });
}

// =========================================
//  Active Nav Link — IntersectionObserver
// =========================================
function initActiveNav() {
    const sections = document.querySelectorAll('#home, #shop, #about');
    const navLinks = document.querySelectorAll('.nav-links li a');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(section => navObserver.observe(section));
}

// Run Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
