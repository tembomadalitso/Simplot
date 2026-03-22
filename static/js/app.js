const REALISTIC_IMAGES = [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600607687940-4ad2364775a3?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=80&w=800"
];

let debounceTimer;

async function fetchProperties() {
    const container = document.getElementById('property-list');
    const searchInput = document.getElementById('searchInput')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    // Skeleton loader
    container.innerHTML = Array(6).fill().map((_, i) => `
        <div class="glass-card rounded-[28px] overflow-hidden animate-pulse" style="animation-delay: ${i * 0.1}s">
            <div class="h-64 bg-slate-100"></div>
            <div class="p-8 space-y-4">
                <div class="h-6 bg-slate-100 rounded-lg w-3/4"></div>
                <div class="h-4 bg-slate-100 rounded-lg w-1/2"></div>
                <div class="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div class="h-10 bg-slate-100 rounded-xl w-1/3"></div>
                    <div class="h-4 bg-slate-100 rounded-lg w-1/4"></div>
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
            container.innerHTML = `
                <div class="col-span-full py-20 text-center">
                    <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 text-3xl">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="text-slate-900 font-extrabold mb-2">No listings found</h3>
                    <p class="text-slate-400">Try adjusting your search filters or area.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        data.forEach((prop, i) => {
            const fallbackImg = REALISTIC_IMAGES[i % REALISTIC_IMAGES.length];
            let mainImageUrl = fallbackImg;
            if (prop.images && prop.images.length > 0) {
                const mainImage = prop.images.find(img => img.is_main) || prop.images[0];
                mainImageUrl = mainImage.image;
            }

            const card = document.createElement('a');
            card.href = window.URLS.propertyDetail.replace('0', parseInt(prop.id));
            card.className = "glass-card group rounded-[28px] overflow-hidden animate-fade-in";
            card.style.animationDelay = `${i * 0.05}s`;

            const imgWrapper = `
                <div class="h-64 overflow-hidden relative">
                    <img src="${mainImageUrl}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${prop.title}">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div class="absolute top-5 left-5">
                        <span class="bg-white/95 backdrop-blur shadow-sm px-4 py-1.5 rounded-full text-[11px] font-black text-indigo-600 uppercase tracking-wider">
                            ${prop.category_display}
                        </span>
                    </div>
                    ${prop.is_tax_compliant ? `
                        <div class="absolute top-5 right-5">
                            <span class="bg-indigo-600 text-white shadow-lg px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                                <i class="fas fa-check-circle text-[12px]"></i> Verified
                            </span>
                        </div>
                    ` : ''}
                </div>
            `;

            const content = `
                <div class="p-8">
                    <h3 class="text-xl font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">${prop.title}</h3>
                    <div class="flex items-center gap-2 text-slate-400 font-bold text-sm mb-6">
                        <i class="fas fa-map-pin text-indigo-400"></i>
                        ${prop.area_name}, ${prop.district}
                    </div>
                    <div class="pt-6 border-t border-slate-100 flex justify-between items-center">
                        <div class="flex items-baseline gap-1">
                            <span class="text-2xl font-black text-slate-900">K${parseFloat(prop.price).toLocaleString()}</span>
                            <span class="text-slate-400 text-sm font-bold">/mo</span>
                        </div>
                        <div class="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all duration-300">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    </div>
                </div>
            `;

            card.innerHTML = imgWrapper + content;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        container.innerHTML = '<p class="col-span-full text-center text-red-500 py-12">Failed to load listings. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(fetchProperties, 500);
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', fetchProperties);
    }

    fetchProperties();
});