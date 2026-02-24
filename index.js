require('dotenv').config();

const express = require('express');
const { Client } = require("@googlemaps/google-maps-services-js");
const mongoose = require('mongoose');
const Viaje = require('./models/Viaje');
const path = require('path');
const rutasPasajeros = require('./routes/pasajeros');
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/taxi-app')
.then(() => console.log('✅ Base de datos conectada'))
.catch(err => console.error('❌ Error de conexión:', err));
const rutasConductores = require('./routes/conductores');

const app = express();
const client = new Client({});
app.use(express.json());
// Para que Node pueda encontrar tu index.html dentro de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use('/pasajeros', rutasPasajeros);
app.use('/conductores', rutasConductores);

app.get('/api/autocomplete', async (req, res) => {
  try {
    const response = await client.placeAutocomplete({
      params: {
        input: req.query.input,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'es',
      },
    });
    res.json(response.data.predictions);
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});
// Ruta para que el pasajero guarde su pedido de taxi
app.post('/api/viajes', async (req, res) => {
    try {
        const nuevoViaje = new Viaje({
            destino: req.body.destino,
            pasajero: "Ryan Ruffen" 
        });
        await nuevoViaje.save();
        res.status(201).json({ mensaje: 'Viaje guardado con éxito', viaje: nuevoViaje });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo guardar el viaje' });
    }
});
app.listen(3000, () => {
  console.log("✅ Servidor de MI-TAXI-APP corriendo en http://localhost:3000");
});