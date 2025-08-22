import ClientForm from '../molecules/ClientForm';

const ClientFormPage = () => {
  const handleSave = (clientData) => {
    console.log('Cliente guardado:', clientData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registrar Cliente - GimnasioFit
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <ClientForm onSave={handleSave} />
      </div>
    </div>
  );
};

export default ClientFormPage;