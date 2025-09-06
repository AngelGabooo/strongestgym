const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { phoneNumber, clientName, qrImage, message } = req.body;

  if (!phoneNumber || !qrImage || !message) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos' });
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    // Convertir la URL relativa a absoluta
    const absoluteQrImageUrl = `${req.headers.origin}${qrImage}`;
    
    const twilioMessage = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // ej: whatsapp:+14155238886
      to: phoneNumber, // ej: whatsapp:+528144384826
      body: message,
      mediaUrl: [absoluteQrImageUrl], // URL absoluta para Twilio
    });

    res.status(200).json({ success: true, messageSid: twilioMessage.sid });
  } catch (error) {
    console.error('Error enviando mensaje con Twilio:', error);
    res.status(500).json({ error: `Error al enviar mensaje: ${error.message}` });
  }
}