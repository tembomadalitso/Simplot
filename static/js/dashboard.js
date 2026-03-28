// Landlord Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    initCharts();
    initExport();
});

function initExport() {
    const btn = document.getElementById('exportDashboardBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const search = document.getElementById('propSearch').value;
        const cat = document.getElementById('propCategory').value;
        window.location.href = `${window.URLS.exportXlsx}?search=${search}&category=${cat}`;
    });

    const pdfBtn = document.getElementById('exportPDFBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            window.location.href = window.URLS.exportPdf;
        });
    }
}

async function fetchDashboardData() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Fetch Applications
    try {
        const appResp = await fetch(window.URLS.apiRentals, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (appResp.ok) {
            const apps = await appResp.json();
            renderApplications(apps);
        }

        // Fetch Expenses
        const expResp = await fetch(window.URLS.apiExpenses, {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (expResp.ok) {
            const expenses = await expResp.json();
            renderExpenses(expenses);
        }
    } catch (e) {
        console.error("Dashboard sync error:", e);
    }
}

function renderApplications(apps) {
    const container = document.getElementById('applicationsContainer');
    if (!container) return;

    if (apps.length === 0) {
        container.innerHTML = `<div class="p-12 text-center text-muted italic">No active applications.</div>`;
        return;
    }

    const table = ce('table', 'data-table w-full');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Property</th>
                <th>Tenant</th>
                <th>Occupants</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="appsTableBody"></tbody>
    `;
    container.innerHTML = '';
    container.appendChild(table);

    const tbody = table.querySelector('tbody');
    apps.forEach(app => {
        const tr = ce('tr');
        tr.innerHTML = `
            <td class="font-bold text-main">${escapeHTML(app.property_title || 'Property')}</td>
            <td>${escapeHTML(app.tenant_name || 'Anonymous')}</td>
            <td><span class="badge badge-neutral">${app.number_of_occupants}</span></td>
            <td><span class="badge ${getStatusBadgeClass(app.status)}">${app.status}</span></td>
            <td>
                <div class="flex gap-2">
                    ${app.status === 'PENDING' ? `
                        <button onclick="updateAppStatus(${app.id}, 'approve')" class="btn btn-primary btn-sm !py-1 !px-3 text-[10px]">Approve</button>
                        <button onclick="updateAppStatus(${app.id}, 'reject')" class="btn btn-ghost btn-sm !py-1 !px-3 text-[10px] border border-color">Reject</button>
                    ` : `<span class="text-[10px] font-bold text-muted uppercase">Finalized</span>`}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'APPROVED': return 'badge-success';
        case 'REJECTED': return 'badge-error';
        default: return 'badge-warning';
    }
}

function renderExpenses(expenses) {
    const list = document.getElementById('expensesList');
    const totalEl = document.getElementById('totalExpenses');
    if (!list) return;

    if (expenses.length === 0) {
        list.innerHTML = `<div class="p-8 text-center text-xs text-muted italic">No transactions recorded.</div>`;
        return;
    }

    let total = 0;
    list.innerHTML = '';
    expenses.forEach(exp => {
        total += parseFloat(exp.amount);
        const item = ce('div', 'p-4 border-b border-color flex justify-between items-center hover:bg-surface transition-colors');
        item.innerHTML = `
            <div class="flex flex-col">
                <span class="text-sm font-bold text-main">${escapeHTML(exp.description)}</span>
                <span class="text-[10px] text-muted uppercase font-bold tracking-tight">${escapeHTML(exp.property_title || 'Asset')}</span>
            </div>
            <span class="text-sm font-black text-error">-K${exp.amount}</span>
        `;
        list.appendChild(item);
    });

    if (totalEl) totalEl.textContent = `K${total.toLocaleString()}`;
}

// Charting Logic (MANDATORY per plan)
function initCharts() {
    const ctx1 = document.getElementById('incomeExpensesChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Income',
                        data: [12000, 15000, 14000, 18000, 17000, 21000],
                        backgroundColor: '#6366f1',
                        borderRadius: 6
                    },
                    {
                        label: 'Expenses',
                        data: [4000, 5000, 3500, 6000, 4200, 4800],
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    const ctx2 = document.getElementById('occupancyChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Occupancy %',
                    data: [82, 85, 88, 92, 94, 98],
                    borderColor: '#10b981',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}
