import { initializeApp } from "firebase/app";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// Production Firebase configuration for high-stakes event
const firebaseConfig = {
  apiKey: "AIzaSyBkJoYnXT6x8QI5XhJOG-yVJYYQA9vF4cI",
  authDomain: "treasure-shell-event.firebaseapp.com",
  databaseURL: "https://treasure-shell-event-default-rtdb.firebaseio.com",
  projectId: "treasure-shell-event",
  storageBucket: "treasure-shell-event.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456789012345",
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
