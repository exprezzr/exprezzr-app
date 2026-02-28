require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcrypt'); 
const { OAuth2Client } = require('google-auth-library'); 

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- 1. MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONEXIÓN MONGODB ATLAS ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MONGODB: Connected to Atlas'))
  .catch(err => console.error('❌ MONGODB Error:', err));

// --- 3. MODELO DE USUARIO ---
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: 'Pending' }, 
    password: { type: String, required: true },
    imagen: { type: String },
    fechaRegistro: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- 4. CONFIGURACIÓN DE CORREO (support@exprezzr.com) ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// --- 5. RUTAS DE AUTENTICACIÓN ---

// Registro Manual (CORREGIDO PARA EVITAR PANTALLA BLANCA)
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword
        });

        await newUser.save();

        // Enviar Email (en segundo plano)
        const mailOptions = {
            from: `"Exprezzr Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to CAPI by Exprezzr!',
            html: `<div style="background:#000;color:#fff;padding:20px;text-align:center;border:2px solid #f4d03f;">
                   <h1 style="color:#f4d03f;">WELCOME TO CAPI</h1>
                   <p>Experience the best luxury transportation.</p></div>`
        };
        transporter.sendMail(mailOptions).catch(e => console.log("Email error:", e));

        // RESPUESTA JSON OBLIGATORIA
        return res.status(201).json({ message: "Account created successfully!" });

    } catch (err) {
        console.error("❌ Register Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Autenticación con Google
app.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const { given_name, family_name, email, picture } = ticket.getPayload();
        let user = await User.findOne({ email });
        
        if (!user) {
            user = new User({
                firstName: given_name,
                lastName: family_name,
                email: email,
                password: 'google-authenticated-user-' + Math.random(), 
                imagen: picture,
                phone: 'Pending'
            });
            await user.save();
        }
        res.json({ message: "Success", user });
    } catch (error) {
        res.status(400).json({ error: "Invalid Token" });
    }
});

// Actualizar Teléfono
app.post('/update-phone', async (req, res) => {
    const { email, phone } = req.body;
    try {
        const user = await User.findOneAndUpdate({ email }, { phone }, { new: true });
        if (user) res.status(200).json({ message: "Phone updated", user });
        else res.status(404).json({ error: "User not found" });
    } catch (error) {
        res.status(500).json({ error: "Error updating phone" });
    }
});

// --- 6. RUTAS DE PÁGINAS ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

// --- 7. ARRANQUE ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CAPI SERVER ACTIVE: PORT ${PORT}`);
});