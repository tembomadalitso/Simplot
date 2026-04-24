let debounceTimer;

async function fetchProperties() {
    const container = document.getElementById('property-list');
    const searchInput = document.getElementById('searchInput')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    // Skeleton loaders
    container.innerHTML = Array(6).fill().map((_, i) => `
        <div class="glass-prop-card" style="animation-delay:${i*0.05}s">
            <div class="skel-card-img" style="animation-delay:${i*0.1}s"></div>
            <div class="p-4">
                <div class="skel-line w-full" style="width:60%"></div>
                <div class="skel-line w-full" style="width:38%;margin-bottom:20px"></div>
                <div class="flex-row justify-between">
                    <div class="skel-line" style="width:30%;height:18px"></div>
                    <div class="skel-line" style="width:22%;height:18px"></div>
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
                <div class="text-center p-8" style="grid-column:1/-1;padding-top:60px;padding-bottom:60px;">
                    <div class="flex-center mb-4" style="width:56px;height:56px;border-radius:50%;background:var(--bg-surface);margin:0 auto;">
                        <i class="fas fa-search text-muted" style="font-size:22px"></i>
                    </div>
                    <p class="text-lg font-semibold text-muted">No listings found matching your search.</p>
                </div>`;
            return;
        }

        container.innerHTML = '';
        data.forEach((prop, idx) => {
            let mainImageUrl = null;
            if (prop.images && prop.images.length > 0) {
                const mainImage = prop.images.find(img => img.is_main) || prop.images[0];
                mainImageUrl = mainImage.image;
            }

            // Card wrapper
            const card = document.createElement('div');
            card.className = `glass-prop-card fade-up delay-${(idx % 4) + 1}`;
            card.onclick = () => { window.location.href = window.URLS.propertyDetail.replace('0', parseInt(prop.id)); };

            // Image area
            const imgWrap = document.createElement('div');
            imgWrap.className = 'prop-card-img-wrap';

            if (mainImageUrl) {
                const img = document.createElement('img');
                img.className = 'prop-card-img';
                img.src = mainImageUrl;
                img.alt = prop.title;
                card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.06)');
                card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
                imgWrap.appendChild(img);
            } else {
                imgWrap.innerHTML = `<div class="w-full h-full flex-center"><i class="fas fa-home text-muted" style="font-size:2.5rem;opacity:0.2"></i></div>`;
            }

            // Category badge
            const catBadge = document.createElement('span');
            catBadge.className = 'badge badge-primary prop-card-badge-left';
            catBadge.textContent = prop.category_display;
            imgWrap.appendChild(catBadge);

            // Verified badge
            if (prop.is_tax_compliant) {
                const vBadge = document.createElement('span');
                vBadge.className = 'badge badge-success prop-card-badge-right';
                vBadge.innerHTML = '<i class="fas fa-check-circle text-xs"></i> Verified';
                imgWrap.appendChild(vBadge);
            }

            // Bottom gradient on image
            const imgGrad = document.createElement('div');
            imgGrad.className = 'prop-card-img-grad';
            imgWrap.appendChild(imgGrad);

            card.appendChild(imgWrap);

            // Card body
            const body = document.createElement('div');
            body.className = 'prop-card-body';

            // Title
            const title = document.createElement('h4');
            title.className = 'prop-card-title';
            title.textContent = prop.title;

            // Location
            const loc = document.createElement('p');
            loc.className = 'text-xs font-medium flex-row items-center gap-1 mb-4';
            loc.innerHTML = `<i class="fas fa-map-marker-alt" style="color:var(--color-primary);font-size:10px;"></i> ${prop.area_name}, ${prop.district}`;

            // Divider
            const div = document.createElement('div');
            div.className = 'border-b mb-4';

            // Footer row
            const footer = document.createElement('div');
            footer.className = 'flex-row justify-between items-center';

            const price = document.createElement('div');
            price.innerHTML = `<span class="price-tag">K${parseFloat(prop.price).toLocaleString()}</span><span class="text-xs font-medium text-muted">/mo</span>`;

            const viewBtn = document.createElement('span');
            viewBtn.className = 'text-xs font-bold flex-row items-center gap-1';
            viewBtn.style.color = 'var(--color-primary)';
            viewBtn.innerHTML = 'View Details <i class="fas fa-arrow-right" style="font-size:10px"></i>';
            card.addEventListener('mouseenter', () => viewBtn.style.color = 'var(--color-primary-hover)');
            card.addEventListener('mouseleave', () => viewBtn.style.color = 'var(--color-primary)');

            footer.append(price, viewBtn);
            body.append(title, loc, div, footer);
            card.appendChild(body);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        container.innerHTML = `
            <div class="text-center p-8" style="grid-column:1/-1;padding-top:60px;padding-bottom:60px;">
                <p class="text-lg font-semibold" style="color:var(--color-error);">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Failed to load listings. Please try again.
                </p>
            </div>`;
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