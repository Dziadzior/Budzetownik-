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

// Funkcja aktualizująca saldo
function updateBalance() {
    balance = transactions.reduce((total, transaction) => {
        if (transaction.currency === "PLN") {
            return total + transaction.amount;
        }
        return total; // Można dodać konwersję walut w przyszłości
    }, 0);

    balanceElement.textContent = `${balance.toFixed(2)} zł`; // Zaktualizowane saldo w PLN

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

// Funkcja zapisująca transakcje
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions)); // Zapisujemy do localStorage
}

function renderTransactions(filter = 'all') {
    transactionList.innerHTML = ''; // Wyczyszczenie listy transakcji

    // Filtrowanie transakcji na podstawie wybranego kryterium
    const filteredTransactions = transactions.filter(transaction =>
        filter === 'all' || 
        (filter === 'income' && transaction.amount > 0) || 
        (filter === 'expense' && transaction.amount < 0)
    );

    // Dodanie przefiltrowanych transakcji do listy
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

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const currency = document.getElementById('currency').value;

    if (!description || isNaN(amount)) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const transaction = {
        id: Date.now().toString(),
        description,
        amount,
        category,
        currency,
        convertedAmount: convertToPLN(amount, currency)
    };

    transactions.push(transaction);
    saveTransactions();
    renderTransactions();
    updateChart();
    updateBalance();
    transactionForm.reset();
});

const exchangeRates = {
    PLN: 1,
    USD: 4.50,
    EUR: 4.80
};

function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Załadowanie danych transakcji do formularza
    document.getElementById('description').value = transaction.description;
    document.getElementById('amount').value = transaction.originalAmount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('currency').value = transaction.currency;

    // Usunięcie transakcji z listy, aby można było ją ponownie zapisać
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
    updateBalance();
    updateChart();
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active')); // Usuń aktywną klasę z innych przycisków
        button.classList.add('active'); // Dodaj aktywną klasę do klikniętego przycisku
        renderTransactions(button.dataset.filter); // Wywołaj renderowanie z odpowiednim filtrem
    });
});

renderTransactions();
updateChart();
updateBalance();