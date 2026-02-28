document.getElementById('propertyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('formStatus');
    const token = localStorage.getItem('auth_token');

    if (!token) {
        alert("You must be logged in to post a property.");
        window.location.href = '/auth/login/';
        return;
    }

    const payload = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        price: document.getElementById('price').value,
        district: document.getElementById('district').value,
        area_name: document.getElementById('area_name').value,
        street_address: document.getElementById('street_address').value,
        province: "Lusaka" // Defaulting for now
    };

    try {
        const response = await fetch('/api/properties/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            statusDiv.innerText = "Listing Published Successfully!";
            statusDiv.className = "mt-4 text-center text-emerald-600 font-bold";
            statusDiv.classList.remove('hidden');
            setTimeout(() => window.location.href = '/', 1500);
        } else {
            const err = await response.json();
            statusDiv.innerText = "Error: " + JSON.stringify(err);
            statusDiv.className = "mt-4 text-center text-red-500 font-bold";
            statusDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Submission failed", error);
    }
});