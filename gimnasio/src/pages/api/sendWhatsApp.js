const shareOnWhatsApp = async () => {
  const phoneNumber = "8144384806"; // Sin +52, lo agregamos después. Cámbialo si es dinámico.
  const clientNameFormatted = clientName || "Cliente";
  
  // Mensaje de texto (el mismo que tienes)
  const message = `¡Hola ${clientNameFormatted}! 

Te comparto tu QR para que des asistencia al ingresar al gimnasio.
Tu QR contiene tu fecha de caducidad de tu mensualidad.
Al pasar la fecha de vencimiento se te cobrará $30 si aún sigues ingresando con fecha vencida.
Recuerda que es tu responsabilidad levantar todos tus instrumentos usados, recuerda que alguien más quiere usar lo que tú tienes en uso.
Así como contar con una toalla para limpiar dónde has estado.

¡Te esperamos para que sigas alcanzando tus metas en Gimnasio Strongest Villa Comaltitlán!`;
  
  try {
    // Genera la URL pública del QR usando la nueva API route
    const qrValue = encodeURIComponent(value); // value es el contenido del QR (JSON.stringify({ qrCode, pin }))
    const qrImageUrl = `/api/generate-qr?value=${qrValue}`;
    
    // Llama a tu API para enviar con Twilio
    const response = await fetch('/api/send-whatsapp', { // Cambia '/api/send-whatsapp' por tu endpoint real
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: `+52${phoneNumber}`, // Formato completo +52...
        clientName: clientNameFormatted,
        qrImage: qrImageUrl, // URL pública que Twilio fetchará
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar');
    }

    onShowAlert?.('success', `Código QR enviado a ${clientNameFormatted} por WhatsApp desde Twilio (${selectedColorScheme.name})`);
  } catch (error) {
    console.error('Error al enviar por Twilio:', error);
    onShowAlert?.('error', `Error al enviar el código QR por WhatsApp: ${error.message}`);
  }
};