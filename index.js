require('dotenv').config();

const express = require('express');
const { Client } = require("@googlemaps/google-maps-services-js");
const path = require('path');
const rutasPasajeros = require('./routes/pasajeros');
const rutasConductores = require('./routes/conductores');

const app = express();
const client = new Client({});

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

app.listen(3000, () => {
  console.log("✅ Servidor de MI-TAXI-APP corriendo en http://localhost:3000");
});