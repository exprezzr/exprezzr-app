// 1. Function to switch between Login and Register
function setTab(type) {
    const tabs = document.querySelectorAll('.tab');
    const btn = document.getElementById('main-btn');
    const roleSelector = document.getElementById('roleSelector');
    const driverFields = document.getElementById('driverFields');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if(type === 'login') {
        tabs[0].classList.add('active');
        btn.innerText = 'Login to Account';
        roleSelector.style.display = 'none';
        driverFields.style.display = 'none';
    } else {
        tabs[1].classList.add('active');
        btn.innerText = 'Create New Account';
        roleSelector.style.display = 'flex';
        
        const isDriver = document.querySelector('input[name="role"]:checked')?.value === 'driver';
        driverFields.style.display = isDriver ? 'block' : 'none';
    }
}

// 2. Listener for changes in the Role
document.addEventListener('change', (e) => {
    if (e.target.name === 'role') {
        const driverFields = document.getElementById('driverFields');
        driverFields.style.display = e.target.value === 'driver' ? 'block' : 'none';
    }
});

// 3. Form Submission Logic
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    const roleInput = document.querySelector('input[name="role"]:checked');
    
    const isRegistering = document.getElementById('main-btn').innerText === 'Create New Account';
    const role = isRegistering ? roleInput.value : 'login_attempt';
    
    let registrationData = { email, password, role };

    if (isRegistering && role === 'driver') {
        const license = document.getElementById('licenseNumber').value;
        if (!license) return alert("License Number is required for Drivers");
        
        registrationData.licenseNumber = license;
        registrationData.vehicleModel = "Tesla Model Y"; 
    }

    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });
        const data = await response.json();
        alert(data.message || data.error);
    } catch (err) {
        console.error("Connection failed", err);
        alert("Server is not responding. Check if 'npm run dev' is running.");
    }
}); // <--- ESTA ES LA LLAVE QUE FALTABA

// 4. Google Maps Initialization (Pro-Style)
let map, taxiMarker;

function initMap() {
    const myPosition = { lat: 42.2959, lng: -71.7128 }; // Shrewsbury, MA

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: myPosition,
        styles: [
            { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#303030" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
        ]
    });

    taxiMarker = new google.maps.Marker({
        position: myPosition,
        map: map,
        title: "Exprezzr Unit - Tesla Model Y",
        icon: {
            url: "https://cdn-icons-png.flaticon.com/512/741/741407.png", 
            scaledSize: new google.maps.Size(40, 40)
        },
        animation: google.maps.Animation.DROP
    });
}