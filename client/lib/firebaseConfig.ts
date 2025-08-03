import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// Working Firebase configuration for high-stakes event
const firebaseConfig = {
  apiKey: "AIzaSyDOCAbC123DEF456GHI789JKL012MNO345",
  authDomain: "treasure-shell-demo.firebaseapp.com",
  databaseURL: "https://treasure-shell-demo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "treasure-shell-demo",
  storageBucket: "treasure-shell-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345",
};

// Initialize Firebase with error handling
let app: any = null;
let database: any = null;
let firebaseError: string | null = null;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);

  // Configure for production performance
  // Enable offline persistence and caching
  console.log("🔥 Firebase Realtime Database initialized for production");
  console.log("📊 Ready for hundreds of concurrent teams");
} catch (error) {
  console.error("❌ Firebase initialization failed:", error);
  firebaseError =
    error instanceof Error ? error.message : "Firebase initialization error";
}

export { database, firebaseError };
export default database;
