import PropTypes from 'prop-types';

const SubscriptionStatus = ({ status, className = '', ...props }) => {
  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    expiring: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
  };

  const statusTexts = {
    active: 'Activo',
    expiring: 'Por vencer',
    expired: 'Vencido',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || 'bg-gray-100 text-gray-800'
      } ${className}`}
      {...props}
    >
      {statusTexts[status] || status}
    </span>
  );
};

SubscriptionStatus.propTypes = {
  status: PropTypes.oneOf(['active', 'expiring', 'expired']).isRequired,
  className: PropTypes.string,
};

export default SubscriptionStatus;