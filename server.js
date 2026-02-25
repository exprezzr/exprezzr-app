require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// 1. Import your models
const User = require('./models/User');
const Driver = require('./models/Driver');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Exprezzr Database Connected Successfully'))
    .catch(err => console.log('Database Connection Error:', err));

// 2. Updated Registration Route
app.post('/api/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        if (role === 'driver') {
            // Logic for Driver
            const newDriver = new Driver({ email, password });
            await newDriver.save();
            return res.status(201).json({ message: 'Driver registered successfully!' });
        } else {
            // Logic for Passenger (User)
            const newUser = new User({ email, password });
            await newUser.save();
            return res.status(201).json({ message: 'Passenger registered successfully!' });
        }
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'This email is already registered.' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Exprezzr Server running on port ${PORT}`));