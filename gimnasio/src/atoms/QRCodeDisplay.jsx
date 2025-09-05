import { useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { ArrowDownTrayIcon, ShareIcon, QrCodeIcon } from '@heroicons/react/24/outline';

const QRCodeDisplay = ({ value, size = 200, className = '', withDownload = false, withWhatsApp = false, clientName = '', phoneNumber = '', colorScheme = 'auto', onShowAlert, ...props }) => {
  const qrRef = useRef(null);

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

      const highResCanvas = document.createElement('canvas');
      const scaleFactor = 4;
      const highResSize = size * scaleFactor;

      highResCanvas.width = highResSize;
      highResCanvas.height = highResSize;

      const ctx = highResCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0, highResSize, highResSize);

      const pngUrl = highResCanvas.toDataURL("image/png", 1.0).replace("image/png", "image/octet-stream");

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
    if (!phoneNumber) {
      onShowAlert?.('error', 'No se proporcionó un número de teléfono para enviar el QR');
      return;
    }

    const clientNameFormatted = clientName || 'Cliente';

    const message = `¡Hola ${clientNameFormatted}! 

Te comparto tu QR para que des asistencia al ingresar al gimnasio.
Tu QR contiene tu fecha de caducidad de tu mensualidad.
Al pasar la fecha de vencimiento se te cobrará $30 si aún sigues ingresando con fecha vencida.
Recuerda que es tu responsabilidad levantar todos tus instrumentos usados, recuerda que alguien más quiere usar lo que tú tienes en uso.
Así como contar con una toalla para limpiar dónde has estado.

¡Te esperamos para que sigas alcanzando tus metas en Gimnasio Strongest Villa Comaltitlán!`;

    try {
      const originalCanvas = qrRef.current.querySelector('canvas');
      if (!originalCanvas) {
        onShowAlert?.('error', 'Error al generar el código QR para compartir por WhatsApp');
        return;
      }

      const combinedCanvas = document.createElement('canvas');
      const scaleFactor = 6;
      const padding = 25 * scaleFactor;
      const nameHeight = 45 * scaleFactor;
      const logoHeight = 35 * scaleFactor;
      const highResSize = size * scaleFactor;

      combinedCanvas.width = highResSize + padding * 2;
      combinedCanvas.height = highResSize + nameHeight + logoHeight + padding * 3;

      const ctx = combinedCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const gradient = ctx.createLinearGradient(0, 0, combinedCanvas.width, combinedCanvas.height);
      gradient.addColorStop(0, '#FFFFFF');
      gradient.addColorStop(1, selectedColorScheme.bg);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      ctx.drawImage(originalCanvas, padding, padding + logoHeight, highResSize, highResSize);

      ctx.fillStyle = selectedColorScheme.fg;
      ctx.font = `bold ${14 * scaleFactor}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('GIMNASIO STRONGEST', combinedCanvas.width / 2, padding + (logoHeight * 0.6));

      ctx.font = `bold ${12 * scaleFactor}px Arial`;
      const clientY = highResSize + padding * 2 + logoHeight + (nameHeight * 0.5);
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

      ctx.fillStyle = selectedColorScheme.fg;
      ctx.font = `${10 * scaleFactor}px Arial`;
      ctx.fillText(`QR ${selectedColorScheme.name}`, combinedCanvas.width / 2, lineY + (18 * scaleFactor));

      const imageData = combinedCanvas.toDataURL('image/png', 1.0);

      // Enviar solicitud a la API Route
      const response = await fetch('/api/sendWhatsApp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          clientName: clientNameFormatted,
          qrImage: imageData,
          message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onShowAlert?.('success', result.message);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error al enviar por WhatsApp:', error);
      onShowAlert?.('error', `Error al enviar el código QR: ${error.message}`);
    }
  };

  return (
    <div 
      className={`relative flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-xl border border-red-800/50 shadow-lg shadow-red-900/30 w-full overflow-hidden ${className}`} 
      ref={qrRef}
      {...props}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${selectedColorScheme.gradient.replace('600', '600/10').replace('800', '800/5')}`}></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full p-4">
        <div className="mb-3 text-center w-full">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <QrCodeIcon className={`w-5 h-5 text-${selectedColorScheme.gradient.split(' ')[0].replace('from-', '').replace('-600', '-500')} animate-pulse`} />
            <h3 className="text-base font-bold text-white">Código QR HD</h3>
          </div>
          <p className="text-sm text-gray-300">Acceso para {clientName || 'Cliente'}</p>
          <p className="text-xs text-gray-400">Color: {selectedColorScheme.name} • Alta Resolución</p>
        </div>

        <div className={`p-3 bg-gradient-to-br ${selectedColorScheme.bg === '#FFFFFF' ? 'from-white to-gray-50' : `from-white to-[${selectedColorScheme.bg}]`} rounded-xl shadow-xl shadow-red-500/25 border-3 border-red-600/40 mb-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
          <QRCodeSVG 
            value={value} 
            size={size} 
            level="H"
            includeMargin={true} 
            bgColor={selectedColorScheme.bg} 
            fgColor={selectedColorScheme.fg} 
            className="block drop-shadow-sm"
          />
          <QRCodeCanvas 
            value={value} 
            size={size} 
            level="H"
            includeMargin={true} 
            bgColor={selectedColorScheme.bg} 
            fgColor={selectedColorScheme.fg} 
            className="hidden"
          />
        </div>

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
  phoneNumber: PropTypes.string,
  colorScheme: PropTypes.oneOf(['auto', 'azul', 'naranja', 'verde', 'rojo', 'púrpura', 'gris', 'amarillo', 'rosa']),
  onShowAlert: PropTypes.func
};

export default QRCodeDisplay;