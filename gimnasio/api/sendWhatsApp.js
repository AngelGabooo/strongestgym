const twilio = require('twilio');

export default async function handler(req, res) {
  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { phoneNumber, clientName, qrImage, message } = req.body;

  // Validar datos recibidos
  if (!phoneNumber || !clientName || !qrImage || !message) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  // Configuración de Twilio (credenciales desde variables de entorno)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Configuración de Twilio incompleta' });
  }

  const client = twilio(accountSid, authToken);

  try {
    // Enviar mensaje con Twilio
    await client.messages.create({
      from: fromNumber,
      to: `whatsapp:+52${phoneNumber}`,
      body: message,
      mediaUrl: [qrImage],
    });

    return res.status(200).json({ success: true, message: `Código QR enviado a ${clientName}` });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return res.status(500).json({ error: `Error al enviar el código QR: ${error.message}` });
  }
}