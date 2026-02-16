
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { User, Role } from '../types';
import { 
  Plus, UserPlus, Trash2, Edit2, Check, X, Shield, KeyRound, 
  Lock, UserCircle, BookOpen, AlertCircle, ShieldCheck, ShieldAlert,
  LockKeyhole
} from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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

  useEffect(() => {
    setUsers(StorageService.getUsers());
    const session = JSON.parse(localStorage.getItem('asistencia_session') || '{}');
    setCurrentUser(session);
  }, []);

  const isMasterAdmin = currentUser?.id === 'admin-1';

  const handleOpenModal = (user?: User) => {
    // Seguridad: Si no es master y trata de editar a un admin, bloquear
    if (user && user.rol === 'administrador' && !isMasterAdmin && user.id !== currentUser?.id) {
      alert("No tiene permisos para modificar cuentas de nivel administrativo.");
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
    
    // Doble verificación de seguridad para el rol
    const finalRole = isMasterAdmin ? formData.rol : 'docente';

    const newUser: User = {
      id: editingUser?.id || `u-${Date.now()}`,
      ...formData,
      rol: editingUser?.id === 'admin-1' ? 'administrador' : finalRole // El master siempre es administrador
    };
    
    const savedUser = StorageService.saveUser(newUser);
    
    // Si el usuario editado es el mismo que está logueado, actualizar sesión local
    if (currentUser?.id === savedUser.id) {
      localStorage.setItem('asistencia_session', JSON.stringify(savedUser));
      setCurrentUser(savedUser);
    }

    setUsers(StorageService.getUsers());
    setIsModalOpen(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const toggleStatus = (user: User) => {
    if (user.id === 'admin-1') return; // El master nunca se desactiva
    if (!isMasterAdmin && user.rol === 'administrador') return;

    const updated = { ...user, activo: !user.activo };
    StorageService.saveUser(updated);
    setUsers(StorageService.getUsers());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${isMasterAdmin ? 'bg-amber-500' : 'bg-blue-600'}`}>
            {isMasterAdmin ? <ShieldCheck size={32} /> : <Shield size={32} />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              {isMasterAdmin ? 'Control Maestro' : 'Gestión de Personal'}
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
              {isMasterAdmin ? (
                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Acceso Total Habilitado</span>
              ) : (
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Modo Administrador Colaborador</span>
              )}
            </p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-slate-900/20 uppercase text-xs tracking-widest transition-all"
        >
          <UserPlus size={20} />
          Registrar Personal
        </button>
      </header>

      {showSuccess && (
        <div className="bg-green-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 animate-in slide-in-from-top-4 shadow-lg shadow-green-500/20">
          <Check size={18} /> Cambios guardados con éxito
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-200 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Identidad</th>
                <th className="px-8 py-6">Nivel/Cargo</th>
                <th className="px-8 py-6">Usuario Acceso</th>
                <th className="px-8 py-6 text-center">Estatus</th>
                <th className="px-8 py-6 text-right">Seguridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const isThisUserMaster = user.id === 'admin-1';
                const isAnotherAdmin = user.rol === 'administrador' && !isThisUserMaster;
                const canEdit = isMasterAdmin || (user.rol === 'docente') || (user.id === currentUser?.id);
                const isProtected = (isThisUserMaster || isAnotherAdmin) && !isMasterAdmin;

                return (
                  <tr key={user.id} className={`transition-colors group ${isProtected ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50'}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center font-black uppercase text-sm shadow-sm transition-colors ${isThisUserMaster ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-100 text-slate-900'}`}>
                          {user.nombre[0]}{user.apellido[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 uppercase text-base tracking-tight flex items-center gap-2">
                            {user.nombre} {user.apellido}
                            {isThisUserMaster && <ShieldAlert size={14} className="text-amber-500" />}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${user.rol === 'administrador' ? 'text-purple-700' : 'text-blue-700'}`}>
                              {user.rol}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isThisUserMaster ? (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 uppercase italic">Control Total</span>
                      ) : user.rol === 'docente' ? (
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-400" />
                          <span className="text-sm font-black text-slate-700 uppercase italic">{user.grado}° "{user.seccion}"</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase italic">Administración</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                       <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 inline-flex items-center gap-2">
                         <UserCircle size={14} className="text-slate-400" />
                         <span className="font-black text-slate-700 text-sm font-mono lowercase">{user.usuario}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <button 
                          disabled={isProtected || isThisUserMaster}
                          onClick={() => toggleStatus(user)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${user.activo ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'} ${(isProtected || isThisUserMaster) ? 'cursor-not-allowed' : 'hover:scale-105'}`}
                        >
                          {user.activo ? <Check size={14} /> : <X size={14} />}
                          {user.activo ? 'Activo' : 'Suspendido'}
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex justify-end gap-2">
                        {isProtected ? (
                          <div className="flex items-center gap-2 text-slate-300 font-black text-[9px] uppercase tracking-widest bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                            <LockKeyhole size={14} /> Registro Protegido
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleOpenModal(user)} 
                              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-2xl transition-all"
                              title="Editar Perfil"
                            >
                              <Edit2 size={18} />
                            </button>
                            {user.id !== 'admin-1' && isMasterAdmin && (
                              <button 
                                onClick={() => { if(confirm('¿Eliminar permanentemente este acceso?')) { StorageService.deleteUser(user.id); setUsers(StorageService.getUsers()); }}} 
                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-2xl transition-all"
                                title="Eliminar Registro"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 overflow-hidden border-4 border-white">
            <div className={`${editingUser?.id === 'admin-1' ? 'bg-amber-500' : editingUser ? 'bg-blue-600' : 'bg-slate-900'} p-10 text-white relative transition-colors`}>
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <KeyRound size={80} />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                {editingUser?.id === 'admin-1' ? 'Perfil Maestro' : editingUser ? 'Editar Perfil' : 'Nuevo Registro'}
              </h2>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <Shield size={14} /> 
                {editingUser?.id === 'admin-1' ? 'Cuenta Raíz Intransferible' : 'Control de Acceso Institucional'}
              </p>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Nombre</label>
                  <input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all" />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Apellido</label>
                  <input required value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value.toUpperCase()})} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Rol de Sistema</label>
                  <select 
                    disabled={!isMasterAdmin || editingUser?.id === 'admin-1'}
                    value={formData.rol} 
                    onChange={e => setFormData({...formData, rol: e.target.value as Role})} 
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="docente">DOCENTE</option>
                    <option value="administrador">ADMINISTRADOR</option>
                  </select>
                </div>
                {formData.rol === 'docente' && (
                  <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-right-2">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Grado</label>
                      <select value={formData.grado} onChange={e => setFormData({...formData, grado: e.target.value})} className="w-full px-4 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all cursor-pointer">
                        {['1','2','3','4','5','6'].map(g => <option key={g} value={g}>{g}°</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Secc.</label>
                      <select value={formData.seccion} onChange={e => setFormData({...formData, seccion: e.target.value})} className="w-full px-4 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all cursor-pointer">
                        {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Usuario (Login)</label>
                  <div className="relative">
                    <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value.toLowerCase()})} className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all lowercase" />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" value={formData.contraseña} onChange={e => setFormData({...formData, contraseña: e.target.value})} className="w-full pl-12 pr-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black focus:border-blue-600 outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest border-2 border-slate-100">Cancelar</button>
                <button type="submit" className={`flex-1 px-6 py-4 rounded-2xl font-black text-white shadow-2xl transition-all uppercase text-xs tracking-widest ${editingUser?.id === 'admin-1' ? 'bg-amber-600 shadow-amber-600/20' : editingUser ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700' : 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800'}`}>
                  {editingUser ? 'Actualizar Perfil' : 'Finalizar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
