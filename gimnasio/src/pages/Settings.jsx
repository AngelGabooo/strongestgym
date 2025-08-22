import { useState } from 'react';
import Card from '../atoms/Card';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import PropTypes from 'prop-types';

const Settings = ({ className = '', ...props }) => {
  const [settings, setSettings] = useState({
    notificationsDaysBefore: 3,
    adminEmail: 'admin@gimnasiofit.com',
    gymName: 'GimnasioFit',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Configuración guardada correctamente');
  };

  return (
    <main className={`flex-1 overflow-y-auto p-6 ${className}`} {...props}>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Configuración</h1>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Notificaciones</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Días antes para notificar vencimiento"
            name="notificationsDaysBefore"
            type="number"
            min="1"
            max="30"
            value={settings.notificationsDaysBefore}
            onChange={handleChange}
            className="mb-4"
          />
          
          <h2 className="text-lg font-semibold mb-4 mt-6">Información del Gimnasio</h2>
          <Input
            label="Nombre del Gimnasio"
            name="gymName"
            type="text"
            value={settings.gymName}
            onChange={handleChange}
            className="mb-4"
          />
          
          <h2 className="text-lg font-semibold mb-4 mt-6">Administración</h2>
          <Input
            label="Email del Administrador"
            name="adminEmail"
            type="email"
            value={settings.adminEmail}
            onChange={handleChange}
            className="mb-4"
          />
          
          <div className="mt-6 flex justify-end">
            <Button type="submit">Guardar Cambios</Button>
          </div>
        </form>
      </Card>
    </main>
  );
};

Settings.propTypes = {
  className: PropTypes.string,
};

export default Settings;