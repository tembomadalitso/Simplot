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
        const response = await authFetch(window.URLS.apiProperties);
        if (!response.ok) throw new Error('Failed to fetch properties');

        const data = await response.json();

        // Filter for pending (non-compliant) properties
        const pendingProperties = data.filter(prop => !prop.is_tax_compliant);

        if (pendingProperties.length === 0) {
            container.innerHTML = `
                <div class="p-12 text-center text-muted">
                    <i class="fas fa-check-circle text-4xl text-success mb-4 block"></i>
                    <p class="font-semibold">All caught up!</p>
                    <p class="text-sm">No properties pending tax verification.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        pendingProperties.forEach(prop => {
            const item = ce('div', 'list-item group');

            const header = ce('div', 'flex justify-between items-start mb-3');
            const info = ce('div');
            const title = ce('h4', 'font-bold', prop.title);
            const owner = ce('p', 'text-sm text-muted');
            owner.append(icon('fas fa-user-tie text-primary mr-1'), document.createTextNode(' Owner: '));
            owner.append(ce('span', 'font-semibold text-secondary', prop.owner_name));
            info.append(title, owner);

            const badge = ce('span', 'badge badge-warning');
            badge.append(icon('fas fa-clock mr-1'), document.createTextNode(' Pending'));
            header.append(info, badge);

            const details = ce('div', 'grid grid-cols-2 gap-4 list-item-inner text-sm');
            const priceWrap = ce('div');
            const priceTitle = ce('span', 'text-muted block text-xs uppercase font-bold tracking-wider mb-1', 'Declared Price');
            const priceVal = ce('span', 'font-black text-primary', `K${parseFloat(prop.price).toLocaleString()}`);
            const mo = ce('span', 'text-xs text-muted', '/mo');
            priceWrap.append(priceTitle, priceVal, mo);

            const taxWrap = ce('div');
            const taxTitle = ce('span', 'text-muted block text-xs uppercase font-bold tracking-wider mb-1', 'Est. Annual Tax');
            const taxVal = ce('span', 'font-black text-success', `K${parseFloat(prop.estimated_tax).toLocaleString()}`);
            taxWrap.append(taxTitle, taxVal);
            details.append(priceWrap, taxWrap);

            const action = ce('div', 'mt-4 flex justify-end');
            const verifyBtn = ce('button', 'btn btn-success btn-sm', '', {
                onclick: () => toggleCompliance(parseInt(prop.id))
            });
            verifyBtn.append(icon('fas fa-check mr-2'), document.createTextNode(' Verify Compliance'));
            verifyBtn.onclick = () => toggleCompliance(parseInt(prop.id));
            action.append(verifyBtn);

            item.append(header, details, action);
            container.appendChild(item);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="p-8 text-center text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i> Error loading queue.</div>';
    }
}

window.toggleCompliance = async (id) => {
    if(!confirm("Are you sure you want to mark this property as tax compliant?")) return;

    try {
        const url = `${window.URLS.apiProperties}${id}/toggle_compliance/`;
        const response = await authFetch(url, { method: 'POST' });
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