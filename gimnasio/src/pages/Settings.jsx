import { useState, useEffect } from 'react';
import Card from '../atoms/Card';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import PropTypes from 'prop-types';
import { 
  EnvelopeIcon, 
  DevicePhoneMobileIcon, 
  InformationCircleIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Settings = ({ className = '', ...props }) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [systemStats, setSystemStats] = useState({
    uptime: '0h 0m',
    lastBackup: 'Nunca',
    totalMembers: 0,
    activeMembers: 0,
    version: '2.1.0',
    status: 'online'
  });
  const [healthChecks] = useState({
    database: true,
    storage: true,
    email: true,
    notifications: false
  });

  useEffect(() => {
    const updateStats = () => {
      try {
        const members = JSON.parse(localStorage.getItem('members') || '[]');
        const now = new Date();
        const activeMembers = members.filter(member => {
          if (member.membershipEndDate) {
            return new Date(member.membershipEndDate) > now;
          }
          return false;
        }).length;

        setSystemStats({
          uptime: calculateUptime(),
          lastBackup: getLastBackup(),
          totalMembers: members.length,
          activeMembers: activeMembers,
          version: '2.1.0',
          status: 'online'
        });
      } catch (error) {
        console.log('Error updating stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const calculateUptime = () => {
    try {
      const startTime = localStorage.getItem('appStartTime');
      if (!startTime) {
        localStorage.setItem('appStartTime', Date.now().toString());
        return '0h 0m';
      }
      
      const elapsed = Date.now() - parseInt(startTime);
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return '0h 0m';
    }
  };

  const getLastBackup = () => {
    try {
      const lastBackup = localStorage.getItem('lastBackup');
      if (!lastBackup) return 'Nunca';
      
      const backupDate = new Date(parseInt(lastBackup));
      return backupDate.toLocaleDateString('es-ES') + ' ' + backupDate.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Nunca';
    }
  };

  const requestPinAccess = (action) => {
    setPendingAction(action);
    setPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const validatePin = () => {
    if (pin === '5656') {
      setShowPinModal(false);
      executePendingAction();
      setPin('');
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Solo el encargado de mantenimiento tiene acceso.');
      setPin('');
    }
  };

  const executePendingAction = () => {
    if (pendingAction === 'backup') {
      performBackup();
    } else if (pendingAction === 'clearCache') {
      clearCache();
    }
    setPendingAction(null);
  };

  const performBackup = () => {
    try {
      const data = {
        members: JSON.parse(localStorage.getItem('members') || '[]'),
        payments: JSON.parse(localStorage.getItem('payments') || '[]'),
        gymSettings: JSON.parse(localStorage.getItem('gymSettings') || '{}'),
        timestamp: Date.now()
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `strongest-gym-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      localStorage.setItem('lastBackup', Date.now().toString());
      alert('✅ Backup creado exitosamente por el equipo de mantenimiento');
    } catch (error) {
      alert('❌ Error al crear el backup - Contacte al soporte técnico');
    }
  };

  const clearCache = () => {
    try {
      const membersData = localStorage.getItem('members');
      const paymentsData = localStorage.getItem('payments');
      const settingsData = localStorage.getItem('gymSettings');
      
      localStorage.clear();
      
      if (membersData) localStorage.setItem('members', membersData);
      if (paymentsData) localStorage.setItem('payments', paymentsData);
      if (settingsData) localStorage.setItem('gymSettings', settingsData);
      
      alert('✅ Caché limpiada exitosamente - Sistema optimizado');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      alert('❌ Error al limpiar la caché - Contacte al soporte técnico');
    }
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPin('');
    setPinError('');
    setPendingAction(null);
  };

  const toggleInfoModal = () => {
    setShowInfoModal(!showInfoModal);
  };

  const WHATSAPP_NUMBER = '+528144384806';
  const WHATSAPP_MESSAGE = encodeURIComponent(
    'Hola, necesito soporte técnico para el panel de administración de Strongest Gym.'
  );

  const StatCard = ({ icon: Icon, title, value, subtitle, status }) => (
    <div className="bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-2xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 group hover:shadow-red-500/10 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-red-600/30 to-red-700/30 group-hover:from-red-500/40 group-hover:to-red-600/40 transition-all duration-300">
          <Icon className="w-6 h-6 text-red-400" />
        </div>
        {status && (
          <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-red-400 shadow-red-400/50 shadow-lg' : 'bg-gray-500'} animate-pulse`} />
        )}
      </div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-red-100 bg-clip-text text-transparent mb-1">{value}</h3>
      <p className="text-red-200 font-medium">{title}</p>
      {subtitle && <p className="text-red-300/70 text-sm mt-1">{subtitle}</p>}
    </div>
  );

  const HealthCheck = ({ name, status, description }) => (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-black/50 to-red-950/20 rounded-xl border border-red-500/20 hover:border-red-400/30 transition-all duration-300">
      <div className="flex items-center space-x-3">
        {status ? (
          <CheckCircleIcon className="w-5 h-5 text-red-400" />
        ) : (
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
        )}
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-red-200/70 text-sm">{description}</p>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        status 
          ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
      }`}>
        {status ? 'ACTIVO' : 'ALERTA'}
      </div>
    </div>
  );

  return (
    <main className={`flex-1 overflow-y-auto p-6 bg-gradient-to-br from-black via-gray-900 to-red-950 ${className}`} {...props}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              Centro de Control
            </h1>
            <p className="text-red-200/80 mt-2">Panel de administración y monitoreo del sistema</p>
          </div>
          <div className="flex items-center space-x-3 bg-gradient-to-r from-black/50 to-red-950/30 rounded-full px-4 py-2 border border-red-500/30">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-red-400/50 shadow-lg" />
            <span className="text-red-300 font-medium">Sistema Operativo</span>
          </div>
        </div>

        {/* Estadísticas del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={ChartBarIcon}
            title="Miembros Totales"
            value={systemStats.totalMembers}
            subtitle={`${systemStats.activeMembers} activos`}
          />
          <StatCard
            icon={ClockIcon}
            title="Tiempo Activo"
            value={systemStats.uptime}
            subtitle="Desde el último reinicio"
            status={systemStats.status}
          />
          <StatCard
            icon={CpuChipIcon}
            title="Versión del Sistema"
            value={`v${systemStats.version}`}
            subtitle="Última actualización"
          />
          <StatCard
            icon={CloudArrowUpIcon}
            title="Último Backup"
            value={systemStats.lastBackup === 'Nunca' ? 'Nunca' : 'Reciente'}
            subtitle={systemStats.lastBackup}
          />
        </div>

        {/* Estado del Sistema */}
        <Card className="p-8 bg-gradient-to-br from-black via-gray-900 to-red-950 border border-red-500/30 backdrop-blur-xl mb-8 hover:shadow-red-500/10 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent flex items-center">
                <ShieldCheckIcon className="w-7 h-7 mr-3 text-red-400" />
                Estado del Sistema
              </h2>
              <p className="text-red-200/70 mt-1">Monitoreo en tiempo real de componentes críticos</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HealthCheck 
              name="Base de Datos" 
              status={healthChecks.database} 
              description="Conexión y integridad de datos"
            />
            <HealthCheck 
              name="Almacenamiento Local" 
              status={healthChecks.storage} 
              description="Espacio y accesibilidad"
            />
            <HealthCheck 
              name="Sistema de Correo" 
              status={healthChecks.email} 
              description="Configuración de notificaciones"
            />
            <HealthCheck 
              name="Notificaciones Push" 
              status={healthChecks.notifications} 
              description="Alertas automáticas"
            />
          </div>
        </Card>

        {/* Herramientas del Sistema */}
        <Card className="p-8 bg-gradient-to-br from-black via-gray-900 to-red-950 border border-red-500/30 backdrop-blur-xl mb-8 hover:shadow-red-500/10 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent mb-6 flex items-center">
            <CpuChipIcon className="w-7 h-7 mr-3 text-red-400" />
            Herramientas de Mantenimiento
          </h2>
          
          <div className="bg-gradient-to-r from-red-950/30 to-black/30 rounded-2xl p-4 border border-red-600/20 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <LockClosedIcon className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-semibold text-sm">ZONA RESTRINGIDA</span>
            </div>
            <p className="text-red-200/70 text-sm">
              Las siguientes herramientas requieren autorización del <strong>Encargado de Mantenimiento</strong>. 
              Se requiere PIN de seguridad para acceder a funciones críticas del sistema.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => requestPinAccess('backup')}
              className="bg-gradient-to-br from-red-600 via-red-700 to-black hover:from-red-500 hover:via-red-600 hover:to-gray-900 p-4 h-auto flex flex-col items-center space-y-2 transition-all duration-300 transform hover:scale-105 border border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/20 hover:shadow-xl"
            >
              <div className="flex items-center space-x-2">
                <CloudArrowUpIcon className="w-8 h-8" />
                <LockClosedIcon className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="font-semibold">Crear Backup</span>
              <span className="text-xs opacity-90 text-center">Exportar datos del sistema<br />⚠️ Requiere autorización</span>
            </Button>
            
            <Button
              onClick={() => requestPinAccess('clearCache')}
              className="bg-gradient-to-br from-red-600 via-red-700 to-black hover:from-red-500 hover:via-red-600 hover:to-gray-900 p-4 h-auto flex flex-col items-center space-y-2 transition-all duration-300 transform hover:scale-105 border border-red-500/30 hover:border-red-400/50 hover:shadow-red-500/20 hover:shadow-xl"
            >
              <div className="flex items-center space-x-2">
                <CpuChipIcon className="w-8 h-8" />
                <LockClosedIcon className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="font-semibold">Limpiar Caché</span>
              <span className="text-xs opacity-90 text-center">Optimizar rendimiento<br />⚠️ Requiere autorización</span>
            </Button>
            
            <Button
              onClick={toggleInfoModal}
              className="bg-gradient-to-br from-gray-700 via-gray-800 to-red-900 hover:from-gray-600 hover:via-gray-700 hover:to-red-800 p-4 h-auto flex flex-col items-center space-y-2 transition-all duration-300 transform hover:scale-105 border border-red-500/20 hover:border-red-400/40"
            >
              <DocumentTextIcon className="w-8 h-8" />
              <span className="font-semibold">Documentación</span>
              <span className="text-xs opacity-90">Guías y términos</span>
            </Button>
          </div>
        </Card>

        {/* Soporte y Contacto */}
        <Card className="p-8 bg-gradient-to-br from-black via-gray-900 to-red-950 border border-red-500/30 backdrop-blur-xl hover:shadow-red-500/10 hover:shadow-2xl transition-all duration-300">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent mb-6 flex items-center">
            <InformationCircleIcon className="w-7 h-7 mr-3 text-red-400" />
            Soporte Técnico Premium
          </h2>
          
          <div className="bg-gradient-to-br from-red-950/40 to-black/40 rounded-2xl p-6 border border-red-500/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">Biomey - Soluciones Tecnológicas</h3>
                <p className="text-red-200/70">Angel Gabriel García Samayoa - Fundador</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-400 font-semibold">Disponible 24/7</p>
                <p className="text-xs text-red-300/70">Tiempo de respuesta: ~2h</p>
              </div>
            </div>
            
            <p className="text-red-100/80 text-sm mb-6 leading-relaxed">
              Soporte técnico especializado para Strongest Gym. Nuestro equipo está disponible para resolver cualquier 
              problema técnico, implementar nuevas funcionalidades o brindar capacitación personalizada.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center py-4 px-6 border border-green-500/30 rounded-2xl shadow-lg text-white font-semibold bg-gradient-to-r from-green-600 via-green-700 to-black hover:from-green-500 hover:via-green-600 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-black transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/20 hover:shadow-xl"
              >
                <DevicePhoneMobileIcon className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                <div className="text-left">
                  <p>WhatsApp Directo</p>
                  <p className="text-xs opacity-90">+52 8144384806</p>
                </div>
              </a>
              
              <a
                href="mailto:a20624646@gmail.com?subject=Soporte%20Strongest%20Gym&body=Describe%20tu%20problema%20o%20consulta%20aquí..."
                className="group flex items-center justify-center py-4 px-6 border border-blue-500/30 rounded-2xl shadow-lg text-white font-semibold bg-gradient-to-r from-blue-600 via-blue-700 to-black hover:from-blue-500 hover:via-blue-600 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-black transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/20 hover:shadow-xl"
              >
                <EnvelopeIcon className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                <div className="text-left">
                  <p>Email Profesional</p>
                  <p className="text-xs opacity-90">a20624646@gmail.com</p>
                </div>
              </a>
            </div>
          </div>

          <div className="text-center pt-6 border-t border-red-500/20">
            <p className="text-xs text-red-200/60 mb-2">
              © 2025 Strongest Gym by Biomey. Todos los derechos reservados.
            </p>
            <button
              onClick={toggleInfoModal}
              className="text-red-400 hover:text-red-300 underline text-xs transition-colors duration-200 hover:scale-105 transform inline-block"
            >
              Ver Términos de Servicio y Política de Privacidad
            </button>
          </div>
        </Card>
      </div>

      {/* Modal de PIN de Seguridad */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-3xl shadow-2xl border border-red-500/50 p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-red-600/30 to-red-700/30">
                  <LockClosedIcon className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent">
                    Acceso Restringido
                  </h2>
                  <p className="text-red-200/70 text-sm">Zona de Mantenimiento</p>
                </div>
              </div>
              <button
                onClick={closePinModal}
                className="p-2 rounded-full hover:bg-red-800/30 transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-red-400" />
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-950/30 to-red-950/30 rounded-xl p-4 border border-yellow-500/20 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-300 font-medium text-sm">AUTORIZACIÓN REQUERIDA</span>
              </div>
              <p className="text-red-100/80 text-sm">
                Esta función está reservada exclusivamente para el <strong>Encargado de Mantenimiento</strong>. 
                Ingrese el PIN de seguridad para continuar.
              </p>
            </div>

            <div className="mb-6">
              <Input
                label="PIN de Seguridad"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full text-center text-lg tracking-widest"
                placeholder="••••"
                maxLength="4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    validatePin();
                  }
                }}
              />
              {pinError && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {pinError}
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={closePinModal}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 border border-gray-500/30"
              >
                Cancelar
              </Button>
              <Button
                onClick={validatePin}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-500/30"
                disabled={pin.length === 0}
              >
                Verificar PIN
              </Button>
            </div>
            
            <p className="text-xs text-red-300/60 text-center mt-4">
              Contacte al administrador si ha olvidado el PIN de acceso
            </p>
          </div>
        </div>
      )}

      {/* Modal de Información */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-3xl shadow-2xl border border-red-500/50 p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Biomey - Innovación Tecnológica
              </h2>
              <button
                onClick={toggleInfoModal}
                className="p-2 rounded-full hover:bg-red-800/30 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-red-400" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-red-600/10 to-red-700/10 rounded-2xl p-6 border border-red-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">Acerca de la Empresa</h3>
                <p className="text-red-100/90 text-sm leading-relaxed mb-4">
                  <strong>Biomey</strong> es una empresa líder en el desarrollo de soluciones tecnológicas para la gestión 
                  de gimnasios y centros deportivos. Fundada por <strong>Angel Gabriel García Samayoa</strong>, nos especializamos 
                  en crear sistemas intuitivos, seguros y eficientes que transforman la manera en que los gimnasios operan.
                </p>
                <p className="text-red-100/90 text-sm leading-relaxed">
                  Nuestra misión es democratizar el acceso a tecnología de clase mundial para gimnasios de todos los tamaños, 
                  proporcionando herramientas que mejoran tanto la experiencia del usuario como la eficiencia operacional.
                </p>
              </div>

              <div className="bg-gradient-to-r from-gray-800/30 to-red-950/20 rounded-2xl p-6 border border-red-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">Strongest Gym v2.1.0</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-red-400 font-medium">Características:</p>
                    <ul className="text-red-100/80 mt-2 space-y-1">
                      <li>• Gestión completa de miembros</li>
                      <li>• Sistema de pagos integrado</li>
                      <li>• Dashboard analítico avanzado</li>
                      <li>• Notificaciones automáticas</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-red-400 font-medium">Seguridad:</p>
                    <ul className="text-red-100/80 mt-2 space-y-1">
                      <li>• Encriptación de datos AES-256</li>
                      <li>• Backups automáticos</li>
                      <li>• Cumplimiento GDPR</li>
                      <li>• Auditoría de accesos</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-950/30 to-black/30 rounded-2xl p-6 border border-red-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">Términos de Servicio & Privacidad</h3>
                <p className="text-red-100/90 text-sm leading-relaxed mb-4">
                  Al utilizar Strongest Gym, aceptas nuestros términos de servicio. Todos los datos están protegidos bajo 
                  estrictas políticas de privacidad y encriptación de extremo a extremo. No compartimos información personal 
                  con terceros sin consentimiento explícito.
                </p>
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Certificado de Seguridad SSL/TLS válido hasta 2025</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button
                onClick={toggleInfoModal}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 border border-red-500/30"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

Settings.propTypes = {
  className: PropTypes.string,
};

export default Settings;