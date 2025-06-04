import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO, getDay } from 'date-fns';
import { notifySuccess, notifyError } from '../utils/notify';

const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function ScheduleAppointment() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors]         = useState([]);
  const [times, setTimes]             = useState([]);

  const [statusMsg, setStatusMsg]     = useState('');
  const [form, setForm] = useState({
    specialty: '',
    doctorId: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDoctors(docs);
        const uniq = Array.from(new Set(docs.map(d => d.specialty)));
        setSpecialties(uniq);
      } catch (err) {
        notifyError('Error al cargar los doctores.');
      }
    })();
  }, []);

  const filteredDoctors = doctors.filter(d => d.specialty === form.specialty);

  useEffect(() => {
    async function calcSlots() {
      if (!form.doctorId || !form.date) {
        setTimes([]);
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, 'doctors', form.doctorId));
        if (!docSnap.exists()) {
          setTimes([]);
          return;
        }
        const doctor = docSnap.data();

        const dayIndex = getDay(parseISO(form.date)); // 0=Sunday ... 6=Saturday
        const dayKey = WEEK_DAYS[dayIndex];

        if (!doctor.days.includes(dayKey)) {
          setTimes([]);
          return;
        }

        const clashSnap = await getDocs(
          query(
            collection(db, 'appointments'),
            where('doctorId', '==', form.doctorId),
            where('date', '==', form.date)
          )
        );
        const taken = clashSnap.docs.map(d => d.data().time);

        const libres = Array.isArray(doctor.slots)
          ? doctor.slots.filter(slot => !taken.includes(slot))
          : [];

        setTimes(libres);
      } catch (err) {
        console.error('[Slots] Error:', err);
        setTimes([]);
      }
    }

    calcSlots();
  }, [form.doctorId, form.date]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.specialty || !form.doctorId || !form.date || !form.time) {
      notifyError('Faltan campos por completar');
      return;
    }

    try {
      const clashSnap = await getDocs(
        query(
          collection(db, 'appointments'),
          where('doctorId', '==', form.doctorId),
          where('date', '==', form.date),
          where('time', '==', form.time)
        )
      );
      if (!clashSnap.empty) {
        notifyError('La fecha ya ha sido agendada');
        return;
      }

      await addDoc(collection(db, 'appointments'), {
        patientId:  user.uid,
        doctorId:   form.doctorId,
        specialty:  form.specialty,
        date:       form.date,
        time:       form.time,
        status:     'Pendiente'
      });
      notifySuccess('Cita agendada exitosamente!');
    } catch (err) {
      notifyError('Error al agendar la cita, intente más tarde');
    }
  };

  const handleCancel = () => {
    nav('/');
  };

  return (
    <>
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-xl font-bold mb-4">Agendar cita</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Especialidad */}
          <select
            className="border p-2 w-full"
            required
            value={form.specialty}
            onChange={e =>
              setForm({
                specialty: e.target.value,
                doctorId: '',
                date: '',
                time: ''
              })
            }
          >
            <option value="">Especialidad</option>
            {specialties.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>

          {/* Médico */}
          <select
            className="border p-2 w-full"
            required
            disabled={!filteredDoctors.length}
            value={form.doctorId}
            onChange={e =>
              setForm({
                ...form,
                doctorId: e.target.value,
                date: '',
                time: ''
              })
            }
          >
            <option value="">Médico</option>
            {filteredDoctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Fecha específica */}
            <DatePicker
            selected={form.date ? parseISO(form.date) : null}
            onChange={date => {
                const formatted = date.toISOString().split('T')[0];
                setForm({ ...form, date: formatted, time: '' });
            }}
            filterDate={date => {
                const selectedDoc = doctors.find(d => d.id === form.doctorId);
                if (!selectedDoc) return false;
                const jsDay = getDay(date); // 0 (Dom) a 6 (Sáb)
                const weekCode = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][jsDay];
                return selectedDoc.days.includes(weekCode);
            }}
            placeholderText="Fecha"
            className="border p-2 w-full"
            />

          {/* Hora */}
          <select
            className="border p-2 w-full"
            required
            disabled={!form.date}
            value={form.time}
            onChange={e => setForm({ ...form, time: e.target.value })}
          >
            <option value="">Hora</option>
            {times.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2 bg-gray-400 text-white rounded"
            >
              Volver
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-indigo-600 text-white rounded"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>

      {/* Mensaje flotante */}
      {statusMsg && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300">
          {statusMsg}
        </div>
      )}
    </>
  );
}
