import { useState, useEffect } from 'react';
import { db } from '../firebase'; // Asegúrate de que esta sea la ruta correcta a tu configuración de Firebase
import { collection, onSnapshot, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import SubscriptionStatus from '../molecules/SubscriptionStatus';
import PropTypes from 'prop-types';
import { calculateSubscriptionStatus } from '../utils/helpers';
import { ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = ({ className = '' }) => {
  const [stats, setStats] = useState({
    activeClients: '0',
    expiringSubscriptions: '0',
    todaysAccess: '0',
    activeEntries: '0',
    expiringEntries: '0',
    activeExits: '0',
    expiringExits: '0',
    deniedAccess: '0',
  });
  const [recentAccess, setRecentAccess] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      // Obtener clientes de Firestore
      const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const clients = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: calculateSubscriptionStatus(doc.data().expirationDate),
      }));

      const activeClients = clients.filter(c => c.status === 'active').length;
      const expiringSubscriptions = clients.filter(c => c.status === 'expiring').length;

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
      const todaysHistory = accessSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        client: {
          ...doc.data().client,
          status: doc.data().client.status || calculateSubscriptionStatus(doc.data().client.expirationDate),
        },
      }));

      const todaysAccess = todaysHistory.length;
      const activeEntries = todaysHistory.filter(h => h.type === 'entry' && h.client?.status === 'active').length;
      const expiringEntries = todaysHistory.filter(h => h.type === 'entry' && h.client?.status === 'expiring').length;
      const activeExits = todaysHistory.filter(h => h.type === 'exit' && h.client?.status === 'active').length;
      const expiringExits = todaysHistory.filter(h => h.type === 'exit' && h.client?.status === 'expiring').length;
      const deniedAccess = todaysHistory.filter(h => h.type === 'denied').length;

      setStats({
        activeClients: activeClients.toString(),
        expiringSubscriptions: expiringSubscriptions.toString(),
        todaysAccess: todaysAccess.toString(),
        activeEntries: activeEntries.toString(),
        expiringEntries: expiringEntries.toString(),
        activeExits: activeExits.toString(),
        expiringExits: expiringExits.toString(),
        deniedAccess: deniedAccess.toString(),
      });

      // Obtener los últimos 5 accesos recientes
      const recentAccessQuery = query(
        collection(db, 'accessHistory'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const recentAccessSnapshot = await getDocs(recentAccessQuery);
      const sortedRecentAccess = recentAccessSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        client: {
          ...doc.data().client,
          status: doc.data().client.status || calculateSubscriptionStatus(doc.data().client.expirationDate),
        },
      }));

      setRecentAccess(sortedRecentAccess);
    } catch (err) {
      setError(err.message);
      console.error('Error al obtener datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Configurar listener en tiempo real para accessHistory
    const accessQuery = query(
      collection(db, 'accessHistory'),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribeAccess = onSnapshot(accessQuery, (snapshot) => {
      const updatedAccess = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        client: {
          ...doc.data().client,
          status: doc.data().client.status || calculateSubscriptionStatus(doc.data().client.expirationDate),
        },
      }));
      setRecentAccess(updatedAccess);

      // Actualizar estadísticas de accesos de hoy
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      const todaysAccessQuery = query(
        collection(db, 'accessHistory'),
        where('timestamp', '>=', startOfToday.toISOString()),
        where('timestamp', '<=', endOfToday.toISOString())
      );

      onSnapshot(todaysAccessQuery, (todaysSnapshot) => {
        const todaysHistory = todaysSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          client: {
            ...doc.data().client,
            status: doc.data().client.status || calculateSubscriptionStatus(doc.data().client.expirationDate),
          },
        }));

        const todaysAccess = todaysHistory.length;
        const activeEntries = todaysHistory.filter(h => h.type === 'entry' && h.client?.status === 'active').length;
        const expiringEntries = todaysHistory.filter(h => h.type === 'entry' && h.client?.status === 'expiring').length;
        const activeExits = todaysHistory.filter(h => h.type === 'exit' && h.client?.status === 'active').length;
        const expiringExits = todaysHistory.filter(h => h.type === 'exit' && h.client?.status === 'expiring').length;
        const deniedAccess = todaysHistory.filter(h => h.type === 'denied').length;

        setStats(prev => ({
          ...prev,
          todaysAccess: todaysAccess.toString(),
          activeEntries: activeEntries.toString(),
          expiringEntries: expiringEntries.toString(),
          activeExits: activeExits.toString(),
          expiringExits: expiringExits.toString(),
          deniedAccess: deniedAccess.toString(),
        }));
      });

      // Actualizar estadísticas de clientes
      onSnapshot(collection(db, 'clients'), (clientsSnapshot) => {
        const clients = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: calculateSubscriptionStatus(doc.data().expirationDate),
        }));

        const activeClients = clients.filter(c => c.status === 'active').length;
        const expiringSubscriptions = clients.filter(c => c.status === 'expiring').length;

        setStats(prev => ({
          ...prev,
          activeClients: activeClients.toString(),
          expiringSubscriptions: expiringSubscriptions.toString(),
        }));
      });
    }, (err) => {
      setError(err.message);
      console.error('Error en el listener de Firestore:', err);
    });

    // Cargar datos iniciales
    fetchData();

    // Limpiar listeners al desmontar
    return () => {
      unsubscribeAccess();
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
        <p className="text-gray-100 text-lg">Cargando dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-950/80 backdrop-blur-xl border border-red-800/50 rounded-2xl p-6 text-center shadow-2xl">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-200 text-lg">Error: {error}</p>
      </div>
    </div>
  );

  // Función para obtener el tiempo relativo
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const accessTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - accessTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} hrs`;
    return format(accessTime, 'dd/MM HH:mm', { locale: es });
  };

  // Función para obtener el texto del tipo diferenciado
  const getTypeText = (access) => {
    if (access.type === 'denied') {
      return 'Denegado (Vencido)';
    } else if (access.type === 'entry') {
      return access.client?.status === 'active' ? 'Entrada Activa' : 'Entrada Por Vencer';
    } else if (access.type === 'exit') {
      return access.client?.status === 'active' ? 'Salida Activa' : 'Salida Por Vencer';
    }
    return access.type;
  };

  // Función para obtener el color del tipo diferenciado
  const getTypeColor = (access) => {
    if (access.type === 'denied') {
      return 'bg-red-900/30 text-red-400 border-red-700/40';
    } else if (access.type === 'entry') {
      return access.client?.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-700/40' : 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40';
    } else if (access.type === 'exit') {
      return access.client?.status === 'active' ? 'bg-blue-900/30 text-blue-400 border-blue-700/40' : 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40';
    }
    return 'bg-gray-900/30 text-gray-400 border-gray-700/40';
  };

  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    return status === 'active' ? 'Activo' : status === 'expiring' ? 'Por Vencer' : 'Vencido';
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    return status === 'active' 
      ? 'bg-green-900/20 text-green-400 border-green-500/30' 
      : status === 'expiring' 
        ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30' 
        : 'bg-red-900/20 text-red-400 border-red-500/30';
  };

  return (
    <main className={`flex-1 overflow-y-auto p-4 sm:p-6 min-h-screen ${className}`}>
      {/* Elementos decorativos de fondo mejorados */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-red-800 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-red-900 rounded-full mix-blend-multiply filter blur-3xl opacity-8 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-950 rounded-full mix-blend-multiply filter blur-3xl opacity-3 animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Header del dashboard */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-100 via-white to-red-200 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-300 mt-1 text-sm sm:text-base">Panel de control - STRONGEST GYM</p>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Actualizado: {format(new Date(), 'HH:mm', { locale: es })}</span>
            </div>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Clientes Activos */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Clientes Activos</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.activeClients}</p>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-400 text-xs sm:text-sm">Membresías activas</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <svg className="h-5 sm:h-6 w-5 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Asistencias Hoy */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Asistencias Hoy</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.todaysAccess}</p>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-blue-400 text-xs sm:text-sm">Entradas y salidas</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <svg className="h-5 sm:h-6 w-5 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Suscripciones por Vencer */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Susc. por Vencer</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.expiringSubscriptions}</p>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-400 text-xs sm:text-sm">Requieren atención</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <svg className="h-5 sm:h-6 w-5 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Entradas Activas */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Entradas Activas</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.activeEntries}</p>
                <div className="flex items-center mt-2">
                  <ArrowLeftIcon className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-xs sm:text-sm">Entradas con suscripción activa</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <ArrowLeftIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Entradas por Vencer */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Entradas por Vencer</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.expiringEntries}</p>
                <div className="flex items-center mt-2">
                  <ArrowLeftIcon className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 text-xs sm:text-sm">Entradas con suscripción por vencer</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <ArrowLeftIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Salidas Activas */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Salidas Activas</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.activeExits}</p>
                <div className="flex items-center mt-2">
                  <ArrowRightIcon className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-xs sm:text-sm">Salidas con suscripción activa</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <ArrowRightIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Salidas por Vencer */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Salidas por Vencer</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.expiringExits}</p>
                <div className="flex items-center mt-2">
                  <ArrowRightIcon className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 text-xs sm:text-sm">Salidas con suscripción por vencer</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <ArrowRightIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Accesos Denegados */}
          <div className="bg-gradient-to-br from-gray-950/90 to-red-950/30 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-xs sm:text-sm font-medium">Accesos Denegados</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-100 mt-2">{stats.deniedAccess}</p>
                <div className="flex items-center mt-2">
                  <XMarkIcon className="w-4 h-4 text-red-400 mr-1" />
                  <span className="text-red-400 text-xs sm:text-sm">Intentos fallidos hoy</span>
                </div>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <XMarkIcon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de accesos recientes - TABLA */}
        <div className="bg-gradient-to-br from-gray-950/90 to-red-950/20 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 shadow-2xl hover:border-red-700/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center">
              <svg className="w-4 sm:w-5 h-4 sm:h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Accesos Recientes
              <span className="ml-2 bg-red-900/40 text-red-300 text-xs px-2 py-1 rounded-full border border-red-700/30">
                Tiempo Real
              </span>
            </h2>
            <a href="/history" className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-medium transition-colors duration-200">
              Ver todos →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800/50">
              <thead className="bg-gradient-to-br from-gray-950 to-red-950/30">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-br from-gray-950/80 to-red-950/20 divide-y divide-gray-800/50">
                {recentAccess.length > 0 ? (
                  recentAccess.map((access) => (
                    <tr key={access.id} className="hover:bg-red-950/50 transition-all duration-200">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-100">{access.clientName}</div>
                        <div className="text-sm text-gray-300">{access.clientEmail}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <div>{format(parseISO(access.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</div>
                        <div className="text-xs text-gray-400">{getRelativeTime(access.timestamp)}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getTypeColor(access)}`}
                        >
                          {getTypeText(access)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(access.client?.status)}`}
                        >
                          {getStatusText(access.client?.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 sm:px-6 py-4 text-center text-sm text-gray-300">
                      No hay accesos recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acceso rápido a funciones */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <button className="bg-gradient-to-br from-gray-950/90 to-red-950/20 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group text-left shadow-2xl hover:shadow-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-100 font-semibold text-sm sm:text-base mb-1">Registrar Cliente</h3>
                <p className="text-gray-300 text-xs sm:text-sm">Añadir nuevo miembro</p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-br from-gray-950/90 to-red-950/20 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group text-left shadow-2xl hover:shadow-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-100 font-semibold text-sm sm:text-base mb-1">Generar Reporte</h3>
                <p className="text-gray-300 text-xs sm:text-sm">Estadísticas del gym</p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </button>

          <button className="bg-gradient-to-br from-gray-950/90 to-red-950/20 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-red-700/50 transition-all duration-300 group text-left shadow-2xl hover:shadow-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-100 font-semibold text-sm sm:text-base mb-1">Configuración</h3>
                <p className="text-gray-300 text-xs sm:text-sm">Ajustes del sistema</p>
              </div>
              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <svg className="w-4 sm:w-5 h-4 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
};

Dashboard.propTypes = {
  className: PropTypes.string,
};

export default Dashboard;