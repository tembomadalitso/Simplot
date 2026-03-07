document.addEventListener('DOMContentLoaded', () => {
    let imageCounter = 0;
    const addImageBtn = document.getElementById('addImageBtn');
    const container = document.getElementById('imageUploadsContainer');

    function updateRemoveButtons() {
        const rows = document.querySelectorAll('.image-upload-row');
        rows.forEach((row, index) => {
            const btn = row.querySelector('.remove-image-btn');
            if (rows.length > 1) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        });
    }

    addImageBtn.addEventListener('click', () => {
        imageCounter++;
        const row = document.createElement('div');
        row.className = "glass p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start image-upload-row fade-in";
        row.innerHTML = `
            <div class="flex-1 w-full">
                <input type="file" accept="image/*" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" required>
            </div>
            <div class="flex-1 w-full">
                <input type="text" placeholder="Caption (e.g. Master Bedroom)" class="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm image-caption">
            </div>
            <div class="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <label class="flex items-center text-sm font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="main_image" value="${imageCounter}" class="mr-2 text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                    Main Image
                </label>
                <button type="button" class="text-red-500 hover:text-red-700 p-2 remove-image-btn" title="Remove"><i class="fas fa-trash"></i></button>
            </div>
        `;

        row.querySelector('.remove-image-btn').addEventListener('click', () => {
            row.remove();

            // Re-assign values for remaining radios
            const remainingRadios = container.querySelectorAll('input[type="radio"]');
            let hasChecked = false;
            remainingRadios.forEach((radio, index) => {
                radio.value = index;
                if (radio.checked) hasChecked = true;
            });
            if (!hasChecked && remainingRadios.length > 0) {
                remainingRadios[0].checked = true;
            }
            updateRemoveButtons();
        });

        container.appendChild(row);

        // Re-assign radio values just to be safe
        container.querySelectorAll('input[type="radio"]').forEach((radio, index) => {
            radio.value = index;
        });
        updateRemoveButtons();
    });
});

document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const token = localStorage.getItem('auth_token');

    if (!token) {
        alert("You must be logged in to post a property.");
        window.location.href = '/auth/login/';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Uploading...';

    // We use FormData for multipart file uploads
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value || '');
    formData.append('category', document.getElementById('category').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('district', document.getElementById('district').value);
    formData.append('area_name', document.getElementById('area_name').value);
    formData.append('street_address', document.getElementById('street_address').value);
    formData.append('province', "Lusaka");

    // Gather images and captions
    const rows = document.querySelectorAll('.image-upload-row');
    rows.forEach((row, idx) => {
        const fileInput = row.querySelector('input[type="file"]');
        const captionInput = row.querySelector('.image-caption');
        if (fileInput.files.length > 0) {
            formData.append('images', fileInput.files[0]);
            formData.append('captions', captionInput.value || '');
        }
    });

    const mainImageIndex = document.querySelector('input[name="main_image"]:checked')?.value || "0";
    formData.append('main_image_index', mainImageIndex);

    try {
        const response = await fetch('/api/properties/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
                // Note: Do NOT set Content-Type header with FormData, fetch handles the boundary automatically
            },
            body: formData
        });

        if (response.ok) {
            statusDiv.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Listing Published Successfully!';
            statusDiv.className = "mt-4 text-center text-emerald-600 font-bold p-3 bg-emerald-50 rounded-xl";
            statusDiv.classList.remove('hidden');
            setTimeout(() => window.location.href = '/dashboard/', 1500);
        } else {
            const err = await response.json();
            statusDiv.innerText = "Error: " + JSON.stringify(err);
            statusDiv.className = "mt-4 text-center text-red-500 font-bold p-3 bg-red-50 rounded-xl";
            statusDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Publish Listing</span>';
        }
    } catch (error) {
        console.error("Submission failed", error);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Publish Listing</span>';
    }
});