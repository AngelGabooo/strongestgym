import PropTypes from 'prop-types';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XMarkIcon,
  ChatBubbleBottomCenterTextIcon // Ícono genérico para WhatsApp
} from '@heroicons/react/24/outline';

const CustomAlertModal = ({ isOpen, onClose, type = 'info', message, actionButton = null }) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-8 h-8 text-green-400 animate-pulse" />,
          bg: 'bg-gradient-to-r from-green-600/20 to-green-700/20',
          border: 'border-green-500/30',
          text: 'text-green-400',
          title: '¡Éxito!'
        };
      case 'error':
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8 text-red-400 animate-pulse" />,
          bg: 'bg-gradient-to-r from-red-600/20 to-red-700/20',
          border: 'border-red-500/30',
          text: 'text-red-400',
          title: 'Error'
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400 animate-pulse" />,
          bg: 'bg-gradient-to-r from-yellow-600/20 to-yellow-700/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          title: 'Advertencia'
        };
      case 'whatsapp':
        return {
          icon: <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-green-500 animate-bounce" />,
          bg: 'bg-gradient-to-r from-green-500/20 to-green-600/20',
          border: 'border-green-500/30',
          text: 'text-green-500',
          title: '¡Enviado por WhatsApp!'
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="w-8 h-8 text-gray-400 animate-pulse" />,
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
      <div className={`relative bg-black/40 backdrop-blur-xl ${styles.bg} ${styles.border} rounded-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-500 scale-100 hover:scale-105 shadow-2xl shadow-${styles.text.split('-')[1]}-500/30 animate-in fade-in-50 zoom-in-95`}>
        {/* Header con logo del gimnasio */}
        <div className="text-center mb-4 border-b border-gray-600/30 pb-3">
          <h2 className="text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent tracking-wide">
            💪 STRONGEST GYM
          </h2>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 bg-gray-800/50 hover:bg-red-700/50 rounded-full border border-gray-600/50 text-gray-300 hover:text-white transition-all duration-200 hover:rotate-90"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {styles.icon}
            <h3 className={`ml-2 text-xl font-bold ${styles.text}`}>{styles.title}</h3>
          </div>
          <p className="text-gray-200 text-sm sm:text-base mb-6">{message}</p>
          
          <div className="flex justify-center space-x-4">
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`px-6 py-3 bg-gradient-to-r from-${styles.text.split('-')[1]}-600 to-${styles.text.split('-')[1]}-700 hover:from-${styles.text.split('-')[1]}-700 hover:to-${styles.text.split('-')[1]}-800 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-${styles.text.split('-')[1]}-500/25 transform hover:scale-105`}
              >
                {actionButton.label}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 rounded-xl border border-gray-600/50 transition-all duration-200 transform hover:scale-105"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Footer con créditos del desarrollador */}
        <div className="mt-4 pt-3 border-t border-gray-600/30 text-center">
          <p className="text-xs text-gray-400">
            Página desarrollada por{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent font-semibold">
              Biomey - Angel Gabriel
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

CustomAlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'whatsapp']),
  message: PropTypes.string.isRequired,
  actionButton: PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func
  })
};

export default CustomAlertModal;