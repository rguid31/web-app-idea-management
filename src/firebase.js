import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA8ocgbm93KhaPgFq0QnYaiyuuCb3BPhFM",
  authDomain: "idea-board-app.firebaseapp.com",
  projectId: "idea-board-app",
  storageBucket: "idea-board-app.firebasestorage.app",
  messagingSenderId: "175710312811",
  appId: "1:175710312811:web:327ece79d8d855903e542e"
  // measurementId: "YOUR_MEASUREMENT_ID" // optional
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };