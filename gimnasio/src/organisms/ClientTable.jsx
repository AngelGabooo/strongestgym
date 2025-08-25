import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  QrCodeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  HashtagIcon,
  PhoneIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/outline';

const ClientTable = ({ clients, onViewQR, onEdit, onDelete, onRenew, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    console.log('Clientes recibidos en ClientTable:', clients);
    const idCount = clients.reduce((acc, client) => {
      acc[client.id] = (acc[client.id] || 0) + 1;
      return acc;
    }, {});
    console.log('Conteo de IDs en ClientTable:', idCount);
  }, [clients]);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.pin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      client.status === filter;
    return matchesSearch && matchesFilter;
  });

  useEffect(() => {
    console.log('Clientes filtrados:', filteredClients);
  }, [filteredClients]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/30 border-green-500/30';
      case 'expiring': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
      case 'expired': return 'text-red-400 bg-red-900/30 border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/30';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'expiring': return 'Por vencer';
      case 'expired': return 'Vencido';
      default: return 'Desconocido';
    }
  };

  const getInitial = (name) => {
    return name.trim().charAt(0).toUpperCase() || '?';
  };

  // Función para verificar si la suscripción está a 5 días o menos de vencer
  const isExpiringInFiveDays = (expirationDate) => {
    const today = new Date();
    const expiration = new Date(expirationDate);
    const daysUntilExpiration = differenceInDays(expiration, today);
    return daysUntilExpiration >= 0 && daysUntilExpiration <= 5;
  };

  // Función para generar el enlace de WhatsApp con un mensaje predefinido
  const sendWhatsAppReminder = (client) => {
    const phoneNumber = client.phone.replace(/[^0-9+]/g, ''); // Limpiar el número (quitar espacios, guiones, etc.)
    const formattedDate = format(new Date(client.expirationDate), 'dd/MM/yyyy', { locale: es });
    const message = `Hola ${client.name}, tu suscripción en Strongest Gym está por vencer el ${formattedDate}. ¡Renueva ahora para seguir entrenando! Contacta con nosotros para más detalles.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 overflow-hidden ${className}`}>
      <div className="p-4 sm:p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/50 to-black/50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono o PIN..."
              className="w-full pl-12 pr-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-base sm:text-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <FunnelIcon className="w-6 h-6 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-base sm:text-lg"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="expiring">Por vencer</option>
              <option value="expired">Vencidos</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-700/30">
            <div className="text-2xl sm:text-3xl font-bold text-white">{clients.length}</div>
            <div className="text-base sm:text-lg text-gray-400">Total</div>
          </div>
          <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/20">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {clients.filter(c => c.status === 'active').length}
            </div>
            <div className="text-base sm:text-lg text-green-300">Activos</div>
          </div>
          <div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/20">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
              {clients.filter(c => c.status === 'expiring').length}
            </div>
            <div className="text-base sm:text-lg text-yellow-300">Por vencer</div>
          </div>
          <div className="bg-red-900/20 rounded-xl p-4 border border-red-500/20">
            <div className="text-2xl sm:text-3xl font-bold text-red-400">
              {clients.filter(c => c.status === 'expired').length}
            </div>
            <div className="text-base sm:text-lg text-red-300">Vencidos</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredClients.length > 0 ? (
          <>
            <table className="hidden sm:table min-w-full">
              <thead className="bg-gray-900/30 border-b border-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    PIN
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="transition-all duration-200 hover:bg-gray-900/20"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center border-2 border-gray-600/50 text-white text-xl font-bold">
                            {getInitial(client.name)}
                          </div>
                        </div>
                        <div>
                          <div className="text-base font-semibold text-white">{client.name}</div>
                          <div className="text-sm text-gray-400 flex items-center">
                            <PhoneIcon className="w-4 h-4 mr-1" />
                            {client.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <HashtagIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-300">{client.pin}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <CreditCardIcon className="w-5 h-5 text-gray-400" />
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                          client.subscriptionType === 'monthly' 
                            ? 'text-blue-400 bg-blue-900/30 border-blue-500/30' 
                            : 'text-purple-400 bg-purple-900/30 border-purple-500/30'
                        }`}>
                          {client.subscriptionType === 'monthly' 
                            ? 'Mensual' 
                            : `Por visita (${client.visitDays} días)`
                          }
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(client.status)}`}>
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          client.status === 'active' ? 'bg-green-400' :
                          client.status === 'expiring' ? 'bg-yellow-400' :
                          client.status === 'expired' ? 'bg-red-400' : 'bg-gray-400'
                        }`}></div>
                        {getStatusText(client.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center space-x-1 mb-1">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Inicio:</span>
                          <span>{format(new Date(client.paymentDate), 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Fin:</span>
                          <span>{format(new Date(client.expirationDate), 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewQR(client)}
                          className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 group"
                          title="Ver QR"
                        >
                          <QrCodeIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                        </button>
                        <button
                          onClick={() => onEdit(client)}
                          className="p-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-200 group"
                          title="Editar"
                        >
                          <PencilIcon className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
                        </button>
                        {client.status === 'expiring' && isExpiringInFiveDays(client.expirationDate) && (
                          <button
                            onClick={() => sendWhatsAppReminder(client)}
                            className="p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 group"
                            title="Enviar recordatorio por WhatsApp"
                          >
                            <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                          </button>
                        )}
                        {client.status === 'expired' && (
                          <button
                            onClick={() => onRenew(client)}
                            className="p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 group"
                            title="Renovar Suscripción"
                          >
                            <ArrowPathIcon className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(client.id)}
                          className="p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 group"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sm:hidden space-y-4 p-4">
              {filteredClients.map((client) => (
                <div 
                  key={client.id}
                  className="bg-gray-900/10 rounded-xl p-4 border border-gray-800/50 transition-all duration-200 hover:bg-gray-900/20"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center border-2 border-gray-600/50 text-white text-xl font-bold">
                        {getInitial(client.name)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white">{client.name}</div>
                      <div className="text-base text-gray-400 flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-1" />
                        {client.phone}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <HashtagIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-base text-gray-300">{client.pin}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <CreditCardIcon className="w-5 h-5 text-gray-400" />
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-base font-medium border ${
                          client.subscriptionType === 'monthly' 
                            ? 'text-blue-400 bg-blue-900/30 border-blue-500/30' 
                            : 'text-purple-400 bg-purple-900/30 border-purple-500/30'
                        }`}>
                          {client.subscriptionType === 'monthly' 
                            ? 'Mensual' 
                            : `Por visita (${client.visitDays} días)`
                          }
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-base font-medium border ${getStatusColor(client.status)}`}>
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            client.status === 'active' ? 'bg-green-400' :
                            client.status === 'expiring' ? 'bg-yellow-400' :
                            client.status === 'expired' ? 'bg-red-400' : 'bg-gray-400'
                          }`}></div>
                          {getStatusText(client.status)}
                        </span>
                      </div>
                      <div className="text-base text-gray-300 mt-2">
                        <div className="flex items-center space-x-1 mb-1">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-base text-gray-400">Inicio:</span>
                          <span>{format(new Date(client.paymentDate), 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-base text-gray-400">Fin:</span>
                          <span>{format(new Date(client.expirationDate), 'dd/MM/yyyy', { locale: es })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-4">
                    <button
                      onClick={() => onViewQR(client)}
                      className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 group"
                      title="Ver QR"
                    >
                      <QrCodeIcon className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                    </button>
                    <button
                      onClick={() => onEdit(client)}
                      className="p-3 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-lg transition-all duration-200 group"
                      title="Editar"
                    >
                      <PencilIcon className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
                    </button>
                    {client.status === 'expiring' && isExpiringInFiveDays(client.expirationDate) && (
                      <button
                        onClick={() => sendWhatsAppReminder(client)}
                        className="p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 group"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <ChatBubbleBottomCenterTextIcon className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                      </button>
                    )}
                    {client.status === 'expired' && (
                      <button
                        onClick={() => onRenew(client)}
                        className="p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all duration-200 group"
                        title="Renovar Suscripción"
                      >
                        <ArrowPathIcon className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(client.id)}
                      className="p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all duration-200 group"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircleIcon className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No se encontraron clientes</h3>
            <p className="text-base sm:text-lg text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Intenta ajustar tus filtros de búsqueda' 
                : 'Comienza agregando tu primer cliente'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

ClientTable.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      pin: PropTypes.string.isRequired,
      qrCode: PropTypes.string.isRequired,
      subscriptionType: PropTypes.oneOf(['monthly', 'per_visit']).isRequired,
      paymentDate: PropTypes.string.isRequired,
      expirationDate: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['active', 'expiring', 'expired']).isRequired,
      visitDays: PropTypes.number.isRequired,
      monthlyCost: PropTypes.number.isRequired,
      perVisitCost: PropTypes.number.isRequired,
    })
  ).isRequired,
  onViewQR: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRenew: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default ClientTable;