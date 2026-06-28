// Initial product seeding if localStorage is empty
const DEFAULT_PRODUCTS = [
    { id: '1', name: 'Coca-Cola 350ml', price: 1200, stock: 30, category: 'bebida', color: 'var(--color-teal)' },
    { id: '2', name: 'Pepsi 350ml', price: 1100, stock: 25, category: 'bebida', color: 'var(--color-teal)' },
    { id: '3', name: 'Papas Fritas Lays', price: 1500, stock: 15, category: 'snack', color: 'var(--color-pink)' },
    { id: '4', name: 'Sándwich Jamón Queso', price: 2500, stock: 10, category: 'comida', color: 'var(--color-indigo)' },
    { id: '5', name: 'Chocolate Milky', price: 990, stock: 40, category: 'snack', color: 'var(--color-violet)' },
    { id: '6', name: 'Galletas de Avena', price: 800, stock: 0, category: 'snack', color: 'var(--color-rose)' },
    { id: '7', name: 'Café Expreso', price: 1800, stock: 20, category: 'bebida', color: 'var(--color-amber)' }
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
    metricTransferSales: document.getElementById('metric-transfer-sales'),
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
    if (storedProducts) {
        state.products = JSON.parse(storedProducts);
    } else {
        state.products = [...DEFAULT_PRODUCTS];
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

        card.innerHTML = `
            <div class="product-card-top">
                <span class="product-title">${product.name}</span>
                <span class="product-category-tag">${product.category}</span>
            </div>
            <div class="product-card-bottom">
                <span class="product-price">${formatCurrency(product.price)}</span>
                <span class="stock-badge ${stockClass}">${stockText}</span>
            </div>
        `;

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
function getCartTotal() {
    return state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
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
            quantity: 1
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
        elements.submitSaleBtn.disabled = true;
        elements.amountPaid.value = '';
        elements.checkoutChange.textContent = formatCurrency(0);
        elements.quickCashContainer.innerHTML = '';
        return;
    }

    state.cart.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';
        
        const itemTotal = item.product.price * item.quantity;

        itemRow.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-price-unit">${formatCurrency(item.product.price)} c/u</div>
            </div>
            <div class="cart-item-controls">
                <div class="qty-control">
                    <button class="qty-btn btn-qty-dec"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty-val">${item.quantity}</span>
                    <button class="qty-btn btn-qty-inc"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div class="cart-item-total">${formatCurrency(itemTotal)}</div>
                <button class="cart-item-remove"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;

        // Attach event handlers
        itemRow.querySelector('.btn-qty-dec').addEventListener('click', () => updateCartQty(item.product.id, -1));
        itemRow.querySelector('.btn-qty-inc').addEventListener('click', () => updateCartQty(item.product.id, 1));
        itemRow.querySelector('.cart-item-remove').addEventListener('click', () => removeCartItem(item.product.id));

        elements.cartItemsList.appendChild(itemRow);
    });

    const total = getCartTotal();
    elements.checkoutTotal.textContent = formatCurrency(total);
    
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
    const total = getCartTotal();
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
    
    // Find active color picker choice
    let color = 'var(--color-teal)';
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
            state.products[index] = { ...state.products[index], name, price, stock, category, color };
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
            color
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
    const firstColorRadio = document.querySelector('input[name="prod-color"][value="var(--color-teal)"]');
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

    state.salesHistory.forEach(tx => {
        totalSales += tx.total;
        if (tx.method === 'efectivo') {
            cashSales += tx.total;
        } else {
            transferSales += tx.total;
        }
    });

    elements.metricTotalSales.textContent = formatCurrency(totalSales);
    elements.metricCashSales.textContent = formatCurrency(cashSales);
    elements.metricTransferSales.textContent = formatCurrency(transferSales);
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

// Start the application
document.addEventListener('DOMContentLoaded', init);
