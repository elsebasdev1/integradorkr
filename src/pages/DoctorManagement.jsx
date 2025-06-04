import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, where
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { notifyError, notifySuccess } from '../utils/notify';

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
    notifySuccess('Médico agregado correctamente');
  };

  const remove = async (id) => {
    // Verificar si el médico tiene citas agendadas
    const citasSnap = await getDocs(
      query(collection(db, 'appointments'), where('doctorId', '==', id))
    );

    if (!citasSnap.empty) {
      notifyError('No se puede eliminar. Este médico tiene citas agendadas.');
      return;
    }

    if (!confirm('¿Eliminar médico?')) return;

    await deleteDoc(doc(db, 'doctors', id));
    setDoctors(ds => ds.filter(d => d.id !== id));
  };

  const [specialties, setSpecialties] = useState([]);
useEffect(() => {
  async function fetchSpecialties() {
    const snap = await getDocs(collection(db, 'specialties'));
    setSpecialties(snap.docs.map(d => d.data().name));
  }
  fetchSpecialties();
}, []);

const [view, setView] = useState('list'); // 'list' o 'add'
const [searchTerm, setSearchTerm] = useState('');

const dayNamesES = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo'
};


  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setView('list')}
          className={`px-4 py-2 rounded-md ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Listado de Médicos
        </button>
        <button
          onClick={() => setView('add')}
          className={`px-4 py-2 rounded-md ${view === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Agregar Médico
        </button>
      </div>

      {view === 'add' && (
      <form onSubmit={addDoctor} className="space-y-3 mb-8">
        <input
          className="border p-2 w-full"
          placeholder="Nombre"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
        />

        <select
          className="border p-2 w-full"
          value={form.specialty}
          onChange={e => setForm({ ...form, specialty: e.target.value })}
          required
        >
          <option value="">Selecciona especialidad</option>
          {specialties.map((spec, i) => (
            <option key={i} value={spec}>{spec}</option>
          ))}
        </select>
        <div className="flex gap-3 flex-wrap mb-2">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              className="w-4 h-4 rounded-full accent-blue-600"
              checked={form.days.length === WEEK.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setForm(f => ({ ...f, days: WEEK.map(d => d.code) }));
                } else {
                  setForm(f => ({ ...f, days: [] }));
                }
              }}
            />
            Todos
          </label>
          {WEEK.map(d => (
            <label key={d.code} className="flex items-center gap-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-blue-600"
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
        <div className="flex justify-between mt-6">
          <button
            onClick={() => nav('/admin')}
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Volver
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded">
            Agregar
          </button>
        </div>
      </form>
      )}

      {view === 'list' && (
        <>
          <input
            type="text"
            placeholder="Buscar médico o especialidad..."
            className="mb-4 w-full border p-2 rounded"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <ul className="space-y-2">
            {doctors
              .filter(d => {
                const term = searchTerm.toLowerCase();
                return (
                  d.name.toLowerCase().includes(term) ||
                  d.specialty.toLowerCase().includes(term)
                );
              })
              .map(d => (
                <li key={d.id} className="p-4 bg-white shadow rounded flex justify-between">
                  <div>
                    <p className="font-semibold">{d.name} – {d.specialty}</p>
                    <p>
                      Días:{' '}
                      {d.days.map(code => dayNamesES[code]).join(', ')}
                    </p>
                    <p>Horarios: {d.slots.length > 0 ? `${d.slots[0]} a ${d.slots[d.slots.length - 1]}` : '—'}</p>
                  </div>
                  <button onClick={() => remove(d.id)} className="text-red-600">Eliminar</button>
                </li>
              ))}
          </ul>
                <button
        onClick={() => nav('/admin')}
        className="mt-4 px-4 py-2 bg-gray-400 text-white rounded"
      >
        Volver
      </button>
        </>
      )}
    </div>
  );
}
