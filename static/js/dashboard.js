// Landlord Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    initExport();

    // Wire up filter listeners for property list
    const propSearch = document.getElementById('propSearch');
    const propCategory = document.getElementById('propCategory');

    if (propSearch) {
        propSearch.addEventListener('input', debounce(() => {
            // Logic to filter DOM elements (since fetchDashboardData fetches all)
            filterLocalProperties(propSearch.value, propCategory.value);
        }, 300));
    }
    if (propCategory) {
        propCategory.addEventListener('change', () => {
            filterLocalProperties(propSearch.value, propCategory.value);
        });
    }
});

function filterLocalProperties(search, cat) {
    const cards = document.querySelectorAll('#propertiesList > .card');
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const category = card.querySelector('.badge-primary').textContent;

        const matchSearch = !search || title.includes(search.toLowerCase());
        const matchCat = !cat || category.includes(cat);

        card.style.display = (matchSearch && matchCat) ? 'block' : 'none';
    });
}

// Basic debounce utility
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

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

    try {
        // Parallel data fetch
        const [appResp, expResp, propResp] = await Promise.all([
            fetch(window.URLS.apiRentals, { headers: { 'Authorization': `Token ${token}` } }),
            fetch(window.URLS.apiExpenses, { headers: { 'Authorization': `Token ${token}` } }),
            fetch(window.URLS.apiProperties, { headers: { 'Authorization': `Token ${token}` } })
        ]);

        if (appResp.ok) renderApplications(await appResp.json());

        let expenses = [];
        if (expResp.ok) {
            expenses = await expResp.json();
            renderExpenses(expenses);
        }

        let properties = [];
        if (propResp.ok) {
            properties = await propResp.json();
        }

        initCharts(expenses, properties);
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
        const tr = ce('tr', 'hover:bg-primary-soft transition-colors group cursor-pointer');
        tr.innerHTML = `
            <td class="font-bold text-main !py-5">${escapeHTML(app.property_title || 'Property')}</td>
            <td class="!py-5 font-medium text-secondary group-hover:text-main">${escapeHTML(app.tenant_name || 'Anonymous')}</td>
            <td class="!py-5"><span class="badge badge-neutral !bg-surface !border-color">${app.number_of_occupants} Residents</span></td>
            <td class="!py-5"><span class="badge ${getStatusBadgeClass(app.status)} !bg-opacity-20">${app.status}</span></td>
            <td class="!py-5">
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${app.status === 'PENDING' ? `
                        <button onclick="updateAppStatus(${app.id}, 'approve')" class="btn btn-primary btn-sm !py-2 !px-4 text-[10px] shadow-sm">Approve</button>
                        <button onclick="updateAppStatus(${app.id}, 'reject')" class="btn btn-ghost btn-sm !py-2 !px-4 text-[10px] border border-color shadow-sm">Reject</button>
                    ` : `<span class="text-[10px] font-black text-muted uppercase tracking-widest">Finalized</span>`}
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
function initCharts(expenses = [], properties = []) {
    const ctx1 = document.getElementById('incomeExpensesChart');
    if (ctx1) {
        const totalIncome = properties.reduce((acc, p) => acc + parseFloat(p.price), 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);

        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Current Portfolio Value'],
                datasets: [
                    {
                        label: 'Monthly Income',
                        data: [totalIncome],
                        backgroundColor: '#6366f1',
                        borderRadius: 12,
                        barThickness: 40
                    },
                    {
                        label: 'Monthly Expenses',
                        data: [totalExpenses],
                        backgroundColor: '#ef4444',
                        borderRadius: 12,
                        barThickness: 40
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { weight: 'bold' } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    const ctx2 = document.getElementById('occupancyChart');
    if (ctx2) {
        const residentialCount = properties.filter(p => p.category === 'RESIDENTIAL').length;
        const otherCount = properties.length - residentialCount;

        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Residential', 'Other'],
                datasets: [{
                    data: [residentialCount, otherCount],
                    backgroundColor: ['#10b981', '#6366f1'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20, font: { weight: 'bold' } } } },
                cutout: '75%'
            }
        });
    }
}
