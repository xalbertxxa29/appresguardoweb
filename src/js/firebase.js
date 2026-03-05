import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB7wgz1vL9GNhT8HL-TzvzaLI5Dduo82Iw",
    authDomain: "resguardo-b4d86.firebaseapp.com",
    projectId: "resguardo-b4d86",
    storageBucket: "resguardo-b4d86.firebasestorage.app",
    messagingSenderId: "454182824752",
    appId: "1:454182824752:web:f09be903adef25be4576f5",
    measurementId: "G-0MFVWNF6ZN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
