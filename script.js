const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const ctx = document.getElementById('expense-chart')?.getContext('2d');
const filterButtons = document.querySelectorAll('.filter');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart;

// Funkcja do pobierania kursów wymiany walut
const pobierzKursyWalut = async () => ({
    PLN: 1,
    USD: 4.5, // Podmień na aktualne dane
    EUR: 4.8  // Podmień na aktualne dane
});

// Funkcja przeliczania waluty na PLN
const przeliczWalute = async (kwota, waluta) => {
    const kursy = await pobierzKursyWalut();
    const kurs = kursy[waluta];
    if (!kurs) {
        console.error(`Nieznana waluta: ${waluta}`);
        return kwota;
    }
    return kwota * kurs;
};

// Aktualizacja salda
const aktualizujSaldo = async () => {
    const kursy = await pobierzKursyWalut();
    const saldo = transactions.reduce((suma, transakcja) => {
        const kurs = kursy[transakcja.currency] || 1;
        return suma + transakcja.amount * kurs;
    }, 0);
    balanceElement.textContent = `${saldo.toFixed(2)} zł`;

    balanceElement.className = saldo > 0 ? 'positive' : saldo < 0 ? 'negative' : 'zero';
};

// Dodawanie transakcji do listy
const dodajTransakcjeDoListy = (transakcja) => {
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
            ${transakcja.amount > 0 ? '+' : ''}${transakcja.originalAmount.toFixed(2)} ${transakcja.currency}
        </div>
        <div class="transaction-actions">
            <button class="edit-btn" onclick="edytujTransakcje('${transakcja.id}')">Edytuj</button>
            <button class="delete-btn" onclick="usunTransakcje('${transakcja.id}')">Usuń</button>
        </div>
    `;
    transactionList.appendChild(li);
};

// Usuwanie transakcji
const usunTransakcje = (id) => {
    transactions = transactions.filter(transakcja => transakcja.id !== id);
    zapiszTransakcje();
    renderujTransakcje();
    aktualizujSaldo();
    aktualizujWykres();
};

// Zapisywanie transakcji do localStorage
const zapiszTransakcje = () => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
};

// Renderowanie transakcji
const renderujTransakcje = (filtr = 'all') => {
    transactionList.innerHTML = '';
    const przefiltrowaneTransakcje = transactions.filter(transakcja =>
        filtr === 'all' ||
        (filtr === 'income' && transakcja.amount > 0) ||
        (filtr === 'expense' && transakcja.amount < 0)
    );
    przefiltrowaneTransakcje.forEach(dodajTransakcjeDoListy);
};

// Aktualizacja wykresu
const aktualizujWykres = () => {
    if (!ctx || typeof Chart === 'undefined') {
        console.error('Chart.js nie jest załadowany lub element canvas jest niedostępny');
        return;
    }

    const kategorie = {};
    transactions.forEach(({ amount, category }) => {
        if (amount < 0) {
            kategorie[category] = (kategorie[category] || 0) + Math.abs(amount);
        }
    });

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(kategorie),
            datasets: [
                {
                    label: 'Wydatki według kategorii',
                    data: Object.values(kategorie),
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4caf50', '#ff5722'],
                },
            ],
        },
    });
};

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
        amount: przeliczonaKwota,
        originalAmount: kwota,
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

// Edycja transakcji
const edytujTransakcje = (id) => {
    const transakcja = transactions.find(t => t.id === id);
    if (!transakcja) return;

    document.getElementById('description').value = transakcja.description;
    document.getElementById('amount').value = transakcja.originalAmount;
    document.getElementById('category').value = transakcja.category;
    document.getElementById('currency').value = transakcja.currency;

    transactions = transactions.filter(t => t.id !== id);
    zapiszTransakcje();
    renderujTransakcje();
    aktualizujSaldo();
    aktualizujWykres();
};

// Obsługa filtrów
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        renderujTransakcje(button.dataset.filter);
    });
});

// Inicjalizacja
renderujTransakcje();
aktualizujSaldo();
aktualizujWykres();