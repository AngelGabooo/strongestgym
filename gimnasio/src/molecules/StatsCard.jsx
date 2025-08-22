import PropTypes from 'prop-types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

const StatsCard = ({ title, value, change, trend, icon: Icon, className = '', ...props }) => {
  return (
    <div
      className={`bg-white overflow-hidden shadow rounded-lg ${className}`}
      {...props}
    >
      <div className="p-5">
        <div className="flex items-center">
          {Icon && (
            <div className="flex-shrink-0">
              <Icon className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {change && (
          <div className="mt-1">
            <span
              className={`inline-flex items-center text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? (
                <ArrowUpIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0" />
              ) : (
                <ArrowDownIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0" />
              )}
              {change}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  change: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down']),
  icon: PropTypes.elementType,
  className: PropTypes.string,
};

export default StatsCard;