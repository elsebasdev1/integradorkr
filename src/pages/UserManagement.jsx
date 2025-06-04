import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const nav = useNavigate();
  const [users, setUsers]       = useState([]);        // lista de usuarios {id, displayName, email, role}
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'patient' | 'admin'
  const [searchTerm, setSearchTerm] = useState('');    // buscador por nombre/email

  // 1) Cargar todos los usuarios al montar el componente
  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    fetchUsers();
  }, []);

  // 2) Alternar rol entre 'patient' y 'admin' en Firestore
  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'patient' : 'admin';
    try {
      await updateDoc(doc(db, 'users', u.id), { role: newRole });
      // Actualizamos la lista local para re‐renderizar inmediatamente
      setUsers(us =>
        us.map(x => (x.id === u.id ? { ...x, role: newRole } : x))
      );
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      alert('No se pudo cambiar el rol de este usuario.');
    }
  };

  // 3) Generar lista filtrada según roleFilter y searchTerm
  const filteredUsers = users.filter(u => {
    // 3.a) Filtrar por rol
    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false;
    }
    // 3.b) Filtrar por búsqueda de nombre o email
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const name = (u.displayName || '').toLowerCase();
      const mail = (u.email || '').toLowerCase();
      return name.includes(term) || mail.includes(term);
    }
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Usuarios</h2>

      {/* ─── FILTROS ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Filtro por rol */}
        <div>
          <label className="mr-2 font-medium">Filtrar por rol:</label>
          <select
            className="border p-1 rounded"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="patient">Paciente</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {/* Búsqueda por nombre o correo */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="w-full border p-2 rounded"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ─── TABLA DE USUARIOS ───────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">Nombre</th>
              <th className="border px-4 py-2 text-left">Email</th>
              <th className="border px-4 py-2 text-left">Rol</th>
              <th className="border px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id} className="border-t">
                <td className="border px-4 py-2">{u.displayName || '—'}</td>
                <td className="border px-4 py-2">{u.email}</td>
                <td className="border px-4 py-2 capitalize">{u.role === 'admin' ? 'Administrador' : 'Paciente'}</td>
                <td className="border px-4 py-2">
                <button
                onClick={() => toggleRole(u)}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                >
                Cambiar a {u.role === 'admin' ? 'Paciente' : 'Administrador'}
                </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-600">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
    <button
        onClick={() => nav('/admin')}
        className="mt-6 px-4 py-2 bg-gray-400 text-white rounded"
    >
        Volver
    </button>        
      </div>
    </div>
  );
}
