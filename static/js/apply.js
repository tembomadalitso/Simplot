document.getElementById('agreementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    
    // Improved URL parsing to get the ID from /property/1/apply/
    const pathParts = window.location.pathname.split('/');
    const propertyId = pathParts[pathParts.indexOf('property') + 1];

    if (!token) {
        alert("Session expired. Please login again.");
        window.location.href = '/auth/login/';
        return;
    }

    const payload = {
        property: parseInt(propertyId), // Ensure it's a number
        number_of_occupants: parseInt(document.getElementById('occupants').value),
        is_active: true
    };

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
            alert("Agreement activated! Data sent to Ministry of Home Affairs and ZRA.");
            window.location.href = '/dashboard/';
        } else {
            const errorData = await response.json();
            console.error("Submission error:", errorData);
            alert("Error: " + JSON.stringify(errorData));
        }
    } catch (error) {
        console.error("Network error:", error);
        alert("Connection failed. Check if server is running.");
    }
});