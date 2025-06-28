// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA8ocgbm93KhaPgFq0QnYaiyuuCb3BPhFM",
    authDomain: "idea-board-app.firebaseapp.com",
    projectId: "idea-board-app",
    storageBucket: "idea-board-app.firebasestorage.app",
    messagingSenderId: "175710312811",
    appId: "1:175710312811:web:327ece79d8d855903e542e"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services so your other files can use them
export const auth = getAuth(app);
export const db = getFirestore(app);