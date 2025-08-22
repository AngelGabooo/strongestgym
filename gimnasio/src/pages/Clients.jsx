import { useState } from 'react';
import ClientForm from '../molecules/ClientForm';
import ClientTable from '../organisms/ClientTable';
import Modal from '../atoms/Modal';
import QRCodeDisplay from '../atoms/QRCodeDisplay';
import CustomAlertModal from '../organisms/CustomAlertModal';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlusIcon, 
  ListBulletIcon, 
  UsersIcon,
  QrCodeIcon,
  SparklesIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useClients } from '../hooks/useClients';
import { format, addMonths, addDays } from 'date-fns';

const Clients = ({ className = '' }) => {
  const { clients, loading, error, addClient, editClient, removeClient, refreshClients, findClientByEmail } = useClients();
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [clientToRenew, setClientToRenew] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: 'info',
    message: '',
    actionButton: null,
  });

  const showAlert = (type, message, actionButton = null) => {
    setAlertConfig({ isOpen: true, type, message, actionButton });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        const updatedClient = await editClient(editingClient.id, clientData);
        showAlert('success', 'Cliente actualizado exitosamente');
      } else {
        const newClient = await addClient(clientData);
        showAlert('success', 'Cliente registrado exitosamente');
      }
      setShowForm(false);
      setEditingClient(null);
    } catch (err) {
      showAlert('error', `Error al guardar cliente: ${err.message}`);
    }
  };

  const handleEditClient = async (client) => {
    try {
      console.log('Intentando editar cliente con ID:', client.id);
      await refreshClients();
      // Verificar si el cliente existe en Firestore
      const clientFromFirestore = await findClientByEmail(client.email);
      if (!clientFromFirestore || clientFromFirestore.id !== client.id) {
        throw new Error(`El cliente con ID ${client.id} no existe en Firestore o no coincide con el email ${client.email}`);
      }
      const updatedClient = clients.find(c => c.id === client.id) || clientFromFirestore;
      if (!updatedClient) {
        throw new Error('Cliente no encontrado en la lista local después de recargar');
      }
      console.log('Cliente seleccionado para editar:', updatedClient);
      setEditingClient(updatedClient);
      setShowForm(true);
    } catch (err) {
      console.error('Error en handleEditClient:', err.message);
      showAlert('error', `Error al preparar cliente para edición: ${err.message}`);
    }
  };

  const handleViewQR = (client) => {
    setSelectedClient(client);
    setShowQRModal(true);
  };

  const handleDeleteClient = async (clientId) => {
    try {
      console.log('Eliminando cliente con ID:', clientId);
      await refreshClients();
      await removeClient(clientId);
      showAlert('success', 'Cliente eliminado exitosamente');
    } catch (err) {
      showAlert('error', `Error al eliminar cliente: ${err.message}`);
    }
  };

  const handleRenewClient = (client) => {
    setClientToRenew(client);
    setShowRenewModal(true);
  };

  const handleRenewConfirm = async () => {
    if (!clientToRenew) return;

    try {
      const today = new Date();
      const paymentDate = today.toISOString();
      const expirationDate = clientToRenew.subscriptionType === 'monthly'
        ? addMonths(today, 1).toISOString()
        : addDays(today, clientToRenew.visitDays).toISOString();

      const updatedClient = {
        ...clientToRenew,
        paymentDate,
        expirationDate,
        status: 'active',
      };

      await editClient(clientToRenew.id, updatedClient);
      setShowRenewModal(false);
      setClientToRenew(null);
      showAlert('success', 'Suscripción renovada exitosamente');
    } catch (err) {
      showAlert('error', `Error al renovar la suscripción: ${err.message}`);
    }
  };

  const handleRenewCancel = () => {
    setShowRenewModal(false);
    setClientToRenew(null);
  };

  const handleRefreshClients = async () => {
    try {
      await refreshClients();
      showAlert('success', 'Lista de clientes recargada');
    } catch (err) {
      showAlert('error', `Error al recargar clientes: ${err.message}`);
    }
  };

  console.log('Clients component rendering', { user, clients });

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg sm:text-xl">Cargando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center bg-red-900/20 border border-red-500/30 rounded-2xl p-6 sm:p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl sm:text-3xl">⚠</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-red-400 mb-2">Error al cargar</h2>
            <p className="text-sm sm:text-base text-red-300">{error}</p>
            <button
              onClick={handleRefreshClients}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className={`flex-1 overflow-y-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative px-4 sm:px-6 pt-6 sm:pt-8 pb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {showForm && (
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 sm:p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-xl transition-all duration-200"
                  >
                    <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  </button>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center">
                    <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 mr-2 sm:mr-3" />
                    {showForm ? (editingClient ? 'Editar Cliente' : 'Nuevo Cliente') : 'Gestión de Clientes'}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-400 mt-1">
                    {showForm 
                      ? (editingClient ? 'Actualiza la información del cliente' : 'Registra un nuevo miembro del gimnasio')
                      : `${clients.length} clientes registrados`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={handleRefreshClients}
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/50 transition-all duration-200"
                >
                  <ArrowPathIcon className="w-5 h-5 inline-block mr-2" />
                  Recargar
                </button>
                <button
                  onClick={() => {
                    setEditingClient(null);
                    setShowForm(!showForm);
                  }}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 text-sm sm:text-base ${
                    showForm 
                      ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 text-gray-300 hover:text-white'
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                  }`}
                >
                  {showForm ? (
                    <>
                      <ListBulletIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Ver Lista</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span>Nuevo Cliente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6">
          {showForm ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 text-sm sm:text-base text-gray-400">
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Clientes</span>
                  <span>/</span>
                  <span className="text-red-400">
                    {editingClient ? 'Editar' : 'Nuevo'}
                  </span>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-6 sm:p-8">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-white">
                      {editingClient ? 'Actualizar Información' : 'Información del Cliente'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-400">
                      Completa todos los campos requeridos
                    </p>
                  </div>
                </div>

                <ClientForm 
                  onSave={handleSaveClient} 
                  initialData={editingClient}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingClient(null);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <ClientTable 
                clients={clients} 
                onViewQR={handleViewQR}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
                onRenew={handleRenewClient}
              />
            </div>
          )}
        </div>
      </div>

      <Modal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)}
        className="bg-black/80 backdrop-blur-xl"
      >
        {selectedClient && (
          <div className="relative bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-2xl border border-red-800/50 max-w-md w-full mx-auto shadow-xl shadow-red-900/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
            
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-2 right-2 z-20 p-1.5 bg-gray-800/50 hover:bg-red-700/50 rounded-full border border-gray-600/50 text-gray-300 hover:text-white transition-all duration-200"
            >
              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="relative z-10 text-center p-4 sm:p-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                  <QrCodeIcon className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Código QR</h2>
                  <p className="text-xs text-red-400">Gimnasio Strongest</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center border-3 border-red-600/30 mx-auto mb-3 shadow-md shadow-red-500/20 text-white text-2xl font-bold">
                  {selectedClient.name.trim().charAt(0).toUpperCase() || '?'}
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">{selectedClient.name}</h3>
                <p className="text-xs sm:text-sm text-gray-300">{selectedClient.email}</p>
                <p className="text-xs sm:text-sm text-gray-300 mt-1">PIN: <span className="font-semibold text-red-400">{selectedClient.pin}</span></p>
              </div>

              <div className="mb-4">
                <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border shadow-sm ${
                  selectedClient.status === 'active' ? 'text-green-400 bg-green-900/20 border-green-500/30' :
                  selectedClient.status === 'expiring' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' :
                  'text-red-400 bg-red-900/20 border-red-500/30'
                }`}>
                  {selectedClient.status === 'active' ? 'Activo' :
                   selectedClient.status === 'expiring' ? 'Por vencer' :
                   'Vencido'}
                </span>
              </div>

              <div className="mb-4">
                <QRCodeDisplay 
                  value={JSON.stringify({ qrCode: selectedClient.qrCode, pin: selectedClient.pin })} 
                  size={140}
                  withDownload={true}
                  withWhatsApp={true}
                  clientName={selectedClient.name}
                  onShowAlert={showAlert}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showRenewModal}
        onClose={handleRenewCancel}
        className="bg-black/80 backdrop-blur-xl"
      >
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-2xl border border-red-800/50 max-w-sm w-full mx-auto shadow-xl shadow-red-900/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
          
          <div className="relative z-10 text-center p-4 sm:p-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                <ArrowPathIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Renovar Suscripción</h2>
                <p className="text-xs sm:text-sm text-gray-300">
                  ¿Desea renovar la suscripción de {clientToRenew?.name}?
                </p>
              </div>
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={handleRenewConfirm}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md shadow-green-500/25 hover:shadow-green-500/30 transform hover:scale-105 text-sm"
              >
                Sí
              </button>
              <button
                onClick={handleRenewCancel}
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600/50 transition-all duration-200 transform hover:scale-105 text-sm"
              >
                No
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <CustomAlertModal
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        type={alertConfig.type}
        message={alertConfig.message}
        actionButton={alertConfig.actionButton}
      />
    </main> 
  );  
};

export default Clients;