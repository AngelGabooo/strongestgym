import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../atoms/LoadingSpinner';
import Layout from '../organisms/Layout';
import PropTypes from 'prop-types';

const PrivateRoute = ({ children, allowedRoles = ['admin', 'staff', 'qrScanner'] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  // Verificar si el rol del usuario está en los roles permitidos
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <Layout>{children}</Layout>;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default PrivateRoute;