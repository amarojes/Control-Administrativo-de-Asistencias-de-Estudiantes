
import React, { useEffect, useState } from 'react';
import { User, Student, AttendanceRecord } from '../types';
import { BookMarked, ChevronRight, CalendarDays, Users, ClipboardCheck, Clock, Star, AlertCircle, Check, X, AlertOctagon } from 'lucide-react';
import { StorageService } from '../services/StorageService';

interface TeacherDashboardProps {
  user: User;
  onSelectGroup: (grado: string, seccion: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onSelectGroup }) => {
  const [assignedGroup, setAssignedGroup] = useState<{ grado: string, seccion: string } | null>(null);
  const [todayStats, setTodayStats] = useState({ total: 0, present: 0 });
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay(); 
    setIsWeekend(day === 0 || day === 6);

    if (user.grado && user.seccion) {
      setAssignedGroup({ grado: user.grado, seccion: user.seccion });
      
      const allStudents = StorageService.getStudents();
      const groupStudents = allStudents.filter(s => s.grado === user.grado && s.seccion === user.seccion);
      const allAttendance = StorageService.getAttendance();
      const today = now.toISOString().split('T')[0];
      const todayRecords = allAttendance.filter(r => 
        r.fecha === today && 
        r.estado === 'A' && 
        groupStudents.some(s => s.id === r.estudiante_id)
      );

      setTodayStats({
        total: groupStudents.length,
        present: todayRecords.length
      });
    }
  }, [user]);

  const attendancePercentage = todayStats.total > 0 
    ? Math.round((todayStats.present / todayStats.total) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* Estado del sistema ahora es lo primero */}
      <section className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl border-b-8 border-blue-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Clock size={32} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-tight">Estado del Sistema</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Conexión Institucional Activa</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex-1 md:flex-none">
              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Fecha Actual</p>
              <p className="text-xs md:text-sm font-bold capitalize">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex-1 md:flex-none">
              <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-1">Servidor</p>
              <p className="text-xs md:text-sm font-bold uppercase">Operativo</p>
            </div>
          </div>
        </div>
      </section>

      <header className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 transform -rotate-2 shrink-0">
            <Users size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Mi Aula</h1>
            <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
              <Star size={14} className="fill-blue-600" /> Docente: {user.nombre} {user.apellido}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="bg-slate-900 px-8 py-4 rounded-2xl text-center border-b-4 border-blue-600 flex-1 lg:flex-none">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Asistencia Real</p>
            <p className="text-2xl font-black text-white">{todayStats.present} <span className="text-slate-500 text-sm">/ {todayStats.total}</span></p>
          </div>
        </div>
      </header>

      {isWeekend && (
        <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[2.5rem] flex items-center gap-6 text-amber-800 animate-pulse">
          <div className="w-16 h-16 bg-amber-200 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter">Periodo No Lectivo</h3>
            <p className="font-bold uppercase text-[10px] tracking-widest mt-1">El sistema de registro se activará nuevamente el lunes.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="text-blue-600" size={24} />
              <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Grupo a Cargo</h2>
            </div>
          </div>

          {assignedGroup ? (
            <div className="max-w-md">
              <button
                disabled={isWeekend}
                onClick={() => !isWeekend && onSelectGroup(assignedGroup.grado, assignedGroup.seccion)}
                className={`group relative w-full bg-white p-10 rounded-[3rem] border-2 border-slate-100 transition-all text-left overflow-hidden ${isWeekend ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-blue-600 hover:shadow-2xl'}`}
              >
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 transition-all shadow-inner ${isWeekend ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    <BookMarked size={40} />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-5xl font-black text-slate-900 italic tracking-tighter">{assignedGroup.grado}° GRADO</h3>
                    <p className="text-blue-600 font-black uppercase tracking-[0.2em] text-lg">SECCIÓN "{assignedGroup.seccion}"</p>
                  </div>
                  
                  <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                      {isWeekend ? 'Fuera de Horario' : 'Pasar Asistencia'}
                    </span>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${isWeekend ? 'bg-slate-100 text-slate-300' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      <ChevronRight size={28} />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-200 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Users size={48} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Sin Grupo Asignado</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm italic mt-4">
                  Su cuenta aún no tiene un grado y sección asignado. Comuníquese con la dirección para habilitar su acceso al pase de lista.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
           <div className="bg-blue-50 rounded-[2.5rem] p-8 border-2 border-blue-100">
             <div className="flex items-center gap-3 mb-4">
                <Star size={20} className="text-blue-600 fill-blue-600" />
                <h3 className="font-black text-blue-900 uppercase italic tracking-tighter">Compromiso Escolar</h3>
             </div>
             <p className="text-blue-800 text-sm font-medium leading-relaxed italic">
               "Su registro permite identificar oportunamente riesgos de inasistencia y fortalecer el vínculo con el estudiante."
             </p>
             <div className="mt-6 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[8px] font-black uppercase text-blue-400">
                   <span>Asistencia Registrada</span>
                   <span>{attendancePercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-blue-600 transition-all duration-1000 ease-out"
                     style={{ width: `${attendancePercentage}%` }}
                   ></div>
                </div>
             </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Ayuda Rápida</h4>
              <ul className="space-y-4">
                 <li className="flex gap-4 items-center text-xs font-bold text-slate-600">
                    <div className="w-10 h-10 bg-green-50 text-green-600 border border-green-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                       <Check size={18} />
                    </div>
                    <span>Toque una vez para marcar presencia hoy.</span>
                 </li>
                 <li className="flex gap-4 items-center text-xs font-bold text-slate-600">
                    <div className="w-10 h-10 bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                       <X size={18} />
                    </div>
                    <span>Toque para registrar inasistencia injustificada.</span>
                 </li>
                 <li className="flex gap-4 items-center text-xs font-bold text-slate-600">
                    <div className="w-10 h-10 bg-amber-50 text-amber-500 border border-amber-100 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                       <AlertOctagon size={18} />
                    </div>
                    <span>IJ: Para registrar inasistencias justificadas.</span>
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
