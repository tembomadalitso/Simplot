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
            const row = ce('div', 'list-item');

            const header = ce('div', 'flex justify-between items-start mb-2');
            const info = ce('div');
            const title = ce('h4', 'font-bold', app.property_details.title);
            const applicant = ce('p', 'text-sm text-muted');
            applicant.append(icon('fas fa-user text-primary mr-1'), document.createTextNode(' Applicant: '));
            applicant.append(ce('span', 'font-semibold text-secondary', app.tenant_name));
            info.append(title, applicant);
            header.append(info);

            header.append(getStatusBadge(app.status));

            const details = ce('div', 'grid grid-cols-2 gap-4 list-item-inner text-sm');
            const occupantsWrap = ce('div');
            occupantsWrap.append(ce('span', 'text-muted', 'Occupants: '), ce('span', 'font-semibold', parseInt(app.number_of_occupants).toString()));
            const periodWrap = ce('div');
            periodWrap.append(ce('span', 'text-muted', 'Period: '), ce('span', 'font-semibold', `${app.start_date} to ${app.end_date}`));
            details.append(occupantsWrap, periodWrap);

            row.append(header, details);

            if (app.status === 'PENDING') {
                const actions = ce('div', 'mt-4 flex gap-3');
                const approveBtn = ce('button', 'btn btn-success btn-sm btn-full', 'Approve');
                approveBtn.onclick = () => updateApplicationStatus(parseInt(app.id), 'approve');
                const rejectBtn = ce('button', 'btn btn-danger btn-sm btn-full', 'Reject');
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
    const badge = ce('span', 'badge');
    if (status === 'APPROVED') {
        badge.classList.add('badge-success');
        badge.append(icon('fas fa-check mr-1'), document.createTextNode(' Approved'));
    } else if (status === 'REJECTED') {
        badge.classList.add('badge-error');
        badge.append(icon('fas fa-times mr-1'), document.createTextNode(' Rejected'));
    } else {
        badge.classList.add('badge-warning');
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
            const item = ce('div', 'list-item !p-4 flex justify-between items-center group');

            const info = ce('div');
            const desc = ce('p', 'font-semibold text-sm text-main', exp.description);
            const date = ce('p', 'text-xs text-muted mt-1', new Date(exp.date).toLocaleDateString());
            info.append(desc, date);

            const meta = ce('div', 'text-right');
            const amt = ce('p', 'font-bold text-main text-sm', `K${parseFloat(exp.amount).toLocaleString()}`);
            const delBtn = ce('button', 'text-error text-xs opacity-0 group-hover:opacity-100 transition mt-1', '', {
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