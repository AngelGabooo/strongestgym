
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PropTypes from 'prop-types';
import { Bars3Icon, XMarkIcon, UserIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Header = ({ onToggleSidebar, isSidebarOpen, className = '', ...props }) => {
  const { user, logout } = useAuth(); // Obtener el usuario y la función logout del contexto
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout(); // Usar la función logout del contexto
    navigate('/');
  };

  // Obtener la inicial del correo o 'A' por defecto
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'A';
  // Determinar el rol para mostrar
  const userRole = user?.role === 'admin' ? 'Administrador' : user?.role === 'staff' ? 'Staff' : 'Usuario';
  // Mostrar el correo completo o un texto por defecto
  const userEmail = user?.email || 'admin@strongestgym.com';
  // Descripción según el rol
  const roleDescription = user?.role === 'admin' ? 'Gestión completa' : 'Acceso limitado';

  return (
    <header className={`bg-gradient-to-r from-black via-gray-900 to-black shadow-2xl border-b border-red-900/20 ${className}`} {...props}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Lado izquierdo - Toggle sidebar */}
          <div className="flex items-center">
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl text-gray-300 hover:text-white hover:bg-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 backdrop-blur-sm"
              onClick={onToggleSidebar}
            >
              <span className="sr-only">{isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
              {isSidebarOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>

            {/* Logo/Título para desktop */}
            <div className="hidden md:flex items-center ml-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <img src="/images/gym.png" alt="Strongest Gym Logo" className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">STRONGEST</h1>
                  <p className="text-xs text-red-400 -mt-1">Administrador</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado derecho - Perfil */}
          <div className="flex items-center space-x-4">
            {/* Separador */}
            <div className="h-8 w-px bg-gray-700"></div>

            {/* Perfil de usuario */}
            <div className="relative">
              <button
                className="flex items-center space-x-3 p-2 rounded-xl text-gray-300 hover:text-white hover:bg-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 backdrop-blur-sm"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-bold shadow-lg">
                  {userInitial}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{userRole}</p>
                  <p className="text-xs text-gray-400">{userEmail}</p>
                </div>
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown del perfil */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 z-50">
                  <div className="px-4 py-3 border-b border-gray-700/50">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-center text-white font-bold">
                        {userInitial}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{userRole}</p>
                        <p className="text-xs text-gray-400">{roleDescription}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-600/10 transition-colors duration-200">
                      <UserIcon className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </button>
                    <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-red-600/10 transition-colors duration-200">
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span>Configuración</span>
                    </button>
                  </div>
                  <div className="border-t border-gray-700/50 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors duration-200"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar dropdowns */}
      {profileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

Header.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  isSidebarOpen: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default Header;