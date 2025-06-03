import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCa9ctBnQkLA77yJftvbOKt1xpIIloSKjk",
  authDomain: "integrador-kr.firebaseapp.com",
  projectId: "integrador-kr",
  storageBucket: "integrador-kr.firebasestorage.app",
  messagingSenderId: "964268057096",
  appId: "1:964268057096:web:5d7f8e24456dcbda8c67bd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
