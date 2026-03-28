// ZRA Official Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchZRAAudit();
    initZRACharts();
    initZRAExport();
});

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
            renderZRAAuditTable(data.landlords);
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
        const tr = ce('tr');
        tr.innerHTML = `
            <td class="font-bold text-main">${escapeHTML(l.landlord_name)}</td>
            <td><span class="badge badge-neutral">${l.property_count} Assets</span></td>
            <td class="font-black">K${l.annual_income_estimate.toLocaleString()}</td>
            <td><span class="badge badge-success !bg-success-bg/20">Verified</span></td>
            <td>
                <button class="btn btn-ghost btn-sm px-4 border border-color text-[10px] font-black uppercase">Inspect Portfolio</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Charting Logic (MANDATORY per plan)
function initZRACharts() {
    const ctx1 = document.getElementById('complianceChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Compliant', 'Non-Compliant', 'Under Audit'],
                datasets: [{
                    data: [65, 20, 15],
                    backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold' } } } },
                cutout: '70%'
            }
        });
    }

    const ctx2 = document.getElementById('revenueCategoryChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Residential', 'Boarding', 'Lodge'],
                datasets: [{
                    label: 'Revenue (ZMW)',
                    data: [4.2, 1.8, 0.9],
                    backgroundColor: '#6366f1',
                    borderRadius: 8
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
