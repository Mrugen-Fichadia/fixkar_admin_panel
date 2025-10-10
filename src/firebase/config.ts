import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC-khbdV40-1Gu-je63tJgjyEy8i0s00-g",
    authDomain: "fixkar-d3d6b.firebaseapp.com",
    projectId: "fixkar-d3d6b",
    storageBucket: "fixkar-d3d6b.firebasestorage.app",
    messagingSenderId: "1072622423142",
    appId: "1:1072622423142:web:ef7aa339d9b4ed58a6f1a7",
    measurementId: "G-CXYB7DNSDZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
