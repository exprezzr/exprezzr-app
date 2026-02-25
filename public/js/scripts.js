// --- CONFIGURACIÓN DEL CARRUSEL DE AUTOS ---
// Este bloque controla el movimiento automático de la lista de vehículos.
const slider = document.getElementById('carSlider');
let index = 0;

function rotateCars() {
    index++;
    // Si tenemos 10 autos y mostramos 4, solo hay 6 posiciones de movimiento (10-4=6).
    if (index > 6) { 
        index = 0;
    }
    const movePercentage = index * 25; 
    if (slider) {
        slider.style.transform = `translateX(-${movePercentage}%)`;
    }
}

// Cambia de auto cada 3 segundos.
setInterval(rotateCars, 3000);

// --- LÓGICA DE GOOGLE MAPS: RUTAS Y COTIZADOR ---
let map;
let directionsService;
let directionsRenderer;

// Definimos initMap en el objeto window para que el API de Google lo encuentre al cargar.
window.initMap = function() {
    // 1. Inicializar el mapa centrado en Shrewsbury, MA
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

    // 2. Configurar el servicio de rutas y el renderizador (línea visual en el mapa).
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        polylineOptions: {
            strokeColor: "#f1c40f", // Color amarillo para la ruta
            strokeWeight: 6
        }
    });

    // 3. Activar Autocompletado en los cuadros de texto.
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');

    if (originInput && destinationInput) {
        new google.maps.places.Autocomplete(originInput);
        new google.maps.places.Autocomplete(destinationInput);
    }
};

// --- BOTÓN DE GPS (DETECCIÓN DE UBICACIÓN) ---
const locateBtn = document.getElementById('locateBtn');
if (locateBtn) {
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
                            map.setZoom(16);
                        } else {
                            originInput.value = "Ubicación detectada (Coordenadas)";
                        }
                    });
                },
                () => {
                    alert("Error: Por favor permite el acceso al GPS en tu navegador.");
                    originInput.value = "";
                }
            );
        } else {
            alert("Tu navegador no soporta geolocalización.");
        }
    });
}

// --- BOTÓN CALCULAR TARIFA ($10 BASE + $1.30 MILLA) ---
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

        directionsService.route(
            {
                origin: origin,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
                if (status === "OK") {
                    // Dibujar la ruta en el mapa.
                    directionsRenderer.setDirections(response);
                    
                    // Obtener distancia en metros y convertir a millas.
                    const distanceMeters = response.routes[0].legs[0].distance.value;
                    const distanceMiles = distanceMeters * 0.000621371;
                    
                    // FÓRMULA DE PRECIOS DE EXPREZZR
                    const baseFare = 10.00;
                    const costPerMile = 1.30;
                    const finalPrice = baseFare + (distanceMiles * costPerMile);
                    
                    // Mostrar resultado con formato de moneda.
                    priceResult.style.display = 'block';
                    priceResult.innerHTML = `Viaje estimado: <span>$${finalPrice.toFixed(2)}</span>`;
                } else {
                    alert("No se pudo trazar la ruta. Verifica las direcciones.");
                }
            }
        );
    });
}