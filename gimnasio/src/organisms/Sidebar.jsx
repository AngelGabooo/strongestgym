import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { HomeIcon, UserGroupIcon, QrCodeIcon, ClockIcon, CogIcon, ChartBarIcon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { calculateSubscriptionStatus } from '../utils/helpers';
import { db } from '../firebase'; // Asegúrate de que esta sea la ruta correcta a tu configuración de Firebase
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { startOfDay, endOfDay, addDays } from 'date-fns';

const Sidebar = ({ isOpen, onClose, className = '', ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gymStats, setGymStats] = useState({
    occupancy: 0,
    occupancyPercentage: 0,
    activeMembers: 0,
    expiringSoon: 0,
  });
  const [error, setError] = useState(null);

  const MAX_CAPACITY = 200; // Capacidad máxima del gimnasio, ajustable

  useEffect(() => {
    const updateGymStats = async () => {
      try {
        // Obtener clientes de Firestore
        const clientsSnapshot = await getDocs(collection(db, 'clients'));
        const clients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: calculateSubscriptionStatus(doc.data().expirationDate),
        }));

        // Obtener accesos de hoy
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        const accessQuery = query(
          collection(db, 'accessHistory'),
          where('timestamp', '>=', startOfToday.toISOString()),
          where('timestamp', '<=', endOfToday.toISOString())
        );
        const accessSnapshot = await getDocs(accessQuery);
        const todayHistory = accessSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calcular ocupación (clientes con entrada sin salida hoy)
        const activeClients = [];
        clients.forEach((client) => {
          if (client.status !== 'active') return;

          const entries = todayHistory.filter(
            (entry) => entry.clientEmail === client.email && entry.type === 'entry'
          );
          const exits = todayHistory.filter(
            (entry) => entry.clientEmail === client.email && entry.type === 'exit'
          );

          if (entries.length > exits.length) {
            activeClients.push(client.email);
          }
        });

        const occupancy = activeClients.length;
        const occupancyPercentage = Math.round((occupancy / MAX_CAPACITY) * 100);

        // Calcular miembros activos
        const activeMembers = clients.filter(c => c.status === 'active').length;

        // Calcular membresías que vencen pronto
        const tomorrow = addDays(today, 2);
        const expiringSoon = clients.filter((client) => {
          const expirationDate = new Date(client.expirationDate);
          return expirationDate > today && expirationDate <= tomorrow;
        }).length;

        setGymStats({
          occupancy,
          occupancyPercentage: Math.min(occupancyPercentage, 100),
          activeMembers,
          expiringSoon,
        });

        setError(null);
      } catch (err) {
        console.error('Error calculando estadísticas del gimnasio:', err);
        setError(err.message);
      }
    };

    // Configurar listeners en tiempo real
    const clientsUnsubscribe = onSnapshot(collection(db, 'clients'), (snapshot) => {
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: calculateSubscriptionStatus(doc.data().expirationDate),
      }));

      const activeMembers = clients.filter(c => c.status === 'active').length;
      const tomorrow = addDays(new Date(), 2);
      const expiringSoon = clients.filter((client) => {
        const expirationDate = new Date(client.expirationDate);
        return expirationDate > new Date() && expirationDate <= tomorrow;
      }).length;

      setGymStats(prev => ({
        ...prev,
        activeMembers,
        expiringSoon,
      }));
    }, (err) => {
      console.error('Error en el listener de clientes:', err);
      setError(err.message);
    });

    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const accessQuery = query(
      collection(db, 'accessHistory'),
      where('timestamp', '>=', startOfToday.toISOString()),
      where('timestamp', '<=', endOfToday.toISOString())
    );

    const accessUnsubscribe = onSnapshot(accessQuery, (snapshot) => {
      const todayHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Obtener clientes para recalcular ocupación
      getDocs(collection(db, 'clients')).then((clientsSnapshot) => {
        const clients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: calculateSubscriptionStatus(doc.data().expirationDate),
        }));

        const activeClients = [];
        clients.forEach((client) => {
          if (client.status !== 'active') return;

          const entries = todayHistory.filter(
            (entry) => entry.clientEmail === client.email && entry.type === 'entry'
          );
          const exits = todayHistory.filter(
            (entry) => entry.clientEmail === client.email && entry.type === 'exit'
          );

          if (entries.length > exits.length) {
            activeClients.push(client.email);
          }
        });

        const occupancy = activeClients.length;
        const occupancyPercentage = Math.round((occupancy / MAX_CAPACITY) * 100);

        setGymStats(prev => ({
          ...prev,
          occupancy,
          occupancyPercentage: Math.min(occupancyPercentage, 100),
        }));
      }).catch((err) => {
        console.error('Error al obtener clientes para ocupación:', err);
        setError(err.message);
      });
    }, (err) => {
      console.error('Error en el listener de accesos:', err);
      setError(err.message);
    });

    // Cargar datos iniciales
    updateGymStats();

    // Limpiar listeners al desmontar
    return () => {
      clientsUnsubscribe();
      accessUnsubscribe();
    };
  }, []);

  // Definir los elementos de navegación y los roles permitidos
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'Panel principal',
      allowedRoles: ['admin', 'staff'],
    },
    {
      name: 'Clientes',
      href: '/clients',
      icon: UserGroupIcon,
      description: 'Gestión de miembros',
      allowedRoles: ['admin', 'staff'],
    },
    {
      name: 'Escáner QR',
      href: '/scanner',
      icon: QrCodeIcon,
      description: 'Control de acceso',
      allowedRoles: ['admin', 'staff', 'qrScanner'],
    },
    {
      name: 'Historial',
      href: '/history',
      icon: ClockIcon,
      description: 'Registro de actividad',
      allowedRoles: ['admin'],
    },
    {
      name: 'Reportes',
      href: '/reports',
      icon: ChartBarIcon,
      description: 'Estadísticas y análisis',
      allowedRoles: ['admin'],
    },
    {
      name: 'Configuración',
      href: '/settings',
      icon: CogIcon,
      description: 'Ajustes del sistema',
      allowedRoles: ['admin'],
    },
  ];

  // Filtrar los elementos de navegación según el rol del usuario
  const filteredNavigationItems = navigationItems.filter((item) =>
    item.allowedRoles.includes(user?.role || 'staff')
  );

  const handleNavigation = (href) => {
    navigate(href);
    if (onClose) {
      onClose();
    }
  };

  // Sidebar para desktop
  const DesktopSidebar = () => (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-72 bg-black/60 backdrop-blur-xl border-r border-red-900/30 shadow-2xl">
        <div className="flex-shrink-0 px-6 py-6 border-b border-red-900/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <img src="/images/gym.png" alt="Strongest Gym Logo" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">STRONGEST</h1>
              <p className="text-xs text-red-400 -mt-1">GYM ADMIN</p>
            </div>
          </div>
        </div>
        <SidebarContent />
      </div>
    </div>
  );

  // Sidebar para móvil
  const MobileSidebar = () => (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-black/95 backdrop-blur-xl border-r border-red-900/30 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-shrink-0 px-4 py-4 border-b border-red-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <img src="/images/gym.png" alt="Strongest Gym Logo" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">STRONGEST</h1>
                <p className="text-xs text-red-400 -mt-1">GYM ADMIN</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <SidebarContent />
      </div>
    </>
  );

  // Contenido compartido del sidebar
  const SidebarContent = () => (
    <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
      <nav className="flex-1 px-4 space-y-2">
        {filteredNavigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25'
                  : 'text-gray-300 hover:text-white hover:bg-red-900/20'
              }`}
            >
              <Icon
                className={`mr-4 flex-shrink-0 h-5 w-5 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-red-400'
                }`}
              />
              <div className="flex-1 text-left">
                <div
                  className={`font-medium ${
                    isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                  }`}
                >
                  {item.name}
                </div>
                <div
                  className={`text-xs ${
                    isActive ? 'text-red-100' : 'text-gray-500 group-hover:text-gray-400'
                  }`}
                >
                  {item.description}
                </div>
              </div>
              {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
            </button>
          );
        })}
      </nav>
      <div className="px-4 mt-8">
        {error && (
          <div className="bg-red-900/30 rounded-2xl p-3 mb-4">
            <p className="text-xs text-red-300">Error: {error}</p>
          </div>
        )}
        <div className="bg-gradient-to-r from-red-900/40 to-black/40 backdrop-blur-sm rounded-2xl p-4 border border-red-800/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Estado del Gym</h3>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Ocupación actual</span>
              <span className="text-xs font-medium text-white">
                {gymStats.occupancyPercentage}% ({gymStats.occupancy} personas)
              </span>
            </div>
            <div className="w-full bg-gray-700/50 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${gymStats.occupancyPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-gray-400">Miembros activos</span>
              <span className="text-xs font-medium text-green-400">{gymStats.activeMembers}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-4">
        <div className="bg-yellow-900/20 backdrop-blur-sm rounded-2xl p-4 border border-yellow-800/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center">
              <BellIcon className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-yellow-200">Recordatorio</p>
              <p className="text-xs text-yellow-300/80">
                {gymStats.expiringSoon}{' '}
                {gymStats.expiringSoon === 1 ? 'membresía vence' : 'membresías vencen'} en los próximos 2 días
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="px-4 mt-6">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-white">
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'qrScanner' ? 'Escáner QR' : 'Staff'}
              </div>
              <div className="text-xs text-gray-400">{user?.email || 'admin@strongestgym.com'}</div>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-150"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-300"></div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">Sistema</span>
              </div>
              <span className="text-green-400 font-medium">Online</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-400">Base de datos</span>
              </div>
              <span className="text-blue-400 font-medium">Conectada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={className} {...props}>
      <DesktopSidebar />
      <MobileSidebar />
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  className: PropTypes.string,
};

Sidebar.defaultProps = {
  isOpen: false,
  onClose: () => {},
};

export default Sidebar;