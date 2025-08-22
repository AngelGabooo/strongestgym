import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, icon: Icon, children, className = '', ...props }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-md ${
          isActive
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${className}`
      }
      {...props}
    >
      {Icon && <Icon className="flex-shrink-0 h-5 w-5 mr-3" />}
      {children}
    </NavLink>
  );
};

NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default NavItem;