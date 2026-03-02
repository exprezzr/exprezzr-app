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

    if (savedUser) {
        const user = JSON.parse(savedUser);
        
        // 1. Mostrar saludo y nombre
        if (greetingArea) greetingArea.style.display = 'block';
        if (nameDisplay) nameDisplay.innerText = user.firstName.toUpperCase();
        
        // 2. Cambiar el título del formulario por algo más directo
        if (formTitle) formTitle.innerText = "Where are we going?";
        
        // 3. Ocultar el botón de Sign Up del Navbar (ya es usuario)
        if (navButtons) navButtons.style.display = 'none';
        console.log("CAPI: Sesión activa de " + user.email);
    }
}
window.addEventListener('load', checkUserSession);

// --- GOOGLE MAPS ---
let map, directionsService, directionsRenderer;

window.initMap = function() {
    const startLocation = { lat: 42.28, lng: -71.71 };
    map = new google.maps.Map(document.getElementById("map"), {
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

    if (!origin || !destination) return alert("Ingresa origen y destino.");

    directionsService.route({
        origin: origin, destination: destination, travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(response);
            const miles = response.routes[0].legs[0].distance.value * 0.000621371;
            const finalPrice = 10.00 + (miles * 1.30);
            priceResult.style.display = 'block';
            priceResult.innerHTML = `Viaje estimado: <span>$${finalPrice.toFixed(2)}</span>`;
        }
    });
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
    if (!email) return alert("Please enter your email first.");
    
    fetch('/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(r => r.json())
    .then(data => alert(data.message || data.error));
}