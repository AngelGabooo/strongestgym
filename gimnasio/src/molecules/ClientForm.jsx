import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isValid } from 'date-fns';
import { 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useClients } from '../hooks/useClients';

const ClientForm = ({ onSave, initialData = null, onCancel, className = '' }) => {
  const { addClient, editClient, findClientByEmail } = useClients();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subscriptionType: 'monthly',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    monthlyCost: 0,
    perVisitCost: 40,
    visitDays: 10,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const initialFormData = {
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        subscriptionType: initialData.subscriptionType || 'monthly',
        paymentDate: initialData.paymentDate 
          ? format(parseISO(initialData.paymentDate), 'yyyy-MM-dd') 
          : format(new Date(), 'yyyy-MM-dd'),
        monthlyCost: initialData.monthlyCost || 0,
        perVisitCost: initialData.perVisitCost || 40,
        visitDays: initialData.visitDays || 10,
      };
      
      setFormData(initialFormData);
    }
  }, [initialData]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-Z\s]*$/.test(formData.name.trim())) {
      newErrors.name = 'El nombre solo puede contener letras y espacios';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'El teléfono debe tener exactamente 10 dígitos';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email debe contener "@" y ser válido';
    }
    
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'La fecha de pago es requerida';
    } else if (!isValid(new Date(formData.paymentDate))) {
      newErrors.paymentDate = 'Fecha de pago inválida';
    }
    
    if (formData.subscriptionType === 'monthly') {
      if (isNaN(formData.monthlyCost) || formData.monthlyCost <= 0) {
        newErrors.monthlyCost = 'El costo mensual debe ser mayor a 0';
      }
    } else {
      if (isNaN(formData.perVisitCost) || formData.perVisitCost <= 0) {
        newErrors.perVisitCost = 'El costo por visita debe ser mayor a 0';
      }
      
      if (![10, 15].includes(parseInt(formData.visitDays))) {
        newErrors.visitDays = 'Los días de visita deben ser 10 o 15';
      }
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      if (/^[a-zA-Z\s]*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    } else if (name === 'phone') {
      if (/^[0-9]*$/.test(value) && value.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      const [year, month, day] = formData.paymentDate.split('-');
      const paymentDate = new Date(Date.UTC(year, month - 1, day, 6, 0, 0));
      const clientData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        subscriptionType: formData.subscriptionType,
        paymentDate: paymentDate.toISOString(),
        monthlyCost: parseFloat(formData.monthlyCost) || 0,
        perVisitCost: parseFloat(formData.perVisitCost) || 40,
        visitDays: formData.subscriptionType === 'per_visit' 
          ? parseInt(formData.visitDays) 
          : 1,
      };
      
      console.log('Datos enviados:', JSON.stringify(clientData, null, 2));
      
      let savedClient;
      if (initialData?.id) {
        // Check if the email is unchanged or belongs to the same client
        const existingClient = await findClientByEmail(clientData.email);
        if (existingClient && existingClient.id !== initialData.id) {
          throw new Error('El email ya está registrado por otro cliente');
        }
        savedClient = await editClient(initialData.id, clientData);
      } else {
        savedClient = await addClient(clientData);
      }
      
      onSave(savedClient);
      setIsSubmitting(false);
      
      if (!initialData) {
        setFormData({
          name: '',
          phone: '',
          email: '',
          subscriptionType: 'monthly',
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          monthlyCost: 0,
          perVisitCost: 40,
          visitDays: 10,
        });
      }
      
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      setErrors({ 
        form: error.message || 'Error al registrar el cliente. Por favor, intenta de nuevo.' 
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${className}`}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-6">
        {/* Sección de Información Personal */}
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/30">
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center mb-4">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2" />
            Información Personal
          </h3>
          
          <div className="space-y-4">
            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre completo *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 text-sm sm:text-base border ${
                    errors.name ? 'border-red-500' : 'border-gray-600/50'
                  } bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                  placeholder="Ingresa el nombre completo"
                  required
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{errors.name}</span>
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono *
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  className={`block w-full pl-10 pr-3 py-3 text-sm sm:text-base border ${
                    errors.phone ? 'border-red-500' : 'border-gray-600/50'
                  } bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                  placeholder="1234567890"
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico *
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 text-sm sm:text-base border ${
                    errors.email ? 'border-red-500' : 'border-gray-600/50'
                  } bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                  placeholder="cliente@email.com"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Información de Suscripción */}
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-gray-700/30">
          <h3 className="text-base sm:text-lg font-semibold text-white flex items-center mb-4">
            <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2" />
            Información de Suscripción
          </h3>
          
          <div className="space-y-4">
            {/* Primera fila: Tipo de suscripción y Fecha de pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de suscripción *
                </label>
                <select
                  name="subscriptionType"
                  value={formData.subscriptionType}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 text-sm sm:text-base border border-gray-600/50 bg-gray-900/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                >
                  <option value="monthly">Mensual</option>
                  <option value="per_visit">Por visita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha de pago *
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 text-sm sm:text-base border ${
                      errors.paymentDate ? 'border-red-500' : 'border-gray-600/50'
                    } bg-gray-900/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                    required
                  />
                </div>
                {errors.paymentDate && (
                  <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{errors.paymentDate}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Campos condicionados por tipo de suscripción */}
            {formData.subscriptionType === 'monthly' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Costo Mensual ($) *
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="monthlyCost"
                    min="0"
                    step="0.01"
                    value={formData.monthlyCost}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-3 text-sm sm:text-base border ${
                      errors.monthlyCost ? 'border-red-500' : 'border-gray-600/50'
                    } bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                    placeholder="0.00"
                    required
                  />
                </div>
                {errors.monthlyCost && (
                  <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{errors.monthlyCost}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Costo por Visita ($) *
                  </label>
                  <div className="relative">
                    <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="perVisitCost"
                      min="0"
                      step="0.01"
                      value={formData.perVisitCost}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-3 text-sm sm:text-base border ${
                        errors.perVisitCost ? 'border-red-500' : 'border-gray-600/50'
                      } bg-gray-900/50 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                      placeholder="40.00"
                      required
                    />
                  </div>
                  {errors.perVisitCost && (
                    <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{errors.perVisitCost}</span>
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Días de visita *
                  </label>
                  <select
                    name="visitDays"
                    value={formData.visitDays}
                    onChange={handleChange}
                    className={`block w-full px-3 py-3 text-sm sm:text-base border ${
                      errors.visitDays ? 'border-red-500' : 'border-gray-600/50'
                    } bg-gray-900/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm`}
                    required
                  >
                    <option value="10">10 días</option>
                    <option value="15">15 días</option>
                  </select>
                  {errors.visitDays && (
                    <p className="mt-1 text-xs sm:text-sm text-red-400 flex items-start">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{errors.visitDays}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Error general del formulario */}
        {errors.form && (
          <div className="bg-red-900/30 backdrop-blur-sm border border-red-500/50 rounded-2xl p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-200 text-sm">{errors.form}</p>
            </div>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base bg-gray-800/50 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-2 sm:order-1"
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center order-1 sm:order-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {initialData ? 'Actualizando...' : 'Registrando...'}
              </>
            ) : (
              <>
                {initialData ? 'Actualizar Cliente' : 'Registrar Cliente'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

ClientForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  onCancel: PropTypes.func,
  className: PropTypes.string,
};

export default ClientForm;