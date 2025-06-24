import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage as getFirebaseStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5YUv8EfzzwXXwZcMw8O-QhgSaddudLEc",
  authDomain: "snappy-app-ef183.firebaseapp.com",
  projectId: "snappy-app-ef183",
  storageBucket: "snappy-app-ef183.firebasestorage.app",
  messagingSenderId: "729888460044",
  appId: "1:729888460044:web:9797fb19bbab7288018d29",
  measurementId: "G-BY63W1ZP5E"
};

let app: FirebaseApp;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Initialize Firebase app if not already initialized to prevent errors on hot-reloads
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase initialization error", e);
    app = getApp(); // Fallback to getApp() if initialization fails
  }
} else {
  app = getApp();
}

// Lazy initialization for Firestore service
export const getDb = (): Firestore => {
  if (!db) {
    db = getFirestore(app);
  }
  return db;
};

// Lazy initialization for Storage service
export const getStorage = (): FirebaseStorage => {
  if (!storage) {
    storage = getFirebaseStorage(app);
  }
  return storage;
};

export default app;