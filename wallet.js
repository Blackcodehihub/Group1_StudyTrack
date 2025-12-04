//Logout Modal
    const logoutTrigger = document.querySelector('.bot-nav a[href="#"]');

    
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogout');
    const confirmLogoutBtn = document.getElementById('confirmLogout');

    
    logoutTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        logoutModal.style.display = "flex";
    });


    cancelLogoutBtn.addEventListener('click', () => {
        logoutModal.style.display = "none";
    });

    
    confirmLogoutBtn.addEventListener('click', () => {
        window.location.href = "Sign-in.html"; 
    });

    
    window.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.style.display = "none";
        }
    });
        // API
        const API_URL = 'wallet_api.php';
        async function apiGet(endpoint) {
            try {
                const res = await fetch(`${API_URL}?${endpoint}`);
                // CRITICAL FIX: Check for 403 Forbidden (Auth failure)
                if (res.status === 403) throw new Error('Authentication required.');
                if (!res.ok) throw new Error('Network error: ' + res.status);
                
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                return data;

            } catch (e) {
                console.warn('API GET failed:', e);
                // Propagate specific auth errors
                if (e.message === 'Authentication required.') throw e;
                return null;
            }
        }
        async function apiPost(data) {
            try {
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                // CRITICAL FIX: Check for 403 Forbidden (Auth failure)
                if (res.status === 403) throw new Error('Authentication required.');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Network error: ${res.status}`);
                }
                return await res.json();
            } catch (e) {
                console.warn('API POST failed:', e);
                throw e; // Re-throw to be caught by the submit handler
            }
        }
        // Theme Toggle
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            themeIcon.src = 'images_icons/moon.png';
        } else {
            themeIcon.src = 'images_icons/Sun.png';
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeIcon.src = isLight ? 'images_icons/moon.png' : 'images_icons/Sun.png';
        });
        // Hamburger
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            mainContent.classList.toggle('shift');
        });
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !hamburgerBtn.contains(e.target)) {
                sidebar.classList.remove('active');
                mainContent.classList.remove('shift');
            }
        });
        // Wallet Data
        let walletData = {
            balance: 0,
            totalIncome: 0,
            totalExpense: 0,
            incomeRecords: [],
            expenseRecords: []
        };
        // CRITICAL: ID is now VARCHAR (string)
        let pendingDeleteId = null; 
        let pendingDeleteType = null;
        function showDeleteModal(id, type) {
            pendingDeleteId = id;
            pendingDeleteType = type;
            document.getElementById('deleteModalMessage').textContent = 
                `Are you sure you want to delete this ${type} record (ID: ${id})? This action cannot be undone.`;
            document.getElementById('deleteModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            pendingDeleteId = null;
            pendingDeleteType = null;
        }
        async function handleDeleteRecord(e) {
            const btn = e.currentTarget;
            // CRITICAL: Get ID as string
            const id = btn.dataset.id; 
            const type = btn.dataset.type;
            showDeleteModal(id, type);
        }
        function renderTransactionList(container, records, type) {
            let scrollContainer = container;
            if (container.id !== 'recentIncomeContainer' && container.id !== 'recentExpenseContainer') {
                scrollContainer = container.querySelector('.recent-transactions-container') || container;
            }
            const header = container.querySelector('h4');
            scrollContainer.innerHTML = '';
            const fragment = document.createDocumentFragment();
            // Show only the latest 3 records
            const recentRecords = records.slice(-3); 
            const iconMap = {
                Salary: 'fa-briefcase', Investment: 'fa-chart-line', Business: 'fa-briefcase',
                Interest: 'fa-wallet', 'Extra Income': 'fa-hand-holding-dollar', Other: 'fa-ellipsis',
                Food: 'fa-utensils', Transport: 'fa-truck', Shopping: 'fa-bag-shopping',
                Grocery: 'fa-cart-shopping', Rentals: 'fa-house', Bills: 'fa-receipt',
                Education: 'fa-graduation-cap', Medical: 'fa-suitcase-medical', Others: 'fa-ellipsis'
            };
            if (recentRecords.length === 0) {
                const empty = document.createElement('p');
                empty.style.cssText = 'color: var(--text-dim); text-align: center; margin-top: 10px;';
                empty.textContent = 'No records yet';
                fragment.appendChild(empty);
            } else {
                // Render in reverse order to show latest first
                recentRecords.slice().reverse().forEach(record => {
                    const item = document.createElement('div');
                    item.className = 'transaction-item';
                    const iconName = iconMap[record.category] || 'fa-question';
                    const date = new Date(record.date).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                    });
                    item.innerHTML = `
                        <div class="transaction-details">
                            <i class="fa-solid ${iconName}"></i>
                            <div class="text">
                                <h4>${record.category}</h4>
                                <p>${date}</p>
                            </div>
                        </div>
                        <div class="transaction-amount ${type === 'income' ? 'amount-income' : 'amount-expense'}">
                            <i class="fa-solid fa-${type === 'income' ? 'plus' : 'minus'}"></i>₱ ${record.amount.toLocaleString()}
                        </div>
                        <button class="delete-btn" data-id="${record.id}" data-type="${type}" title="Delete record">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    fragment.appendChild(item);
                });
            }
            scrollContainer.appendChild(fragment);
            // Re-attach listeners for deletion
            scrollContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.removeEventListener('click', handleDeleteRecord);
                btn.addEventListener('click', handleDeleteRecord);
            });
        }
        async function loadWalletData() {
            try {
                const data = await apiGet('get=wallet');
                if (data && data.wallet) {
                    walletData = data.wallet;
                } else if (data) {
                    walletData = data;
                }
                updateUI();
            } catch (e) {
                if (e.message === 'Authentication required.') {
                    // Show a message or redirect to login
                    document.querySelector('.balance-card .amount').innerHTML = `<span>₱</span> AUTH`;
                    document.getElementById('recentIncomeContainer').innerHTML = `<p style="color:red; text-align:center;">Login Required</p>`;
                }
                // Continue to update UI with potentially empty data
                updateUI();
            }
        }
        function updateUI() {
            document.getElementById('totalBalanceAmount').innerHTML = 
                `<span>₱</span> ${walletData.balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
            document.getElementById('totalIncomeAmount').textContent = 
                `₱ ${walletData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
            document.getElementById('totalExpenseAmount').textContent = 
                `₱ ${walletData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
            const incomeContainer = document.getElementById('recentIncomeContainer');
            renderTransactionList(incomeContainer, walletData.incomeRecords, 'income');
            const expenseContainer = document.getElementById('recentExpenseContainer');
            renderTransactionList(expenseContainer, walletData.expenseRecords, 'expense');
        }
        // Modal logic
        const openRecordModalBtn = document.getElementById('openRecordModalBtn');
        const addRecordModal = document.getElementById('addRecordModal');
        const closeRecordModalBtn = document.getElementById('closeRecordModalBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');
        const typeExpenseBtn = document.getElementById('typeExpenseBtn');
        const typeIncomeBtn = document.getElementById('typeIncomeBtn');
        const categoryGrid = document.getElementById('categoryGrid');
        const recordAmountInput = document.getElementById('recordAmountInput');
        const addRecordSubmitBtn = document.getElementById('addRecordSubmitBtn');
        const expenseCategories = [
            { name: "Food", icon: "fa-utensils" }, { name: "Transport", icon: "fa-truck" },
            { name: "Shopping", icon: "fa-bag-shopping" }, { name: "Grocery", icon: "fa-cart-shopping" },
            { name: "Rentals", icon: "fa-house" }, { name: "Bills", icon: "fa-receipt" },
            { name: "Education", icon: "fa-graduation-cap" }, { name: "Medical", icon: "fa-suitcase-medical" },
            { name: "Investment", icon: "fa-coins" }, { name: "Others", icon: "fa-ellipsis" }
        ];
        const incomeCategories = [
            { name: "Salary", icon: "fa-briefcase" }, { name: "Investment", icon: "fa-chart-line" },
            { name: "Business", icon: "fa-briefcase" }, { name: "Interest", icon: "fa-wallet" },
            { name: "Extra Income", icon: "fa-hand-holding-dollar" }, { name: "Other", icon: "fa-ellipsis" }
        ];
        let currentType = 'expense';
        let selectedCategory = expenseCategories[0].name;
        function handleCategoryClick(event) {
            const item = event.target.closest('.category-item');
            if (!item) return;
            categoryGrid.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            selectedCategory = item.querySelector('p').textContent;
        }
        function renderCategories(type) {
            categoryGrid.innerHTML = '';
            const categories = type === 'income' ? incomeCategories : expenseCategories;
            // Set initial selected category and type
            selectedCategory = categories[0].name;
            categories.forEach((cat, index) => {
                const item = document.createElement('div');
                item.className = 'category-item';
                // Set the first item as active
                if (index === 0) item.classList.add('active'); 
                item.innerHTML = `<i class="fa-solid ${cat.icon}"></i><p>${cat.name}</p>`;
                item.addEventListener('click', handleCategoryClick);
                categoryGrid.appendChild(item);
            });
        }
        function openRecordModal() {
            addRecordModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            currentType = 'expense';
            // Reset state to default expense category
            selectedCategory = expenseCategories[0].name; 
            typeExpenseBtn.classList.add('active');
            typeIncomeBtn.classList.remove('active');
            recordAmountInput.value = '100';
            renderCategories('expense');
            setTimeout(() => recordAmountInput.focus(), 100);
        }
        function closeRecordModal() {
            addRecordModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        openRecordModalBtn.addEventListener('click', openRecordModal);
        closeRecordModalBtn.addEventListener('click', closeRecordModal);
        modalCancelBtn.addEventListener('click', closeRecordModal);
        addRecordModal.addEventListener('click', e => {
            if (e.target === addRecordModal) closeRecordModal();
        });
        typeExpenseBtn.addEventListener('click', () => {
            currentType = 'expense';
            typeExpenseBtn.classList.add('active');
            typeIncomeBtn.classList.remove('active');
            renderCategories('expense');
        });
        typeIncomeBtn.addEventListener('click', () => {
            currentType = 'income';
            typeIncomeBtn.classList.add('active');
            typeExpenseBtn.classList.remove('active');
            renderCategories('income');
        });
        recordAmountInput.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');
            this.value = val === '' ? '0' : Math.max(0, parseInt(val));
        });
        // ✅ VALIDATION ERROR MODAL FUNCTION
        function showValidationError(message) {
            document.getElementById('validationMessage').textContent = message;
            document.getElementById('validationModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        // ✅ UPDATED SUBMIT HANDLER — Uses showValidationError
        addRecordSubmitBtn.addEventListener('click', async () => {
            const amount = parseInt(recordAmountInput.value) || 0;
            if (amount <= 0) {
                showValidationError('Please enter a valid amount greater than 0.');
                return;
            }
            try {
                const res = await apiPost({
                    type: currentType,
                    amount: amount,
                    category: selectedCategory,
                    description: ''
                });
                if (res && res.wallet) {
                    walletData = res.wallet;
                    updateUI();
                    closeRecordModal();
                } else {
                    showValidationError('Failed to save record. Please check server status.');
                }
            } catch (e) {
                showValidationError(e.message || 'Failed to save record. Please check server status.');
            }
        });
        recordAmountInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') addRecordSubmitBtn.click();
        });
        // Delete modal
        const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!pendingDeleteId || !pendingDeleteType) return closeDeleteModal();
            const btn = confirmDeleteBtn;
            const origText = btn.textContent;
            btn.textContent = 'Deleting...';
            btn.disabled = true;
            try {
                const res = await fetch(API_URL, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: pendingDeleteId, type: pendingDeleteType })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                         walletData = data.wallet;
                         updateUI();
                         closeDeleteModal();
                    } else {
                        throw new Error(data.error || 'Failed to delete record.');
                    }
                } else {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Network failure during deletion.');
                }
            } catch (e) {
                showValidationError(e.message || 'Failed to delete record. Please check server status.');
            } finally {
                btn.textContent = origText;
                btn.disabled = false;
            }
        });
        deleteModal.addEventListener('click', e => {
            if (e.target === deleteModal) closeDeleteModal();
        });
        // ✅ VALIDATION MODAL HANDLERS — NO CANCEL
        document.getElementById('closeValidationModal').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        document.getElementById('tryAgainBtn').addEventListener('click', () => {
            document.getElementById('validationModal').style.display = 'none';
            document.body.style.overflow = 'auto';
            recordAmountInput.focus();
        });
        // Initial load
        loadWalletData();