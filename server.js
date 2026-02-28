require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcrypt'); 
const { OAuth2Client } = require('google-auth-library'); 

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- 1. MODELO DE USUARIO ---
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

// --- 2. MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. CONEXIÓN MONGODB ATLAS ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MONGODB: Connected to Atlas'))
  .catch(err => console.error('❌ MONGODB Error:', err));

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

// REGISTRO MANUAL (Lógica integrada por Gemini)
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

        // Verificar si el usuario ya existe
        const existe = await User.findOne({ email });
        if (existe) {
            return res.status(400).json({ error: "Email already in use." });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Guardar en MongoDB
        const newUser = new User({ 
            firstName, 
            lastName, 
            email, 
            phone, 
            password: hashedPassword 
        });
        await newUser.save();

        // Enviar Email de Bienvenida
        const mailOptions = {
            from: `"Exprezzr Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to CAPI by Exprezzr!',
            html: `
                <div style="background-color: #000; color: #fff; padding: 40px; text-align: center; border: 2px solid #f4d03f; font-family: Arial;">
                    <h1 style="color: #f4d03f;">WELCOME TO CAPI</h1>
                    <p>Hello ${firstName}, your executive account is now active.</p>
                    <p>Experience premium transportation in Shrewsbury and Boston.</p>
                </div>`
        };

        transporter.sendMail(mailOptions).catch(err => console.log("📧 Mail error:", err));

        // Respuesta JSON (Evita pantalla blanca)
        return res.status(201).json({ message: "Account created successfully!" });

    } catch (err) {
        console.error("❌ Register Error:", err);
        return res.status(500).json({ error: "Internal server error during registration" });
    }
});

// Autenticación con Google
app.post('/auth/google', async (req, res) => {
    const { token } = req.body;
    try {
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
                password: 'google-authenticated-user', 
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
        if (user) {
            res.status(200).json({ message: "Phone updated", user });
        } else {
            res.status(404).json({ error: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error updating phone" });
    }
});

// --- 6. RUTAS DE PÁGINAS ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.get('/status', (req, res) => {
    res.json({
        status: "Online",
        engine: "Exprezzr CAPI Engine",
        support: process.env.EMAIL_USER
    });
});

// --- 7. ARRANQUE ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(`🚀 CAPI SERVER ACTIVE: PORT ${PORT}`);
    console.log(`📧 SUPPORT EMAIL: ${process.env.EMAIL_USER}`);
    console.log('====================================');
});