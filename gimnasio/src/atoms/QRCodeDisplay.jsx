import PropTypes from 'prop-types';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useRef, useMemo } from 'react';
import { ArrowDownTrayIcon, ShareIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const QRCodeDisplay = ({ value, size = 200, className = '', withDownload = false, withWhatsApp = false, clientName = '', colorScheme = 'auto', ...props }) => {
  const qrRef = useRef(null);
  
  if (!value) return null;

  // Esquemas de colores para QR codes únicos
  const colorSchemes = [
    { fg: '#1F2937', bg: '#F3F4F6', gradient: 'from-blue-600 to-blue-800', name: 'Azul' },
    { fg: '#7C2D12', bg: '#FEF7FF', gradient: 'from-orange-600 to-orange-800', name: 'Naranja' },
    { fg: '#14532D', bg: '#F0FDF4', gradient: 'from-green-600 to-green-800', name: 'Verde' },
    { fg: '#7C2D12', bg: '#FEF2F2', gradient: 'from-red-600 to-red-800', name: 'Rojo' },
    { fg: '#581C87', bg: '#FAF5FF', gradient: 'from-purple-600 to-purple-800', name: 'Púrpura' },
    { fg: '#0F172A', bg: '#F1F5F9', gradient: 'from-gray-600 to-gray-800', name: 'Gris' },
    { fg: '#92400E', bg: '#FFFBEB', gradient: 'from-yellow-600 to-yellow-800', name: 'Amarillo' },
    { fg: '#BE123C', bg: '#FFF1F2', gradient: 'from-rose-600 to-rose-800', name: 'Rosa' },
  ];

  // Generar color único basado en el valor del QR o nombre del cliente
  const selectedColorScheme = useMemo(() => {
    if (colorScheme === 'auto') {
      const hash = (value + clientName).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return colorSchemes[Math.abs(hash) % colorSchemes.length];
    }
    return colorSchemes.find(scheme => scheme.name.toLowerCase() === colorScheme.toLowerCase()) || colorSchemes[0];
  }, [value, clientName, colorScheme]);

  const downloadQRCode = (format = 'png') => {
    if (!qrRef.current) return;
    
    if (format === 'svg') {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = `QR_${clientName || 'Cliente'}_${selectedColorScheme.name}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    } else {
      const canvas = qrRef.current.querySelector('canvas');
      if (!canvas) return;
      
      // Crear canvas de alta resolución
      const highResCanvas = document.createElement('canvas');
      const scaleFactor = 4; // Factor de escala para mayor calidad
      const highResSize = size * scaleFactor;
      
      highResCanvas.width = highResSize;
      highResCanvas.height = highResSize;
      
      const ctx = highResCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      
      // Escalar la imagen original
      ctx.drawImage(canvas, 0, 0, highResSize, highResSize);
      
      const pngUrl = highResCanvas
        .toDataURL("image/png", 1.0) // Máxima calidad
        .replace("image/png", "image/octet-stream");
      
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${clientName || 'Cliente'}_${selectedColorScheme.name}_HD.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const shareOnWhatsApp = async () => {
    const phoneNumber = "528144384806";
    const clientNameFormatted = clientName || "Cliente";
    
    // Mensaje de texto que se enviará primero
    const message = `¡Hola ${clientNameFormatted}! 

Te comparto tu QR para que des asistencia al ingresar al gimnasio.
Tu QR contiene tu fecha de caducidad de tu mensualidad.
Al pasar la fecha de vencimiento se te cobrará $30 si aún sigues ingresando con fecha vencida.
Recuerda que es tu responsabilidad levantar todos tus instrumentos usados, recuerda que alguien más quiere usar lo que tú tienes en uso.
Así como contar con una toalla para limpiar dónde has estado.

¡Te esperamos para que sigas alcanzando tus metas en Gimnasio Strongest Villa Comaltitlán!`;
    
    try {
      const originalCanvas = qrRef.current.querySelector('canvas');
      if (!originalCanvas) return;
      
      // Crear canvas de máxima resolución para WhatsApp
      const combinedCanvas = document.createElement('canvas');
      const scaleFactor = 6; // Aumentado a 6x para máxima calidad
      const padding = 25 * scaleFactor;
      const nameHeight = 45 * scaleFactor;
      const logoHeight = 35 * scaleFactor;
      const highResSize = size * scaleFactor;
      
      combinedCanvas.width = highResSize + padding * 2;
      combinedCanvas.height = highResSize + nameHeight + logoHeight + padding * 3;
      
      const ctx = combinedCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      
      // Fondo con gradiente
      const gradient = ctx.createLinearGradient(0, 0, combinedCanvas.width, combinedCanvas.height);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, selectedColorScheme.bg);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);
      
      // Sombra para el QR
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10 * scaleFactor;
      ctx.shadowOffsetX = 5 * scaleFactor;
      ctx.shadowOffsetY = 5 * scaleFactor;
      
      // Dibujar QR en alta resolución
      ctx.drawImage(originalCanvas, padding, padding + logoHeight, highResSize, highResSize);
      
      // Resetear sombra
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Título del gimnasio - texto más legible
      ctx.fillStyle = selectedColorScheme.fg;
      ctx.font = `bold ${14 * scaleFactor}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('GIMNASIO STRONGEST', combinedCanvas.width / 2, padding + (logoHeight * 0.6));
      
      // Nombre del cliente - texto más pequeño y legible
      ctx.fillStyle = selectedColorScheme.fg;
      ctx.font = `bold ${12 * scaleFactor}px Arial`;
      ctx.textAlign = 'center';
      const clientY = highResSize + padding * 2 + logoHeight + (nameHeight * 0.5);
      
      // Dividir nombre largo en múltiples líneas si es necesario
      const maxWidth = highResSize * 0.8;
      const words = clientNameFormatted.toUpperCase().split(' ');
      let line = '';
      let lineY = clientY;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line.trim(), combinedCanvas.width / 2, lineY);
          line = words[i] + ' ';
          lineY += 15 * scaleFactor;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), combinedCanvas.width / 2, lineY);
      
      // Color del QR - texto más pequeño
      ctx.fillStyle = selectedColorScheme.fg;
      ctx.font = `${10 * scaleFactor}px Arial`;
      ctx.fillText(`QR ${selectedColorScheme.name}`, combinedCanvas.width / 2, lineY + (18 * scaleFactor));
      
      // Convertir a blob de alta calidad
      combinedCanvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `QR_${clientNameFormatted}_${selectedColorScheme.name}_HD.png`, { type: 'image/png' });
          
          // Primero enviar el mensaje de texto
          const encodedMessage = encodeURIComponent(message);
          const whatsappTextUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
          
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              // PRIMERO: Compartir la imagen del QR
              await navigator.share({
                title: `Código QR HD - ${clientNameFormatted}`,
                files: [file]
              });
              
              // SEGUNDO: Esperar un momento y luego enviar el texto
              setTimeout(() => {
                window.open(whatsappTextUrl, '_blank');
                alert('✅ Imagen QR enviada\n📝 Ahora se abre WhatsApp para enviar el mensaje de texto');
              }, 1500);
              
            } catch (shareError) {
              console.error('Error sharing image:', shareError);
              // Fallback: descargar imagen y abrir WhatsApp
              const imageUrl = URL.createObjectURL(blob);
              const downloadLink = document.createElement("a");
              downloadLink.href = imageUrl;
              downloadLink.download = `QR_${clientNameFormatted}_${selectedColorScheme.name}_HD.png`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              setTimeout(() => URL.revokeObjectURL(imageUrl), 100);
              
              setTimeout(() => {
                window.open(whatsappTextUrl, '_blank');
                alert(`
📱 Imagen HD descargada
✅ WhatsApp abierto

📋 PASOS A SEGUIR:
1. Adjunta PRIMERO la imagen descargada en WhatsApp
2. Después envía el mensaje de texto que aparece
                `);
              }, 1000);
            }
          } else {
            // Fallback: abrir WhatsApp con texto y descargar imagen
            window.open(whatsappTextUrl, '_blank');
            
            setTimeout(() => {
              const imageUrl = URL.createObjectURL(blob);
              const downloadLink = document.createElement("a");
              downloadLink.href = imageUrl;
              downloadLink.download = `QR_${clientNameFormatted}_${selectedColorScheme.name}_HD.png`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              setTimeout(() => URL.revokeObjectURL(imageUrl), 100);
              
              alert(`
✅ WhatsApp abierto con el mensaje de texto.
📱 Imagen HD descargada automáticamente.

📋 INSTRUCCIONES:
1. Envía primero el mensaje de texto que aparece en WhatsApp
2. Luego adjunta la imagen descargada como un segundo mensaje
3. La imagen tiene calidad HD y color ${selectedColorScheme.name}
              `);
            }, 1000);
          }
        }
      }, 'image/png', 1.0); // Máxima calidad
      
    } catch (error) {
      console.error('Error al compartir:', error);
      // Fallback simple
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      alert(`
❌ Error al procesar la imagen automáticamente.
✅ WhatsApp abierto con el mensaje de texto.

Por favor, genera el QR nuevamente e intenta la descarga manual.
      `);
    }
  };

  return (
    <div 
      className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-xl border border-red-800/50 shadow-lg shadow-red-900/30 w-full overflow-hidden ${className}`} 
      {...props} 
      ref={qrRef}
    >
      {/* Fondo decorativo que cubre todo */}
      <div className={`absolute inset-0 bg-gradient-to-r ${selectedColorScheme.gradient.replace('600', '600/10').replace('800', '800/5')}`}></div>
      
      {/* Contenido con padding interno */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full p-4">
        {/* Header */}
        <div className="mb-3 text-center w-full">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <QrCodeIcon className={`w-5 h-5 text-${selectedColorScheme.gradient.split(' ')[0].replace('from-', '').replace('-600', '-500')} animate-pulse`} />
            <h3 className="text-base font-bold text-white">Código QR HD</h3>
          </div>
          <p className="text-sm text-gray-300">Acceso para {clientName || 'Cliente'}</p>
          <p className="text-xs text-gray-400">Color: {selectedColorScheme.name} • Alta Resolución</p>
        </div>

        {/* QR Code Container */}
        <div className={`p-3 bg-gradient-to-br ${selectedColorScheme.bg === '#FFFFFF' ? 'from-white to-gray-50' : `from-white to-[${selectedColorScheme.bg}]`} rounded-xl shadow-xl shadow-red-500/25 border-3 border-red-600/40 mb-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
          <QRCodeSVG 
            value={value} 
            size={size} 
            level="H" // Máximo nivel de corrección de errores
            includeMargin={true} 
            bgColor={selectedColorScheme.bg} 
            fgColor={selectedColorScheme.fg} 
            className="block drop-shadow-sm"
          />
          <QRCodeCanvas 
            value={value} 
            size={size} 
            level="H" // Máximo nivel de corrección de errores
            includeMargin={true} 
            bgColor={selectedColorScheme.bg} 
            fgColor={selectedColorScheme.fg} 
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        {(withDownload || withWhatsApp) && (
          <div className="flex flex-wrap gap-2 justify-center mb-3 w-full">
            {withDownload && (
              <>
                <button
                  onClick={() => downloadQRCode('png')}
                  className={`group flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gradient-to-r ${selectedColorScheme.gradient} text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95`}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  PNG HD
                </button>
                <button
                  onClick={() => downloadQRCode('svg')}
                  className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg border border-red-600/30 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  SVG
                </button>
              </>
            )}
            {withWhatsApp && (
              <button
                onClick={shareOnWhatsApp}
                className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <ShareIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                WhatsApp HD
              </button>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center w-full space-y-1">
          <p className="text-sm text-gray-300 font-medium">Escanea con tu móvil</p>
          <p className="text-sm text-red-400 font-bold">Gimnasio Strongest</p>
          <p className="text-xs text-gray-500">Villa Comaltitlán • Calidad HD</p>
        </div>
      </div>
    </div>
  );
};

QRCodeDisplay.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  withDownload: PropTypes.bool,
  withWhatsApp: PropTypes.bool,
  clientName: PropTypes.string,
  colorScheme: PropTypes.oneOf(['auto', 'azul', 'naranja', 'verde', 'rojo', 'púrpura', 'gris', 'amarillo', 'rosa']),
};

export default QRCodeDisplay;