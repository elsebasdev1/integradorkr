import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const formatDate = (isoDateStr) => {
  try {
    const date = parseISO(isoDateStr);
    return format(date, "EEEE, dd 'de' MMMM 'del' yyyy", { locale: es });
  } catch {
    return isoDateStr;
  }
};

const deleteAppointment = async (id) => {
  if (!window.confirm('¿Deseas eliminar esta cita?')) return;
  try {
    await deleteDoc(doc(db, 'appointments', id));
  } catch (err) {
    console.error('Error eliminando cita:', err);
    alert('No se pudo eliminar la cita.');
  }
};


export default function AdminDashboard() {
  const { logout } = useAuth();
  const nav = useNavigate();

  // Lista completa de citas (originales de Firestore)
  const [appointments, setAppointments] = useState([]);
  // Mapas para resolver nombres desde IDs
  const [doctorsMap, setDoctorsMap]     = useState({}); // { [doctorId]: doctorName }
  const [usersMap, setUsersMap]         = useState({}); // { [userId]: displayName }

  // Filtros y búsqueda
  const [statusFilter, setStatusFilter] = useState('all');      // 'all' | 'pendiente' | 'confirmada'
  const [searchTerm, setSearchTerm]     = useState('');         // cadena para buscar en nombres

  // 1. Cargar datos iniciales: citas, doctores y usuarios
  useEffect(() => {
    // a) Cargar citas
    async function fetchAppointments() {
      const snap = await getDocs(collection(db, 'appointments'));
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }

    // b) Cargar doctores (para doctorName)
    async function fetchDoctors() {
      const snap = await getDocs(collection(db, 'doctors'));
      const map = {};
      snap.docs.forEach(d => {
        map[d.id] = d.data().name;
      });
      setDoctorsMap(map);
    }

    // c) Cargar usuarios (para pacienteName)
    async function fetchUsers() {
      const snap = await getDocs(collection(db, 'users'));
      const map = {};
      snap.docs.forEach(d => {
        const data = d.data();
        map[d.id] = {
      name: data.displayName || data.email || d.id,
      address: data.address || 'N/A',
      phone: data.phone || 'N/A'            
        };
      });
      setUsersMap(map);
    }

    fetchAppointments();
    fetchDoctors();
    fetchUsers();
  }, []);

  // 2. Función para confirmar una cita (cambia status a 'confirmada')
  const confirmAppointment = async (id) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'Confirmada' });
    setAppointments(apps =>
      apps.map(a => (a.id === id ? { ...a, status: 'Confirmada' } : a))
    );
  };

  // 3. Derivar la lista filtrada según statusFilter y searchTerm
    const filteredAppointments = appointments.filter(appt => {
    // 3.a) Filtrar por estado
    if (statusFilter !== 'all' && appt.status !== statusFilter) {
        return false;
    }

    // 3.b) Resolver nombres de médico y paciente
    const doctorName = doctorsMap[appt.doctorId] || 'N/A';
    const userData = usersMap[appt.patientId]; // ESTA LÍNEA FALTABA
    const patientName = userData?.name || appt.patientId;

    // 3.c) Búsqueda
    const term = searchTerm.trim().toLowerCase();
    if (term === '') return true;

    const hayEnDoctor = doctorName.toLowerCase().includes(term);
    const hayEnPaciente = patientName.toLowerCase().includes(term);
    return hayEnDoctor || hayEnPaciente;
    });


  return (
  <div className="p-6 max-w-4xl mx-auto">
    <header className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold">Panel de Administrador</h2>
      <div className="flex gap-2">
        <button
          onClick={() => nav('/admin/doctors')}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
        >
          Médicos
        </button>
        <button
          onClick={() => nav('/admin/users')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Usuarios
        </button>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-md"
        >
          Salir
        </button>
      </div>
    </header>
      {/* ─── Filtros y búsqueda ───────────────────────────── */}
      <div className="max-w-2xl w-full mx-auto flex flex-wrap gap-4 items-center mb-6">
        {/* Filtro por estado */}
        <div>
          <label className="mr-2 font-medium">Estado:</label>
          <select
            className="border p-1 rounded"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Confirmada">Confirmadas</option>
          </select>
        </div>

        {/* Búsqueda por nombre de paciente o médico */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por paciente o médico..."
            className="w-full border p-2 rounded"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ─── Lista de citas filtradas ─────────────────────── */}
      {filteredAppointments.length === 0 ? (
        <p className="text-center text-gray-600">No hay citas que coincidan.</p>
      ) : (
        <ul className="space-y-4">
          {filteredAppointments.map(appt => {
            const doctorName  = doctorsMap[appt.doctorId]  || '—';

            const userData = usersMap[appt.patientId];
            const patientName = userData?.name || appt.patientId;
            const patientAddress = userData?.address || 'N/A';
            const patientPhone = userData?.phone || 'N/A';

            return (
              <li
                key={appt.id}
                className="p-4 bg-white rounded-lg shadow flex flex-col sm:flex-row justify-between items-start sm:items-stretch max-w-4xl mx-auto"
              >
                <div>
                  <p><strong>Paciente:</strong> {patientName}</p>
                  <p><strong>Dirección:</strong> {patientAddress}</p>
                  <p><strong>Teléfono:</strong> {patientPhone}</p>
                  <p><strong>Médico:</strong> {doctorName}</p>
                    <p>
                    <span className="font-medium">Fecha:</span>{' '}
                    {formatDate(appt.date)}
                    </p>
                  <p><strong>Hora:</strong> {appt.time}</p>
                  <p><strong>Especialidad:</strong> {appt.specialty}</p>
                  <p>
                    <strong>Estado:</strong>{' '}
                    <span
                      className={`font-semibold ${
                        appt.status === 'Confirmada' ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </p>
                </div>

                <div className="flex flex-col justify-center items-end gap-2 sm:w-[200px] ml-auto self-center">
                {appt.status === 'Pendiente' && (
                    <>
                    <button
                        onClick={() => confirmAppointment(appt.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md"
                    >
                        Confirmar
                    </button>
                    <button
                        onClick={() => deleteAppointment(appt.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-md"
                    >
                        Descartar
                    </button>
                    </>
                )}
                {appt.status === 'Confirmada' && (
                    <button
                    onClick={() => deleteAppointment(appt.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md"
                    >
                    Cancelar Cita
                    </button>
                )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
