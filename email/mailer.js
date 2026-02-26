const passwordCorreo = process.env.EMAIL_PASS;
const nodemailer = require('nodemailer');

// 1. Configuramos el transporte (el "cartero")
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ryanruffen@gmail.com',
        // Usamos directamente la variable de entorno aquí
        pass: process.env.EMAIL_PASS 
    }
});

// 2. Definimos la función para enviar el correo
const enviarBienvenida = async (emailUsuario) => {
    // Verificación de seguridad rápida
    if (!process.env.EMAIL_PASS) {
        console.error("ERROR: No se encontró EMAIL_PASS en las variables de entorno.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"CAPI - Exprezzr" <ryanruffen@gmail.com>',
            to: emailUsuario,
            subject: "¡Bienvenido a CAPI!",
            text: "Hola, gracias por unirte a nuestra app de taxis.",
            html: "<b>Hola!</b><br>Gracias por unirte a la familia Exprezzr y CAPI."
        });

        console.log("✅ Correo enviado con éxito: %s", info.messageId);
    } catch (error) {
        console.error("❌ Error al enviar el correo:", error);
    }
};

module.exports = { enviarBienvenida };