async function fetchProperties() {
    const container = document.getElementById('property-list');
    
    try {
        const response = await fetch(`${API_BASE}/properties/`);
        const data = await response.json();
        
        if (data.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center py-12">No listings found in Zambia yet.</p>';
            return;
        }

        container.innerHTML = data.map(prop => `
            <div class="glass-card rounded-3xl overflow-hidden flex flex-col">
                <div class="h-48 bg-slate-200 relative">
                    <span class="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-indigo-600">
                        ${prop.category_display}
                    </span>
                    <img src="https://via.placeholder.com/400x300?text=Property" class="w-full h-full object-cover">
                </div>
                <div class="p-6">
                    <h3 class="font-bold text-xl mb-1">${prop.title}</h3>
                    <p class="text-slate-500 text-sm mb-4"><i class="fas fa-map-marker-alt mr-2"></i>${prop.area_name}, ${prop.district}</p>
                    <div class="flex justify-between items-center mt-auto">
                        <span class="text-2xl font-black text-slate-900">K${parseFloat(prop.price).toLocaleString()}</span>
                        <a href="/property/${prop.id}" class="text-indigo-600 font-semibold hover:underline">View Details</a>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching properties:', error);
        container.innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load listings.</p>';
    }
}

// Initialize
fetchProperties();