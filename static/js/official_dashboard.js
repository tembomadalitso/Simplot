document.addEventListener('DOMContentLoaded', () => {
    fetchPendingProperties();
});

const token = localStorage.getItem('auth_token');

async function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
    };
    return fetch(url, { ...options, headers });
}

async function fetchPendingProperties() {
    const container = document.getElementById('taxQueueList');
    try {
        const response = await authFetch('/api/properties/');
        if (!response.ok) throw new Error('Failed to fetch properties');

        const data = await response.json();

        // Filter for pending (non-compliant) properties
        const pendingProperties = data.filter(prop => !prop.is_tax_compliant);

        if (pendingProperties.length === 0) {
            container.innerHTML = `
                <div class="p-12 text-center text-slate-500">
                    <i class="fas fa-check-circle text-4xl text-emerald-400 mb-4 block"></i>
                    <p class="font-semibold">All caught up!</p>
                    <p class="text-sm">No properties pending tax verification.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingProperties.map(prop => `
            <div class="p-6 hover:bg-slate-50 transition border-b border-slate-100 last:border-0 group">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-bold text-slate-900">${prop.title}</h4>
                        <p class="text-sm text-slate-500"><i class="fas fa-user-tie text-indigo-400 mr-1"></i> Owner: <span class="font-semibold text-slate-700">${prop.owner_name}</span></p>
                    </div>
                    <span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold uppercase whitespace-nowrap"><i class="fas fa-clock mr-1"></i> Pending</span>
                </div>

                <div class="grid grid-cols-2 gap-4 mt-4 text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                    <div><span class="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Declared Price</span> <span class="font-black text-indigo-600">K${parseFloat(prop.price).toLocaleString()}</span><span class="text-xs text-slate-400">/mo</span></div>
                    <div><span class="text-slate-500 block text-xs uppercase font-bold tracking-wider mb-1">Est. Annual Tax</span> <span class="font-black text-emerald-600">K${parseFloat(prop.estimated_tax).toLocaleString()}</span></div>
                </div>

                <div class="mt-4 flex justify-end">
                    <button onclick="toggleCompliance(${prop.id})" class="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm flex items-center">
                        <i class="fas fa-check mr-2"></i> Verify Compliance
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="p-8 text-center text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> Error loading queue.</div>';
    }
}

window.toggleCompliance = async (id) => {
    if(!confirm("Are you sure you want to mark this property as tax compliant?")) return;

    try {
        const response = await authFetch(`/api/properties/${id}/toggle_compliance/`, { method: 'POST' });
        if (response.ok) {
            // Optional: refresh page to update the stats headers too, or just fetch list again
            window.location.reload();
        } else {
            alert('Failed to verify compliance.');
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred.');
    }
}