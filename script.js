const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const exportCsvButton = document.getElementById('export-csv');
const exportExcelButton = document.getElementById('export-excel');
const ctx = document.getElementById('expense-chart')?.getContext('2d');
const filterButtons = document.querySelectorAll('.filter');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let balance = 0;
let chart;

function updateBalance() {
    balance = transactions.reduce((total, transaction) => total + transaction.amount, 0);
    balanceElement.textContent = `${balance.toFixed(2)} zł`;

    if (balance > 0) {
        balanceElement.className = 'positive';
    } else if (balance < 0) {
        balanceElement.className = 'negative';
    } else {
        balanceElement.className = 'zero';
    }
}

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
            ${transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)} zł
        </div>
        <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">Usuń</button>
    `;
    transactionList.appendChild(li);
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions();
    renderTransactions();
    updateChart();
    updateBalance();
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function renderTransactions(filter = 'all') {
    transactionList.innerHTML = '';
    const filteredTransactions = transactions.filter(transaction =>
        filter === 'all' || (filter === 'income' && transaction.amount > 0) || (filter === 'expense' && transaction.amount < 0)
    );
    filteredTransactions.forEach(addTransactionToList);
}

function updateChart() {
    if (!ctx || typeof Chart === 'undefined') {
        console.error('Chart.js nie jest załadowany lub element canvas jest niedostępny');
        return;
    }

    const categories = {};
    transactions.forEach(({ amount, category }) => {
        if (amount < 0) categories[category] = (categories[category] || 0) + Math.abs(amount);
    });

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'doughnut', // Zmiana typu wykresu na "doughnut"
        data: {
            labels: Object.keys(categories),
            datasets: [
                {
                    label: 'Wydatki według kategorii',
                    data: Object.values(categories),
                    backgroundColor: [
                        '#ff6384', '#36a2eb', '#ffce56', '#4caf50', '#ff5722',
                        '#9c27b0', '#3f51b5', '#e91e63', '#795548', '#607d8b'
                    ],
                    borderWidth: 1,
                    borderColor: '#222', // Obrys elementów wykresu
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top', // Pozycja legendy
                    labels: {
                        color: '#fff',
                        font: {
                            size: 14, // Rozmiar tekstu legendy
                            family: 'Arial, sans-serif',
                        },
                        padding: 20, // Odstęp między pozycjami legendy
                    },
                },
                tooltip: {
                    backgroundColor: '#333', // Tło tooltipa
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    cornerRadius: 8,
                },
            },
            layout: {
                padding: 20, // Odstępy wokół wykresu
            },
        },
    });
}

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!description || isNaN(amount)) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const transaction = { id: Date.now().toString(), description, amount, category };
    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    updateChart();
    updateBalance();
    transactionForm.reset();
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        renderTransactions(button.dataset.filter);
    });
});

renderTransactions();
updateChart();
updateBalance();