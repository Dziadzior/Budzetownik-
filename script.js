const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form'); // Usunięcie dodatkowej deklaracji
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
        <div class="transaction-actions">
            <button class="edit-btn" onclick="editTransaction('${transaction.id}')">Edytuj</button>
            <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">Usuń</button>
        </div>
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
        filter === 'all' || 
        (filter === 'income' && transaction.amount > 0) || 
        (filter === 'expense' && transaction.amount < 0)
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

function updateCategorySummary() {
  const summaryList = document.getElementById('summary-list');
  const categories = {};

  // Oblicz sumy dla każdej kategorii
  transactions.forEach(({ amount, category }) => {
    if (amount < 0) {
      categories[category] = (categories[category] || 0) + Math.abs(amount);
    }
  });

  console.log('Kategorie:', categories); // Dodaj log

  // Wyczyść listę podsumowania
  summaryList.innerHTML = '';

  // Dodaj podsumowanie do listy
  for (const [category, total] of Object.entries(categories)) {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${category}</span>
      <span>${total.toFixed(2)} zł</span>
    `;
    summaryList.appendChild(li);
  }
}

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const currency = document.getElementById('currency').value;

    if (!description || isNaN(amount) || !category || !currency) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    console.log(`Przed przeliczeniem: ${amount}, Waluta: ${currency}`);
    const convertedAmount = convertCurrency(amount, currency);
    console.log(`Po przeliczeniu: ${convertedAmount}`);

    const transaction = {
        id: Date.now().toString(),
        description,
        amount: convertedAmount,
        category,
        currency,
    };

    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
    transactionForm.reset();
});

function convertCurrency(amount, currency) {
    const exchangeRates = {
        PLN: 1,
        USD: 4.5,
        EUR: 4.8,
    };

    if (currency === 'PLN') return amount; // Bez przeliczania dla PLN
    return parseFloat((amount * exchangeRates[currency]).toFixed(2));
}

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.amount; // Używaj przeliczonej wartości
    document.getElementById('category').value = transaction.category;
    document.getElementById('currency').value = transaction.currency;

    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
}

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
updateCategorySummary();