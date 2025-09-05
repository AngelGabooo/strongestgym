const QRCode = require('qrcode');

export default async function handler(req, res) {
  const { value } = req.query;

  if (!value) {
    return res.status(400).end('Falta el parámetro "value"');
  }

  try {
    const buffer = await QRCode.toBuffer(value, {
      type: 'png',
      errorCorrectionLevel: 'H', // Alto nivel de corrección para mejor escaneo
      scale: 8, // Alta resolución
      color: { dark: '#000000', light: '#FFFFFF' } // Colores básicos; puedes personalizar
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename=qr.png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora para optimizar
    res.send(buffer);
  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).end('Error interno al generar el QR');
  }
}