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
        const response = await authFetch('/api/rentals/');
        if (!response.ok) throw new Error('Failed to fetch applications');

        const data = await response.json();

        if (data.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-slate-500">No rental applications found.</div>';
            return;
        }

        container.innerHTML = data.map(app => `
            <div class="p-6 hover:bg-slate-50 transition">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-bold text-slate-900">${app.property_details.title}</h4>
                        <p class="text-sm text-slate-500"><i class="fas fa-user text-indigo-400 mr-1"></i> Applicant: <span class="font-semibold text-slate-700">${app.tenant_name}</span></p>
                    </div>
                    ${getStatusBadge(app.status)}
                </div>
                <div class="grid grid-cols-2 gap-4 mt-4 text-sm bg-white p-3 rounded-lg border border-slate-100">
                    <div><span class="text-slate-500">Occupants:</span> <span class="font-semibold">${app.number_of_occupants}</span></div>
                    <div><span class="text-slate-500">Period:</span> <span class="font-semibold">${app.start_date} to ${app.end_date}</span></div>
                </div>
                ${app.status === 'PENDING' ? `
                <div class="mt-4 flex gap-3">
                    <button onclick="updateApplicationStatus(${app.id}, 'approve')" class="flex-1 bg-emerald-50 text-emerald-600 font-bold py-2 rounded-lg hover:bg-emerald-100 transition border border-emerald-200">Approve</button>
                    <button onclick="updateApplicationStatus(${app.id}, 'reject')" class="flex-1 bg-red-50 text-red-600 font-bold py-2 rounded-lg hover:bg-red-100 transition border border-red-200">Reject</button>
                </div>
                ` : ''}
            </div>
        `).join('');

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
        const response = await authFetch(`/api/rentals/${id}/${action}/`, { method: 'POST' });
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
        const response = await authFetch('/api/expenses/', {
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
        const response = await authFetch('/api/expenses/');
        if (!response.ok) throw new Error('Failed to fetch expenses');

        const data = await response.json();

        if (data.length === 0) {
            list.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No expenses recorded yet.</div>';
            totalEl.textContent = 'K0.00';
            return;
        }

        let total = 0;
        list.innerHTML = data.map(exp => {
            total += parseFloat(exp.amount);
            return `
            <div class="p-4 hover:bg-slate-50 transition flex justify-between items-center group">
                <div>
                    <p class="font-semibold text-sm text-slate-800">${exp.description}</p>
                    <p class="text-xs text-slate-500 mt-1">${new Date(exp.date).toLocaleDateString()}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold text-slate-900 text-sm">K${parseFloat(exp.amount).toLocaleString()}</p>
                    <button onclick="deleteExpense(${exp.id})" class="text-red-500 text-xs opacity-0 group-hover:opacity-100 transition mt-1"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            `;
        }).join('');

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
        const response = await authFetch(`/api/expenses/${id}/`, { method: 'DELETE' });
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