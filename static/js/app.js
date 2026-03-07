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

        const url = `${API_BASE}/properties/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center py-12 text-slate-500 text-lg">No listings found matching your search.</p>';
            return;
        }

        container.innerHTML = data.map(prop => {
            let mainImageUrl = "https://via.placeholder.com/400x300?text=Property";
            if (prop.images && prop.images.length > 0) {
                const mainImage = prop.images.find(img => img.is_main) || prop.images[0];
                mainImageUrl = mainImage.image;
            }
            return `
            <div class="glass-card rounded-3xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 hover:shadow-xl duration-300">
                <div class="h-48 bg-slate-200 relative">
                    <span class="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                        ${prop.category_display}
                    </span>
                    ${prop.is_tax_compliant ?
                        `<span class="absolute top-4 right-4 bg-emerald-500/90 text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                            <i class="fas fa-check-circle mr-1"></i> Verified
                        </span>` : ''
                    }
                    <img src="${mainImageUrl}" class="w-full h-full object-cover">
                </div>
                <div class="p-6 flex-1 flex flex-col">
                    <h3 class="font-bold text-xl mb-1 text-slate-900">${prop.title}</h3>
                    <p class="text-slate-500 text-sm mb-2"><i class="fas fa-map-marker-alt mr-2 text-indigo-400"></i>${prop.area_name}, ${prop.district}</p>
                    <p class="text-slate-600 text-sm mb-6 line-clamp-2">${prop.description ? prop.description : 'A beautiful ' + prop.category_display.toLowerCase() + ' located in ' + prop.district + '.'}</p>
                    <div class="flex justify-between items-end mt-auto">
                        <div>
                            <span class="text-2xl font-black text-slate-900">K${parseFloat(prop.price).toLocaleString()}</span>
                            <span class="text-slate-500 text-sm">/mo</span>
                        </div>
                        <a href="/property/${prop.id}" class="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">View Details &rarr;</a>
                    </div>
                </div>
            </div>
        `;
        }).join('');

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