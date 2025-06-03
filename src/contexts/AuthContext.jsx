import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [role, setRole]     = useState(null);   // 'admin' o 'patient'
  const [loadingAuth, setLoadingAuth] = useState(true);

  const login  = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  useEffect(() => {
    // Listener de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // No hay usuario autenticado
        setUser(null);
        setRole(null);
        setLoadingAuth(false);
        return;
      }

      // Usuario autenticado: comprobar (o crear) documento en /users/{uid}
      const userRef = doc(db, 'users', currentUser.uid);

      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          // Si no existe el doc, lo creamos con rol "patient" por defecto
          await setDoc(userRef, {
            displayName: currentUser.displayName || '',
            email:       currentUser.email || '',
            role:        'patient',
            createdAt:   new Date()
          });
          setRole('patient');
        } else {
          // Si ya existe, LEEMOS su campo role (sin sobrescribirlo)
          const data = snap.data();
          setRole(data.role || 'patient');
        }
      } catch (error) {
        console.error('Error leyendo o creando /users/{uid}:', error);
        // En caso de error, forzamos logout para no quedar en estado inconsistente:
        await signOut(auth);
        setUser(null);
        setRole(null);
        setLoadingAuth(false);
        return;
      }

      setUser(currentUser);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
