import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Scanner from './pages/Scanner';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import MaintenancePage from './pages/MaintenancePage'; // Importar la página de mantenimiento
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// VARIABLE DE CONTROL DE MANTENIMIENTO
// Cambia este valor a true para activar el modo mantenimiento
// Cambia este valor a false para desactivar el modo mantenimiento
const MAINTENANCE_MODE = false

function App() {
  // Si el modo mantenimiento está activado, mostrar solo la página de mantenimiento
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  // Si no está en mantenimiento, mostrar la aplicación normal
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute allowedRoles={['admin', 'staff', 'qrScanner']}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute allowedRoles={['admin', 'staff']}>
                <Clients />
              </PrivateRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <PrivateRoute allowedRoles={['admin', 'staff', 'qrScanner']}>
                <Scanner />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <History />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <Settings />
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;