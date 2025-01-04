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
        EUR: 4.8
    };
    console.log("Pobrane kursy walut:", rates);
    return rates;
}

// Przeliczanie walut
// Funkcja przeliczania waluty na PLN
// Przeliczanie walut
async function convertCurrency(amount, currency) {
    try {
        const rates = await getExchangeRates();
        if (!rates[currency]) {
            console.error(`Nieznana waluta: ${currency}`);
            return amount;
        }
        const convertedAmount = parseFloat((amount * rates[currency]).toFixed(2));
        console.log(`Przeliczono: ${amount} ${currency} = ${convertedAmount} PLN`);
        return convertedAmount;
    } catch (error) {
        console.error("Błąd podczas przeliczania waluty:", error);
        return amount;
    }
}

// Aktualizacja salda
async function updateBalance() {
    try {
        const rates = await getExchangeRates();
        const balance = transactions.reduce((total, transaction) => {
            const rate = rates[transaction.currency] || 1;
            const converted = transaction.amount * rate;
            console.log(
                `Transakcja: ${transaction.amount} ${transaction.currency} = ${converted.toFixed(2)} PLN`
            );
            return total + converted;
        }, 0);

        balanceElement.textContent = `${balance.toFixed(2)} zł`;

        if (balance > 0) {
            balanceElement.className = 'positive';
        } else if (balance < 0) {
            balanceElement.className = 'negative';
        } else {
            balanceElement.className = 'zero';
        }
        console.log("Aktualne saldo:", balance.toFixed(2));
    } catch (error) {
        console.error("Błąd podczas aktualizacji salda:", error);
    }
}

// Renderowanie transakcji
function renderTransactions(filter = 'all') {
    transactionList.innerHTML = '';
    const filteredTransactions = transactions.filter(transaction =>
        filter === 'all' ||
        (filter === 'income' && transaction.amount > 0) ||
        (filter === 'expense' && transaction.amount < 0)
    );
    console.log("Filtrowane transakcje:", filteredTransactions);

    filteredTransactions.forEach(addTransactionToList);
}

// Dodawanie transakcji do listy
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

// Obsługa formularza dodawania transakcji
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
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
    } catch (error) {
        console.error("Błąd podczas dodawania transakcji:", error);
    }
});

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

    console.log("Dane do wykresu:", categories);

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
renderTransactions();
updateBalance();
updateChart();