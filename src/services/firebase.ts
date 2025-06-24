import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage as initializeStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5YUv8EfzzwXXwZcMw8O-QhgSaddudLEc",
  authDomain: "snappy-app-ef183.firebaseapp.com",
  projectId: "snappy-app-ef183",
  storageBucket: "snappy-app-ef183.firebasestorage.app",
  messagingSenderId: "729888460044",
  appId: "1:729888460044:web:9797fb19bbab7288018d29",
  measurementId: "G-BY63W1ZP5E"
};

// Initialize Firebase App (safe to do at module level)
const app = initializeApp(firebaseConfig);

// Lazy initialization for services
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Getter functions that initialize on first use
export const getAuth = () => {
  if (!auth) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
  return auth;
};

export const getDb = () => {
  if (!db) {
    db = getFirestore(app);
  }
  return db;
};

export const getStorage = () => {
  if (!storage) {
    storage = initializeStorage(app);
  }
  return storage;
};

export default app;