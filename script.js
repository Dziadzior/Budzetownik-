const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const ctx = document.getElementById('expense-chart')?.getContext('2d');
const filterButtons = document.querySelectorAll('.filter');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart;

// Funkcja do pobierania kursów wymiany walut
async function pobierzKursyWalut() {
    const kursy = {
        PLN: 1,
        USD: 4.5,
        EUR: 4.8
    };
    console.log('Pobrane kursy walut:', kursy);
    return kursy;
}

// Funkcja przeliczania waluty na PLN
async function przeliczWalute(kwota, waluta) {
    const kursy = await pobierzKursyWalut();
    const kurs = kursy[waluta];
    if (!kurs) {
        console.error(`Nieznana waluta: ${waluta}`);
        return kwota;
    }
    const przeliczonaKwota = kwota * kurs;
    console.log(`Przeliczono: ${kwota} ${waluta} na ${przeliczonaKwota} PLN`);
    return przeliczonaKwota;
}

// Aktualizacja salda
async function aktualizujSaldo() {
    const kursy = await pobierzKursyWalut();
    const saldo = transactions.reduce((suma, transakcja) => {
        const kurs = kursy[transakcja.currency] || 1;
        return suma + (transakcja.amount * kurs);
    }, 0);
    balanceElement.textContent = `${saldo.toFixed(2)} zł`;

    if (saldo > 0) {
        balanceElement.className = 'positive';
    } else if (saldo < 0) {
        balanceElement.className = 'negative';
    } else {
        balanceElement.className = 'zero';
    }
    console.log('Aktualne saldo:', saldo);
}

// Dodawanie transakcji do listy
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
    aktualizujWykres();
    transactionForm.reset();
});

// Inicjalizacja
renderujTransakcje();
aktualizujSaldo();
aktualizujWykres();