const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const ctx = document.getElementById('expense-chart')?.getContext('2d');
const filterButtons = document.querySelectorAll('.filter');
const dateFilter = document.getElementById('date-filter');
const amountMinFilter = document.getElementById('amount-min');
const amountMaxFilter = document.getElementById('amount-max');
const applyFiltersButton = document.getElementById('apply-filters');
const loginForm = document.getElementById('login-form');
const userSelect = document.getElementById('user-select');

let users = JSON.parse(localStorage.getItem('users')) || {};
let currentUser = null;
let transactions = [];
let chart;

// Funkcja inicjalizująca
function initialize() {
    if (loginForm && userSelect) {
        renderUserOptions();
        loginForm.addEventListener('submit', loginUser);
    }
    transactionForm?.addEventListener('submit', addTransaction);
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderTransactions(button.dataset.filter);
        });
    });
    applyFiltersButton?.addEventListener('click', (e) => {
        e.preventDefault();
        renderTransactions();
    });

    if (currentUser) {
        transactions = users[currentUser]?.transactions || [];
        renderTransactions();
        updateBalance();
        updateChart();
    }
}

// Funkcja logowania użytkownika
function loginUser(e) {
    e.preventDefault();
    const selectedUser = userSelect.value;

    if (!users[selectedUser]) {
        users[selectedUser] = { transactions: [] };
    }
    currentUser = selectedUser;
    transactions = users[currentUser].transactions;
    saveUsers();
    initialize();
}

// Funkcja renderowania opcji użytkowników
function renderUserOptions() {
    userSelect.innerHTML = '';
    Object.keys(users).forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });
}

// Pobieranie kursów walut z API NBP
async function getExchangeRates() {
    try {
        const response = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json');
        const data = await response.json();
        const rates = data[0].rates.reduce((acc, rate) => {
            acc[rate.code] = rate.mid;
            return acc;
        }, { PLN: 1 });
        return rates;
    } catch (error) {
        console.error("Błąd podczas pobierania kursów walut:", error);
        return { PLN: 1, USD: 4.5, EUR: 4.8 };
    }
}

// Aktualizacja salda
async function updateBalance() {
    const rates = await getExchangeRates();
    const balance = transactions.reduce((total, transaction) => {
        const rate = rates[transaction.currency] || 1;
        return total + (transaction.amount * rate);
    }, 0);
    balanceElement.textContent = `${balance.toFixed(2)} zł`;
    balanceElement.className = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero';
}

// Renderowanie transakcji z filtrami
function renderTransactions(filter = 'all') {
    transactionList.innerHTML = '';
    const filteredTransactions = transactions.filter(transaction => {
        const meetsTypeFilter =
            filter === 'all' ||
            (filter === 'income' && transaction.amount > 0) ||
            (filter === 'expense' && transaction.amount < 0);

        const meetsDateFilter = !dateFilter.value || transaction.date === dateFilter.value;
        const meetsAmountFilter =
            (!amountMinFilter.value || transaction.amount >= parseFloat(amountMinFilter.value)) &&
            (!amountMaxFilter.value || transaction.amount <= parseFloat(amountMaxFilter.value));

        return meetsTypeFilter && meetsDateFilter && meetsAmountFilter;
    });

    filteredTransactions.forEach(transaction => addTransactionToList(transaction));
}

// Dodanie transakcji do listy
function addTransactionToList(transaction) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span class="transaction-icon">${transaction.categoryIcon || '❓'}</span>
        <div class="transaction-details">
            <div class="transaction-description">${transaction.description}</div>
            <div class="transaction-category">${transaction.category}</div>
        </div>
        <div class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
            ${transaction.amount.toFixed(2)} ${transaction.currency}
            (${transaction.convertedAmount.toFixed(2)} PLN)
        </div>
        <div class="transaction-actions">
            <button class="edit-btn" onclick="editTransaction('${transaction.id}')">Edytuj</button>
            <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">Usuń</button>
        </div>
    `;
    transactionList.appendChild(li);
}

// Dodawanie lub edytowanie transakcji
async function addTransaction(e) {
    e.preventDefault();
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const currency = document.getElementById('currency').value;
    const date = document.getElementById('date-filter').value;

    if (!description || isNaN(amount) || !category || !currency) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const convertedAmount = await convertCurrency(amount, currency);
    const transaction = {
        id: editTransactionId || Date.now().toString(),
        description,
        amount,
        convertedAmount,
        category,
        currency,
        date,
    };

    if (editTransactionId) {
        const index = transactions.findIndex(t => t.id === editTransactionId);
        transactions[index] = transaction;
        editTransactionId = null;
    } else {
        transactions.push(transaction);
    }

    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
    transactionForm.reset();
}

// Edycja transakcji
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('currency').value = transaction.currency;
    document.getElementById('date-filter').value = transaction.date;
    editTransactionId = id;
}

// Usuwanie transakcji
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
}

// Aktualizacja wykresu
function updateChart() {
    if (!ctx || typeof Chart === 'undefined') return;

    const categories = {};
    transactions.forEach(({ convertedAmount, category }) => {
        if (convertedAmount < 0) {
            categories[category] = (categories[category] || 0) + Math.abs(convertedAmount);
        }
    });

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'Wydatki według kategorii',
                data: Object.values(categories),
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4caf50', '#ff5722'],
            }],
        },
    });
}

// Zapis użytkowników i transakcji
function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

function saveTransactions() {
    if (currentUser) {
        users[currentUser].transactions = transactions;
        saveUsers();
    }
}

initialize();