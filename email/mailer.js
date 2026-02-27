const nodemailer = require('nodemailer');

// 1. Configuramos el transporte usando las variables del .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // <-- Dinámico (ryanruffen@gmail.com)
        pass: process.env.EMAIL_PASS  // <-- Tu clave de 16 letras
    }
});

// 2. Definimos la función para enviar el correo
const enviarBienvenida = async (emailUsuario) => {
    // Verificación de seguridad
    if (!process.env.EMAIL_PASS || !process.env.EMAIL_USER) {
        console.error("❌ ERROR: Faltan credenciales en el archivo .env (EMAIL_USER o EMAIL_PASS)");
        return;
    }

    try {
        const info = await transporter.sendMail({
            // El "from" ahora usa automáticamente tu correo del .env
            from: `"CAPI - Exprezzr" <${process.env.EMAIL_USER}>`,
            to: emailUsuario,
            subject: "¡Bienvenido a CAPI!",
            text: "Hola, gracias por unirte a nuestra app de taxis.",
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
                    <h2 style="color: #007bff;">¡Bienvenido a la familia Exprezzr!</h2>
                    <p>Gracias por unirte a <b>CAPI</b>. Tu cuenta ha sido activada con éxito.</p>
                    <hr>
                    <small>Este es un correo automático de soporte técnico.</small>
                </div>
            `
        });

        console.log("✅ Correo enviado con éxito: %s", info.messageId);
    } catch (error) {
        console.error("❌ Error de Nodemailer:", error.message);
    }
};

module.exports = { enviarBienvenida };