// Census Ministry Dashboard Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchCensusAudit();
    initCensusCharts();
    initCensusExport();
});

function initCensusExport() {
    const btn = document.getElementById('exportCensusBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            const district = document.getElementById('censusSearchDistrict').value;
            const category = document.getElementById('censusCategoryFilter').value;
            window.location.href = `${window.URLS.exportPdf}?district=${district}&category=${category}`;
        });
    }

    const xlsxBtn = document.getElementById('exportCensusXlsxBtn');
    if (xlsxBtn) {
        xlsxBtn.addEventListener('click', () => {
            const district = document.getElementById('censusSearchDistrict').value;
            const category = document.getElementById('censusCategoryFilter').value;
            window.location.href = `${window.URLS.exportXlsx}?district=${district}&category=${category}`;
        });
    }
}

async function fetchCensusAudit() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const resp = await fetch('/api/properties/census_report/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (resp.ok) {
            const data = await resp.json();
            renderCensusAuditTable(data);
        }
    } catch (e) {
        console.error("Census sync error:", e);
    }
}

function renderCensusAuditTable(data) {
    const container = document.getElementById('censusReportContainer');
    if (!container) return;

    if (Object.keys(data).length === 0) {
        container.innerHTML = `<div class="p-16 text-center text-muted italic">No district occupancy data available.</div>`;
        return;
    }

    const table = ce('table', 'data-table w-full');
    table.innerHTML = `
        <thead>
            <tr>
                <th>District</th>
                <th>Properties Managed</th>
                <th>Total Population</th>
                <th>Occupancy Density</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody id="censusAuditBody"></tbody>
    `;
    container.innerHTML = '';
    container.appendChild(table);

    const tbody = table.querySelector('tbody');
    Object.keys(data).forEach(district => {
        const d = data[district];
        const tr = ce('tr');
        tr.innerHTML = `
            <td class="font-bold text-main uppercase tracking-tighter">${escapeHTML(district)}</td>
            <td><span class="badge badge-neutral">${d.property_count} Assets</span></td>
            <td class="font-black text-primary">${d.total_population} Residents</td>
            <td><span class="badge ${d.total_population > 500 ? 'badge-error' : 'badge-success'} !bg-opacity-20">${d.total_population > 500 ? 'High' : 'Low'}</span></td>
            <td>
                <button class="btn btn-ghost btn-sm px-4 border border-color text-[10px] font-black uppercase tracking-widest">District Map</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Charting Logic (MANDATORY per plan)
function initCensusCharts() {
    const ctx1 = document.getElementById('regionalChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'polarArea',
            data: {
                labels: ['Lusaka', 'Copperbelt', 'Southern', 'Central'],
                datasets: [{
                    label: 'Population Density',
                    data: [1200, 850, 420, 310],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.7)',
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(245, 158, 11, 0.7)',
                        'rgba(239, 68, 68, 0.7)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold' } } } },
                scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, angleLines: { display: false }, ticks: { display: false } } }
            }
        });
    }

    const ctx2 = document.getElementById('growthChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: ['2020', '2021', '2022', '2023', '2024'],
                datasets: [{
                    label: 'Residents Growth',
                    data: [45000, 52000, 61000, 72000, 88000],
                    borderColor: '#6366f1',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.1)'
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
