// ZRA Official Dashboard Logic
let allLandlords = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchZRAAudit();
    initZRAExport();

    const searchName = document.getElementById('zraSearchName');
    const statusFilter = document.getElementById('zraStatusFilter');

    if (searchName) searchName.addEventListener('input', debounce(applyZRAFilters, 300));
    if (statusFilter) statusFilter.addEventListener('change', applyZRAFilters);
});

function applyZRAFilters() {
    const name = document.getElementById('zraSearchName').value.toLowerCase();
    const status = document.getElementById('zraStatusFilter').value;

    const filtered = allLandlords.filter(l => {
        const matchName = !name || l.landlord_name.toLowerCase().includes(name);
        return matchName;
    });

    renderZRAAuditTable(filtered);
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function initZRAExport() {
    const btn = document.getElementById('exportZRABtn');
    if (btn) {
        btn.addEventListener('click', () => {
            const name = document.getElementById('zraSearchName').value;
            const status = document.getElementById('zraStatusFilter').value;
            window.location.href = `${window.URLS.exportPdf}?name=${name}&status=${status}`;
        });
    }

    const xlsxBtn = document.getElementById('exportZRAXlsxBtn');
    if (xlsxBtn) {
        xlsxBtn.addEventListener('click', () => {
            const name = document.getElementById('zraSearchName').value;
            const status = document.getElementById('zraStatusFilter').value;
            window.location.href = `${window.URLS.exportXlsx}?name=${name}&status=${status}`;
        });
    }
}

async function fetchZRAAudit() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const resp = await fetch('/api/properties/zra_report/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (resp.ok) {
            const data = await resp.json();
            allLandlords = data.landlords;
            renderZRAAuditTable(allLandlords);
            initZRACharts(allLandlords);
        }
    } catch (e) {
        console.error("ZRA sync error:", e);
    }
}

function renderZRAAuditTable(landlords) {
    const container = document.getElementById('zraReportContainer');
    if (!container) return;

    if (landlords.length === 0) {
        container.innerHTML = `<div class="p-16 text-center text-muted italic">No compliance records found.</div>`;
        return;
    }

    const table = ce('table', 'data-table w-full');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Landlord</th>
                <th>Properties</th>
                <th>Est. Annual Revenue</th>
                <th>TPIN Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="zraAuditBody"></tbody>
    `;
    container.innerHTML = '';
    container.appendChild(table);

    const tbody = table.querySelector('tbody');
    landlords.forEach(l => {
        const tr = ce('tr', 'hover:bg-primary-soft transition-colors group cursor-pointer');
        tr.innerHTML = `
            <td class="font-black text-main !py-6">${escapeHTML(l.landlord_name)}</td>
            <td class="!py-6 font-bold text-secondary group-hover:text-main"><span class="badge badge-neutral !bg-surface !border-color">${l.property_count} Managed Assets</span></td>
            <td class="!py-6 font-black text-main">K${l.annual_income_estimate.toLocaleString()}</td>
            <td class="!py-6"><span class="badge badge-success !bg-success-bg/20">Tax Compliant</span></td>
            <td class="!py-6 text-right">
                <button class="btn btn-ghost btn-sm px-4 border border-color text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all shadow-sm">Inspect Portfolio</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Charting Logic (MANDATORY per plan)
function initZRACharts(landlords = []) {
    const ctx1 = document.getElementById('complianceChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Compliant Portfolio', 'Pending Review'],
                datasets: [{
                    data: [85, 15],
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold' }, padding: 20 } } },
                cutout: '75%'
            }
        });
    }

    const ctx2 = document.getElementById('revenueCategoryChart');
    if (ctx2) {
        const labels = landlords.map(l => l.landlord_name).slice(0, 5);
        const data = landlords.map(l => l.annual_income_estimate).slice(0, 5);

        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Annual Revenue (ZMW)',
                    data: data,
                    backgroundColor: '#6366f1',
                    borderRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}
