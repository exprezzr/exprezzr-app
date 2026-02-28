require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcrypt'); 
const { OAuth2Client } = require('google-auth-library'); 
const { enviarBienvenida } = require('./email/mailer');

// --- 1. MODELO DE USUARIO ACTUALIZADO ---
// Ahora incluye firstName, lastName y phone para CAPI
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String }, 
    password: { type: String, required: true },
    imagen: { type: String },
    fechaRegistro: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// REDIRECCIÓN A HTTPS (Producción)
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

// --- 2. CONEXIÓN MONGODB ATLAS ---
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log('------------------------------------');
    console.log('✅ MONGODB: Connected to Atlas');
    console.log('------------------------------------');
  })
  .catch(err => console.error('❌ MONGODB Error:', err));

// --- 3. CONFIGURACIÓN DE NODEMAILER ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para puerto 465
  auth: {
    user: process.env.EMAIL_USER, // Esto leerá support@exprezzr.com de tu .env
    pass: process.env.EMAIL_PASS  // Tu App Password
  }
});

// --- 4. RUTAS DE AUTENTICACIÓN ---

// Ver página de Sign Up
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// REGISTRO MANUAL CON ENVÍO DE EMAIL
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        
        // 1. Verificar si el usuario ya existe
        const existe = await User.findOne({ email });
        if (existe) return res.status(400).json({ error: "Email already in use." });

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Guardar en MongoDB Atlas
        const newUser = new User({ 
            firstName, 
            lastName, 
            email, 
            phone,
            password: hashedPassword 
        });
        await newUser.save();

        // 4. ENVIAR CORREO DE BIENVENIDA (support@exprezzr.com)
        const mailOptions = {
            from: `"Exprezzr Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to CAPI by Exprezzr!',
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 40px; text-align: center; border: 2px solid #f4d03f;">
                    <h1 style="color: #f4d03f; font-family: 'Orbitron', sans-serif;">WELCOME TO CAPI</h1>
                    <p style="font-size: 1.1rem;">Hello ${firstName},</p>
                    <p>Thank you for choosing Exprezzr. Your account is now active.</p>
                    <p>Experience the most exclusive transportation in Shrewsbury and Boston.</p>
                    <br>
                    <a href="http://localhost:3000" style="background-color: #f4d03f; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">BOOK YOUR FIRST RIDE</a>
                    <p style="margin-top: 30px; font-size: 0.8rem; color: #777;">&copy; 2026 Exprezzr LLC. All rights reserved.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log("❌ Email Error:", error);
            else console.log("📧 Welcome email sent to:", email);
        });

        res.status(201).json({ message: "Account created and welcome email sent!" });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// Registro/Login con Google (Ruta Actualizada)
app.post('/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        // Google nos da given_name (First) y family_name (Last)
        const { given_name, family_name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });
        
        if (!user) {
            // Si es nuevo, creamos el perfil con datos de Google
            user = new User({
                firstName: given_name,
                lastName: family_name,
                email: email,
                password: 'google-authenticated-user', 
                imagen: picture,
                phone: 'Not provided' // El teléfono se puede pedir después
            });
            await user.save();
        }
        
        res.json({ message: "Google Auth Success", user });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(400).json({ error: "Invalid Google Token" });
    }
});

// ======================================================
// PEGA EL NUEVO CÓDIGO AQUÍ (Línea aprox. 120)
// ======================================================
app.post('/update-phone', async (req, res) => {
    const { email, phone } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { email: email }, 
            { phone: phone }, 
            { new: true }
        );
        if (user) {
            res.status(200).json({ message: "Phone updated", user });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// --- 5. OTRAS RUTAS ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.json({
        status: "Online",
        engine: "Exprezzr CAPI Engine",
        support_email: process.env.EMAIL_USER, // Esto mostrará support@exprezzr.com
        timestamp: new Date().toLocaleString()
    });
});

// --- 6. ARRANQUE ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log('------------------------------------');
    console.log(`🚀 CAPI Server active on port ${PORT}`);
    console.log('------------------------------------');
});