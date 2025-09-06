import PropTypes from 'prop-types';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useRef, useMemo } from 'react';
import { ArrowDownTrayIcon, ShareIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const QRCodeDisplay = ({ value, size = 200, className = '', withDownload = false, withWhatsApp = false, clientName = '', phone = '', colorScheme = 'auto', onShowAlert, ...props }) => {
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
      if (!svg) {
        onShowAlert?.('error', 'Error al generar el código QR en formato SVG');
        return;
      }
      
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

      onShowAlert?.('success', `Código QR de ${clientName || 'Cliente'} descargado en formato SVG (${selectedColorScheme.name})`);
    } else {
      const canvas = qrRef.current.querySelector('canvas');
      if (!canvas) {
        onShowAlert?.('error', 'Error al generar el código QR en formato PNG');
        return;
      }
      
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

      onShowAlert?.('success', `Código QR de ${clientName || 'Cliente'} descargado en formato PNG HD (${selectedColorScheme.name})`);
    }
  };

  const shareOnWhatsApp = async () => {
    if (!phone) {
      onShowAlert?.('error', 'No se proporcionó un número de teléfono');
      return;
    }

    const clientNameFormatted = clientName || "Cliente";
    
    // Mensaje de texto que se enviará
    const message = `¡Hola ${clientNameFormatted}! 

Te comparto tu QR para que des asistencia al ingresar al gimnasio.
Tu QR contiene tu fecha de caducidad de tu mensualidad.
Al pasar la fecha de vencimiento se te cobrará $30 si aún sigues ingresando con fecha vencida.
Recuerda que es tu responsabilidad levantar todos tus instrumentos usados, recuerda que alguien más quiere usar lo que tú tienes en uso.
Así como contar con una toalla para limpiar dónde has estado.

¡Te esperamos para que sigas alcanzando tus metas en Gimnasio Strongest Villa Comaltitlán!`;
    
    try {
      const qrValue = encodeURIComponent(value);
      const qrImageUrl = `/api/generate-qr?value=${qrValue}`;
      
      const response = await fetch('/api/send-WhatsApp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `+52${phone}`,
          clientName: clientNameFormatted,
          qrImage: qrImageUrl,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar');
      }

      onShowAlert?.('success', `Código QR enviado a ${clientNameFormatted} por WhatsApp (${selectedColorScheme.name})`);
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error);
      onShowAlert?.('error', `Error al compartir el código QR por WhatsApp: ${error.message}`);
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
  phone: PropTypes.string, // Nueva prop para el teléfono
  colorScheme: PropTypes.oneOf(['auto', 'azul', 'naranja', 'verde', 'rojo', 'púrpura', 'gris', 'amarillo', 'rosa']),
  onShowAlert: PropTypes.func
};

export default QRCodeDisplay;