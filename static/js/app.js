// Main Application logic for the search and property list
const API_URL = window.URLS.apiProperties;

async function fetchProperties() {
    const list = document.getElementById('property-list');
    const search = document.getElementById('searchInput').value;
    const cat = document.getElementById('categoryFilter').value;

    let url = API_URL;
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (cat) params.append('category', cat);
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            renderProperties(data);
        }
    } catch (e) {
        console.error("Search error:", e);
    }
}

function renderProperties(props) {
    const list = document.getElementById('property-list');
    if (!list) return;

    if (props.length === 0) {
        list.innerHTML = `
            <div class="col-span-full py-20 text-center card border-dashed border-2">
                <i class="fas fa-search text-muted text-4xl mb-4 block"></i>
                <h4 class="text-secondary font-black">No listings matched your criteria</h4>
                <p class="text-sm text-muted">Try broadening your search or exploring all categories.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    props.forEach(p => {
        const card = ce('div', 'card hover:-translate-y-2 group cursor-pointer animate-slide-up', '', {
            onclick: () => window.location.href = window.URLS.propertyDetail.replace('0', p.id)
        });

        const imgWrap = ce('div', 'relative h-56 overflow-hidden');
        if (p.main_image_url) {
            const img = ce('img', 'w-full h-full object-cover group-hover:scale-110 transition-transform duration-500', '', { src: p.main_image_url });
            imgWrap.appendChild(img);
        } else {
            const empty = ce('div', 'w-full h-full flex items-center justify-center bg-body');
            empty.innerHTML = '<i class="fas fa-home text-muted text-3xl"></i>';
            imgWrap.appendChild(empty);
        }

        const badgeWrap = ce('div', 'absolute top-4 right-4 flex gap-2');
        badgeWrap.innerHTML = `
            <span class="badge badge-primary !bg-glass !backdrop-blur-md">${p.category}</span>
            ${p.is_tax_compliant ? '<span class="badge badge-success !bg-glass !backdrop-blur-md"><i class="fas fa-check-circle mr-1"></i>Verified</span>' : ''}
        `;
        imgWrap.appendChild(badgeWrap);

        const body = ce('div', 'p-6');
        body.innerHTML = `
            <h4 class="truncate mb-1 font-black text-lg">${escapeHTML(p.title)}</h4>
            <p class="text-xs font-semibold text-muted mb-4 tracking-tight"><i class="fas fa-map-pin text-primary mr-1"></i>${escapeHTML(p.district)}, ${escapeHTML(p.area_name)}</p>
            <div class="flex justify-between items-center pt-4 border-t border-color">
                <div>
                    <span class="text-xl font-black tracking-tighter">K${p.price}</span>
                    <span class="text-[10px] font-bold text-muted uppercase ml-1">/ Month</span>
                </div>
                <div class="w-8 h-8 rounded-xl bg-primary-light text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <i class="fas fa-arrow-right text-[10px]"></i>
                </div>
            </div>
        `;

        card.appendChild(imgWrap);
        card.appendChild(body);
        list.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProperties();

    // Wire up filter listeners
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(fetchProperties, 500));
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', fetchProperties);
    }
});

// Basic debounce utility
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
