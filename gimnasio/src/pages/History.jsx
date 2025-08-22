import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AccessHistory from '../organisms/AccessHistory';
import PropTypes from 'prop-types';
import { UsersIcon } from '@heroicons/react/24/outline';
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
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clientEmail = queryParams.get('clientEmail');
  const { fetchAccessHistory } = useClients();
  const ADMIN_PASSWORD = 'admin123';

  const gymConfig = {
    name: 'STRONGEST Villa Comaltitlan',
    logo: '/logo-strongest.png',
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
      
      const groupedHistory = data.reduce((acc, entry) => {
        if (!acc[entry.clientEmail]) {
          acc[entry.clientEmail] = {
            clientName: entry.clientName,
            clientEmail: entry.clientEmail,
            entries: []
          };
        }
        acc[entry.clientEmail].entries.push({
          ...entry,
          client: { status: entry.client?.status || 'active' }
        });
        return acc;
      }, {});

      let historyData = Object.values(groupedHistory);
      
      if (clientEmail) {
        historyData = historyData.filter(client => client.clientEmail === clientEmail);
      }
      
      setHistory(historyData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
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

  const filterEntriesByDate = (entries) => {
    if (!selectedDate) return entries;

    const selectedDateStr = format(selectedDate, 'dd/MM/yyyy', { locale: es });
    
    return entries.filter(entry => {
      const entryDate = parseISO(entry.timestamp);
      const entryDateStr = format(entryDate, 'dd/MM/yyyy', { locale: es });
      
      return entryDateStr === selectedDateStr;
    });
  };

  const hasFilteredEntries = () => {
    return history.some(client => filterEntriesByDate(client.entries).length > 0);
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
      doc.text('LOGO', 32, 32);
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
      doc.text('⚠️ No hay registros para la fecha seleccionada', 20, yPosition);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Verifique la fecha seleccionada e intente nuevamente.', 20, yPosition + 15);
      
      const fileName = selectedDate 
        ? `historial_${format(selectedDate, 'yyyy-MM-dd', { locale: es })}_${gymConfig.name.replace(/\s+/g, '_')}.pdf`
        : `historial_completo_${gymConfig.name.replace(/\s+/g, '_')}.pdf`;
      
      doc.save(fileName);
      return;
    }

    let totalEntries = 0;
    history.forEach(async (client) => {
      const filteredEntries = filterEntriesByDate(
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
          yPosition = await addGymHeader(doc);
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
      doc.text(`Total de clientes: ${history.filter(client => filterEntriesByDate(client.entries).length > 0).length}`, 20, yPosition + 25);
    }

    const fileName = selectedDate 
      ? `Historial_${format(selectedDate, 'yyyy-MM-dd', { locale: es })}_${gymConfig.name.replace(/\s+/g, '_')}.pdf`
      : `Historial_Completo_${gymConfig.name.replace(/\s+/g, '_')}.pdf`;
    
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="bg-red-950/80 backdrop-blur-xl border border-red-800/50 rounded-2xl p-6 text-center shadow-2xl">
          <p className="text-red-200 text-lg">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className={`flex-1 overflow-y-auto p-6 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{gymConfig.name}</h2>
                  <p className="text-base text-gray-400">Acceso al Historial</p>
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
                
                <div className="flex justify-center space-x-4">
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
    <main className={`flex-1 overflow-y-auto p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            {clientEmail ? `Historial de ${history[0]?.clientName || 'Cliente'}` : 'Historial de Accesos'}
          </h1>
          <p className="text-gray-400 mt-1">{gymConfig.name}</p>
        </div>
        
        <div className="flex space-x-4">
          <input
            type="date"
            onChange={handleDateChange}
            className="px-4 py-2 bg-gray-900/50 text-white border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={generatePDF}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center space-x-2"
          >
            <span>📄</span>
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {history.length > 0 && hasFilteredEntries() ? (
          history.map((client) => {
            const filteredEntries = filterEntriesByDate(
              client.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            );
            
            if (filteredEntries.length === 0) return null;

            return (
              <div
                key={client.clientEmail}
                className="bg-black/40 backdrop-blur-xl rounded-3xl border border-gray-800/50 p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{client.clientName}</h2>
                    <p className="text-sm text-gray-400">{client.clientEmail}</p>
                  </div>
                  <div className="ml-auto">
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
          <div className="text-center py-8 bg-gradient-to-br from-black via-gray-900 to-red-950 rounded-3xl border border-red-800/50 shadow-xl shadow-red-900/20 mx-auto max-w-md p-6">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg font-medium">
              {selectedDate ? 'No hay registros para esta fecha' : 'No hay accesos registrados'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {selectedDate 
                ? `Fecha seleccionada: ${format(selectedDate, 'dd/MM/yyyy', { locale: es })}`
                : 'Los nuevos accesos aparecerán aquí'
              }
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