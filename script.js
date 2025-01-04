const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const ctx = document.getElementById('expense-chart')?.getContext('2d');
const filterButtons = document.querySelectorAll('.filter');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart;

// Funkcja do zapisywania transakcji w localStorage
function zapiszTransakcje() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    console.log('Zapisano transakcje w localStorage:', transactions);
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
    przefiltrowaneTransakcje.forEach(dodajTransakcjeDoListy);
}

// Funkcja do dodawania transakcji do listy
function dodajTransakcjeDoListy(transakcja) {
    const li = document.createElement('li');
    const ikonaKategorii = document.querySelector(
        `option[value="${transakcja.category}"]`
    )?.getAttribute("data-icon") || "❓";

    li.innerHTML = `
        <span class="transaction-icon">${ikonaKategorii}</span>
        <div class="transaction-details">
            <div class="transaction-description">${transakcja.description}</div>
            <div class="transaction-category">${transakcja.category}</div>
        </div>
        <div class="transaction-amount ${transakcja.amount > 0 ? 'positive' : 'negative'}">
            ${transakcja.amount.toFixed(2)} ${transakcja.currency} 
            (${(transakcja.amountInPLN || transakcja.amount).toFixed(2)} PLN)
        </div>
        <div class="transaction-actions">
            <button class="edit-btn" onclick="edytujTransakcje('${transakcja.id}')">Edytuj</button>
            <button class="delete-btn" onclick="usunTransakcje('${transakcja.id}')">Usuń</button>
        </div>
    `;
    transactionList.appendChild(li);
}

// Inne funkcje...

// Obsługa formularza dodawania transakcji
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const opis = document.getElementById('description').value.trim();
    const kwota = parseFloat(document.getElementById('amount').value);
    const kategoria = document.getElementById('category').value;
    const waluta = document.getElementById('currency').value;

    if (!opis || isNaN(kwota) || !kategoria || !waluta) {
        alert('Wypełnij wszystkie pola!');
        return;
    }

    const przeliczonaKwota = await przeliczWalute(kwota, waluta);

    const transakcja = {
        id: Date.now().toString(),
        description: opis,
        amount: kwota,
        amountInPLN: przeliczonaKwota,
        category: kategoria,
        currency: waluta,
    };

    transactions.push(transakcja);
    zapiszTransakcje();
    renderujTransakcje();
    aktualizujSaldo();
    transactionForm.reset();
});

// Inicjalizacja
renderujTransakcje();
aktualizujSaldo();