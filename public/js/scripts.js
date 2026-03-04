// --- CARRUSEL DE AUTOS ---
const slider = document.getElementById('carSlider');
let index = 0;

function rotateCars() {
    index++;
    // Cambiamos el límite para ajustarse a la cantidad de autos visibles
    if (index > 6) index = 0;
    const movePercentage = index * 25; 
    if (slider) slider.style.transform = `translateX(-${movePercentage}%)`;
}
setInterval(rotateCars, 3000);

// --- SESIÓN DE USUARIO ---
function checkUserSession() {
    const savedUser = localStorage.getItem('capi_user');
    const greetingArea = document.getElementById('userGreetingArea');
    const nameDisplay = document.getElementById('userNameDisplay');
    const formTitle = document.getElementById('formMainTitle');
    const navButtons = document.querySelector('.btn-sistema'); // Botón de Sign Up
    const loginLink = document.querySelector('a[onclick="openLoginModal()"]'); // Botón de Login

    if (savedUser) {
        const user = JSON.parse(savedUser);
        
        // 1. Mostrar saludo y nombre
        if (greetingArea) greetingArea.style.display = 'block';
        if (nameDisplay) nameDisplay.innerText = user.firstName.toUpperCase();
        
        // 2. Cambiar el título del formulario por algo más directo
        if (formTitle) formTitle.innerText = "Where are we going?";
        
        // 3. Ocultar el botón de Sign Up del Navbar (ya es usuario)
        if (navButtons) navButtons.style.display = 'none';

        // 4. Cambiar Login por Logout
        if (loginLink) {
            loginLink.innerText = "LOGOUT";
            loginLink.onclick = logout;
        }

        console.log("CAPI: Sesión activa de " + user.email);
    }
}
window.addEventListener('load', checkUserSession);

// Función para cerrar sesión
window.logout = function() {
    localStorage.removeItem('capi_user');
    window.location.reload();
};

// --- GOOGLE MAPS ---
let map, directionsService, directionsRenderer, userMarker;

window.initMap = function() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return; // Evita errores si no hay contenedor de mapa

    const startLocation = { lat: 42.28, lng: -71.71 };
    map = new google.maps.Map(mapElement, {
        zoom: 13, center: startLocation, disableDefaultUI: false,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map, polylineOptions: { strokeColor: "#f1c40f", strokeWeight: 6 }
    });

    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');

    if (originInput && destinationInput) {
        new google.maps.places.Autocomplete(originInput);
        new google.maps.places.Autocomplete(destinationInput);

        // --- EJECUTAR CALCULAR CON ENTER ---
        [originInput, destinationInput].forEach(input => {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById('calcFareBtn').click();
                }
            });
        });
    }
};

// --- BOTÓN DE GPS ---
document.getElementById('locateBtn')?.addEventListener('click', () => {
    const originInput = document.getElementById('origin');
    if (navigator.geolocation) {
        originInput.value = "Detectando ubicación...";
        navigator.geolocation.getCurrentPosition((position) => {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            new google.maps.Geocoder().geocode({ location: pos }, (results, status) => {
                if (status === "OK" && results[0]) {
                    originInput.value = results[0].formatted_address;
                    map.setCenter(pos);
                    map.setZoom(16);

                    if (userMarker) userMarker.setMap(null);
                    userMarker = new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: {
                            path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
                            fillColor: "#000000",
                            fillOpacity: 1,
                            strokeWeight: 1,
                            strokeColor: "#ffffff",
                            scale: 1,
                            anchor: new google.maps.Point(12, 12)
                        },
                        title: "My Location"
                    });
                }
            });
        });
    }
});

// --- BOTÓN CALCULAR TARIFA ---
document.getElementById('calcFareBtn')?.addEventListener('click', () => {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const priceResult = document.getElementById('priceResult');
    const priceDisplayArea = document.getElementById('priceDisplayArea');

    if (!origin || !destination) return showCapiToast("Please enter pickup and destination.", true);
    if (!directionsService) return showCapiToast("Map service not ready.", true);

    directionsService.route({
        origin: origin, destination: destination, travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(response);
            const miles = response.routes[0].legs[0].distance.value * 0.000621371;
            const finalPrice = 10.00 + (miles * 1.30);
            
            if (priceDisplayArea) priceDisplayArea.style.display = 'block';
            if (priceResult) priceResult.innerText = `$${finalPrice.toFixed(2)}`;
        } else {
            showCapiToast("Could not calculate route. Check addresses.", true);
        }
    });
});

// --- LÓGICA DE ACEPTAR Y PROGRAMAR VIAJE ---
let selectedRideType = 'URGENT'; // Valor por defecto

// 1. Al hacer clic en "Accept Ride"
document.getElementById('acceptRideBtn')?.addEventListener('click', () => {
    const scheduleArea = document.getElementById('rideSchedulingArea');
    const acceptBtn = document.getElementById('acceptRideBtn');
    
    if (scheduleArea) scheduleArea.style.display = 'block';
    if (acceptBtn) acceptBtn.style.display = 'none'; // Ocultamos el botón de aceptar para no duplicar
    
    // Simular clic en Urgente por defecto para estilo visual
    document.getElementById('btnUrgent')?.click();
});

// 2. Botones de Urgente vs Schedule
document.getElementById('btnUrgent')?.addEventListener('click', () => {
    selectedRideType = 'URGENT';
    document.getElementById('dateTimeContainer').style.display = 'none';
    
    // Estilos visuales (Activo/Inactivo)
    document.getElementById('btnUrgent').style.background = '#f4d03f';
    document.getElementById('btnUrgent').style.color = '#000';
    document.getElementById('btnSchedule').style.background = '#000';
    document.getElementById('btnSchedule').style.color = '#f4d03f';
});

document.getElementById('btnSchedule')?.addEventListener('click', () => {
    selectedRideType = 'SCHEDULED';
    document.getElementById('dateTimeContainer').style.display = 'block';
    
    // Estilos visuales
    document.getElementById('btnSchedule').style.background = '#f4d03f';
    document.getElementById('btnSchedule').style.color = '#000';
    document.getElementById('btnUrgent').style.background = '#000';
    document.getElementById('btnUrgent').style.color = '#f4d03f';
});

// 3. Confirmar Reserva y Enviar Email
document.getElementById('confirmBookingBtn')?.addEventListener('click', async () => {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const priceText = document.getElementById('priceResult').innerText;
    const dateTime = document.getElementById('rideDateTime').value;
    const user = JSON.parse(localStorage.getItem('capi_user') || '{}');

    if (selectedRideType === 'SCHEDULED' && !dateTime) {
        return showCapiToast("Please select a date and time.", true);
    }

    try {
        const res = await fetch('/api/book-ride', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ origin, destination, price: priceText, type: selectedRideType, time: dateTime, user })
        });
        const data = await res.json();
        if (res.ok) showCapiToast("Booking Request Sent! We will email you shortly.", false, 'success');
        else showCapiToast("Error booking ride.", true);
    } catch (err) {
        console.error(err);
        showCapiToast("Connection error.", true);
    }
});

// Función para ABRIR el modal desde el menú
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex'; // Primero lo mostramos
        setTimeout(() => {
            modal.classList.add('active'); // Luego activamos la animación
        }, 10);
        console.log("CAPI: Modal de Login abierto desde el menú");
    }
}

// Función para CERRAR el modal (la X y fuera del cuadro)
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active'); // Quitamos animación
        setTimeout(() => {
            modal.style.display = 'none'; // Al final ocultamos
        }, 300);
    }
}

// Cerrar si hacen clic en el fondo negro (fuera de la tarjeta)
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        closeLoginModal();
    }
}
function forgotPassword() {
    const email = document.getElementById('modalEmail').value;
    if (!email) return showCapiToast("Please enter your email first.", true);
    
    fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(r => r.json())
    .then(data => showCapiToast(data.message || data.error, !!data.error, data.error ? 'error' : 'success'));
}

// --- TOAST NOTIFICATION (Para Index y Services) ---
window.showCapiToast = function(msg, isError = false, type = 'info') {
    const toast = document.getElementById('capiToast');
    const message = document.getElementById('toastMessage');
    
    // Si no existe el contenedor de toast (ej. en services.html), usamos alert
    if (!toast || !message) return alert(msg); 

    message.innerText = msg;
    toast.className = 'capi-toast show';
    if (type === 'error' || isError) toast.classList.add('error');
    else if (type === 'success') toast.classList.add('success');
    
    setTimeout(() => toast.classList.remove('show'), 4000);
};

// --- MANUAL LOGIN ---
window.handleManualLogin = async function(event) {
    event.preventDefault();
    const email = document.getElementById('modalEmail').value;
    const password = document.getElementById('modalPassword').value;

    try {
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('capi_user', JSON.stringify(data.user));
            showCapiToast("Welcome back!", false, 'success');
            closeLoginModal();
            // Recargar para actualizar la UI (mostrar nombre en vez de botones)
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showCapiToast(data.error || "Login failed", true);
        }
    } catch (err) {
        console.error(err);
        showCapiToast("Connection error", true);
    }
};

// --- GOOGLE LOGIN RESPONSE (Para Index y Services) ---
window.handleCredentialResponse = function(response) {
    fetch('/auth/google', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ token: response.credential })
    })
    .then(r => r.json())
    .then(data => {
        if (data.user) {
            localStorage.setItem('capi_user', JSON.stringify(data.user));
            showCapiToast("Welcome back!", false, 'success');
            closeLoginModal();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showCapiToast(data.error || "Google login failed", true);
        }
    })
    .catch(err => {
        console.error(err);
        showCapiToast("Connection error", true);
    });
};

// --- FLATPICKR (CALENDARIO PREMIUM) ---
document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#rideDateTime", {
        enableTime: true,
        dateFormat: "Y-m-d H:i", // Formato limpio
        minDate: "today",
        disableMobile: true,
        closeOnSelect: true // Cierra automáticamente al seleccionar fecha
    });
});