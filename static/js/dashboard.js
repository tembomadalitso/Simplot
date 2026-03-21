document.addEventListener('DOMContentLoaded', () => {
    fetchApplications();
    fetchExpenses();
});

const token = localStorage.getItem('auth_token');

// Utility function for authenticated requests
async function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    };
    return fetch(url, { ...options, headers });
}

// Applications Management
async function fetchApplications() {
    const container = document.getElementById('applicationsContainer');
    try {
        const response = await authFetch(window.URLS.apiRentals);
        if (!response.ok) throw new Error('Failed to fetch applications');

        const data = await response.json();

        if (data.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-500">No rental applications found.</div>';
            return;
        }

        container.innerHTML = '';
        data.forEach(app => {
            const row = ce('div', 'p-6 hover:bg-slate-50 transition');

            const header = ce('div', 'flex justify-between items-start mb-2');
            const info = ce('div');
            const title = ce('h4', 'font-bold text-slate-900', app.property_details.title);
            const applicant = ce('p', 'text-sm text-slate-500');
            applicant.innerHTML = `<i class="fas fa-user text-indigo-400 mr-1"></i> Applicant: <span class="font-semibold text-slate-700">${escapeHTML(app.tenant_name)}</span>`;
            info.append(title, applicant);
            header.append(info);

            const badge = document.createElement('span');
            badge.innerHTML = getStatusBadge(app.status);
            header.append(badge);

            const details = ce('div', 'grid grid-cols-2 gap-4 mt-4 text-sm bg-white p-3 rounded-lg border border-slate-100');
            const occupantsWrap = ce('div');
            occupantsWrap.innerHTML = `<span class="text-slate-500">Occupants:</span> <span class="font-semibold">${parseInt(app.number_of_occupants)}</span>`;
            const periodWrap = ce('div');
            periodWrap.innerHTML = `<span class="text-slate-500">Period:</span> <span class="font-semibold">${escapeHTML(app.start_date)} to ${escapeHTML(app.end_date)}</span>`;
            details.append(occupantsWrap, periodWrap);

            row.append(header, details);

            if (app.status === 'PENDING') {
                const actions = ce('div', 'mt-4 flex gap-3');
                const approveBtn = ce('button', 'flex-1 bg-emerald-50 text-emerald-600 font-bold py-2 rounded-lg hover:bg-emerald-100 transition border border-emerald-200', 'Approve');
                approveBtn.onclick = () => updateApplicationStatus(parseInt(app.id), 'approve');
                const rejectBtn = ce('button', 'flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-lg hover:bg-red-100 transition border border-red-200', 'Reject');
                rejectBtn.onclick = () => updateApplicationStatus(parseInt(app.id), 'reject');
                actions.append(approveBtn, rejectBtn);
                row.append(actions);
            }

            container.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="p-8 text-center text-red-500">Error loading applications.</div>';
    }
}

function getStatusBadge(status) {
    if (status === 'APPROVED') return `<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase"><i class="fas fa-check mr-1"></i> Approved</span>`;
    if (status === 'REJECTED') return `<span class="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase"><i class="fas fa-times mr-1"></i> Rejected</span>`;
    return `<span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase"><i class="fas fa-clock mr-1"></i> Pending</span>`;
}

window.updateApplicationStatus = async (id, action) => {
    try {
        const url = `${window.URLS.apiRentals}${id}/${action}/`;
        const response = await authFetch(url, { method: 'POST' });
        if (response.ok) {
            fetchApplications();
        } else {
            alert(`Failed to ${action} application.`);
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred.');
    }
}

window.deleteProperty = async (id) => {
    if(!confirm("Are you sure you want to delete this property? This will also remove associated images and applications.")) return;

    try {
        const url = `${window.URLS.apiProperties}${id}/`;
        const response = await authFetch(url, { method: 'DELETE' });
        if (response.ok) {
            window.location.reload(); // Refresh to update counts
        } else {
            alert('Failed to delete property.');
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred.');
    }
}

// Expense Management
document.getElementById('expenseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    const payload = {
        property: document.getElementById('expenseProperty').value,
        description: document.getElementById('expenseDescription').value,
        amount: document.getElementById('expenseAmount').value
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const response = await authFetch(window.URLS.apiExpenses, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            e.target.reset();
            fetchExpenses();
        } else {
            alert('Failed to add expense.');
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Expense';
    }
});

async function fetchExpenses() {
    const list = document.getElementById('expensesList');
    const totalEl = document.getElementById('totalExpenses');

    try {
        const response = await authFetch(window.URLS.apiExpenses);
        if (!response.ok) throw new Error('Failed to fetch expenses');

        const data = await response.json();

        if (data.length === 0) {
            list.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No expenses recorded yet.</div>';
            totalEl.textContent = 'K0.00';
            return;
        }

        let total = 0;
        list.innerHTML = '';
        data.forEach(exp => {
            total += parseFloat(exp.amount);
            const item = ce('div', 'p-4 hover:bg-slate-50 transition flex justify-between items-center group');

            const info = ce('div');
            const desc = ce('p', 'font-semibold text-sm text-slate-800', exp.description);
            const date = ce('p', 'text-xs text-slate-500 mt-1', new Date(exp.date).toLocaleDateString());
            info.append(desc, date);

            const meta = ce('div', 'text-right');
            const amt = ce('p', 'font-bold text-slate-900 text-sm', `K${parseFloat(exp.amount).toLocaleString()}`);
            const delBtn = ce('button', 'text-red-500 text-xs opacity-0 group-hover:opacity-100 transition mt-1');
            delBtn.innerHTML = '<i class="fas fa-trash"></i>';
            delBtn.onclick = () => deleteExpense(parseInt(exp.id));
            meta.append(amt, delBtn);

            item.append(info, meta);
            list.appendChild(item);
        });

        totalEl.textContent = `K${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

    } catch (error) {
        console.error(error);
        list.innerHTML = '<div class="p-6 text-center text-red-500 text-sm">Error loading expenses.</div>';
        totalEl.textContent = 'Error';
    }
}

window.deleteExpense = async (id) => {
    if(!confirm("Are you sure you want to delete this expense?")) return;

    try {
        const url = `${window.URLS.apiExpenses}${id}/`;
        const response = await authFetch(url, { method: 'DELETE' });
        if (response.ok) {
            fetchExpenses();
        } else {
            alert('Failed to delete expense.');
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred.');
    }
}