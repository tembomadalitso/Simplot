// Census Ministry Dashboard Logic
let allCensusData = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchCensusAudit();
    initCensusExport();

    const districtSearch = document.getElementById('censusSearchDistrict');
    const categoryFilter = document.getElementById('censusCategoryFilter');

    if (districtSearch) districtSearch.addEventListener('input', debounce(applyCensusFilters, 300));
    if (categoryFilter) categoryFilter.addEventListener('change', applyCensusFilters);
});

function applyCensusFilters() {
    const districtQuery = document.getElementById('censusSearchDistrict').value.toLowerCase();

    const filtered = {};
    Object.keys(allCensusData).forEach(district => {
        if (!districtQuery || district.toLowerCase().includes(districtQuery)) {
            filtered[district] = allCensusData[district];
        }
    });

    renderCensusAuditTable(filtered);
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

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
            allCensusData = data;
            renderCensusAuditTable(allCensusData);
            initCensusCharts(allCensusData);
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
        const tr = ce('tr', 'hover:bg-primary-soft transition-colors group cursor-pointer');
        tr.innerHTML = `
            <td class="font-black text-main uppercase tracking-tighter !py-6">${escapeHTML(district)}</td>
            <td class="!py-6 font-bold text-secondary group-hover:text-main"><span class="badge badge-neutral !bg-surface !border-color">${d.property_count} Audited Assets</span></td>
            <td class="!py-6 font-black text-primary">${d.total_population.toLocaleString()} Residents</td>
            <td class="!py-6"><span class="badge ${d.total_population > 500 ? 'badge-error' : 'badge-success'} !bg-opacity-20">${d.total_population > 500 ? 'High Density' : 'Low Density'}</span></td>
            <td class="!py-6 text-right">
                <button class="btn btn-ghost btn-sm px-4 border border-color text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all shadow-sm">District Intelligence</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Charting Logic (MANDATORY per plan)
function initCensusCharts(data = {}) {
    const ctx1 = document.getElementById('regionalChart');
    if (ctx1) {
        const districts = Object.keys(data);
        const populations = districts.map(d => data[d].total_population);

        new Chart(ctx1, {
            type: 'polarArea',
            data: {
                labels: districts,
                datasets: [{
                    label: 'Residents',
                    data: populations,
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
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { weight: 'bold' }, padding: 15 } } },
                scales: { r: { grid: { color: 'rgba(255,255,255,0.05)' }, angleLines: { display: false }, ticks: { display: false } } }
            }
        });
    }

    const ctx2 = document.getElementById('growthChart');
    if (ctx2) {
        // Growth trend visualization based on current district assets
        const districts = Object.keys(data);
        const assetCounts = districts.map(d => data[d].property_count);

        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: districts,
                datasets: [{
                    label: 'Properties Monitored',
                    data: assetCounts,
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
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }
}
