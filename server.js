require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

const User = require('./models/User');
const Driver = require('./models/Driver');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// SINGLE Connection Block
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('--- EXPREZZR DATABASE CONNECTED SUCCESSFULLY ---'))
    .catch(err => console.error('Database connection error:', err.message));

app.post('/api/register', async (req, res) => {
    const { email, password, role, licenseNumber } = req.body;

    try {
        if (role === 'driver') {
            const newDriver = new Driver({ 
                email, 
                password, 
                license: licenseNumber, 
                auto: "Tesla Model Y" 
            });
            await newDriver.save();
            return res.status(201).json({ message: 'Welcome to the Exprezzr Fleet! Driver registered.' });
        } else {
            const newUser = new User({ email, password });
            await newUser.save();
            return res.status(201).json({ message: 'Passenger account created successfully!' });
        }
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'This email is already in our system.' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Exprezzr Server active on Port ${PORT}`));