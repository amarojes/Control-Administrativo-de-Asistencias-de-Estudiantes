
import React, { useState } from 'react';
import { StorageService } from '../services/StorageService';
import { User } from '../types';
import { User as UserIcon, ShieldCheck, LogIn, ClipboardCheck, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    const user = users.find(u => u.usuario === usuario && u.contraseña === password);
    
    if (user) {
      if (!user.activo) {
        setError('Acceso denegado por suspensión administrativa.');
        return;
      }
      onLogin(user);
    } else {
      setError('Credenciales no válidas en el sistema.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4 text-left">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden relative border-4 border-white animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-blue-600 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-2 transition-transform hover:rotate-0">
             <ClipboardCheck className="text-blue-600" size={40} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter mb-1 uppercase leading-tight italic text-center">
            Control Administrativo<br/>de Asistencias
          </h1>
          <p className="text-blue-100 font-bold uppercase tracking-[0.2em] text-[9px] mt-2 text-center">Gestión de Estudiantes</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black border-2 border-red-100 uppercase tracking-widest text-center animate-shake">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Identificador de Usuario</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <UserIcon size={18} />
              </span>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-900 font-black focus:bg-white focus:border-blue-600 outline-none transition-all"
                placeholder="Usuario"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Clave de Acceso</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <ShieldCheck size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-900 font-black focus:bg-white focus:border-blue-600 outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 px-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
          >
            <LogIn size={20} />
            Acceder al Control
          </button>
        </form>
        
        <div className="px-10 pb-10">
          <p className="text-[9px] text-slate-400 text-center font-black uppercase tracking-[0.2em]">Control Administrativo de Asistencias • v2.5</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
