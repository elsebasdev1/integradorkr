import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../utils/notify';

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);

  const [statusMsg, setStatusMsg] = useState('');

  // Cargar datos del usuario desde Firestore
  useEffect(() => {
    async function fetchUserData() {
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setForm({
            name: data.displayName || 'N/A',
            address: data.address || 'N/A',
            phone: data.phone || 'N/A',
            email: user.email
          });
        } else {
          // Si no hay documento, usamos valores por defecto
          setForm({
            name: data.displayName,
            address: 'N/A',
            phone: 'N/A',
            email: user.email
          });
        }
      } catch (err) {
        notifyError('Ha ocurrido un error al cargar el perfil, intente más tarde');
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: form.name,
        address: form.address,
        phone: form.phone
      });
      notifySuccess('Perfil actualizado correctamente!');
    } catch (err) {
      notifyError('Ocurrió un error al actualizar el perfil, intente más tarde');
    }
  };

if (loading) return <p className="p-4 flex items-center justify-center h-screen">Cargando perfil...</p>;

  return (
    <>
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Editar Perfil</h2>

      <div className="space-y-4">
        <div>
          <label className="block font-medium">Correo electrónico:</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>

        <div>
          <label className="block font-medium">Nombre:</label>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Dirección:</label>
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Teléfono:</label>
          <input
            name="phone"
            type="text"
            value={form.phone}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Volver
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Guardar Cambios
          </button>
        </div>            
      </div>     
    </div>   
    {statusMsg && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300">
        {statusMsg}
      </div>
    )}       
    </> 
  );
}
