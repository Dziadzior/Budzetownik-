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
        USD: 4.5, // Przykładowy kurs
        EUR: 4.8  // Przykładowy kurs
    };
    console.log('Pobrane kursy walut:', kursy);
    return kursy;
}

// Funkcja przeliczania waluty na PLN
function przeliczWalute(kwota, waluta, kursy) {
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
    try {
        const saldo = transactions.reduce((suma, transakcja) => suma + transakcja.amountInPLN, 0);
        balanceElement.textContent = `${saldo.toFixed(2)} zł`;

        if (saldo > 0) {
            balanceElement.className = 'positive';
        } else if (saldo < 0) {
            balanceElement.className = 'negative';
        } else {
            balanceElement.className = 'zero';
        }

        console.log('Aktualne saldo:', saldo);
    } catch (error) {
        console.error('Błąd podczas aktualizacji salda:', error);
    }
}

// Dodawanie transakcji do listy
function dodajTransakcjeDoListy(transakcja) {
    try {
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
            <div class="transaction-amount ${transakcja.amountInPLN > 0 ? 'positive' : 'negative'}">
                ${transakcja.amount > 0 ? '+' : ''}${transakcja.amount.toFixed(2)} ${transakcja.currency} 
                (<span>${transakcja.amountInPLN.toFixed(2)} PLN</span>)
            </div>
            <div class="transaction-actions">
                <button class="edit-btn" onclick="edytujTransakcje('${transakcja.id}')">Edytuj</button>
                <button class="delete-btn" onclick="usunTransakcje('${transakcja.id}')">Usuń</button>
            </div>
        `;
        transactionList.appendChild(li);
    } catch (error) {
        console.error('Błąd podczas dodawania transakcji do listy:', error, transakcja);
    }
}

// Usuwanie transakcji
function usunTransakcje(id) {
    try {
        transactions = transactions.filter(transakcja => transakcja.id !== id);
        console.log(`Usunięto transakcję o ID: ${id}`);
        zapiszTransakcje();
        renderujTransakcje();
        aktualizujSaldo();
        aktualizujWykres();
    } catch (error) {
        console.error('Błąd podczas usuwania transakcji:', error);
    }
}

// Zapisywanie transakcji do localStorage
function zapiszTransakcje() {
    try {
        localStorage.setItem('transactions', JSON.stringify(transactions));
        console.log('Zapisano transakcje w localStorage:', transactions);
    } catch (error) {
        console.error('Błąd podczas zapisywania transakcji:', error);
    }
}

// Renderowanie transakcji
function renderujTransakcje(filtr = 'all') {
    try {
        transactionList.innerHTML = '';
        const przefiltrowaneTransakcje = transactions.filter(transakcja =>
            filtr === 'all' ||
            (filtr === 'income' && transakcja.amountInPLN > 0) ||
            (filtr === 'expense' && transakcja.amountInPLN < 0)
        );
        console.log('Filtrowane transakcje:', przefiltrowaneTransakcje);
        przefiltrowaneTransakcje.forEach(dodajTransakcjeDoListy);
    } catch (error) {
        console.error('Błąd podczas renderowania transakcji:', error);
    }
}

// Aktualizacja wykresu
function aktualizujWykres() {
    try {
        if (!ctx || typeof Chart === 'undefined') {
            console.error('Chart.js nie jest załadowany lub element canvas jest niedostępny');
            return;
        }

        const kategorie = {};
        transactions.forEach(({ amountInPLN, category }) => {
            if (amountInPLN < 0) {
                kategorie[category] = (kategorie[category] || 0) + Math.abs(amountInPLN);
            }
        });

        console.log('Dane do wykresu:', kategorie);

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
    } catch (error) {
        console.error('Błąd podczas aktualizacji wykresu:', error);
    }
}

// Obsługa formularza dodawania transakcji
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const opis = document.getElementById('description').value.trim();
        const kwota = parseFloat(document.getElementById('amount').value);
        const kategoria = document.getElementById('category').value;
        const waluta = document.getElementById('currency').value;

        if (!opis || isNaN(kwota) || !kategoria || !waluta) {
            alert('Wypełnij wszystkie pola!');
            return;
        }

        const kursy = await pobierzKursyWalut();
        const przeliczonaKwota = przeliczWalute(kwota, waluta, kursy);

        const transakcja = {
            id: Date.now().toString(),
            description: opis,
            amount: kwota,
            amountInPLN: przeliczonaKwota,
            category: kategoria,
            currency: waluta,
        };

        transactions.push(transakcja);
        console.log('Dodano transakcję:', transakcja);
        zapiszTransakcje();
        renderujTransakcje();
        aktualizujSaldo();
        aktualizujWykres();
        transactionForm.reset();
    } catch (error) {
        console.error('Błąd podczas dodawania transakcji:', error);
    }
});

// Obsługa filtrów
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        try {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            console.log('Aktywny filtr:', button.dataset.filter);
            renderujTransakcje(button.dataset.filter);
        } catch (error) {
            console.error('Błąd podczas obsługi filtrów:', error);
        }
    });
});

// Inicjalizacja
(async () => {
    try {
        await aktualizujSaldo();
        renderujTransakcje();
        aktualizujWykres();
    } catch (error) {
        console.error('Błąd podczas inicjalizacji aplikacji:', error);
    }
})();