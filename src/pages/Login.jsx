import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-80">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        <button
          onClick={login}
          className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition"
        >
          Ingresar con Google
        </button>
      </div>
    </div>
  );
}
