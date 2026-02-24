const express = require('express');
const router = express.Router();

// Ruta para que el conductor vea viajes disponibles
// Se accede desde el navegador en: http://localhost:3000/conductores/disponibles
router.get('/disponibles', (req, res) => {
    res.json({
        mensaje: "Hola Ryan Ruffen, buscando viajes cercanos para el conductor...",
        estado: "Buscando",
        fecha: new Date().toLocaleString()
    });
});

// Ruta para ver el perfil del conductor (ejemplo adicional)
router.get('/perfil', (req, res) => {
    res.send('Perfil del conductor: Ryan Ruffen. Estado: Activo');
});

// ESTA LÍNEA VA AL FINAL: Es la que permite que index.js reconozca estas rutas
module.exports = router;