import React from 'react';

// Componentes de iconos SVG
const WrenchIcon = ({ className = "w-12 h-12 text-white" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = ({ className = "w-4 h-4 text-white" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const MailIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488"/>
  </svg>
);

const DumbbellIcon = ({ className = "w-8 h-8" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 4V2h4v2h4V2h4v2l.6.2c.5.2 1.2.5 1.4 1.3L20 8v8l-.1 1.5c-.2.8-.9 1.1-1.4 1.3L18 19v2h-4v-2H10v2H6v-2l-.6-.2c-.5-.2-1.2-.5-1.4-1.3L4 16V8l.1-1.5c.2-.8.9-1.1 1.4-1.3L6 5V4zm2 2v12h8V6H8z"/>
  </svg>
);

const MaintenancePage = () => {
  // Función para manejar el clic de WhatsApp
  const handleWhatsAppClick = () => {
    const phoneNumber = "5218144384806"; // Número sin espacios ni caracteres especiales
    const message = encodeURIComponent("Hola, necesito ayuda con respecto al sistema de STRONGEST Gym Villa Comaltitlán.");
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-80 h-80 bg-red-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: 'linear-gradient(rgba(255,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        {/* Logo y iconos principales */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse border-2 border-red-500/50">
              <WrenchIcon className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
            </div>
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center animate-spin shadow-lg">
              <AlertIcon className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center animate-bounce">
              <DumbbellIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Títulos principales */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 mb-4 tracking-tight">
            STRONGEST
          </h1>
          <div className="text-lg sm:text-xl text-gray-300 font-medium mb-2 tracking-wide">
            VILLA COMALTITLÁN
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            MANTENIMIENTO
          </h2>
          <p className="text-lg sm:text-xl text-red-300 font-semibold">
            Sistema Temporalmente Fuera de Servicio
          </p>
        </div>

        {/* Contenido principal */}
        <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-6 sm:p-8 mb-8 border border-red-500/30 shadow-2xl">
          <p className="text-base sm:text-lg text-gray-200 mb-8 leading-relaxed">
            Estamos mejorando nuestro sistema de gestión del gimnasio para ofrecerte una experiencia más potente y completa. 
            Durante este proceso, el acceso estará temporalmente restringido.
          </p>
          
          {/* Indicadores de estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center bg-red-900/40 rounded-2xl p-4 border border-red-500/40 backdrop-blur-sm">
              <ClockIcon className="w-8 h-8 text-red-400 mb-2 sm:mb-0 sm:mr-3" />
              <div className="text-center sm:text-left">
                <p className="text-red-200 font-bold text-lg">Tiempo Estimado</p>
                <p className="text-red-100 text-sm">2-4 horas</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center bg-gray-800/40 rounded-2xl p-4 border border-gray-600/40 backdrop-blur-sm">
              <WrenchIcon className="w-8 h-8 text-gray-300 mb-2 sm:mb-0 sm:mr-3" />
              <div className="text-center sm:text-left">
                <p className="text-gray-200 font-bold text-lg">Estado</p>
                <p className="text-gray-100 text-sm">Actualizaciones Activas</p>
              </div>
            </div>
          </div>

          {/* Barra de progreso mejorada */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-300 mb-3">
              <span className="font-semibold">Progreso del Mantenimiento</span>
              <span className="font-bold text-red-400">75%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-400 h-4 rounded-full shadow-lg transition-all duration-1000 ease-out animate-pulse" style={{width: '75%'}}>
                <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping"></div>
              </div>
            </div>
          </div>

          <div className="bg-red-900/30 rounded-2xl p-4 border border-red-600/50">
            <p className="text-gray-200 font-medium">
              🔥 <strong>STRONGEST</strong>. Gracias por tu paciencia.
            </p>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-gray-700/50 mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">¿Necesitas Ayuda Urgente?</h3>
          <div className="flex flex-col lg:flex-row gap-4 justify-center items-center">
            <a 
              href="mailto:a20624646@gmail.com" 
              className="flex items-center text-red-400 hover:text-red-300 transition-all duration-300 group bg-black/40 px-4 py-3 rounded-xl border border-red-500/30 hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/20"
            >
              <MailIcon className="w-6 h-6 mr-3 group-hover:animate-bounce" />
              <span className="font-medium">a20624646@gmail.com</span>
            </a>
            
            <div className="hidden lg:block w-px h-8 bg-gray-600"></div>
            
            <a 
              href="tel:+5218144384806" 
              className="flex items-center text-blue-400 hover:text-blue-300 transition-all duration-300 group bg-black/40 px-4 py-3 rounded-xl border border-blue-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <PhoneIcon className="w-6 h-6 mr-3 group-hover:animate-bounce" />
              <span className="font-medium">+52 81 4438 4806</span>
            </a>

            <div className="hidden lg:block w-px h-8 bg-gray-600"></div>
            
            <button
              onClick={handleWhatsAppClick}
              className="flex items-center text-green-400 hover:text-green-300 transition-all duration-300 group bg-black/40 px-4 py-3 rounded-xl border border-green-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer"
            >
              <WhatsAppIcon className="w-6 h-6 mr-3 group-hover:animate-bounce" />
              <span className="font-medium">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-gray-400 text-sm sm:text-base space-y-2">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-800/50">
            <p className="font-bold text-white mb-1">© 2025 STRONGEST Gym - Villa Comaltitlán</p>
            <p className="text-gray-300">Desarrollado por <span className="text-red-400 font-semibold">Biomey</span> - Angel Gabriel García Samayoa</p>
            <p className="mt-2 text-xs">Última actualización: {new Date().toLocaleString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>

      {/* Partículas flotantes mejoradas */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-500 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MaintenancePage;