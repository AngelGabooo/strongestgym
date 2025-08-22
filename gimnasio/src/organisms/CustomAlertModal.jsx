import PropTypes from 'prop-types';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

const CustomAlertModal = ({ isOpen, onClose, type = 'info', message, actionButton = null }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-8 h-8 text-green-400" />,
          bg: 'bg-gradient-to-r from-green-600/20 to-green-700/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          title: '¡Éxito!'
        };
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />,
          bg: 'bg-gradient-to-r from-red-600/20 to-red-700/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          title: 'Error'
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />,
          bg: 'bg-gradient-to-r from-yellow-600/20 to-yellow-700/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          title: 'Advertencia'
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8 text-gray-400" />,
          bg: 'bg-gradient-to-r from-gray-600/20 to-gray-700/20',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          title: 'Información'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className={`relative bg-black/40 backdrop-blur-xl ${styles.bg} ${styles.border} rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 shadow-lg shadow-${styles.text.split('-')[1]}-500/20`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 bg-gray-800/50 hover:bg-red-700/50 rounded-full border border-gray-600/50 text-gray-300 hover:text-white transition-all duration-200"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {styles.icon}
            <h3 className={`ml-2 text-xl font-semibold ${styles.text}`}>{styles.title}</h3>
          </div>
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex justify-center space-x-4">
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`px-6 py-3 bg-gradient-to-r from-${styles.text.split('-')[1]}-600 to-${styles.text.split('-')[1]}-700 hover:from-${styles.text.split('-')[1]}-700 hover:to-${styles.text.split('-')[1]}-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-${styles.text.split('-')[1]}-500/25`}
              >
                {actionButton.label}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-xl border border-gray-600/50 transition-all duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

CustomAlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  message: PropTypes.string.isRequired,
  actionButton: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func
  })
};

export default CustomAlertModal;