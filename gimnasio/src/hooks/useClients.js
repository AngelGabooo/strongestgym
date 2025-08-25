import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateExpirationDate, calculateSubscriptionStatus, getLocalTimestamp } from '../utils/helpers';

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const clientsRef = collection(db, 'clients');
      const snapshot = await getDocs(clientsRef, { source: 'server' });
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: calculateSubscriptionStatus(doc.data().expirationDate),
      }));
      
      // Eliminar duplicados basados en id
      const uniqueData = Array.from(
        new Map(data.map(client => [client.id, client])).values()
      );
      
      console.log('Clientes cargados:', uniqueData);
      const idCount = data.reduce((acc, client) => {
        acc[client.id] = (acc[client.id] || 0) + 1;
        return acc;
      }, {});
      console.log('Conteo de IDs:', idCount);
      
      setClients(uniqueData);
      setError(null);
    } catch (err) {
      console.error('Error en fetchClients:', err.code, err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const addClient = async (clientData) => {
    try {
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      const expirationDate = calculateExpirationDate(
        clientData.paymentDate,
        clientData.subscriptionType,
        clientData.visitDays
      );
      const newClient = {
        ...clientData,
        pin,
        qrCode: `QR-${pin}`,
        expirationDate,
        status: calculateSubscriptionStatus(expirationDate),
      };
      const docRef = await addDoc(collection(db, 'clients'), newClient);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchClients();
      return { ...newClient, id: docRef.id };
    } catch (err) {
      console.error('Error en addClient:', err.code, err.message);
      throw new Error(`Error al registrar el cliente: ${err.message}`);
    }
  };

  const editClient = async (id, clientData) => {
    try {
      console.log('Intentando editar cliente con ID:', id, 'Datos:', clientData);
      let clientRef = doc(db, 'clients', id);
      let clientDoc = await getDoc(clientRef, { source: 'server' });
      if (!clientDoc.exists()) {
        const q = query(collection(db, 'clients'), where('id', '==', id));
        const snapshot = await getDocs(q, { source: 'server' });
        if (snapshot.empty) {
          throw new Error(`No se encontró el documento del cliente con ID: ${id}`);
        }
        clientRef = doc(db, 'clients', snapshot.docs[0].id);
        clientDoc = snapshot.docs[0];
        console.log('Cliente encontrado usando customId:', id, 'ID de Firestore:', snapshot.docs[0].id);
      }

      const existingClient = clients.find(client => client.id === id);
      if (!existingClient) {
        console.warn('Cliente no encontrado en la lista local, usando datos de Firestore');
      }
      
      const expirationDate = calculateExpirationDate(
        clientData.paymentDate,
        clientData.subscriptionType,
        clientData.visitDays
      );
      const updatedClient = {
        ...clientData,
        id: clientDoc.id,
        pin: existingClient?.pin || clientDoc.data().pin,
        qrCode: existingClient?.qrCode || clientDoc.data().qrCode,
        expirationDate,
        status: calculateSubscriptionStatus(expirationDate),
      };
      await updateDoc(clientRef, updatedClient);
      await fetchClients();
      console.log('Cliente actualizado:', updatedClient);
      return updatedClient;
    } catch (err) {
      console.error('Error en editClient:', err.code, err.message);
      throw new Error(`Error al actualizar el cliente: ${err.message}`);
    }
  };

  const removeClient = async (id) => {
    try {
      console.log('Intentando eliminar cliente con ID:', id);
      const clientRef = doc(db, 'clients', id);
      const clientDoc = await getDoc(clientRef, { source: 'server' });
      if (!clientDoc.exists()) {
        const q = query(collection(db, 'clients'), where('id', '==', id));
        const snapshot = await getDocs(q, { source: 'server' });
        if (snapshot.empty) {
          throw new Error(`No se encontró el documento del cliente con ID: ${id}`);
        }
        const docRef = doc(db, 'clients', snapshot.docs[0].id);
        await deleteDoc(docRef);
        console.log('Cliente eliminado usando customId:', id);
      } else {
        await deleteDoc(clientRef);
        console.log('Cliente eliminado con ID de Firestore:', id);
      }
      await fetchClients();
    } catch (err) {
      console.error('Error en removeClient:', err.code, err.message);
      throw new Error(`Error al eliminar el cliente: ${err.message}`);
    }
  };

  const registerAccess = async (client, type) => {
    try {
      console.log('Registrando acceso:', { client, type });
      const clientStatus = calculateSubscriptionStatus(client.expirationDate);
      console.log('Estado del cliente:', clientStatus);

      if (type === 'entry') {
        if (clientStatus === 'expired') {
          const accessData = {
            id: Date.now().toString(),
            clientName: client.name,
            clientEmail: client.email,
            timestamp: getLocalTimestamp(),
            type: 'denied',
            client: { status: clientStatus },
            reason: 'Suscripción vencida'
          };
          console.log('Guardando acceso denegado:', accessData);
          await addDoc(collection(db, 'accessHistory'), accessData);
          throw new Error('Acceso denegado: Suscripción vencida. Por favor, renueve su suscripción.');
        } else {
          const accessData = {
            id: Date.now().toString(),
            clientName: client.name,
            clientEmail: client.email,
            timestamp: getLocalTimestamp(),
            type: 'entry',
            client: { status: clientStatus }
          };
          console.log('Guardando entrada:', accessData);
          await addDoc(collection(db, 'accessHistory'), accessData);
          return accessData;
        }
      } else if (type === 'exit') {
        const todayRecords = await getTodayAccessRecords(client.email);
        console.log('Registros de hoy:', todayRecords);
        const todayEntries = todayRecords.filter(r => r.type === 'entry');
        if (todayEntries.length === 0) {
          throw new Error('No hay una entrada registrada hoy para registrar una salida.');
        }
        const latestEntry = todayEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const entryTime = new Date(latestEntry.timestamp);
        const exitTime = new Date(getLocalTimestamp());
        const activeTime = Math.round((exitTime - entryTime) / (1000 * 60));
        const accessData = {
          id: Date.now().toString(),
          clientName: client.name,
          clientEmail: client.email,
          timestamp: getLocalTimestamp(),
          type: 'exit',
          client: { status: clientStatus },
          activeTime
        };
        console.log('Guardando salida:', accessData);
        await addDoc(collection(db, 'accessHistory'), accessData);
        return accessData;
      }
    } catch (err) {
      console.error('Error en registerAccess:', err.code, err.message);
      throw new Error(`Error al registrar el acceso: ${err.message}`);
    }
  };

  const getTodayAccessRecords = async (clientEmail) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, 'accessHistory'),
        where('clientEmail', '==', clientEmail),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString()),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q, { source: 'server' });
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error en getTodayAccessRecords:', err.code, err.message);
      throw new Error(`Error al obtener los registros de acceso: ${err.message}`);
    }
  };

  const fetchAccessHistory = async (clientEmail = null) => {
    try {
      const historyRef = collection(db, 'accessHistory');
      const snapshot = await getDocs(historyRef, { source: 'server' });
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (clientEmail) {
        return data.filter(entry => entry.clientEmail === clientEmail);
      }
      return data;
    } catch (err) {
      console.error('Error en fetchAccessHistory:', err.code, err.message);
      throw new Error(`Error al obtener el historial de acceso: ${err.message}`);
    }
  };

  const findClientByEmail = async (email) => {
    try {
      const clientsRef = collection(db, 'clients');
      const q = query(clientsRef, where('email', '==', email.trim()));
      const snapshot = await getDocs(q, { source: 'server' });
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data(), status: calculateSubscriptionStatus(doc.data().expirationDate) };
      }
      return null;
    } catch (err) {
      console.error('Error en findClientByEmail:', err.code, err.message);
      throw new Error(`Error al buscar cliente por email: ${err.message}`);
    }
  };

  const fetchAllAccessHistory = async () => {
    try {
      const historyRef = collection(db, 'accessHistory');
      const snapshot = await getDocs(historyRef, { source: 'server' });
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error en fetchAllAccessHistory:', err.code, err.message);
      throw new Error(`Error al obtener todo el historial de acceso: ${err.message}`);
    }
  };

  const deleteAllAccessHistory = async () => {
    try {
      const historyRef = collection(db, 'accessHistory');
      const snapshot = await getDocs(historyRef, { source: 'server' });
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('Todos los registros de acceso han sido eliminados');
    } catch (err) {
      console.error('Error en deleteAllAccessHistory:', err.code, err.message);
      throw new Error(`Error al eliminar el historial de acceso: ${err.message}`);
    }
  };

  return {
    clients,
    loading,
    error,
    addClient,
    editClient,
    removeClient,
    refreshClients: fetchClients,
    registerAccess,
    getTodayAccessRecords,
    fetchAccessHistory,
    findClientByEmail,
    fetchAllAccessHistory,
    deleteAllAccessHistory,
  };
};