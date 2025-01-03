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
    balanceElement.className = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'zero';
}

function addTransactionToList(transaction) {
    const li = document.createElement('li');
    const categoryIcon = document.querySelector(`option[value="${transaction.category}"]`)?.getAttribute("data-icon") || "❓";

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
    transactions
        .filter(transaction => filter === 'all' || (filter === 'income' && transaction.amount > 0) || (filter === 'expense' && transaction.amount < 0))
        .forEach(addTransactionToList);
}

function updateChart() {
    if (!ctx || typeof Chart === 'undefined') {
        console.error('Chart.js nie jest załadowany lub element canvas jest niedostępny');
        return;
    }

    const categories = transactions.reduce((acc, { amount, category }) => {
        if (amount < 0) acc[category] = (acc[category] || 0) + Math.abs(amount);
        return acc;
    }, {});

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'Wydatki według kategorii',
                data: Object.values(categories),
                backgroundColor: [
                    '#ff6384', '#36a2eb', '#ffce56', '#4caf50', '#ff5722',
                    '#673ab7', '#00bcd4', '#e91e63', '#3f51b5', '#9c27b0'
                ],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw.toFixed(2)} zł` } }
            }
        }
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
    transactions.push({ id: Date.now().toString(), description, amount, category });
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