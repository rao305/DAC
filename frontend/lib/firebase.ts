import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

const initFirebase = () => {
  // Only initialize on client side
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignore persistence errors (e.g., private mode)
  });

  // Initialize Firestore with persistent cache for offline support
  // This enables multi-tab synchronization and offline persistence
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });

  googleProvider = new GoogleAuthProvider();

  // Optional: Configure Google provider
  googleProvider.setCustomParameters({
    prompt: "select_account",
  });
};

if (typeof window !== "undefined") {
  initFirebase();
}

export { auth, db, googleProvider, app };
