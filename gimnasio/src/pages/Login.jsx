import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Card from '../atoms/Card';

const Login = ({ className = '', ...props }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isFullyLocked, setIsFullyLocked] = useState(false);
  const [showTerms, setShowTerms] = useState(false); // Nuevo estado para el modal
  const { login } = useAuth();
  const navigate = useNavigate();

  const MAX_LOGIN_ATTEMPTS = 3;
  const MAX_PIN_ATTEMPTS = 5;
  const ADMIN_PIN = '3000';
  const WHATSAPP_NUMBER = '+528144384806';
  const WHATSAPP_MESSAGE = encodeURIComponent(
    'Página bloqueada: Solicito código de desbloqueo para el panel de administración de Strongest Gym. Por favor, proporcione asistencia.'
  );

  useEffect(() => {
    const storedAttempts = localStorage.getItem('loginAttempts');
    const storedIsLocked = localStorage.getItem('isLocked');
    const storedPinAttempts = localStorage.getItem('pinAttempts');
    const storedIsFullyLocked = localStorage.getItem('isFullyLocked');

    if (storedAttempts) setAttempts(parseInt(storedAttempts));
    if (storedIsLocked) setIsLocked(storedIsLocked === 'true');
    if (storedPinAttempts) setPinAttempts(parseInt(storedPinAttempts));
    if (storedIsFullyLocked) setIsFullyLocked(storedIsFullyLocked === 'true');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      resetAllStates();
      navigate('/dashboard');
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('loginAttempts', newAttempts.toString());

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        setIsLocked(true);
        localStorage.setItem('isLocked', 'true');
        setError('Has alcanzado el límite de intentos. Ingresa el PIN para desbloquear.');
      } else {
        setError(`Credenciales incorrectas. Te quedan ${MAX_LOGIN_ATTEMPTS - newAttempts} intento(s).`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setPinError('');

    if (pinInput === ADMIN_PIN) {
      resetAllStates();
      setPinInput('');
      setError('');
    } else {
      const newPinAttempts = pinAttempts + 1;
      setPinAttempts(newPinAttempts);
      localStorage.setItem('pinAttempts', newPinAttempts.toString());

      if (newPinAttempts >= MAX_PIN_ATTEMPTS) {
        setIsFullyLocked(true);
        localStorage.setItem('isFullyLocked', 'true');
        setPinError(
          'Has alcanzado el límite de intentos para el PIN. La página ha sido bloqueada automáticamente. ' +
          'Solo el administrador puede desbloquear con un PIN único o comunicarse al número +52 8144384806 para ayuda más rápida.'
        );
      } else {
        setPinError(`PIN incorrecto. Te quedan ${MAX_PIN_ATTEMPTS - newPinAttempts} intento(s).`);
      }
    }
  };

  const resetAllStates = () => {
    setAttempts(0);
    setIsLocked(false);
    setPinAttempts(0);
    setIsFullyLocked(false);
    localStorage.setItem('loginAttempts', '0');
    localStorage.setItem('isLocked', 'false');
    localStorage.setItem('pinAttempts', '0');
    localStorage.setItem('isFullyLocked', 'false');
  };

  // Función para abrir/cerrar el modal de Términos y Condiciones
  const toggleTermsModal = () => {
    setShowTerms(!showTerms);
  };

  return (
    <div className={`app-container flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden ${className}`} {...props}>
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-600 to-black rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo y título mejorados */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full blur-lg opacity-40 scale-110 animate-pulse"></div>
              <div className="relative bg-white p-4 rounded-full shadow-2xl border border-red-500/30">
                <img 
                  src="/images/gym.png" 
                  alt="Strongest Gym Logo" 
                  className="w-16 h-16 drop-shadow-lg filter brightness-110 contrast-110" 
                />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-red-500/20 scale-125 animate-spin-slow"></div>
            </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-gray-100 to-red-200 bg-clip-text text-transparent mb-2 tracking-tight drop-shadow-lg">
              STRONGEST
            </h1>
            <h2 className="text-3xl font-bold text-red-500 tracking-widest mb-3 drop-shadow-md">
              GYM
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-400 text-sm font-medium">Panel de Administración</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8">
          {isFullyLocked ? (
            <div className="space-y-6">
              <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  La página ha sido bloqueada automáticamente. Solo el administrador puede desbloquear con un PIN único o comunicarse al número +52 8144384806 para ayuda más rápida.
                </div>
              </div>

              <form onSubmit={handlePinSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Ingresa el PIN único de administrador para desbloquear
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-600/50 bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="PIN único"
                    />
                  </div>
                </div>

                {pinError && (
                  <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm mt-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pinError}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-black transition-all duration-200 transform hover:scale-[1.02] mt-4"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Desbloquear
                </button>
              </form>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white font-medium bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-black transition-all duration-200 transform hover:scale-[1.02] mt-4"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.074-.149-.669-.816-.911-1.114-.241-.297-.478-.297-.669-.198-.197.099-1.255.462-1.953.694-.697.232-1.193.694-1.343.992-.149.297-.149.744.05 1.092.198.347.842 1.09 1.888 1.934 1.045.844 1.838 1.838 2.182 2.184.347.347.644.793.992 1.389.347.595.595 1.139.793 1.586.198.446.446.644.793.793.297.099.595.099.893-.05.297-.149.744-.595 1.14-.893.396-.297.793-.446 1.14-.223.347.198 1.34.992 1.586 1.19.248.198.495.347.595.347.099 0 .198-.099.297-.297.099-.198.099-.595-.05-.893zm-5.472 7.618c-4.536 0-8.22-3.684-8.22-8.22s3.684-8.22 8.22-8.22 8.22 3.684 8.22 8.22-3.684 8.22-8.22 8.22zm0-18c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>
          ) : isLocked ? (
            <form className="space-y-6" onSubmit={handlePinSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Ingresa el PIN para desbloquear
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600/50 bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="PIN"
                  />
                </div>
              </div>

              {pinError && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {pinError}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-black transition-all duration-200 transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Desbloquear
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600/50 bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="Correo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-600/50 bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="Contraseña"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-black transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Acceder al Dashboard
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <p className="text-center text-xs text-gray-400">
              © 2025 Strongest Gym - NetSpark - Angel Gabriel.{' '}
              <button
                onClick={toggleTermsModal}
                className="text-red-400 hover:text-red-300 underline transition-colors duration-200"
              >
                Términos y Condiciones
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Términos y Condiciones */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-4">Términos y Condiciones</h2>
            <p className="text-gray-300 text-sm mb-6">
              Todas las políticas de Strongest Gym están protegidas. Los correos electrónicos y datos personales de nuestros usuarios están encriptados para garantizar la máxima seguridad y privacidad.
            </p>
            <button
              onClick={toggleTermsModal}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-white font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-black transition-all duration-200 transform hover:scale-[1.02]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-gray-900">
          <div className="h-full bg-gradient-to-r from-red-500 to-red-600 animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default Login;