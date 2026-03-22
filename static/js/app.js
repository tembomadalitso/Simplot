let debounceTimer;

async function fetchProperties() {
    const container = document.getElementById('property-list');
    const searchInput = document.getElementById('searchInput')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    // Skeleton loaders
    container.innerHTML = Array(6).fill().map((_, i) => `
        <div class="glass-prop-card" style="animation-delay:${i*0.05}s">
            <div style="height:210px;background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite ${i*0.1}s"></div>
            <div style="padding:20px">
                <div style="height:15px;width:60%;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;margin-bottom:10px"></div>
                <div style="height:11px;width:38%;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite;margin-bottom:20px"></div>
                <div style="display:flex;justify-content:space-between">
                    <div style="height:18px;width:30%;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite"></div>
                    <div style="height:18px;width:22%;border-radius:6px;background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.06) 75%);background-size:200% 100%;animation:shimmer 1.6s infinite"></div>
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
                <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                        <i class="fas fa-search" style="color:rgba(255,255,255,0.4);font-size:22px"></i>
                    </div>
                    <p style="color:rgba(255,255,255,0.6);font-size:16px;font-weight:600">No listings found matching your search.</p>
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
            card.className = 'glass-prop-card';
            card.style.animation = `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 0.06}s both`;
            card.onclick = () => { window.location.href = window.URLS.propertyDetail.replace('0', parseInt(prop.id)); };

            // Image area
            const imgWrap = document.createElement('div');
            imgWrap.style.cssText = 'height:210px;position:relative;overflow:hidden;background:rgba(255,255,255,0.05)';

            if (mainImageUrl) {
                const img = document.createElement('img');
                img.src = mainImageUrl;
                img.alt = prop.title;
                img.style.cssText = 'width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease';
                card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.06)');
                card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
                imgWrap.appendChild(img);
            } else {
                imgWrap.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><i class="fas fa-home" style="font-size:2.5rem;color:rgba(255,255,255,0.15)"></i></div>`;
            }

            // Category badge
            const catBadge = document.createElement('span');
            catBadge.style.cssText = 'position:absolute;top:14px;left:14px;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.9);padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em';
            catBadge.textContent = prop.category_display;
            imgWrap.appendChild(catBadge);

            // Verified badge
            if (prop.is_tax_compliant) {
                const vBadge = document.createElement('span');
                vBadge.style.cssText = 'position:absolute;top:14px;right:14px;background:rgba(16,185,129,0.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;padding:4px 10px;border-radius:9999px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;display:flex;align-items:center;gap:5px';
                vBadge.innerHTML = '<i class="fas fa-check-circle" style="font-size:9px"></i> Verified';
                imgWrap.appendChild(vBadge);
            }

            // Bottom gradient on image
            const imgGrad = document.createElement('div');
            imgGrad.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to bottom,transparent,rgba(0,0,0,0.5))';
            imgWrap.appendChild(imgGrad);

            card.appendChild(imgWrap);

            // Card body
            const body = document.createElement('div');
            body.style.cssText = 'padding:18px 20px 20px';

            // Title
            const title = document.createElement('h4');
            title.style.cssText = 'font-size:15px;font-weight:800;letter-spacing:-0.02em;color:#fff;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
            title.textContent = prop.title;

            // Location
            const loc = document.createElement('p');
            loc.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.5);font-weight:500;margin-bottom:16px;display:flex;align-items:center;gap:5px';
            loc.innerHTML = `<i class="fas fa-map-marker-alt" style="font-size:10px;color:rgba(165,180,252,0.7)"></i> ${prop.area_name}, ${prop.district}`;

            // Divider
            const div = document.createElement('div');
            div.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin-bottom:14px';

            // Footer row
            const footer = document.createElement('div');
            footer.style.cssText = 'display:flex;justify-content:space-between;align-items:center';

            const price = document.createElement('div');
            price.innerHTML = `<span style="font-size:1.3rem;font-weight:900;letter-spacing:-0.04em;color:#fff">K${parseFloat(prop.price).toLocaleString()}</span><span style="font-size:12px;color:rgba(255,255,255,0.45);font-weight:500">/mo</span>`;

            const viewBtn = document.createElement('span');
            viewBtn.style.cssText = 'font-size:12px;font-weight:700;color:rgba(165,180,252,0.85);display:flex;align-items:center;gap:5px;transition:color .15s';
            viewBtn.innerHTML = 'View Details <i class="fas fa-arrow-right" style="font-size:10px"></i>';
            card.addEventListener('mouseenter', () => viewBtn.style.color = '#a5b4fc');
            card.addEventListener('mouseleave', () => viewBtn.style.color = 'rgba(165,180,252,0.85)');

            footer.append(price, viewBtn);
            body.append(title, loc, div, footer);
            card.appendChild(body);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error fetching properties:', error);
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
                <p style="color:rgba(255,100,100,0.8);font-size:15px;font-weight:600">
                    <i class="fas fa-exclamation-triangle" style="margin-right:8px"></i>Failed to load listings. Please try again.
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