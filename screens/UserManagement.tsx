
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { User, Role } from '../types';
import { UserPlus, Trash2, Edit2, Check, X, Shield, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    usuario: '',
    contraseña: '',
    rol: 'docente' as Role,
    grado: '1',
    seccion: 'A',
    activo: true
  });

  const refreshUsers = () => {
    setUsers(StorageService.getUsers());
  };

  useEffect(() => {
    refreshUsers();
    const session = JSON.parse(localStorage.getItem('asistencia_session') || '{}');
    setCurrentUser(session);
  }, []);

  const isMasterAdmin = currentUser?.id === 'admin-1';

  const handleOpenModal = (user?: User) => {
    setShowPassword(false);
    if (user && user.rol === 'administrador' && !isMasterAdmin && user.id !== currentUser?.id) {
      alert("No tiene permisos para modificar cuentas administrativas.");
      return;
    }

    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido,
        usuario: user.usuario,
        contraseña: user.contraseña || '',
        rol: user.rol,
        grado: user.grado || '1',
        seccion: user.seccion || 'A',
        activo: user.activo
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        apellido: '',
        usuario: '',
        contraseña: '',
        rol: 'docente',
        grado: '1',
        seccion: 'A',
        activo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = isMasterAdmin ? formData.rol : 'docente';
    const newUser: User = {
      id: editingUser?.id || `u-${Date.now()}`,
      ...formData,
      rol: editingUser?.id === 'admin-1' ? 'administrador' : finalRole
    };
    StorageService.saveUser(newUser);
    refreshUsers();
    setIsModalOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    if (id === 'admin-1') {
      alert("La cuenta maestra no puede ser eliminada.");
      return;
    }
    if (window.confirm('¿Está seguro de eliminar a este miembro del personal?')) {
      StorageService.deleteUser(id);
      refreshUsers();
    }
  };

  const toggleStatus = (user: User) => {
    if (user.id === 'admin-1') return;
    const updated = { ...user, activo: !user.activo };
    StorageService.saveUser(updated);
    refreshUsers();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${isMasterAdmin ? 'bg-amber-500' : 'bg-blue-600'}`}>
            {isMasterAdmin ? <ShieldCheck size={24} /> : <Shield size={24} />}
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              {isMasterAdmin ? 'Control Maestro' : 'Gestión de Personal'}
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-2">Personal Institucional Registrado</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl uppercase text-[10px] tracking-widest transition-all">
          <UserPlus size={18} /> Registrar Personal
        </button>
      </header>

      {showSuccess && (
        <div className="bg-green-600 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 animate-in slide-in-from-top-4 shadow-lg">
          <Check size={16} /> Cambios guardados con éxito
        </div>
      )}

      <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-900 text-[9px] font-black text-blue-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6 text-left">Personal</th>
              <th className="px-8 py-6 text-left">Rol</th>
              <th className="px-8 py-6 text-left">Usuario</th>
              <th className="px-8 py-6 text-center">Estatus</th>
              <th className="px-8 py-6 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(user => {
              const isThisUserMaster = user.id === 'admin-1';
              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 uppercase text-sm leading-none">{user.nombre} {user.apellido}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-tighter bg-blue-100 text-blue-700">
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-mono font-bold text-slate-500">@{user.usuario}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button disabled={isThisUserMaster} onClick={() => toggleStatus(user)} className={`text-[8px] font-black uppercase px-4 py-1.5 rounded-full border-2 ${user.activo ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {user.activo ? 'Activo' : 'Suspendido'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleOpenModal(user)} className="p-2.5 text-blue-600 bg-blue-50 rounded-xl">
                        <Edit2 size={16} />
                      </button>
                      {!isThisUserMaster && (
                        <button onClick={() => handleDelete(user.id)} className="p-2.5 text-red-600 bg-red-50 rounded-xl">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase italic leading-tight">Ficha Personal</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/10 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} className="px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 text-sm" />
                <input required placeholder="Apellido" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} className="px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 text-sm" />
              </div>
              <input required placeholder="Usuario" value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value.toLowerCase()})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold outline-none focus:border-blue-600 text-sm" />
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} value={formData.contraseña} onChange={e => setFormData({...formData, contraseña: e.target.value})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold outline-none focus:border-blue-600 text-sm" placeholder="Clave" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl border-b-4 border-blue-800">
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
