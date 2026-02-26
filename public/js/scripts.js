// --- CONFIGURACIÓN DEL CARRUSEL DE AUTOS ---
const slider = document.getElementById('carSlider');
let index = 0;

function rotateCars() {
    index++;
    if (index > 6) { 
        index = 0;
    }
    const movePercentage = index * 25; 
    if (slider) {
        slider.style.transform = `translateX(-${movePercentage}%)`;
    }
}
setInterval(rotateCars, 3000);

// --- LÓGICA DE GOOGLE MAPS ---
let map;
let directionsService;
let directionsRenderer;

window.initMap = function() {
    const startLocation = { lat: 42.28, lng: -71.71 };
    
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 13,
        center: startLocation,
        disableDefaultUI: false,
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: { strokeColor: "#f1c40f", strokeWeight: 6 }
    });

    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');

    if (originInput && destinationInput) {
        new google.maps.places.Autocomplete(originInput);
        new google.maps.places.Autocomplete(destinationInput);

        // --- SOLUCIÓN: EJECUTAR CON ENTER ---
        // Escuchamos el teclado en ambos campos de texto
        [originInput, destinationInput].forEach(input => {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault(); // Evita que la página se recargue
                    document.getElementById('calcFareBtn').click(); // Simula el clic en el botón
                }
            });
        });
    }
};

// --- BOTÓN DE GPS ---
const locateBtn = document.getElementById('locateBtn');
if (locateBtn) {
    locateBtn.addEventListener('click', () => {
        const originInput = document.getElementById('origin');
        if (navigator.geolocation) {
            originInput.value = "Detectando ubicación...";
            navigator.geolocation.getCurrentPosition((position) => {
                const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        originInput.value = results[0].formatted_address;
                        map.setCenter(pos);
                        map.setZoom(16);
                    }
                });
            });
        }
    });
}

// --- COTIZADOR DE TARIFA ---
const calcFareBtn = document.getElementById('calcFareBtn');
if (calcFareBtn) {
    calcFareBtn.addEventListener('click', () => {
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        const priceResult = document.getElementById('priceResult');

        if (!origin || !destination || origin.includes("Detectando")) {
            alert("Por favor, ingresa un punto de origen y un destino.");
            return;
        }

        directionsService.route({
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        }, (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                const distanceMeters = response.routes[0].legs[0].distance.value;
                const distanceMiles = distanceMeters * 0.000621371;
                
                const baseFare = 10.00;
                const costPerMile = 1.30;
                const finalPrice = baseFare + (distanceMiles * costPerMile);
                
                priceResult.style.display = 'block';
                priceResult.innerHTML = `Viaje estimado: <span>$${finalPrice.toFixed(2)}</span>`;
            } else {
                alert("No se pudo calcular la ruta.");
            }
        });
    });
}
