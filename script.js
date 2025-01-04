const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');

// Lista transakcji
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Funkcja do zapisywania transakcji
function zapiszTransakcje() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    console.log('Zapisano transakcje:', transactions);
}

// Funkcja do renderowania transakcji
function renderujTransakcje(filtr = 'all') {
    transactionList.innerHTML = '';
    const przefiltrowaneTransakcje = transactions.filter(transakcja =>
        filtr === 'all' ||
        (filtr === 'income' && transakcja.amount > 0) ||
        (filtr === 'expense' && transakcja.amount < 0)
    );
    console.log('Filtrowane transakcje:', przefiltrowaneTransakcje);
    przefiltrowaneTransakcje.forEach(transakcja => {
        const li = document.createElement('li');
        li.textContent = `${transakcja.description}: ${transakcja.amount} ${transakcja.currency}`;
        transactionList.appendChild(li);
    });
}

// Funkcja do obsługi formularza
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const currency = document.getElementById('currency').value;

    if (!description || isNaN(amount) || !currency) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const transaction = {
        id: Date.now().toString(),
        description,
        amount,
        currency,
    };

    transactions.push(transaction);
    zapiszTransakcje();
    renderujTransakcje();
    transactionForm.reset();
});

// Inicjalizacja
renderujTransakcje();