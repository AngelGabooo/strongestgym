import { useState, useEffect } from 'react';
import { useClients } from '../hooks/useClients';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { format, parseISO, startOfMonth, endOfMonth, getHours, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ClockIcon, 
  StarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const { clients, fetchAllAccessHistory } = useClients();
  const [accessHistory, setAccessHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Precios asumidos (ajusta según tu negocio)
  const MONTHLY_PRICE = 300; // Precio suscripción mensual
  const VISIT_PRICE = 30;   // Precio por día de visita

  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await fetchAllAccessHistory();
        setAccessHistory(history);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Procesar ingresos mensuales
  const getMonthlyIncomeData = () => {
    const monthlyIncome = {};

    clients.forEach(client => {
      const paymentDate = parseISO(client.paymentDate);
      const monthKey = format(paymentDate, 'MMM yyyy', { locale: es });

      if (!monthlyIncome[monthKey]) {
        monthlyIncome[monthKey] = 0;
      }

      if (client.subscriptionType === 'monthly') {
        monthlyIncome[monthKey] += MONTHLY_PRICE;
      } else {
        monthlyIncome[monthKey] += VISIT_PRICE * (client.visitDays || 1);
      }
    });

    const labels = Object.keys(monthlyIncome).sort((a, b) => parseISO(a) - parseISO(b));
    const data = labels.map(label => monthlyIncome[label]);

    return {
      labels,
      datasets: [{
        label: 'Ingresos Mensuales ($)',
        data,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
  };

  // Clientes nuevos y renovaciones
  const getNewAndRenewals = () => {
    const currentMonth = startOfMonth(new Date());
    const newClients = clients.filter(client => isSameMonth(parseISO(client.paymentDate), currentMonth));
    const renewals = clients.filter(client => !isSameMonth(parseISO(client.paymentDate), currentMonth) && client.status !== 'expired');

    return { newClients: newClients.length, renewals: renewals.length };
  };

  // Distribución de tipos de suscripción
  const getSubscriptionDistribution = () => {
    const monthlyCount = clients.filter(c => c.subscriptionType === 'monthly').length;
    const visitCount = clients.filter(c => c.subscriptionType === 'visit').length;

    return {
      labels: ['Mensual', 'Por Visita'],
      datasets: [{
        data: [monthlyCount, visitCount],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  // Horas pico: agrupar entradas por hora
  const getPeakHoursData = () => {
    const hoursCount = Array(24).fill(0);

    accessHistory.forEach(entry => {
      if (entry.type === 'entry') {
        const hour = getHours(parseISO(entry.timestamp));
        hoursCount[hour]++;
      }
    });

    return {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
        label: 'Visitas por Hora',
        data: hoursCount,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4
      }]
    };
  };

  // Clientes más constantes: top 5 por número de entradas
  const getMostConstantClients = () => {
    const clientVisits = {};

    accessHistory.forEach(entry => {
      if (entry.type === 'entry') {
        if (!clientVisits[entry.clientEmail]) {
          clientVisits[entry.clientEmail] = { name: entry.clientName, visits: 0 };
        }
        clientVisits[entry.clientEmail].visits++;
      }
    });

    return Object.entries(clientVisits)
      .sort(([, a], [, b]) => b.visits - a.visits)
      .slice(0, 5)
      .map(([email, { name, visits }]) => ({ email, name, visits }));
  };

  // Calcular métricas resumidas
  const getSummaryMetrics = () => {
    const totalIncome = clients.reduce((sum, client) => {
      if (client.subscriptionType === 'monthly') {
        return sum + MONTHLY_PRICE;
      }
      return sum + (VISIT_PRICE * (client.visitDays || 1));
    }, 0);

    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const totalVisits = accessHistory.filter(entry => entry.type === 'entry').length;

    return { totalIncome, totalClients, activeClients, totalVisits };
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="text-red-600 text-lg font-semibold">Error al cargar reportes</div>
          <div className="text-red-500 mt-2">{error}</div>
        </div>
      </main>
    );
  }

  const incomeData = getMonthlyIncomeData();
  const { newClients, renewals } = getNewAndRenewals();
  const subscriptionData = getSubscriptionDistribution();
  const peakHoursData = getPeakHoursData();
  const constantClients = getMostConstantClients();
  const metrics = getSummaryMetrics();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e7eb',
          font: {
            family: 'Inter, sans-serif'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' }
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(75, 85, 99, 0.3)' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e5e7eb',
          font: {
            family: 'Inter, sans-serif'
          },
          padding: 20
        }
      }
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Reportes
        </h1>
        <p className="text-slate-400 text-lg">Análisis completo de tu negocio</p>
      </div>

      {/* Métricas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">Ingresos Totales</p>
              <p className="text-white text-3xl font-bold">${metrics.totalIncome}</p>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-xl">
              <CurrencyDollarIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Clientes Activos</p>
              <p className="text-white text-3xl font-bold">{metrics.activeClients}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <UsersIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium">Total Visitas</p>
              <p className="text-white text-3xl font-bold">{metrics.totalVisits}</p>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-xl">
              <ArrowTrendingUpIcon className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-medium">Total Clientes</p>
              <p className="text-white text-3xl font-bold">{metrics.totalClients}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-xl">
              <ChartBarIcon className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ingresos Mensuales */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Ingresos Mensuales</h2>
          </div>
          <div className="h-80">
            <Bar data={incomeData} options={chartOptions} />
          </div>
        </div>

        {/* Distribución de Suscripciones */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Tipos de Suscripción</h2>
          </div>
          <div className="h-80">
            <Doughnut data={subscriptionData} options={doughnutOptions} />
          </div>
        </div>

        {/* Horas Pico */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-500/20 p-2 rounded-lg">
              <ClockIcon className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Horas Pico de Asistencia</h2>
          </div>
          <div className="h-80">
            <Line data={peakHoursData} options={chartOptions} />
          </div>
        </div>

        {/* Clientes y Renovaciones */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <UsersIcon className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Clientes Este Mes</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6 h-80 content-center">
            <div className="text-center">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl p-8 border border-emerald-500/20">
                <div className="flex items-center justify-center mb-4">
                  <ArrowUpIcon className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-emerald-300 text-sm font-medium mb-2">Nuevos Clientes</p>
                <p className="text-white text-4xl font-bold">{newClients}</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-8 border border-blue-500/20">
                <div className="flex items-center justify-center mb-4">
                  <ArrowDownIcon className="w-8 h-8 text-blue-400 transform rotate-45" />
                </div>
                <p className="text-blue-300 text-sm font-medium mb-2">Renovaciones</p>
                <p className="text-white text-4xl font-bold">{renewals}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clientes Más Constantes */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-yellow-500/20 p-2 rounded-lg">
            <StarIcon className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Top 5 Clientes Más Constantes</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {constantClients.map((client, index) => (
            <div key={client.email} className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-xl p-4 border border-slate-600/30 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  index === 1 ? 'bg-gray-400/20 text-gray-300' :
                  index === 2 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-slate-500/20 text-slate-300'
                }`}>
                  {index + 1}
                </div>
                {index < 3 && <StarIcon className="w-4 h-4 text-yellow-400" />}
              </div>
              <p className="text-white font-semibold text-sm mb-1 truncate">{client.name}</p>
              <p className="text-slate-400 text-xs mb-2 truncate">{client.email}</p>
              <div className="flex items-center gap-1">
                <ArrowTrendingUpIcon className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-bold text-sm">{client.visits}</span>
                <span className="text-slate-400 text-xs">visitas</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Reports;