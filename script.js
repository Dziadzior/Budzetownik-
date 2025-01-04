const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const ctx = document.getElementById('expense-chart')?.getContext('2d');
const filterButtons = document.querySelectorAll('.filter');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart;

// Pobieranie kursów walut
async function getExchangeRates() {
    const rates = {
        PLN: 1,
        USD: 4.5,
        EUR: 4.8,
    };
    console.log("Pobrane kursy walut:", rates);
    return rates;
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
    console.log("Aktualne saldo:", balance);
}

// Renderowanie transakcji
function renderTransactions(filter = 'all') {
    transactionList.innerHTML = ''; // Czyści listę transakcji
    const filteredTransactions = transactions.filter(transaction =>
        filter === 'all' ||
        (filter === 'income' && transaction.amount > 0) ||
        (filter === 'expense' && transaction.amount < 0)
    );
    console.log("Filtrowane transakcje:", filteredTransactions);

    filteredTransactions.forEach(transaction => addTransactionToList(transaction));
}

// Dodanie transakcji do listy
function addTransactionToList(transaction) {
    const li = document.createElement('li');
    const categoryIcon = document.querySelector(
        `option[value="${transaction.category}"]`
    )?.getAttribute("data-icon") || "❓";

    li.innerHTML = `
        <span class="transaction-icon">${categoryIcon}</span>
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

// Przeliczanie waluty na PLN
async function convertCurrency(amount, currency) {
    const rates = await getExchangeRates();
    const rate = rates[currency];
    if (!rate) {
        console.error(`Nieznana waluta: ${currency}`);
        return amount;
    }
    const convertedAmount = amount * rate;
    console.log(`Przeliczono: ${amount} ${currency} na ${convertedAmount.toFixed(2)} PLN`);
    return convertedAmount;
}

// Dodawanie transakcji
async function addTransaction(e) {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const currency = document.getElementById('currency').value;

    if (!description || isNaN(amount) || !category || !currency) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const convertedAmount = await convertCurrency(amount, currency);

    const transaction = {
        id: Date.now().toString(),
        description,
        amount,
        convertedAmount,
        category,
        currency,
    };

    transactions.push(transaction);
    console.log("Dodano transakcję:", transaction);
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
    transactionForm.reset();
}

// Edycja transakcji
function editTransaction(id) {
    const transaction = transactions.find(trans => trans.id === id);
    if (!transaction) return;

    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('currency').value = transaction.currency;

    removeTransaction(id); // Usuń starą wersję przed zapisaniem zmienionej
}

// Usuwanie transakcji
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
}

// Zapisywanie transakcji do localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    console.log("Zapisano transakcje:", transactions);
}

// Aktualizacja wykresu
function updateChart() {
    if (!ctx || typeof Chart === 'undefined') {
        console.error('Chart.js nie jest załadowany lub element canvas jest niedostępny');
        return;
    }

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
            datasets: [
                {
                    label: 'Wydatki według kategorii',
                    data: Object.values(categories),
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4caf50', '#ff5722'],
                },
            ],
        },
    });
}

// Inicjalizacja
transactionForm.addEventListener('submit', addTransaction);
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        renderTransactions(button.dataset.filter);
    });
});

renderTransactions();
updateBalance();
updateChart();