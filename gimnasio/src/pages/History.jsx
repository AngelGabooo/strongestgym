import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AccessHistory from '../organisms/AccessHistory';
import PropTypes from 'prop-types';
import { UsersIcon, TrashIcon, CalendarIcon, DocumentArrowDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useClients } from '../hooks/useClients';

const History = ({ className = '' }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showFilters, setShowFilters] = useState(false); // Nuevo estado para mostrar/ocultar filtros en móvil
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientEmail = queryParams.get('clientEmail');
  const { fetchAccessHistory, deleteAllAccessHistory } = useClients();
  const ADMIN_PASSWORD = 'admin123';

  const gymConfig = {
    name: 'STRONGEST Villa Comaltitlan',
    colors: {
      primary: '#DC2626',
      secondary: '#000000',
      gradient: ['#DC2626', '#991B1B', '#000000']
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      const data = await fetchAccessHistory(clientEmail);
      console.log('Datos obtenidos de fetchAccessHistory:', data);

      if (!data || !Array.isArray(data) || data.length === 0) {
        setHistory([]);
        setLoading(false);
        setError('No se encontraron registros de acceso.');
        return;
      }

      const groupedHistory = data.reduce((acc, entry) => {
        if (!entry.clientEmail || !entry.clientName || !entry.timestamp) {
          console.warn('Entrada con datos incompletos:', entry);
          return acc;
        }
        if (!acc[entry.clientEmail]) {
          acc[entry.clientEmail] = {
            clientName: entry.clientName,
            clientEmail: entry.clientEmail,
            entries: []
          };
        }
        acc[entry.clientEmail].entries.push({
          id: entry.id,
          timestamp: entry.timestamp,
          type: entry.type,
          client: { status: entry.client?.status || 'active' },
          clientName: entry.clientName,
          clientEmail: entry.clientEmail
        });
        return acc;
      }, {});

      const historyData = Object.values(groupedHistory);
      console.log('Historial agrupado:', historyData);

      if (clientEmail) {
        const filteredData = historyData.filter(client => client.clientEmail === clientEmail);
        setSelectedClient(clientEmail);
        setHistory(filteredData);
      } else {
        setHistory(historyData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener historial:', err);
      setError(err.message || 'Error al cargar el historial.');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordInput('');
      setPasswordError(null);
    } else {
      setPasswordError('Contraseña incorrecta. Intenta de nuevo.');
    }
  };

  const handleDateChange = (e) => {
    const dateString = e.target.value;
    if (dateString) {
      const selectedDate = new Date(dateString + 'T00:00:00');
      setSelectedDate(selectedDate);
    } else {
      setSelectedDate(null);
    }
  };

  const handleClientChange = (e) => {
    const email = e.target.value;
    setSelectedClient(email || null);
    console.log('Cliente seleccionado:', email);
  };

  const handleDeleteAllHistory = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todos los registros del historial? Esta acción no se puede deshacer.')) {
      try {
        await deleteAllAccessHistory();
        setHistory([]);
        setSelectedClient(null);
        setSelectedDate(null);
        alert('Todos los registros han sido eliminados exitosamente.');
      } catch (err) {
        console.error('Error al eliminar el historial:', err);
        alert('Error al eliminar el historial: ' + err.message);
      }
    }
  };

  const filterEntriesByDateAndClient = (client) => {
    let entries = Array.isArray(client.entries) ? client.entries : [];
    console.log('Entradas antes de filtrar:', entries);

    if (selectedDate) {
      const selectedDateStr = format(selectedDate, 'dd/MM/yyyy', { locale: es });
      entries = entries.filter(entry => {
        try {
          const entryDate = parseISO(entry.timestamp);
          const entryDateStr = format(entryDate, 'dd/MM/yyyy', { locale: es });
          return entryDateStr === selectedDateStr;
        } catch (err) {
          console.warn('Error al parsear timestamp en entrada:', entry, err);
          return false;
        }
      });
    }

    console.log('Entradas después de filtrar por fecha:', entries);
    return entries;
  };

  const getFilteredHistory = () => {
    let filteredHistory = history;

    if (selectedClient) {
      filteredHistory = history.filter(client => client.clientEmail === selectedClient);
    }

    console.log('Historial filtrado:', filteredHistory);
    return filteredHistory;
  };

  const hasFilteredEntries = () => {
    return getFilteredHistory().some(client => filterEntriesByDateAndClient(client).length > 0);
  };

  const addGymHeader = async (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setFillColor(153, 27, 27);
    doc.rect(0, 20, pageWidth, 40, 'F');
    
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 40, pageWidth, 20, 'F');

    try {
      doc.setFillColor(255, 255, 255);
      doc.rect(20, 15, 30, 30, 'F');
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(12);
      doc.text('', 32, 32);
    } catch (error) {
      console.log('No se pudo cargar el logo:', error);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(gymConfig.name, 60, 25);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('HISTORIAL DE ENTRADAS', 60, 40);
    
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(2);
    doc.line(20, 55, pageWidth - 20, 55);
    
    return 70;
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    
    let yPosition = await addGymHeader(doc);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    if (selectedDate) {
      const fechaFormateada = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: es });
      doc.text(`Fecha del reporte: ${fechaFormateada}`, 20, yPosition);
      yPosition += 15;
    } else {
      doc.text('Reporte completo - Todas las fechas', 20, yPosition);
      yPosition += 15;
    }

    if (selectedClient) {
      const client = history.find(c => c.clientEmail === selectedClient);
      if (client) {
        doc.text(`Cliente: ${client.clientName}`, 20, yPosition);
        yPosition += 15;
      }
    }

    const fechaGeneracion = format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${fechaGeneracion}`, 20, yPosition);
    yPosition += 20;

    if (!hasFilteredEntries()) {
      doc.setFontSize(16);
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠️ No hay registros para los filtros seleccionados', 20, yPosition);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Verifique los filtros seleccionados e intente nuevamente.', 20, yPosition + 15);
      
      const fileName = selectedDate 
        ? `historial_${format(selectedDate, 'yyyy-MM-dd', { locale: es })}_${gymConfig.name.replace(/\s+/g, '_')}.pdf`
        : `historial_completo_${gymConfig.name.replace(/\s+/g, '_')}.pdf`;
      
      doc.save(fileName);
      return;
    }

    let totalEntries = 0;
    const filteredHistory = getFilteredHistory();
    
    filteredHistory.forEach(client => {
      const filteredEntries = filterEntriesByDateAndClient(
        client.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );
      
      if (filteredEntries.length > 0) {
        totalEntries += filteredEntries.length;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Cliente: ${client.clientName}`, 20, yPosition);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Email: ${client.clientEmail}`, 20, yPosition + 10);
        
        yPosition += 20;

        const tableData = filteredEntries.map(entry => {
          const entryDate = parseISO(entry.timestamp);
          const statusText = entry.client.status === 'active' ? 'Activo' : 
                           entry.client.status === 'expiring' ? 'Por Vencer' : 'Inactivo';
          
          return [
            format(entryDate, 'dd/MM/yyyy', { locale: es }),
            format(entryDate, 'HH:mm:ss', { locale: es }),
            entry.type === 'entry' ? '🟢 Entrada' : '🔴 Salida',
            statusText
          ];
        });

        doc.autoTable({
          startY: yPosition,
          head: [['Fecha', 'Hora', 'Tipo', 'Estado del Cliente']],
          body: tableData,
          theme: 'grid',
          headStyles: { 
            fillColor: [220, 38, 38],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10
          },
          bodyStyles: { 
            textColor: [0, 0, 0],
            fontSize: 9
          },
          alternateRowStyles: { 
            fillColor: [245, 245, 245]
          },
          tableLineColor: [200, 200, 200],
          tableLineWidth: 0.5,
          margin: { left: 20, right: 20 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
        
        if (yPosition > 250) {
          doc.addPage();
          yPosition = addGymHeader(doc);
        }
      }
    });

    if (totalEntries > 0) {
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(1);
      doc.line(20, yPosition, doc.internal.pageSize.getWidth() - 20, yPosition);
      yPosition += 15;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`📊 RESUMEN DEL REPORTE`, 20, yPosition);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de registros: ${totalEntries}`, 20, yPosition + 15);
      doc.text(`Total de clientes: ${filteredHistory.filter(client => filterEntriesByDateAndClient(client).length > 0).length}`, 20, yPosition + 25);
    }

    const fileName = selectedDate 
      ? `Historial_${format(selectedDate, 'yyyy-MM-dd', { locale: es })}_${gymConfig.name.replace(/\s+/g, '_')}${selectedClient ? `_${selectedClient.replace(/[@.]/g, '_')}` : ''}.pdf`
      : `Historial_Completo_${gymConfig.name.replace(/\s+/g, '_')}${selectedClient ? `_${selectedClient.replace(/[@.]/g, '_')}` : ''}.pdf`;
    
    doc.save(fileName);
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setSelectedDate(null);
    setSelectedClient(null);
    // Limpiar el input de fecha
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) dateInput.value = '';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <div className="bg-red-950/80 backdrop-blur-xl border border-red-800/50 rounded-2xl p-6 text-center shadow-2xl max-w-sm w-full">
          <p className="text-red-200 text-lg">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className={`flex-1 overflow-y-auto p-4 sm:p-6 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-6">
            <div className="text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-white">{gymConfig.name}</h2>
                  <p className="text-base text-gray-400">Historial</p>
                </div>
              </div>
              
              <form onSubmit={handlePasswordSubmit}>
                <div className="relative mb-4">
                  <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Contraseña de administrador"
                    className="block w-full pl-12 pr-4 py-3 border border-gray-700/50 bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                {passwordError && (
                  <p className="text-red-400 text-sm mb-4">{passwordError}</p>
                )}
                
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25"
                  >
                    Ingresar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordInput('')}
                    className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl border border-gray-600/50 transition-all duration-200"
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex-1 overflow-y-auto p-3 sm:p-6 ${className}`}>
      {/* Header con título */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white truncate">
              {selectedClient ? `Historial de ${history.find(c => c.clientEmail === selectedClient)?.clientName || 'Cliente'}` : 'Historial'}
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">{gymConfig.name}</p>
          </div>
          
          {/* Botón de filtros para móvil */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden ml-4 p-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl border border-gray-600/50 transition-all duration-200"
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Filtros - Ocultos en móvil por defecto, siempre visibles en desktop */}
        <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Selector de cliente */}
            <div className="relative">
              <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedClient || ''}
                onChange={handleClientChange}
                className="pl-10 pr-8 py-2.5 bg-gray-900/50 text-white border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 w-full appearance-none bg-gradient-to-r from-gray-900 to-gray-800/80 shadow-md transition-all duration-200 text-sm"
              >
                <option value="">Todos los clientes</option>
                {history.map(client => (
                  <option key={client.clientEmail} value={client.clientEmail}>
                    {client.clientName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Selector de fecha */}
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                onChange={handleDateChange}
                className="pl-10 pr-4 py-2.5 bg-gray-900/50 text-white border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 w-full text-sm"
              />
            </div>
            
            {/* Botones de acción */}
            <div className="flex space-x-2 col-span-1 sm:col-span-2 lg:col-span-2">
              <button
                onClick={generatePDF}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center justify-center space-x-2 text-sm"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Descargar </span>
                <span>PDF</span>
              </button>
              
              <button
                onClick={clearFilters}
                className="px-4 py-2.5 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl border border-gray-600/50 transition-all duration-200 text-sm font-medium"
              >
                Limpiar
              </button>
              
              <button
                onClick={handleDeleteAllHistory}
                className="px-4 py-2.5 bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-red-600/25 flex items-center justify-center text-sm"
              >
                <TrashIcon className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del historial */}
      <div className="space-y-4 sm:space-y-6">
        {history.length > 0 ? (
          getFilteredHistory().map((client) => {
            const filteredEntries = filterEntriesByDateAndClient(client);
            
            if (filteredEntries.length === 0) {
              return (
                <div
                  key={client.clientEmail}
                  className="bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-800/50 p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-semibold text-white truncate">{client.clientName}</h2>
                        <p className="text-xs sm:text-sm text-gray-400 truncate">{client.clientEmail}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1 bg-red-600/20 text-red-300 rounded-full text-xs font-medium">
                        0 registros
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-center text-sm">No hay registros para los filtros seleccionados</p>
                </div>
              );
            }

            return (
              <div
                key={client.clientEmail}
                className="bg-black/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-800/50 p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base sm:text-lg font-semibold text-white truncate">{client.clientName}</h2>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">{client.clientEmail}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="px-3 py-1 bg-red-600/20 text-red-300 rounded-full text-xs font-medium">
                      {filteredEntries.length} registro{filteredEntries.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <AccessHistory
                  history={filteredEntries}
                  className="bg-black/20"
                />
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-2xl sm:rounded-3xl border border-red-800/50 shadow-xl shadow-red-900/20 mx-auto max-w-md p-6">
            <UsersIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-base sm:text-lg font-medium">
              No hay accesos registrados
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Los nuevos accesos aparecerán aquí
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

History.propTypes = {
  className: PropTypes.string,
};

export default History;