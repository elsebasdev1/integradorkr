import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { notifySuccess, notifyError } from '../utils/notify';

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const formatDate = (isoDateStr) => {
    try {
        const date = parseISO(isoDateStr);
        return format(date, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
    } catch {
        return isoDateStr;
    }
 };

  // 1. Estado: lista de citas del paciente
  const [appointments, setAppointments] = useState([]);

  // 2. Estado: mapa doctorId → doctorName
  const [doctorsMap, setDoctorsMap] = useState({});

  // 3. Estado: lista completa de doctores (para edición)
  const [doctorsList, setDoctorsList] = useState([]);

  // 4. Filtros:
  //    4.a) Búsqueda por nombre de médico
  const [searchTerm, setSearchTerm] = useState('');
  //    4.b) Filtro por estado (all, pendiente, confirmada)
  const [statusFilter, setStatusFilter] = useState('all');

  // 5. Estados para edición inline:
  //    - editingId: id de la cita que estamos editando (o null si no está en edición)
  const [editingId, setEditingId] = useState(null);
  //    - editForm: objeto que tendrá doctorId, day, time para la cita en edición
  const [editForm, setEditForm] = useState({
    doctorId: '',
    date: '',
    time: ''
  });
  //    - slotsDisponibles: array de horas libres para el doctor+día seleccionado en edición
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);

  const [profile, setProfile] = useState({ displayName: '' });

  useEffect(() => {
  if (!user) return;

  const fetchProfile = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    } catch (err) {
      notifyError('Error al cargar el perfil');
    }
  };

  fetchProfile();
}, [user]);


  // ─────────────────────────────────────────────────────────────────────────────
  // 1️⃣ Cargar doctoresMap y doctorsList al montar (DoctorID → Nombre)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const map = {};
        const list = [];
        snap.docs.forEach(d => {
          map[d.id] = d.data().name;
          list.push({ id: d.id, ...d.data() });
        });
        setDoctorsMap(map);
        setDoctorsList(list);
      } catch (err) {
        notifyError('Error al cargar los doctores');
      }
    }
    fetchDoctors();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2️⃣ Suscripción a citas en tiempo real para este usuario (paciente)
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', user.uid)
    );
    const unsub = onSnapshot(
      q,
      snap => {
        setAppointments(
          snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          }))
        );
      },
    );
    return unsub;
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 3️⃣ Función para eliminar una cita (solo si está pendiente)
  // ─────────────────────────────────────────────────────────────────────────────
  const deleteAppointment = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta cita?')) return;
    try {
      await deleteDoc(doc(db, 'appointments', id));
      // El onSnapshot en el useEffect se encargará de quitarla de la lista
      if (editingId === id) {
        // Si estábamos editando justo esa cita, salir de modo edición
        setEditingId(null);
      }
    } catch (err) {
      notifyError('Error al eliminar la cita');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 4️⃣ Función para comenzar la edición de una cita pendiente
  // ─────────────────────────────────────────────────────────────────────────────
  const startEditing = (appt) => {
    setEditingId(appt.id);
    // Pre‐llenamos el editForm con los valores actuales de la cita:
    setEditForm({
      doctorId: appt.doctorId,
      date:      appt.date || '',    // si usas día en vez de fecha
      time:     appt.time
    });
    setSlotsDisponibles([]); // reiniciamos slotsDisponibles; se recalcularán por useEffect
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5️⃣ Función para cancelar la edición
  // ─────────────────────────────────────────────────────────────────────────────
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ doctorId: '', date: '', time: '' });
    setSlotsDisponibles([]);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6️⃣ Hook para recalcular los slots libres cuando cambie editForm.doctorId o editForm.day
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function calcSlotsForEdit() {
      if (!editForm.doctorId || !editForm.date) {
        setSlotsDisponibles([]);
        return;
      }
      try {
        // 6.a) Traer datos del doctor elegido
        const docSnap = await getDoc(doc(db, 'doctors', editForm.doctorId));
        if (!docSnap.exists()) {
          setSlotsDisponibles([]);
          return;
        }
        const doctor = docSnap.data();
        // 6.b) Verificar que el día esté en doctor.days
        const dayIndex = getDay(parseISO(editForm.date)); // 0 = domingo, ..., 6 = sábado
        const dayCode = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dayIndex];

        if (!doctor.days.includes(dayCode)) {
        setSlotsDisponibles([]);
        return;
        }
        // 6.c) Consultar las citas ocupadas para ese doctor+día
        const clashSnap = await getDocs(
          query(
            collection(db, 'appointments'),
            where('doctorId', '==', editForm.doctorId),
            where('date',      '==', editForm.date)
          )
        );
        // 6.d) Crear array con las horas tomadas, salvo la propia cita que estamos editando
        const taken = clashSnap.docs
          .map(d => ({ id: d.id, time: d.data().time }))
          .filter(x => x.id !== editingId) // ignorar la cita actual para no bloquear su hora original
          .map(x => x.time);
        // 6.e) El array de slots libres es: doctor.slots - taken
        const libres = Array.isArray(doctor.slots)
          ? doctor.slots.filter(s => !taken.includes(s))
          : [];
        setSlotsDisponibles(libres);
      } catch (err) {
        notifyError('Error al calular el horario del médico');
        setSlotsDisponibles([]);
      }
    }
    calcSlotsForEdit();
  }, [editForm.doctorId, editForm.date, editingId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7️⃣ Función para guardar los cambios de la cita editada
  // ─────────────────────────────────────────────────────────────────────────────
  const saveEdit = async (id) => {
    // Validar que el paciente haya seleccionado doctor, día y hora
    if (!editForm.doctorId || !editForm.date || !editForm.time) {
      return notifyError('Faltan campos por completar');
    }
    try {
      // Verificar colisión: que no exista otra cita distinta con el mismo doctor+día+hora
      const clashSnap = await getDocs(
        query(
          collection(db, 'appointments'),
          where('doctorId', '==', editForm.doctorId),
          where('date',      '==', editForm.date),
          where('time',     '==', editForm.time)
        )
      );
      const collided = clashSnap.docs
        .map(d => d.id)
        .filter(apptId => apptId !== id); // ignore this appointment itself
      if (collided.length > 0) {
        return notifyError('Ya existe una cita en ese horario');
      }
      // 7.a) Hacer updateDoc cambiando doctorId, day y time
      await updateDoc(doc(db, 'appointments', id), {
        doctorId: editForm.doctorId,
        date:      editForm.date,
        time:     editForm.time
      });
      // 7.b) Resetear el modo edición
      setEditingId(null);
      setEditForm({ doctorId: '', date: '', time: '' });
      setSlotsDisponibles([]);
      notifySuccess('Cita actualizada correctamente!');
    } catch (err) {
      notifyError('Error al actualizar la cita');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 8️⃣ Derivar lista filtrada según statusFilter y searchTerm
  // ─────────────────────────────────────────────────────────────────────────────
  const visibleAppointments = appointments.filter(appt => {
    // Filtrar por estado
    if (statusFilter !== 'all' && appt.status !== statusFilter) {
      return false;
    }
    // Filtrar por búsqueda en nombre de médico
    if (searchTerm.trim()) {
      const doctorName = (doctorsMap[appt.doctorId] || '').toLowerCase();
      return doctorName.includes(searchTerm.trim().toLowerCase());
    }
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* ─── ENCABEZADO ───────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
        Bienvenido, {profile.displayName || 'Paciente'}
        </h2>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => nav('/schedule')}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Agendar Cita
          </button>
          <button
            onClick={() => nav('/profile')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
            Perfil
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ─── FILTROS ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl w-full mx-auto flex flex-wrap gap-4 items-center mb-6">
        {/* Filtro por estado */}
        <div>
          <label className="mr-2 font-medium">Estado:</label>
          <select
            className="border p-2 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Confirmada">Confirmadas</option>
          </select>
        </div>

        {/* Buscador por nombre de médico */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por médico..."
            className="w-full border p-2 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ─── LISTA DE CITAS FILTRADAS ─────────────────────────────────── */}
      {visibleAppointments.length === 0 ? (
        <p className="text-center text-gray-600">
          {appointments.length === 0
            ? 'No tienes citas agendadas.'
            : 'No se encontraron citas que coincidan con los filtros.'}
        </p>
      )
       : (
        <ul className="space-y-4">
          {visibleAppointments.map((appt) => {
            const doctorName  = doctorsMap[appt.doctorId] || 'Desconocido';
            const isEditing   = editingId === appt.id;
            const isPending   = appt.status === 'Pendiente';
            
            return (
              <li
                key={appt.id}
                className="relative bg-white rounded-lg shadow"
              >
              <span
                className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-semibold shadow
                  ${appt.status === 'Confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
              >
                {appt.status}
              </span>           
                {/* ─── MODO “SOLO LECTURA” DE LA CITA ─────────────────── */}
                <div className="p-4 flex flex-col sm:flex-row justify-between items-start text-base space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Columna de información */}
                  <div className="space-y-1">
                    <p><strong>Médico:</strong> {doctorName}</p>
                    <p><strong>Especialidad:</strong> {appt.specialty}</p>
                    <p><strong>Fecha:</strong> {formatDate(appt.date)}</p>
                    <p><strong>Hora:</strong> {appt.time}</p>                 
                  </div>

                  {/* Estado y acciones */}
                  <div className="flex flex-col gap-2 items-end self-center sm:w-[200px] ml-auto">
                    {!isEditing && (
                      <div className="flex gap-2 flex-wrap">
                        {isPending && (
                          <>
                            <button
                              onClick={() => startEditing(appt)}
                              className="px-3 py-1 bg-blue-500 text-white rounded"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteAppointment(appt.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                              Cancelar Cita
                            </button>
                          </>
                        )}

                        {appt.status === 'Confirmada' && (
                          <button
                            onClick={() => deleteAppointment(appt.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded"
                          >
                            Cancelar Cita
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* ─── MODO EDICIÓN INLINE ────────────────────────────── */}
                {isEditing && isPending && (
                  <div className="border-t px-4 py-4 bg-gray-50">
                    <h3 className="font-medium mb-2">Editar Cita</h3>
                    <div className="space-y-3">

                      {/* ▷ SELECT: Médico (solo de la misma especialidad) ▷ */}
                      <div>
                        <label className="block mb-1 font-medium">
                          Médico:
                        </label>
                        <select
                          className="border p-2 w-full rounded"
                          value={editForm.doctorId}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              doctorId: e.target.value,
                              date:      '',
                              time:     ''
                            }))
                          }
                        >
                          <option value="">Selecciona médico</option>
                          {/* Filtrar doctoresList por la misma especialidad de esta cita */}
                          {doctorsList
                            .filter((d) => d.specialty === appt.specialty)
                            .map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                        </select>
                      </div>

                    {/* ▷ CALENDARIO: Fecha específica ▷ */}
                    <div>
                    <label className="block mb-1 font-medium">Fecha:</label>
                    <DatePicker
                        selected={editForm.date ? parseISO(editForm.date) : null}
                        onChange={(date) => {
                        const formatted = format(date, 'yyyy-MM-dd');
                        setEditForm((f) => ({
                            ...f,
                            date: formatted,
                            time: ''
                        }));
                        }}
                        filterDate={(date) => {
                        const docObj = doctorsList.find((d) => d.id === editForm.doctorId);
                        if (!docObj?.days?.length) return false;
                        const jsDay = getDay(date); // 0 = domingo ... 6 = sábado
                        const dayCode = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][jsDay];
                        return docObj.days.includes(dayCode);
                        }}
                        placeholderText="Fecha"
                        className="border p-2 w-full rounded"
                        dateFormat="dd/MM/yyyy"
                    />
                    </div>


                      {/* ▷ SELECT: Hora ▷ */}
                      <div>
                        <label className="block mb-1 font-medium">Hora:</label>
                        <select
                          className="border p-2 w-full rounded"
                          value={editForm.time}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              time: e.target.value
                            }))
                          }
                          disabled={!editForm.date}
                        >
                          <option value="">Selecciona hora</option>
                          {slotsDisponibles.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* ▷ Botones Guardar Cambios / Cancelar ▷ */}
                      <div className="flex gap-2">
                        <button
                          onClick={cancelEditing}
                          className="flex-1 py-2 bg-gray-400 text-white rounded"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(appt.id)}
                          className="flex-1 py-2 bg-indigo-600 text-white rounded"
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* ─── FIN MODO EDICIÓN ──────────────────────────────── */}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
