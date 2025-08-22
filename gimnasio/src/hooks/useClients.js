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
      const snapshot = await getDocs(clientsRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: calculateSubscriptionStatus(doc.data().expirationDate),
      }));
      console.log('Clientes cargados:', data); // Log para depuración
      setClients(data);
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
        qrCode: `QR-${pin}`, // Usar pin para el qrCode para unicidad
        expirationDate,
        status: calculateSubscriptionStatus(expirationDate),
      };
      const docRef = await addDoc(collection(db, 'clients'), newClient);
      await fetchClients();
      return { ...newClient, id: docRef.id }; // Usar docRef.id como ID oficial
    } catch (err) {
      console.error('Error en addClient:', err.code, err.message);
      throw new Error(`Error al registrar el cliente: ${err.message}`);
    }
  };

  const editClient = async (id, clientData) => {
    try {
      const clientRef = doc(db, 'clients', id);
      // Verificar si el documento existe en Firestore
      const clientDoc = await getDoc(clientRef);
      if (!clientDoc.exists()) {
        throw new Error(`No se encontró el documento del cliente con ID: ${id}`);
      }
      const existingClient = clients.find(client => client.id === id);
      if (!existingClient) {
        throw new Error('Cliente no encontrado en la lista local');
      }
      const expirationDate = calculateExpirationDate(
        clientData.paymentDate,
        clientData.subscriptionType,
        clientData.visitDays
      );
      const updatedClient = {
        ...clientData,
        id: existingClient.id,
        pin: existingClient.pin,
        qrCode: existingClient.qrCode,
        expirationDate,
        status: calculateSubscriptionStatus(expirationDate),
      };
      await updateDoc(clientRef, updatedClient);
      await fetchClients();
      return updatedClient;
    } catch (err) {
      console.error('Error en editClient:', err.code, err.message);
      throw new Error(`Error al actualizar el cliente: ${err.message}`);
    }
  };

  const removeClient = async (id) => {
    try {
      const clientRef = doc(db, 'clients', id);
      // Verificar si el documento existe
      const clientDoc = await getDoc(clientRef);
      if (!clientDoc.exists()) {
        throw new Error(`No se encontró el documento del cliente con ID: ${id}`);
      }
      await deleteDoc(clientRef);
      await fetchClients();
    } catch (err) {
      console.error('Error en removeClient:', err.code, err.message);
      throw new Error(`Error al eliminar el cliente: ${err.message}`);
    }
  };

  const registerAccess = async (client, type) => {
    try {
      const accessData = {
        id: Date.now().toString(),
        clientName: client.name,
        clientEmail: client.email,
        timestamp: getLocalTimestamp(),
        type,
        client: { status: client.status }
      };
      if (type === 'exit') {
        const todayRecords = await getTodayAccessRecords(client.email);
        const todayEntries = todayRecords.filter(r => r.type === 'entry');
        if (todayEntries.length === 0) {
          throw new Error('No hay una entrada registrada hoy para registrar una salida.');
        }
        const latestEntry = todayEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        const entryTime = new Date(latestEntry.timestamp);
        const exitTime = new Date(getLocalTimestamp());
        const activeTime = Math.round((exitTime - entryTime) / (1000 * 60));
        accessData.activeTime = activeTime;
      }
      await addDoc(collection(db, 'accessHistory'), accessData);
      return accessData;
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
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Error en getTodayAccessRecords:', err.code, err.message);
      throw new Error(`Error al obtener los registros de acceso: ${err.message}`);
    }
  };

  const fetchAccessHistory = async (clientEmail = null) => {
    try {
      const historyRef = collection(db, 'accessHistory');
      const snapshot = await getDocs(historyRef);
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
      const q = query(clientsRef, where('email', '==', email));
      const snapshot = await getDocs(q);
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
  };
};