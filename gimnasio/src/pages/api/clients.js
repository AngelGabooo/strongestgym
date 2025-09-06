import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const clientsCollection = collection(db, 'clients');
    const snapshot = await getDocs(clientsCollection);
    const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(clients);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: `Error al obtener clientes: ${error.message}` });
  }
}