document.getElementById('agreementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    const statusDiv = document.getElementById('formStatus');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Improved URL parsing to get the ID from /property/1/apply/
    const pathParts = window.location.pathname.split('/');
    const propertyId = pathParts[pathParts.indexOf('property') + 1];

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = '/auth/login/';
        return;
    }

    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;

    if (new Date(startDate) >= new Date(endDate)) {
        statusDiv.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-exclamation-triangle mr-2"></i> End date must be after start date.</span>`;
        statusDiv.classList.remove('hidden');
        return;
    }

    const payload = {
        property: parseInt(propertyId), // Ensure it's a number
        number_of_occupants: parseInt(document.getElementById('occupants').value),
        start_date: startDate,
        end_date: endDate,
        is_active: true
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';

    try {
        const response = await fetch('/api/rentals/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            statusDiv.innerHTML = `<span class="text-emerald-500 font-bold"><i class="fas fa-check-circle mr-2"></i> Application submitted successfully! Redirecting...</span>`;
            statusDiv.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            const errorData = await response.json();
            console.error("Submission error:", errorData);
            statusDiv.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-times-circle mr-2"></i> Failed to submit application.</span>`;
            statusDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Application';
        }
    } catch (error) {
        console.error("Network error:", error);
        statusDiv.innerHTML = `<span class="text-red-500 font-bold"><i class="fas fa-times-circle mr-2"></i> Connection failed. Check if server is running.</span>`;
        statusDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Application';
    }
});