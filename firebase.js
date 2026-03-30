// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBeXV5HFB4qVY5KtViQIbA9Sqv2uz4RGaI",
  authDomain: "campus-food-ordering-d5c44.firebaseapp.com",
  projectId: "campus-food-ordering-d5c44",
  storageBucket: "campus-food-ordering-d5c44.firebasestorage.app",
  messagingSenderId: "798065669671",
  appId: "1:798065669671:web:5a589cfd4d513b69d70002"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };