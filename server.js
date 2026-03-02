require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const bcrypt = require('bcryptjs'); 
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library'); 

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- 1. MIDDLEWARE ---
app.use(express.json());
app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONEXIÓN MONGODB ATLAS ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MONGODB: Connected to Atlas'))
  .catch(err => console.error('❌ MONGODB Error:', err));

// --- 3. MODELOS DE DATOS ---
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: 'Pending' }, 
    password: { type: String }, 
    imagen: { type: String },
    role: { type: String, default: 'client' },
    fechaRegistro: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// --- 4. CONFIGURACIÓN DE CORREO (NODEMAILER) ---
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

// LOGIN MANUAL
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });
        if (!user.password) return res.status(400).json({ error: "Please use Google Login" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// FORGOT PASSWORD (DINÁMICO PARA LOCAL Y CLOUD)
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "No account found" });

        // LOGICA DINÁMICA: Detecta si es HTTPS (Cloud) o HTTP (Local) y el host actual
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;
        const host = req.get('host');
        const resetLink = `${protocol}://${host}/reset-password?email=${email}`;

        const mailOptions = {
            from: `"CAPI Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your CAPI Password',
            html: `
                <div style="background:#000; color:#fff; padding:30px; border:2px solid #f4d03f; text-align:center; font-family:sans-serif;">
                    <img src="https://tu-url-de-logo.com/logo.png" alt="Exprezzr" style="height:50px;">
                    <h1 style="color:#f4d03f; font-family:'Orbitron';">PASSWORD RECOVERY</h1>
                    <p>Hello ${user.firstName}, click the button below to set a new manual password.</p>
                    <a href="${resetLink}" style="display:inline-block; padding:15px 25px; background:#f4d03f; color:#000; text-decoration:none; font-weight:bold; border-radius:50px; margin-top:20px;">RESET PASSWORD</a>
                    <p style="margin-top:20px; font-size:0.8rem; color:#888;">This link belongs to Exprezzr LLC Security.</p>
                </div>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Recovery email sent!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send email." });
    }
});

// ACTUALIZAR CONTRASEÑA (SET PASSWORD)
app.post('/set-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findOneAndUpdate({ email }, { password: hashedPassword });
        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Error updating password" });
    }
});

// --- 6. RUTAS DE PÁGINAS (HTML) ---
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 7. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CAPI Server running on port ${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
});