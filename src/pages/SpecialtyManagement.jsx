import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  getDoc
} from 'firebase/firestore';

import { useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../utils/notify';

export default function SpecialtyManagement() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState([]);

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    const snap = await getDocs(collection(db, 'specialties'));
    setSpecialties(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const addSpecialty = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addDoc(collection(db, 'specialties'), { name: name.trim() });
    setName('');
    loadSpecialties();
    notifySuccess('Especialidad agregada correctamente!');
  };

    const removeSpecialty = async (id) => {
    const specialtyDoc = doc(db, 'specialties', id);
    const specialtySnap = await getDoc(specialtyDoc);
    if (!specialtySnap.exists()) return;

    const specialtyName = specialtySnap.data().name;

    // Validar si hay citas con esa especialidad
    const citasSnap = await getDocs(
        query(collection(db, 'appointments'), where('specialty', '==', specialtyName))
    );

    if (!citasSnap.empty) {
        notifyError('No se puede eliminar. Esta especialidad tiene citas agendadas.');
        return;
    }

    if (!confirm(`¿Está seguro de eliminar esta especialidad?`)) return;

    await deleteDoc(specialtyDoc);
    loadSpecialties();
    };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Especialidades</h2>
      </header>

      <form onSubmit={addSpecialty} className="mb-6 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de especialidad"
          className="border p-2 flex-1 rounded"
        />
        <button className="px-4 py-2 bg-green-600 text-white rounded-md">
          Agregar
        </button>
      </form>

      <ul className="space-y-2">
        {specialties.map(spec => (
          <li key={spec.id} className="flex justify-between items-center p-3 bg-white shadow rounded">
            <span>{spec.name}</span>
            <button
              onClick={() => removeSpecialty(spec.id)}
              className="text-red-600"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
        <button
          onClick={() => nav('/admin')}
          className="mt-6 px-4 py-2 bg-gray-400 text-white rounded"
        >
          Volver
        </button>
    </div>
  );
}
