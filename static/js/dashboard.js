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
            applicant.append(icon('fas fa-user text-indigo-400 mr-1'), document.createTextNode(' Applicant: '));
            applicant.append(ce('span', 'font-semibold text-slate-700', app.tenant_name));
            info.append(title, applicant);
            header.append(info);

            header.append(getStatusBadge(app.status));

            const details = ce('div', 'grid grid-cols-2 gap-4 mt-4 text-sm bg-white p-3 rounded-lg border border-slate-100');
            const occupantsWrap = ce('div');
            occupantsWrap.append(ce('span', 'text-slate-500', 'Occupants: '), ce('span', 'font-semibold', parseInt(app.number_of_occupants).toString()));
            const periodWrap = ce('div');
            periodWrap.append(ce('span', 'text-slate-500', 'Period: '), ce('span', 'font-semibold', `${app.start_date} to ${app.end_date}`));
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
    const badge = ce('span', 'px-3 py-1 rounded-full text-xs font-bold uppercase');
    if (status === 'APPROVED') {
        badge.className += ' bg-emerald-100 text-emerald-700';
        badge.append(icon('fas fa-check mr-1'), document.createTextNode(' Approved'));
    } else if (status === 'REJECTED') {
        badge.className += ' bg-red-100 text-red-700';
        badge.append(icon('fas fa-times mr-1'), document.createTextNode(' Rejected'));
    } else {
        badge.className += ' bg-amber-100 text-amber-700';
        badge.append(icon('fas fa-clock mr-1'), document.createTextNode(' Pending'));
    }
    return badge;
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
            const delBtn = ce('button', 'text-red-500 text-xs opacity-0 group-hover:opacity-100 transition mt-1', '', {
                onclick: () => deleteExpense(parseInt(exp.id))
            });
            delBtn.append(icon('fas fa-trash'));
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