const balanceElement = document.getElementById('balance');
const transactionForm = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const ctx = document.getElementById('expense-chart')?.getContext('2d');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart;

function updateBalance() {
    const balance = transactions.reduce((total, t) => total + t.amount, 0);
    balanceElement.textContent = `${balance.toFixed(2)} zł`;
}

function renderTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach((transaction) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                ${transaction.amount.toFixed(2)} zł
            </span>
        `;
        transactionList.appendChild(li);
    });
}

function updateChart() {
    const categories = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
    }, {});
    const labels = Object.keys(categories);
    const data = Object.values(categories);

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{ data }],
        },
    });
}

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    transactions.push({ description, amount });
    updateBalance();
    renderTransactions();
    updateChart();
});

updateBalance();
renderTransactions();
updateChart();