import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, setDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const WEEK = [
  { code: 'mon', label: 'Lunes' },
  { code: 'tue', label: 'Martes' },
  { code: 'wed', label: 'Miércoles' },
  { code: 'thu', label: 'Jueves' },
  { code: 'fri', label: 'Viernes' },
  { code: 'sat', label: 'Sábado' }
];

// Función para generar horarios por hora
const generateHourlySlots = (start, end) => {
  const slots = [];
  let [hStart, mStart] = start.split(':').map(Number);
  const [hEnd, mEnd] = end.split(':').map(Number);

  while (hStart < hEnd || (hStart === hEnd && mStart < mEnd)) {
    const formatted = `${String(hStart).padStart(2, '0')}:${String(mStart).padStart(2, '0')}`;
    slots.push(formatted);
    hStart++;
    mStart = 0;
  }

  return slots;
};

export default function DoctorManagement() {
  const nav = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    days: [],
    horaInicio: '08:00',
    horaFin: '17:00'
  });

  useEffect(() => {
    getDocs(collection(db, 'doctors')).then(snap =>
      setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const toggleDay = code =>
    setForm(f => ({
      ...f,
      days: f.days.includes(code)
        ? f.days.filter(d => d !== code)
        : [...f.days, code]
    }));

  const addDoctor = async e => {
    e.preventDefault();

    const slotsArr = generateHourlySlots(form.horaInicio, form.horaFin);

    await setDoc(
      doc(db, 'specialties', form.specialty.toLowerCase()),
      { name: form.specialty },
      { merge: true }
    );

    await addDoc(collection(db, 'doctors'), {
      name: form.name,
      specialty: form.specialty,
      days: form.days,
      slots: slotsArr
    });

    setForm({
      name: '',
      specialty: '',
      days: [],
      horaInicio: '08:00',
      horaFin: '17:00'
    });

    const snap = await getDocs(collection(db, 'doctors'));
    setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const remove = async id => {
    if (confirm('¿Eliminar médico?')) {
      await deleteDoc(doc(db, 'doctors', id));
      setDoctors(ds => ds.filter(d => d.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Médicos</h2>

      <form onSubmit={addDoctor} className="space-y-3 mb-8">
        <input
          className="border p-2 w-full"
          placeholder="Nombre"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          className="border p-2 w-full"
          placeholder="Especialidad"
          value={form.specialty}
          onChange={e => setForm({ ...form, specialty: e.target.value })}
          required
        />

        <div className="flex gap-3 flex-wrap">
          {WEEK.map(d => (
            <label key={d.code} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.days.includes(d.code)}
                onChange={() => toggleDay(d.code)}
              />
              {d.label}
            </label>
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <label className="mb-1 font-medium">Desde:</label>
            <input
              type="time"
              className="border p-2"
              value={form.horaInicio}
              onChange={e => setForm({ ...form, horaInicio: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="mb-1 font-medium">Hasta:</label>
            <input
              type="time"
              className="border p-2"
              value={form.horaFin}
              onChange={e => setForm({ ...form, horaFin: e.target.value })}
              required
            />
          </div>
        </div>

        <button className="px-4 py-2 bg-green-600 text-white rounded">
          Agregar
        </button>
      </form>

      <ul className="space-y-2">
        {doctors.map(d => (
          <li key={d.id} className="p-4 bg-white shadow rounded flex justify-between">
            <div>
              <p className="font-semibold">{d.name} – {d.specialty}</p>
              <p>Días: {d.days.join(', ')}</p>
              <p>Horarios: {d.slots.join(', ')}</p>
            </div>
            <button onClick={() => remove(d.id)} className="text-red-600">Eliminar</button>
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
