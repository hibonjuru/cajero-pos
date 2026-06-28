// Initial product seeding if localStorage is empty (Menú de Alfajores Artesanales)
const DEFAULT_PRODUCTS = [
    { id: '1', name: 'Alfajor Tradicional', price: 600, stock: 30, category: 'snack', color: '#3b82f6', promoQty: null, promoPrice: null },
    { id: '2', name: 'Alfajor Manjar Nuez', price: 700, stock: 25, category: 'snack', color: '#ef4444', promoQty: null, promoPrice: null },
    { id: '3', name: 'Alfajor Mantequilla de Maní', price: 700, stock: 20, category: 'snack', color: '#ec4899', promoQty: null, promoPrice: null },
    { id: '4', name: 'Alfajor Oreo', price: 800, stock: 15, category: 'snack', color: '#ffffff', promoQty: null, promoPrice: null },
    { id: '5', name: 'Alfajor Nutella', price: 800, stock: 15, category: 'snack', color: '#27272a', promoQty: null, promoPrice: null },
    { id: '6', name: 'Alfajor Bon o Bon', price: 800, stock: 40, category: 'snack', color: '#f59e0b', promoQty: null, promoPrice: null },
    { id: '7', name: 'Alfajor Prestigio', price: 800, stock: 20, category: 'snack', color: '#8b5cf6', promoQty: null, promoPrice: null }
];

// App State
let state = {
    products: [],
    cart: [],
    salesHistory: [],
    currentTab: 'terminal',
    categoryFilter: 'all',
    searchQuery: ''
};

// DOM Elements
const elements = {
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    pageTitle: document.getElementById('page-title'),
    pageSubtitle: document.getElementById('page-subtitle'),
    currentDate: document.getElementById('current-date'),
    
    // Terminal Tab
    searchProduct: document.getElementById('search-product'),
    categoryFilters: document.querySelectorAll('.filter-btn'),
    productsGrid: document.getElementById('products-grid'),
    cartItemsList: document.getElementById('cart-items-list'),
    checkoutTotal: document.getElementById('checkout-total'),
    discountRow: document.getElementById('discount-row'),
    checkoutDiscount: document.getElementById('checkout-discount'),
    applyPromosToggle: document.getElementById('apply-promos-toggle'),
    paymentRadios: document.getElementsByName('payment-method'),
    cashFields: document.getElementById('cash-payment-fields'),
    transferFields: document.getElementById('transfer-payment-fields'),
    amountPaid: document.getElementById('amount-paid'),
    quickCashContainer: document.getElementById('quick-cash-container'),
    checkoutChange: document.getElementById('checkout-change'),
    submitSaleBtn: document.getElementById('submit-sale-btn'),
    clearCartBtn: document.getElementById('clear-cart-btn'),
    
    // Inventory Tab
    productForm: document.getElementById('product-form'),
    editProductId: document.getElementById('edit-product-id'),
    prodName: document.getElementById('prod-name'),
    prodPrice: document.getElementById('prod-price'),
    prodStock: document.getElementById('prod-stock'),
    prodPromoQty: document.getElementById('prod-promo-qty'),
    prodPromoPrice: document.getElementById('prod-promo-price'),
    prodCategory: document.getElementById('prod-category'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    saveProductBtn: document.getElementById('save-product-btn'),
    formProductTitle: document.getElementById('form-product-title'),
    inventoryTableBody: document.getElementById('inventory-table-body'),
    statsTotalProducts: document.getElementById('stats-total-products'),
    statsLowStock: document.getElementById('stats-low-stock'),
    
    // History Tab
    historyTableBody: document.getElementById('history-table-body'),
    exportHistoryBtn: document.getElementById('export-history-btn'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    metricTotalSales: document.getElementById('metric-total-sales'),
    metricCashSales: document.getElementById('metric-cash-sales'),
    metricCashCount: document.getElementById('metric-cash-count'),
    metricTransferSales: document.getElementById('metric-transfer-sales'),
    metricTransferCount: document.getElementById('metric-transfer-count'),
    metricTransactionCount: document.getElementById('metric-transaction-count'),
    
    // Global Toast Container
    toastContainer: document.getElementById('toast-container')
};

// Formatting Helper (Currency)
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Formatting Helper (Date)
function updateDateTimeDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (elements.currentDate) {
        elements.currentDate.textContent = now.toLocaleDateString('es-ES', options);
    }
}

// Initialization
function init() {
    // Set Current Date
    updateDateTimeDisplay();
    setInterval(updateDateTimeDisplay, 60000); // Update time display every minute

    // Load state from localStorage or seed
    const storedProducts = localStorage.getItem('pos_products');
    let loadedProducts = [];
    if (storedProducts) {
        loadedProducts = JSON.parse(storedProducts);
    }
    
    // Check if the loaded products are the old default mockup ones
    const hasOldDefaults = loadedProducts.some(p => p.name === 'Coca-Cola 350ml' || p.name === 'Pepsi 350ml');
    
    if (loadedProducts.length === 0 || hasOldDefaults) {
        state.products = [...DEFAULT_PRODUCTS];
        saveProductsToStorage();
        // Clear history if old test history exists to prevent mismatch
        if (hasOldDefaults) {
            localStorage.removeItem('pos_history');
        }
    } else {
        state.products = loadedProducts;
    }

    // Migrate old var(--color-...) strings to hex values for offline visual correctness
    const colorMap = {
        'var(--color-blue)': '#3b82f6',
        'var(--color-red)': '#ef4444',
        'var(--color-pink)': '#ec4899',
        'var(--color-white)': '#ffffff',
        'var(--color-black)': '#27272a',
        'var(--color-yellow)': '#f59e0b',
        'var(--color-purple)': '#8b5cf6',
        'var(--color-teal)': '#14b8a6',
        'var(--color-rose)': '#f43f5e',
        'var(--color-amber)': '#f59e0b',
        'var(--color-violet)': '#8b5cf6',
        'var(--color-indigo)': '#6366f1'
    };

    let needsSave = false;
    state.products.forEach(p => {
        if (p.color && colorMap[p.color]) {
            p.color = colorMap[p.color];
            needsSave = true;
        }
    });

    if (needsSave) {
        saveProductsToStorage();
    }

    const storedHistory = localStorage.getItem('pos_history');
    if (storedHistory) {
        state.salesHistory = JSON.parse(storedHistory);
    } else {
        state.salesHistory = [];
    }

    // Set up navigation event listeners
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.getAttribute('data-tab'));
        });
    });

    // Setup Category filters
    elements.categoryFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.categoryFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.categoryFilter = btn.getAttribute('data-category');
            renderProductGrid();
        });
    });

    // Setup Search input
    elements.searchProduct.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderProductGrid();
    });

    // Setup Payment Method Toggles
    elements.paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const method = e.target.value;
            // Toggle active card styling
            elements.paymentRadios.forEach(r => {
                r.closest('.payment-option-card').classList.remove('active');
            });
            e.target.closest('.payment-option-card').classList.add('active');
            
            // Toggle payment detail fields
            if (method === 'efectivo') {
                elements.cashFields.classList.remove('hidden');
                elements.transferFields.classList.add('hidden');
                elements.amountPaid.value = '';
                elements.checkoutChange.textContent = formatCurrency(0);
                elements.checkoutChange.className = 'change-amount';
            } else {
                elements.cashFields.classList.add('hidden');
                elements.transferFields.classList.remove('hidden');
                // For bank transfers, payment received is exactly the total
                const total = getCartTotal();
                elements.amountPaid.value = total;
            }
            updateCheckoutState();
        });
    });

    // Setup Amount Paid inputs
    elements.amountPaid.addEventListener('input', calculateChange);

    // Setup Promotions Toggle
    elements.applyPromosToggle.addEventListener('change', () => {
        renderCart();
    });

    // Setup cart clear
    elements.clearCartBtn.addEventListener('click', () => {
        if (state.cart.length > 0) {
            clearCart();
            showToast('Carrito vaciado', 'info');
        }
    });

    // Setup checkout submit
    elements.submitSaleBtn.addEventListener('click', processCheckout);

    // Setup Inventory Form submit
    elements.productForm.addEventListener('submit', handleProductFormSubmit);
    
    // Setup Inventory cancel edit
    elements.cancelEditBtn.addEventListener('click', resetProductForm);

    // Color Pickers active state styling
    const colorRadios = document.getElementsByName('prod-color');
    colorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            e.target.closest('.color-option').classList.add('active');
        });
    });

    // History Actions
    elements.exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // Setup Promo Modal Actions
    document.getElementById('close-modal-btn').addEventListener('click', closePromoModal);
    
    document.getElementById('promo-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('promo-modal')) {
            closePromoModal();
        }
    });

    document.getElementById('clear-promo-modal-btn').addEventListener('click', () => {
        const productId = document.getElementById('promo-modal-product-id').value;
        const productIndex = state.products.findIndex(p => p.id === productId);
        if (productIndex > -1) {
            state.products[productIndex].promoQty = null;
            state.products[productIndex].promoPrice = null;
            saveProductsToStorage();
            
            // Also update cart if product is inside it
            const cartItem = state.cart.find(item => item.product.id === productId);
            if (cartItem) {
                cartItem.product.promoQty = null;
                cartItem.product.promoPrice = null;
            }

            renderProductGrid();
            renderCart();
            renderInventoryTable();
            closePromoModal();
            showToast('Oferta eliminada', 'info');
        }
    });

    document.getElementById('save-promo-modal-btn').addEventListener('click', () => {
        const productId = document.getElementById('promo-modal-product-id').value;
        const qtyVal = parseInt(document.getElementById('promo-modal-qty').value) || null;
        const priceVal = parseFloat(document.getElementById('promo-modal-price').value) || null;

        if (qtyVal && !priceVal) {
            showToast('Debes ingresar un precio especial para la oferta', 'warning');
            return;
        }
        if (!qtyVal && priceVal) {
            showToast('Debes ingresar la cantidad de unidades para la oferta', 'warning');
            return;
        }

        const productIndex = state.products.findIndex(p => p.id === productId);
        if (productIndex > -1) {
            state.products[productIndex].promoQty = qtyVal;
            state.products[productIndex].promoPrice = priceVal;
            saveProductsToStorage();

            // Also update cart if product is inside it
            const cartItem = state.cart.find(item => item.product.id === productId);
            if (cartItem) {
                cartItem.product.promoQty = qtyVal;
                cartItem.product.promoPrice = priceVal;
            }

            renderProductGrid();
            renderCart();
            renderInventoryTable();
            closePromoModal();
            showToast('Oferta guardada y aplicada', 'success');
        }
    });

    // Initial Renders
    renderProductGrid();
    renderCart();
    renderInventoryTable();
    renderHistoryTable();
    updateInventoryStats();
    updateHistoryMetrics();
}

// Save helpers
function saveProductsToStorage() {
    localStorage.setItem('pos_products', JSON.stringify(state.products));
}

function saveHistoryToStorage() {
    localStorage.setItem('pos_history', JSON.stringify(state.salesHistory));
}

// Navigation Tabs switching
function switchTab(tabId) {
    state.currentTab = tabId;
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Update navigation active styles
    elements.navItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update panel active states
    elements.tabPanels.forEach(panel => {
        if (panel.id === `tab-${tabId}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    // Update headers text dynamically
    if (tabId === 'terminal') {
        elements.pageTitle.textContent = 'Terminal de Ventas';
        elements.pageSubtitle.textContent = 'Gestiona compras y calcula vueltos en tiempo real';
        renderProductGrid(); // Re-render in case stock changed
    } else if (tabId === 'inventory') {
        elements.pageTitle.textContent = 'Gestión de Inventario';
        elements.pageSubtitle.textContent = 'Agrega, edita y controla el stock de tus productos';
        renderInventoryTable();
        updateInventoryStats();
    } else if (tabId === 'history') {
        elements.pageTitle.textContent = 'Historial de Transacciones';
        elements.pageSubtitle.textContent = 'Consulte ventas históricas y analice sus métricas';
        renderHistoryTable();
        updateHistoryMetrics();
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    if (type === 'warning') iconClass = 'fa-circle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Close button event
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    // Auto removal
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

function removeToast(toast) {
    toast.style.animation = 'fadeOutLeft 0.3s forwards';
    toast.addEventListener('animationend', () => {
        if (toast.parentNode) {
            toast.remove();
        }
    });
}

// RENDER: Product Grid in Sales Terminal
function renderProductGrid() {
    elements.productsGrid.innerHTML = '';
    
    // Filter & Search logic
    const filtered = state.products.filter(prod => {
        const matchesCategory = state.categoryFilter === 'all' || prod.category === state.categoryFilter;
        const matchesSearch = prod.name.toLowerCase().includes(state.searchQuery) || prod.id.includes(state.searchQuery);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        elements.productsGrid.innerHTML = `
            <div class="empty-cart-state" style="grid-column: 1 / -1; margin-top: 40px;">
                <i class="fa-solid fa-magnifying-glass"></i>
                <p>No se encontraron productos</p>
                <span>Prueba buscando con otros términos o agrega nuevos productos en el panel de inventario.</span>
            </div>
        `;
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card glass-panel';
        card.style.borderLeftColor = product.color || 'var(--color-teal)';
        
        let stockClass = 'stock-good';
        let stockText = `${product.stock} disp.`;
        if (product.stock === 0) {
            stockClass = 'stock-out';
            stockText = 'Agotado';
            card.style.opacity = '0.6';
        } else if (product.stock <= 5) {
            stockClass = 'stock-low';
            stockText = `Solo ${product.stock}`;
        }

        let promoHTML = '';
        if (product.promoQty && product.promoPrice) {
            promoHTML = `<span class="promo-badge" style="margin-top: 4px; width: fit-content;"><i class="fa-solid fa-tag"></i> Oferta ${product.promoQty}x${formatCurrency(product.promoPrice)}</span>`;
        }

        card.innerHTML = `
            <div class="product-card-top" style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start; gap: 4px;">
                <div style="display: flex; align-items: flex-start; gap: 6px; flex-grow: 1; min-width: 0;">
                    <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${product.color || 'var(--color-teal)'}; border: ${product.color === '#ffffff' ? '1px solid rgba(0,0,0,0.3)' : 'none'}; display: inline-block; flex-shrink: 0; margin-top: 4px;"></span>
                    <span class="product-title" style="white-space: normal; word-break: break-word; overflow: visible; display: inline; font-size: 13px; font-weight: 600; line-height: 1.3;">${product.name}</span>
                </div>
                <button class="btn-card-promo" data-id="${product.id}" title="Oferta Rápida" style="flex-shrink: 0;"><i class="fa-solid fa-tag"></i></button>
            </div>
            <div style="margin-top: 4px;">
                ${promoHTML}
            </div>
            <div class="product-card-bottom">
                <span class="product-price">${formatCurrency(product.price)}</span>
                <span class="stock-badge ${stockClass}">${stockText}</span>
            </div>
        `;

        card.querySelector('.btn-card-promo').addEventListener('click', (e) => {
            e.stopPropagation();
            openPromoModal(product.id);
        });

        card.addEventListener('click', () => {
            if (product.stock > 0) {
                addProductToCart(product.id);
            } else {
                showToast(`¡El producto "${product.name}" está agotado!`, 'warning');
            }
        });

        elements.productsGrid.appendChild(card);
    });
}

// LOGIC: Cart operations
function calculateCartTotals() {
    let subtotal = 0;
    let total = 0;
    const usePromos = elements.applyPromosToggle ? elements.applyPromosToggle.checked : true;

    // First calculate subtotal for all items
    state.cart.forEach(item => {
        subtotal += item.product.price * item.quantity;
    });

    if (!usePromos) {
        total = subtotal;
        return { subtotal, total, discount: 0 };
    }

    // Group items by promo key if they are eligible for promos
    // Key format: price_promoQty_promoPrice
    const promoGroups = {};
    let regularTotal = 0;

    state.cart.forEach(item => {
        const p = item.product;
        if (p.promoQty && p.promoPrice) {
            const key = `${p.price}_${p.promoQty}_${p.promoPrice}`;
            if (!promoGroups[key]) {
                promoGroups[key] = {
                    normalPrice: p.price,
                    promoQty: p.promoQty,
                    promoPrice: p.promoPrice,
                    totalQuantity: 0
                };
            }
            promoGroups[key].totalQuantity += item.quantity;
        } else {
            regularTotal += p.price * item.quantity;
        }
    });

    // Calculate total for promo groups
    let promoTotal = 0;
    Object.values(promoGroups).forEach(group => {
        const numPromos = Math.floor(group.totalQuantity / group.promoQty);
        const remainder = group.totalQuantity % group.promoQty;
        promoTotal += (numPromos * group.promoPrice) + (remainder * group.normalPrice);
    });

    total = regularTotal + promoTotal;
    const discount = subtotal - total;
    return { subtotal, total, discount };
}

function getCartTotal() {
    return calculateCartTotals().total;
}

function addProductToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const cartItemIndex = state.cart.findIndex(item => item.product.id === productId);
    
    if (cartItemIndex > -1) {
        const currentQty = state.cart[cartItemIndex].quantity;
        if (currentQty >= product.stock) {
            showToast(`No puedes añadir más. Stock límite de "${product.name}" alcanzado.`, 'warning');
            return;
        }
        state.cart[cartItemIndex].quantity += 1;
    } else {
        state.cart.push({
            product: { ...product },
            quantity: 1,
            applyPromo: true
        });
    }

    renderCart();
    showToast(`"${product.name}" añadido al detalle`, 'success');
}

function updateCartQty(productId, delta) {
    const cartItemIndex = state.cart.findIndex(item => item.product.id === productId);
    if (cartItemIndex === -1) return;

    const cartItem = state.cart[cartItemIndex];
    const originalProduct = state.products.find(p => p.id === productId);
    const newQty = cartItem.quantity + delta;

    if (newQty <= 0) {
        state.cart.splice(cartItemIndex, 1);
        showToast(`"${cartItem.product.name}" eliminado del detalle`, 'info');
    } else if (newQty > originalProduct.stock) {
        showToast(`Stock límite de "${originalProduct.name}" alcanzado`, 'warning');
    } else {
        cartItem.quantity = newQty;
    }

    renderCart();
}

function removeCartItem(productId) {
    const cartItemIndex = state.cart.findIndex(item => item.product.id === productId);
    if (cartItemIndex === -1) return;
    
    const name = state.cart[cartItemIndex].product.name;
    state.cart.splice(cartItemIndex, 1);
    renderCart();
    showToast(`"${name}" eliminado del detalle`, 'info');
}

function clearCart() {
    state.cart = [];
    renderCart();
}

// RENDER: Shopping Cart
function renderCart() {
    elements.cartItemsList.innerHTML = '';
    
    if (state.cart.length === 0) {
        elements.cartItemsList.innerHTML = `
            <div class="empty-cart-state">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>El carrito está vacío</p>
                <span>Selecciona productos de la izquierda para comenzar</span>
            </div>
        `;
        elements.checkoutTotal.textContent = formatCurrency(0);
        elements.discountRow.classList.add('hidden');
        elements.submitSaleBtn.disabled = true;
        elements.amountPaid.value = '';
        elements.checkoutChange.textContent = formatCurrency(0);
        elements.quickCashContainer.innerHTML = '';
        return;
    }

    const usePromos = elements.applyPromosToggle ? elements.applyPromosToggle.checked : true;

    // Group quantities and calculate discounts per group
    const promoGroups = {};
    state.cart.forEach(item => {
        const p = item.product;
        if (p.promoQty && p.promoPrice) {
            const key = `${p.price}_${p.promoQty}_${p.promoPrice}`;
            if (!promoGroups[key]) {
                promoGroups[key] = {
                    normalPrice: p.price,
                    promoQty: p.promoQty,
                    promoPrice: p.promoPrice,
                    totalQuantity: 0
                };
            }
            promoGroups[key].totalQuantity += item.quantity;
        }
    });

    // Calculate discount for each group
    Object.keys(promoGroups).forEach(key => {
        const group = promoGroups[key];
        const normalCost = group.totalQuantity * group.normalPrice;
        const numPromos = Math.floor(group.totalQuantity / group.promoQty);
        const remainder = group.totalQuantity % group.promoQty;
        const promoCost = (numPromos * group.promoPrice) + (remainder * group.normalPrice);
        group.discount = normalCost - promoCost;
    });

    state.cart.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        
        let finalItemTotal = item.product.price * item.quantity;
        let promoBadgeHTML = '';

        const p = item.product;
        if (usePromos && p.promoQty && p.promoPrice) {
            const key = `${p.price}_${p.promoQty}_${p.promoPrice}`;
            const group = promoGroups[key];
            
            if (group && group.totalQuantity >= p.promoQty) {
                // Proportional discount distribution
                const itemNormalTotal = p.price * item.quantity;
                const itemDiscount = (item.quantity / group.totalQuantity) * group.discount;
                finalItemTotal = Math.round(itemNormalTotal - itemDiscount);

                promoBadgeHTML = `
                    <span class="promo-badge" style="font-size: 9px; padding: 2px 6px; box-shadow: none; animation: none; margin-left: 6px;">
                        <i class="fa-solid fa-tag"></i> Oferta
                    </span>
                `;
            }
        }

        itemRow.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name" style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                    ${item.product.name}
                    ${promoBadgeHTML}
                </div>
                <div class="cart-item-price-unit">${formatCurrency(item.product.price)} c/u</div>
            </div>
            <div class="cart-item-controls">
                <div class="qty-control">
                    <button class="qty-btn btn-qty-dec"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn btn-qty-inc"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div class="cart-item-total">${formatCurrency(finalItemTotal)}</div>
                <button class="cart-item-remove"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;

        // Attach event handlers
        itemRow.querySelector('.btn-qty-dec').addEventListener('click', () => updateCartQty(item.product.id, -1));
        itemRow.querySelector('.btn-qty-inc').addEventListener('click', () => updateCartQty(item.product.id, 1));
        itemRow.querySelector('.cart-item-remove').addEventListener('click', () => removeCartItem(item.product.id));

        elements.cartItemsList.appendChild(itemRow);
    });

    const { subtotal, total, discount } = calculateCartTotals();
    elements.checkoutTotal.textContent = formatCurrency(total);
    
    // Handle discount row display
    if (discount > 0) {
        elements.discountRow.classList.remove('hidden');
        elements.checkoutDiscount.textContent = `-${formatCurrency(discount)}`;
    } else {
        elements.discountRow.classList.add('hidden');
    }
    
    // Auto-fill paid amount if payment method is bank transfer
    const method = getSelectedPaymentMethod();
    if (method === 'transferencia') {
        elements.amountPaid.value = total;
    }
    
    renderQuickCashChips(total);
    calculateChange();
    updateCheckoutState();
}

function getSelectedPaymentMethod() {
    let method = 'efectivo';
    elements.paymentRadios.forEach(radio => {
        if (radio.checked) {
            method = radio.value;
        }
    });
    return method;
}

// Generate Quick Cash Suggestions (Efectivo)
function renderQuickCashChips(total) {
    elements.quickCashContainer.innerHTML = '';
    
    if (total <= 0) return;

    // Suggest cash notes in Chilean pesos context (or generic denominations depending on currency)
    // Common denominations: 1000, 2000, 5000, 10000, 20000
    const denominations = [1000, 2000, 5000, 10000, 20000];
    const suggestions = new Set([total]); // Always suggest exact amount first

    denominations.forEach(denom => {
        if (denom > total) {
            suggestions.add(denom);
        }
        
        // Multiples of denominations
        const multiplier = Math.ceil(total / denom);
        if (multiplier > 1 && multiplier * denom > total) {
            suggestions.add(multiplier * denom);
        }
    });

    // Convert Set to sorted Array
    const sortedSuggestions = Array.from(suggestions)
        .sort((a, b) => a - b)
        .slice(0, 5); // Limit to top 5 suggestions

    sortedSuggestions.forEach(amount => {
        const chip = document.createElement('button');
        chip.className = 'cash-chip';
        
        if (amount === total) {
            chip.textContent = 'Exacto';
        } else {
            chip.textContent = formatCurrency(amount);
        }

        chip.addEventListener('click', () => {
            elements.amountPaid.value = amount;
            calculateChange();
        });

        elements.quickCashContainer.appendChild(chip);
    });
}

// LOGIC: Change calculation
function calculateChange() {
    const total = getCartTotal();
    const paid = parseFloat(elements.amountPaid.value) || 0;
    const method = getSelectedPaymentMethod();
    
    if (method === 'transferencia') {
        elements.checkoutChange.textContent = formatCurrency(0);
        elements.checkoutChange.className = 'change-amount';
        updateCheckoutState();
        return;
    }

    if (paid < total || total === 0) {
        elements.checkoutChange.textContent = formatCurrency(0);
        elements.checkoutChange.className = 'change-amount text-muted-dark';
    } else {
        const change = paid - total;
        elements.checkoutChange.textContent = formatCurrency(change);
        elements.checkoutChange.className = 'change-amount text-success';
    }

    updateCheckoutState();
}

function updateCheckoutState() {
    const total = getCartTotal();
    const paid = parseFloat(elements.amountPaid.value) || 0;
    const method = getSelectedPaymentMethod();
    
    let isPaymentValid = false;
    
    if (total > 0) {
        if (method === 'transferencia') {
            isPaymentValid = true; // Transfer checks are verified manually, amount is simulated as matching total
        } else if (method === 'efectivo' && paid >= total) {
            isPaymentValid = true; // Cash payment is sufficient
        }
    }

    elements.submitSaleBtn.disabled = !isPaymentValid;
}

// LOGIC: Process sale
function processCheckout() {
    const { total, discount } = calculateCartTotals();
    if (total <= 0 || state.cart.length === 0) return;

    const method = getSelectedPaymentMethod();
    const paid = parseFloat(elements.amountPaid.value) || 0;
    const change = method === 'efectivo' ? (paid - total) : 0;

    // 1. Reduce stock in state.products
    let stockValid = true;
    const itemsForSale = [];

    state.cart.forEach(cartItem => {
        const product = state.products.find(p => p.id === cartItem.product.id);
        if (!product || product.stock < cartItem.quantity) {
            stockValid = false;
            showToast(`Error: "${cartItem.product.name}" no tiene suficiente stock.`, 'error');
        } else {
            itemsForSale.push({
                product: product,
                quantity: cartItem.quantity
            });
        }
    });

    if (!stockValid) return; // Abort checkout if stock became invalid

    // Commit stock reduction
    itemsForSale.forEach(item => {
        item.product.stock -= item.quantity;
    });
    saveProductsToStorage();

    // 2. Add to sales history
    const transaction = {
        id: 'TX-' + Date.now().toString().slice(-6),
        date: new Date().toISOString(),
        products: state.cart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        })),
        method: method,
        total: total,
        discount: discount,
        paidAmount: method === 'efectivo' ? paid : total,
        change: change
    };

    state.salesHistory.unshift(transaction); // Prepend to show latest first
    saveHistoryToStorage();

    // 3. Clear cart & feedback
    clearCart();
    showToast('¡Venta registrada con éxito!', 'success');
    
    // 4. Update elements
    renderProductGrid();
    updateInventoryStats();
    updateHistoryMetrics();
    renderHistoryTable();
}

// RENDER: Inventory Manager Tab
function renderInventoryTable() {
    elements.inventoryTableBody.innerHTML = '';
    
    if (state.products.length === 0) {
        elements.inventoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px 10px;">
                    No hay productos registrados en el inventario. Agrega uno usando el formulario.
                </td>
            </tr>
        `;
        return;
    }

    state.products.forEach(product => {
        const row = document.createElement('tr');
        
        let stockClass = 'text-success';
        if (product.stock === 0) {
            stockClass = 'text-danger font-bold';
        } else if (product.stock <= 5) {
            stockClass = 'text-warning';
        }

        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${product.color || 'var(--color-teal)'}; display: inline-block;"></span>
                    <span class="font-semibold">${product.name}</span>
                </div>
            </td>
            <td><span class="product-category-tag">${product.category}</span></td>
            <td>${formatCurrency(product.price)}</td>
            <td><span class="${stockClass}">${product.stock} unidades</span></td>
            <td>
                <button class="btn-table-action btn-table-edit" title="Editar producto" data-id="${product.id}">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-table-action btn-table-delete" title="Eliminar producto" data-id="${product.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;

        // Event hooks
        row.querySelector('.btn-table-edit').addEventListener('click', () => editProductInit(product.id));
        row.querySelector('.btn-table-delete').addEventListener('click', () => deleteProduct(product.id));

        elements.inventoryTableBody.appendChild(row);
    });
}

function updateInventoryStats() {
    elements.statsTotalProducts.textContent = `${state.products.length} Productos`;
    const lowStockCount = state.products.filter(p => p.stock <= 5).length;
    elements.statsLowStock.textContent = `${lowStockCount} Bajo Stock`;
}

// LOGIC: Add / Edit Product forms
function handleProductFormSubmit(e) {
    e.preventDefault();

    const id = elements.editProductId.value;
    const name = elements.prodName.value.trim();
    const price = parseFloat(elements.prodPrice.value) || 0;
    const stock = parseInt(elements.prodStock.value) || 0;
    const category = elements.prodCategory.value;
    const promoQty = parseInt(elements.prodPromoQty.value) || null;
    const promoPrice = parseFloat(elements.prodPromoPrice.value) || null;
    
    // Find active color picker choice
    let color = 'var(--color-blue)';
    const selectedColorRadio = document.querySelector('input[name="prod-color"]:checked');
    if (selectedColorRadio) {
        color = selectedColorRadio.value;
    }

    if (!name || price < 0 || stock < 0) {
        showToast('Formulario inválido. Revisa los campos obligatorios.', 'error');
        return;
    }

    if (id) {
        // Mode: EDIT
        const index = state.products.findIndex(p => p.id === id);
        if (index > -1) {
            state.products[index] = { ...state.products[index], name, price, stock, category, color, promoQty, promoPrice };
            showToast('Producto actualizado exitosamente', 'success');
        }
    } else {
        // Mode: NEW
        const newProduct = {
            id: Date.now().toString(),
            name,
            price,
            stock,
            category,
            color,
            promoQty,
            promoPrice
        };
        state.products.push(newProduct);
        showToast('Producto registrado exitosamente', 'success');
    }

    saveProductsToStorage();
    resetProductForm();
    renderInventoryTable();
    updateInventoryStats();
}

function editProductInit(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    // Fill form elements
    elements.editProductId.value = product.id;
    elements.prodName.value = product.name;
    elements.prodPrice.value = product.price;
    elements.prodStock.value = product.stock;
    elements.prodPromoQty.value = product.promoQty || '';
    elements.prodPromoPrice.value = product.promoPrice || '';
    elements.prodCategory.value = product.category;

    // Select color radio
    const colorRadio = document.querySelector(`input[name="prod-color"][value="${product.color}"]`);
    if (colorRadio) {
        colorRadio.checked = true;
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        colorRadio.closest('.color-option').classList.add('active');
    }

    // Toggle form elements layout
    elements.formProductTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-primary"></i> Editar Producto`;
    elements.saveProductBtn.textContent = 'Actualizar Producto';
    elements.cancelEditBtn.classList.remove('hidden');

    // Scroll to form on mobile/tablet view
    elements.productForm.scrollIntoView({ behavior: 'smooth' });
}

function resetProductForm() {
    elements.productForm.reset();
    elements.editProductId.value = '';
    elements.formProductTitle.innerHTML = `<i class="fa-solid fa-circle-plus text-primary"></i> Agregar Producto`;
    elements.saveProductBtn.textContent = 'Guardar Producto';
    elements.cancelEditBtn.classList.add('hidden');

    // Reset color radios
    const firstColorRadio = document.querySelector('input[name="prod-color"][value="var(--color-blue)"]');
    if (firstColorRadio) {
        firstColorRadio.checked = true;
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
        firstColorRadio.closest('.color-option').classList.add('active');
    }
}

function deleteProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    if (confirm(`¿Estás seguro de eliminar el producto "${product.name}" del inventario?`)) {
        state.products = state.products.filter(p => p.id !== productId);
        // Also remove from cart if it's there
        state.cart = state.cart.filter(item => item.product.id !== productId);
        
        saveProductsToStorage();
        renderInventoryTable();
        updateInventoryStats();
        showToast(`"${product.name}" eliminado`, 'info');
        
        // Reset form just in case it was being edited
        if (elements.editProductId.value === productId) {
            resetProductForm();
        }
    }
}

// RENDER: Transactions History Tab
function renderHistoryTable() {
    elements.historyTableBody.innerHTML = '';
    
    if (state.salesHistory.length === 0) {
        elements.historyTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 10px;">
                    Historial vacío. Registra tu primera venta en la terminal.
                </td>
            </tr>
        `;
        return;
    }

    state.salesHistory.forEach(tx => {
        const row = document.createElement('tr');
        
        // Format products listing
        const productsHTML = tx.products.map(p => `
            <span class="history-prod-tag">${p.name} <strong>x${p.quantity}</strong></span>
        `).join('');

        const formattedDate = new Date(tx.date).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // Detail info on payment amount and change
        let detailsHTML = '';
        if (tx.method === 'efectivo') {
            detailsHTML = `
                <span class="history-detail-subtext">Paga: ${formatCurrency(tx.paidAmount)}</span>
                <span class="history-detail-subtext text-success">Vuelto: ${formatCurrency(tx.change)}</span>
            `;
        } else {
            detailsHTML = `<span class="history-detail-subtext">Comp. Validado</span>`;
        }

        row.innerHTML = `
            <td><strong class="text-muted-dark">${tx.id}</strong></td>
            <td>${formattedDate}</td>
            <td><div style="max-width: 320px; overflow-wrap: break-word;">${productsHTML}</div></td>
            <td>
                <span class="history-payment-badge ${tx.method}">
                    <i class="fa-solid ${tx.method === 'efectivo' ? 'fa-money-bill-wave' : 'fa-mobile-screen-button'}"></i>
                    ${tx.method === 'efectivo' ? 'Efectivo' : 'Transferencia'}
                </span>
            </td>
            <td><strong class="text-success">${formatCurrency(tx.total)}</strong></td>
            <td>${detailsHTML}</td>
        `;

        elements.historyTableBody.appendChild(row);
    });
}

function updateHistoryMetrics() {
    let totalSales = 0;
    let cashSales = 0;
    let transferSales = 0;
    let cashCount = 0;
    let transferCount = 0;

    state.salesHistory.forEach(tx => {
        totalSales += tx.total;
        if (tx.method === 'efectivo') {
            cashSales += tx.total;
            cashCount++;
        } else {
            transferSales += tx.total;
            transferCount++;
        }
    });

    elements.metricTotalSales.textContent = formatCurrency(totalSales);
    elements.metricCashSales.textContent = formatCurrency(cashSales);
    elements.metricCashCount.textContent = `${cashCount} venta${cashCount === 1 ? '' : 's'}`;
    elements.metricTransferSales.textContent = formatCurrency(transferSales);
    elements.metricTransferCount.textContent = `${transferCount} transferencia${transferCount === 1 ? '' : 's'}`;
    elements.metricTransactionCount.textContent = state.salesHistory.length;
}

function clearHistory() {
    if (state.salesHistory.length === 0) return;

    if (confirm('¿Estás seguro de que deseas borrar todo el historial de transacciones? Esta acción no se puede deshacer.')) {
        state.salesHistory = [];
        saveHistoryToStorage();
        renderHistoryTable();
        updateHistoryMetrics();
        showToast('Historial borrado con éxito', 'success');
    }
}

// LOGIC: Export CSV
function exportHistoryToCSV() {
    if (state.salesHistory.length === 0) {
        showToast('No hay transacciones para exportar', 'warning');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for proper Excel Spanish support
    csvContent += "ID Transaccion,Fecha,Productos Vendidos,Metodo de Pago,Total Cobrado,Monto Recibido,Vuelto Entregado\r\n";

    state.salesHistory.forEach(tx => {
        const formattedDate = new Date(tx.date).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        
        // Stringify products list
        const productsStr = tx.products.map(p => `${p.name} (x${p.quantity})`).join('; ');
        
        const row = [
            tx.id,
            `"${formattedDate}"`,
            `"${productsStr}"`,
            tx.method === 'efectivo' ? 'Efectivo' : 'Transferencia',
            tx.total,
            tx.paidAmount,
            tx.change
        ].join(',');

        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    // File name with date timestamp
    const dateStr = new Date().toISOString().slice(0,10);
    link.setAttribute("download", `historial_ventas_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Historial exportado como CSV', 'success');
}

// LOGIC: Promo Modal operations
function openPromoModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('promo-modal-product-id').value = product.id;
    document.getElementById('promo-modal-product-name').textContent = product.name;
    document.getElementById('promo-modal-qty').value = product.promoQty || '';
    document.getElementById('promo-modal-price').value = product.promoPrice || '';

    document.getElementById('promo-modal').classList.remove('hidden');
}

function closePromoModal() {
    document.getElementById('promo-modal').classList.add('hidden');
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
