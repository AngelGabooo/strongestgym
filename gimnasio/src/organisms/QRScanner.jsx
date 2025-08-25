import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import QRCodeDisplay from '../atoms/QRCodeDisplay';
import Modal from '../atoms/Modal';
import CustomAlertModal from './CustomAlertModal';
import { useClients } from '../hooks/useClients';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  HashtagIcon,
  EnvelopeIcon,
  CalendarIcon,
  CreditCardIcon,
  LockClosedIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { calculateSubscriptionStatus } from '../utils/helpers';
import PropTypes from 'prop-types';
import { getAuth } from 'firebase/auth';

const QRScanner = ({ onScan, className = '', continuousMode = true }) => {
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [scanStatus, setScanStatus] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'info',
    message: '',
    actionButton: null
  });
  const [lastScannedCode, setLastScannedCode] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const navigate = useNavigate();
  const { clients, loading, refreshClients, getTodayAccessRecords, registerAccess } = useClients();

  const ADMIN_PASSWORD = 'admin123';

  useEffect(() => {
    if (!loading) {
      checkCameraAvailability();
    }
    return () => {
      stopCamera();
    };
  }, [loading]);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoDevices.length > 0);
      if (!videoDevices.length) {
        setError('No se detectaron cámaras. Usa el PIN para buscar.');
      } else {
        startCamera();
      }
    } catch (err) {
      console.error('Error verificando cámara:', err);
      setHasCamera(false);
      setError('Error al verificar cámaras. Usa el PIN para buscar.');
    }
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setError(null);
      setScanStatus('Inicializando cámara...');
      setScannedData(null);

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { min: 320, ideal: window.innerWidth <= 640 ? window.innerWidth : 640 },
          height: { min: 240, ideal: window.innerWidth <= 640 ? window.innerWidth * 0.75 : 480 },
          aspectRatio: { ideal: 4 / 3 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setScanStatus('Escaneando... Centra el código QR.');
            animationFrameRef.current = requestAnimationFrame(scanQRCode);
          }).catch(err => {
            console.error('Error al reproducir el video:', err);
            setError('No se pudo reproducir el video. Verifica los permisos de la cámara.');
            setIsScanning(false);
            setScanStatus('');
            stopCamera();
          });
        };
      }
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      setError('No se pudo acceder a la cámara. Verifica los permisos e inténtalo de nuevo.');
      setIsScanning(false);
      setScanStatus('');
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanning(false);
    setScanStatus('');
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code) {
        if (code.data === lastScannedCode) {
          animationFrameRef.current = requestAnimationFrame(scanQRCode);
          return;
        }

        setLastScannedCode(code.data);

        try {
          let qrData;
          try {
            qrData = JSON.parse(code.data);
          } catch (e) {
            qrData = { pin: code.data };
          }

          if (isValidQRFormat(qrData)) {
            setScanStatus('Código QR válido. Buscando cliente...');
            stopCamera();
            fetchClientData(qrData);
          } else {
            throw new Error('Formato de QR inválido');
          }
        } catch (err) {
          console.error('Error procesando QR:', err);
          setError('Código QR inválido. Usa un QR generado por el sistema o ingresa el PIN manualmente.');
          resetScanner();
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const isValidQRFormat = (data) => {
    if (typeof data === 'object' && (data.qrCode || data.pin)) {
      return true;
    }
    if (typeof data === 'string' && /^\d+$/.test(data)) {
      return true;
    }
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === 'object' && (parsed.qrCode || parsed.pin);
    } catch (e) {
      return false;
    }
  };

  const fetchClientData = async (searchData) => {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('No hay usuario autenticado. Por favor, inicia sesión.');
      }

      let client = null;

      if (searchData.qrCode) {
        client = clients.find(c => c.qrCode === searchData.qrCode);
      }
      if (!client && searchData.pin) {
        client = clients.find(c => c.pin === searchData.pin.toString());
      }

      if (client) {
        client.status = calculateSubscriptionStatus(client.expirationDate);
        setScannedData(client);

        try {
          const todayRecords = await getTodayAccessRecords(client.email);
          const sortedRecords = todayRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          const lastRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;

          if (lastRecord && lastRecord.type === 'entry') {
            await registerExit(client);
          } else {
            await registerEntry(client);
          }
        } catch (err) {
          console.error('Error al verificar registros de hoy:', err);
          if (err.message.includes('index')) {
            setError('Error en la consulta de Firestore: Se requiere un índice. Crea el índice en la consola de Firebase usando el enlace del error en la consola.');
          } else {
            setError(`Error al verificar accesos: ${err.message}.`);
          }
          resetScanner();
          return;
        }

        if (onScan) onScan(client);
      } else {
        throw new Error('Cliente no encontrado');
      }
    } catch (err) {
      console.error('Error buscando cliente:', err);
      setError(`Error: ${err.message}. Verifica el QR o PIN o intenta de nuevo.`);
      resetScanner();
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim()) {
      stopCamera();
      fetchClientData({ pin: pinInput.trim() });
    } else {
      setError('Por favor, ingresa un PIN válido.');
      resetScanner();
    }
  };

  const resetScanner = () => {
    setScannedData(null);
    setError(null);
    setPinInput('');
    setScanStatus('Escaneando... Centra el código QR.');
    setLastScannedCode('');
    setAlertModal({ isOpen: false, type: 'info', message: '', actionButton: null });
    if (hasCamera && !loading) {
      setTimeout(startCamera, 500);
    }
  };

  const registerEntry = async (client) => {
    if (client.status === 'expired') {
      setAlertModal({
        isOpen: true,
        type: 'error',
        message: 'Su suscripción está vencida y necesita renovarla con el encargado del gimnasio.',
        actionButton: {
          label: 'Renovar',
          onClick: () => navigate(`/clients?edit=${client.id}`)
        }
      });
      setTimeout(resetScanner, 120000); // 2 minutes (120,000ms) for expired subscription alert
      return;
    }

    try {
      await registerAccess(client, 'entry');
      setAlertModal({
        isOpen: true,
        type: client.status === 'expiring' ? 'warning' : 'success',
        message: client.status === 'expiring' 
          ? 'Su suscripción está por vencer y necesita renovarla. ¡Entrada registrada exitosamente!' 
          : 'Entrada registrada exitosamente.',
        actionButton: client.status === 'expiring' ? {
          label: 'Renovar',
          onClick: () => navigate(`/clients?edit=${client.id}`)
        } : null
      });
      setTimeout(resetScanner, 2000); // 2 seconds (2,000ms) for expiring or successful entry
    } catch (err) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        message: `Error al registrar entrada: ${err.message}`,
        actionButton: null
      });
      setTimeout(resetScanner, 2000); // 2 seconds for error alert
    }
  };

  const registerExit = async (client) => {
    try {
      const accessData = await registerAccess(client, 'exit');
      setAlertModal({
        isOpen: true,
        type: 'success',
        message: `Salida registrada exitosamente. Tiempo activo: ${accessData.activeTime || 0} minutos`,
        actionButton: null
      });
      setTimeout(resetScanner, 1000); // 1 second for exit success alert
    } catch (err) {
      setAlertModal({
        isOpen: true,
        type: 'error',
        message: `Error al registrar salida: ${err.message}`,
        actionButton: null
      });
      setTimeout(resetScanner, 2000); // 2 seconds for error alert
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError(null);
      if (scannedData) {
        navigate(`/history?clientEmail=${encodeURIComponent(scannedData.email)}`);
      } else {
        navigate('/history');
      }
    } else {
      setPasswordError('Contraseña incorrecta. Intenta de nuevo.');
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-500 text-white' 
      : status === 'expiring' 
        ? 'bg-yellow-500 text-white' 
        : 'bg-red-500 text-white';
  };

  const getStatusText = (status) => {
    return status === 'active' ? 'Activo' : status === 'expiring' ? 'Por Vencer' : 'Inactivo';
  };

  return (
    <div className={className}>
      <div className="bg-black backdrop-blur-xl rounded-3xl border border-red-900/20 p-4 sm:p-6 shadow-2xl">
        {!scannedData ? (
          <div className="border-2 border-dashed border-red-900/30 rounded-xl p-4 sm:p-8 bg-gradient-to-br from-red-950/10 via-black/30 to-red-950/10 backdrop-blur-sm">
            <div className="flex flex-col gap-6">
              {hasCamera && !loading && (
                <div className="text-center">
                  <div className="relative mx-auto w-full max-w-md aspect-[4/3] bg-gradient-to-br from-black via-gray-900 to-black rounded-lg overflow-hidden mb-4 border border-red-900/20">
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      style={{ transform: window.innerWidth <= 640 ? 'rotate(0deg)' : 'none' }}
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-4 border-red-500 rounded-lg shadow-lg shadow-red-500/25">
                      <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-red-500"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-red-500"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-red-500"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-red-500"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4/5 h-2 bg-red-500 opacity-80 animate-pulse shadow-lg shadow-red-500/50"></div>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 text-base sm:text-lg">
                    {scanStatus || 'Por favor, centra el código QR en el marco.'}
                  </p>
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-gradient-to-r from-red-950/50 via-black/50 to-red-950/50 hover:from-red-900/50 hover:to-red-900/50 text-gray-300 rounded-xl border border-red-900/30 transition-all duration-200 backdrop-blur-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {loading && (
                <div className="text-center">
                  <p className="text-gray-300 mb-4 text-base sm:text-lg">Cargando clientes...</p>
                </div>
              )}
              <div className="text-center">
                <div className="mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-red-950/20 via-black/40 to-red-950/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6 border border-red-900/20">
                  <QrCodeIcon className="w-12 h-12 sm:w-16 sm:h-16 text-red-500" />
                </div>
                <p className="text-gray-300 mb-4 sm:mb-6 text-base sm:text-lg">
                  Ingresa el PIN del cliente
                </p>
                <form onSubmit={handlePinSubmit} className="mt-4">
                  <div className="relative max-w-sm mx-auto">
                    <HashtagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="Ingresa el PIN del cliente"
                      className="block w-full pl-12 pr-4 py-3 border border-red-900/30 bg-gradient-to-r from-red-950/20 via-black/40 to-red-950/20 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500/50 transition-all duration-200 backdrop-blur-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25"
                  >
                    Buscar por PIN
                  </button>
                </form>
                {error && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-red-950/30 via-red-900/20 to-red-950/30 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                      <p className="text-red-300">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-red-950/10 via-black/40 to-red-950/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-red-900/20">
            <div className="flex items-center mb-4 sm:mb-6 p-3 bg-gradient-to-r from-green-950/30 via-black/30 to-green-950/30 rounded-xl border border-green-500/20">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <h3 className="text-lg sm:text-xl font-semibold text-white">Cliente Identificado</h3>
            </div>
            
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center p-4 bg-gradient-to-r from-red-950/20 via-black/30 to-red-950/20 rounded-xl border border-red-900/20 backdrop-blur-sm">
                  <UsersIcon className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Nombre</p>
                    <p className="text-white font-semibold">{scannedData.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-r from-red-950/20 via-black/30 to-red-950/20 rounded-xl border border-red-900/20 backdrop-blur-sm">
                  <EnvelopeIcon className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-semibold">{scannedData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-r from-red-950/20 via-black/30 to-red-950/20 rounded-xl border border-red-900/20 backdrop-blur-sm">
                  <HashtagIcon className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">PIN</p>
                    <p className="text-white font-semibold text-lg sm:text-xl">{scannedData.pin}</p>
                    <p className="text-xs text-gray-400 mt-1">Úsalo para acceso manual</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-950/20 via-black/30 to-red-950/20 rounded-xl border border-red-900/20 backdrop-blur-sm">
                  <div className="flex items-center">
                    <CreditCardIcon className="w-6 h-6 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-400">Membresía</p>
                      <p className="text-white font-semibold">
                        {scannedData.subscriptionType === 'monthly' ? 'Mensual' : `Por Visita (${scannedData.visitDays} días)`}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(scannedData.status)}`}>
                    {getStatusText(scannedData.status)}
                  </span>
                </div>
                
                <div className="flex items-center p-4 bg-gradient-to-r from-red-950/20 via-black/30 to-red-950/20 rounded-xl border border-red-900/20 backdrop-blur-sm">
                  <CalendarIcon className="w-6 h-6 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-400">Vence</p>
                    <p className="text-white font-semibold">
                      {format(new Date(scannedData.expirationDate), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black p-4 rounded-xl shadow-lg">
                  <QRCodeDisplay 
                    value={JSON.stringify({ qrCode: scannedData.qrCode, pin: scannedData.pin })} 
                    size={150}
                    withDownload={true}
                  />
                </div>
                
                <button
                  onClick={resetScanner}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-950/30 via-black/40 to-red-950/30 hover:from-red-900/30 hover:to-red-900/30 text-gray-300 rounded-xl border border-red-900/30 transition-all duration-200 backdrop-blur-sm"
                >
                  Escanear Otro
                </button>
                
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25"
                >
                  Ver Historial
                </button>
              </div>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordInput('');
            setPasswordError(null);
          }}
          title="Acceso al Historial"
          className="bg-gradient-to-br from-black via-gray-900 to-red-950 border border-red-800/50"
        >
          <form onSubmit={handlePasswordSubmit}>
            <div className="relative mb-4">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Contraseña de administrador"
                className="block w-full pl-12 pr-4 py-3 border border-red-900/30 bg-gradient-to-r from-red-950/20 via-black/40 to-red-950/20 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500/50 transition-all duration-200 backdrop-blur-sm"
              />
            </div>
            {passwordError && (
              <p className="text-red-400 text-sm mb-4">{passwordError}</p>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setPasswordError(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-950/30 via-black/40 to-red-950/30 hover:from-red-900/30 hover:to-red-900/30 text-gray-300 rounded-xl border border-red-900/30 transition-all duration-200 backdrop-blur-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25"
              >
                Ingresar
              </button>
            </div>
          </form>
        </Modal>

        <CustomAlertModal
          isOpen={alertModal.isOpen}
          type={alertModal.type}
          message={alertModal.message}
          onClose={() => {
            setAlertModal({ isOpen: false, type: 'info', message: '', actionButton: null });
            resetScanner();
          }}
          actionButton={alertModal.actionButton}
        />
      </div>
    </div>
  );
};

QRScanner.propTypes = {
  onScan: PropTypes.func,
  className: PropTypes.string,
  continuousMode: PropTypes.bool,
};

QRScanner.defaultProps = {
  continuousMode: true,
};

export default QRScanner;