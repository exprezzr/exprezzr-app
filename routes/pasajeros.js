const express = require('express');
const router = express.Router();

// Ruta para que el pasajero pida un taxi
router.get('/pedir', (req, res) => {

    res.send('Buscando el taxi más cercano para Ryan Ruffen...');
});

module.exports = router;