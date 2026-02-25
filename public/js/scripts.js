// --- CARRUSEL DE AUTOS ---
const slider = document.getElementById('carSlider');
let index = 0;

function rotateCars() {
    index++;
    if (index > 6) { // 10 total - 4 visible = 6 movements
        index = 0;
    }
    const movePercentage = index * 25; 
    slider.style.transform = `translateX(-${movePercentage}%)`;
}

setInterval(rotateCars, 3000);

// --- GOOGLE MAPS: RUTAS, AUTOCOMPLETADO Y COTIZADOR ---
let map;
let directionsService;
let directionsRenderer;
let originAutocomplete;
let destinationAutocomplete;

// AQUÍ ESTÁ LA SOLUCIÓN: Usamos window.initMap para que Google lo encuentre siempre
window.initMap = function() {
    // 1. Inicializar el mapa centrado en Shrewsbury
    const startLocation = { lat: 42.28, lng: -71.71 };
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: startLocation,
        // Estilos oscuros
        styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
        ]
    });

    // 2. Activar el trazado de rutas
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map); 

    // 3. Activar el autocompletado en los inputs
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    
    originInput.removeAttribute('readonly'); 

    originAutocomplete = new google.maps.places.Autocomplete(originInput);
    destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);

    originInput.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    destinationInput.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
};

// --- Botón de GPS (📍) ---
const locateBtn = document.getElementById('locateBtn');
locateBtn.addEventListener('click', () => {
    const originInput = document.getElementById('origin');
    
    if (navigator.geolocation) {
        originInput.value = "Detectando ubicación...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: pos }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        originInput.value = results[0].formatted_address;
                        map.setCenter(pos);
                        map.setZoom(15);
                    } else {
                        originInput.value = "Ubicación detectada (Coordenadas)";
                    }
                });
            },
            () => {
                alert("Error: Asegúrate de darle permisos de ubicación a tu navegador.");
                originInput.value = "";
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
});

// --- Botón Calcular Tarifa ---
const calcFareBtn = document.getElementById('calcFareBtn');
calcFareBtn.addEventListener('click', () => {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const priceResult = document.getElementById('priceResult');

    if (!origin || !destination || origin.includes("Detectando")) {
        alert("Por favor, ingresa un punto de origen válido y un destino.");
        return;
    }

    directionsService.route(
        {
            origin: origin,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (response, status) => {
            if (status === "OK") {
                // 1. Dibujamos la ruta en el mapa
                directionsRenderer.setDirections(response);
                
                // 2. Extraemos la distancia real que calculó Google Maps (viene en metros)
                const distanceInMeters = response.routes[0].legs[0].distance.value;
                
                // 3. Convertimos los metros a millas
                const distanceInMiles = distanceInMeters * 0.000621371;
                
                // 4. Tu fórmula de precios (Puedes cambiar estos números después)
                const baseFare = 5.00; // $5 dólares solo por iniciar el viaje
                const costPerMile = 2.50; // $2.50 dólares por cada milla recorrida
                
                // 5. Calculamos el total
                const finalPrice = baseFare + (distanceInMiles * costPerMile);
                
                // 6. Mostramos el resultado con solo 2 decimales (.toFixed(2))
                priceResult.style.display = 'block';
                priceResult.innerHTML = `Viaje estimado a destino: <span>$${finalPrice.toFixed(2)}</span>`;
            } else {
                
                 alert("No se pudo trazar la ruta. Verifica que las direcciones sean correctas.");
            }
        }
    );
});