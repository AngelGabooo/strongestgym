import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzFRwZznDaa_OdRomMFvMF6EwVkNUKYGU",
  authDomain: "gimstron-cf71d.firebaseapp.com",
  projectId: "gimstron-cf71d",
  storageBucket: "gimstron-cf71d.firebasestorage.app",
  messagingSenderId: "418008650877",
  appId: "1:418008650877:web:e40d7a7da4ae421c1e4d14",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);