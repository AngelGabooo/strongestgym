import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Card from '../atoms/Card';

const AccessHistory = ({ history, className = '', ...props }) => {
  return (
    <Card className={`p-6 bg-gradient-to-br from-black via-gray-900 to-red-950 border border-red-800/50 shadow-xl shadow-red-900/20 ${className}`} {...props}>
      <h2 className="text-xl font-semibold text-white mb-4">Historial de Accesos</h2>
      <div className="overflow-x-auto bg-transparent">
        <table className="min-w-full divide-y divide-red-800/50">
          <thead className="bg-gradient-to-br from-black via-gray-900 to-red-950">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Fecha y Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-gradient-to-br from-black via-gray-900 to-red-950 divide-y divide-red-800/50">
            {history.length > 0 ? (
              history.map((entry) => (
                <tr key={entry.id} className="hover:bg-red-950/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{entry.clientName}</div>
                    <div className="text-sm text-gray-300">{entry.clientEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {format(parseISO(entry.timestamp), 'PPpp', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        entry.type === 'entry'
                          ? 'bg-green-900/20 text-green-400 border-green-500/30'
                          : 'bg-blue-900/20 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {entry.type === 'entry' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        entry.client.status === 'active'
                          ? 'bg-green-900/20 text-green-400 border-green-500/30'
                          : entry.client.status === 'expiring'
                            ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30'
                            : 'bg-red-900/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {entry.client.status === 'active' ? 'Activo' :
                       entry.client.status === 'expiring' ? 'Por Vencer' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-300 bg-gradient-to-br from-black via-gray-900 to-red-950">
                  No hay registros de acceso
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

AccessHistory.propTypes = {
  history: PropTypes.array.isRequired,
  className: PropTypes.string,
};

export default AccessHistory;