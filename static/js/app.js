let debounceTimer;

async function fetchProperties() {
    const container = document.getElementById('property-list');
    const searchInput = document.getElementById('searchInput')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    // Skeleton loader
    container.innerHTML = Array(6).fill().map(() => `
        <div class="glass-card rounded-3xl overflow-hidden flex flex-col animate-pulse">
            <div class="h-48 bg-slate-200"></div>
            <div class="p-6 space-y-4">
                <div class="h-6 bg-slate-200 rounded w-3/4"></div>
                <div class="h-4 bg-slate-200 rounded w-1/2"></div>
                <div class="flex justify-between items-center pt-4">
                    <div class="h-8 bg-slate-200 rounded w-1/3"></div>
                    <div class="h-4 bg-slate-200 rounded w-1/4"></div>
                </div>
            </div>
        </div>
    `).join('');

    try {
        const queryParams = new URLSearchParams();
        if (searchInput) queryParams.append('search', searchInput);
        if (categoryFilter) queryParams.append('category', categoryFilter);

        const url = `${window.URLS.apiProperties}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center py-12 text-slate-500 text-lg">No listings found matching your search.</p>';
            return;
        }

        container.innerHTML = '';
        data.forEach(prop => {
            let mainImageUrl = "https://via.placeholder.com/400x300?text=Property";
            if (prop.images && prop.images.length > 0) {
                const mainImage = prop.images.find(img => img.is_main) || prop.images[0];
                mainImageUrl = mainImage.image;
            }

            const card = ce('div', 'glass-card rounded-3xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl duration-300');

            const imgContainer = ce('div', 'h-48 bg-slate-200 relative');
            const categoryBadge = ce('span', 'absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm', prop.category_display);
            imgContainer.appendChild(categoryBadge);

            if (prop.is_tax_compliant) {
                const verifiedBadge = ce('span', 'absolute top-4 right-4 bg-emerald-500/90 text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm');
                verifiedBadge.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Verified';
                imgContainer.appendChild(verifiedBadge);
            }

            const img = ce('img', 'w-full h-full object-cover', '', { src: mainImageUrl, alt: prop.title });
            imgContainer.appendChild(img);

            const content = ce('div', 'p-6 flex-1 flex flex-col');
            const title = ce('h3', 'font-bold text-xl mb-1 text-slate-900', prop.title);
            const location = ce('p', 'text-slate-500 text-sm mb-6');
            location.innerHTML = `<i class="fas fa-map-marker-alt mr-2 text-indigo-400"></i>${escapeHTML(prop.area_name)}, ${escapeHTML(prop.district)}`;

            const footer = ce('div', 'flex justify-between items-end mt-auto');
            const priceWrap = ce('div');
            const price = ce('span', 'text-2xl font-black text-slate-900', `K${parseFloat(prop.price).toLocaleString()}`);
            const perMo = ce('span', 'text-slate-500 text-sm', '/mo');
            priceWrap.append(price, perMo);

            const link = ce('a', 'text-indigo-600 font-semibold hover:text-indigo-800 transition-colors', 'View Details →', {
                href: window.URLS.propertyDetail.replace('0', parseInt(prop.id))
            });

            footer.append(priceWrap, link);
            content.append(title, location, footer);
            card.append(imgContainer, content);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        container.innerHTML = '<p class="col-span-full text-center text-red-500 py-12">Failed to load listings. Please try again later.</p>';
    }
}

// Event Listeners for Filtering
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchProperties, 500); // 500ms debounce
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', fetchProperties);
    }

    // Initial fetch
    fetchProperties();
});