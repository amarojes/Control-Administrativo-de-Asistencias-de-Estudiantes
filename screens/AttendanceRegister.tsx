
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Student, AttendanceStatus, AttendanceRecord } from '../types';
import { ArrowLeft, Save, Search, Check, X, AlertOctagon, ClipboardCheck } from 'lucide-react';

interface AttendanceRegisterProps {
  grado: string;
  seccion: string;
  onBack: () => void;
}

const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({ grado, seccion, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const allStudents = StorageService.getStudents();
    const groupStudents = allStudents
      .filter(s => s.grado === grado && s.seccion === seccion)
      .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
    
    setStudents(groupStudents);

    const allAttendance = StorageService.getAttendance();
    const todayRecords = allAttendance.filter(r => r.fecha === today);
    const initialMap: Record<string, AttendanceStatus> = {};
    todayRecords.forEach(r => {
      initialMap[r.estudiante_id] = r.estado;
    });
    setAttendance(initialMap);
  }, [grado, seccion, today]);

  const toggleStatus = (studentId: string, status: AttendanceStatus) => {
    if (attendance[studentId] === status) {
      const newAttendance = { ...attendance };
      delete newAttendance[studentId];
      setAttendance(newAttendance);
    } else {
      setAttendance(prev => ({ ...prev, [studentId]: status }));
    }
  };

  const handleSave = async () => {
    const totalMarked = Object.keys(attendance).length;
    if (totalMarked < students.length) {
      if (!window.confirm(`Atención: Solo ha marcado a ${totalMarked} de ${students.length} estudiantes. ¿Desea guardar así?`)) {
        return;
      }
    }

    setIsSaving(true);
    students.forEach(student => {
      const status = attendance[student.id];
      if (status) {
        StorageService.markAttendance({
          estudiante_id: student.id,
          fecha: today,
          estado: status
        });
      }
    });
    setTimeout(() => {
      setIsSaving(false);
      alert("Asistencia guardada correctamente.");
    }, 800);
  };

  const filteredStudents = students.filter(s => 
    s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Pase de Lista</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase mt-2">{grado}° "{seccion}" • {today}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-700 font-black text-[9px] uppercase tracking-widest border border-blue-100">
           <ClipboardCheck size={14} />
           {Object.keys(attendance).length} / {students.length} Marcados
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Filtrar estudiante por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-blue-600 outline-none transition-all text-sm" />
        </div>
      </div>

      <div className="space-y-2">
        {filteredStudents.map((student, index) => (
          <div key={student.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 hover:border-blue-100 transition-colors">
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
              <span className="text-[9px] font-black text-slate-400 w-4 text-center">{(index + 1)}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-base transition-colors shrink-0 ${attendance[student.id] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {student.nombre_completo[0]}
              </div>
              <div className="overflow-hidden">
                <p className="font-black text-slate-900 uppercase text-[11px] leading-tight truncate italic tracking-tighter">{student.nombre_completo}</p>
                <p className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${
                  attendance[student.id] === 'A' ? 'text-green-600' : 
                  attendance[student.id] === 'I' ? 'text-red-600' : 
                  attendance[student.id] === 'IJ' ? 'text-amber-500' : 'text-slate-300'
                }`}>
                  {attendance[student.id] ? (attendance[student.id] === 'A' ? '✓ PRESENTE' : attendance[student.id] === 'I' ? '✕ FALTÓ' : '⚠ JUSTIFICADA') : 'PENDIENTE'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
               <button 
                 onClick={() => toggleStatus(student.id, 'A')} 
                 className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${ attendance[student.id] === 'A' ? 'bg-green-600 text-white border-green-700 shadow-lg' : 'bg-white text-slate-300 border-slate-100 hover:border-green-200' }`}
               >
                  <Check size={18} strokeWidth={3} />
               </button>
               <button 
                 onClick={() => toggleStatus(student.id, 'I')} 
                 className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${ attendance[student.id] === 'I' ? 'bg-red-600 text-white border-red-700 shadow-lg' : 'bg-white text-slate-300 border-slate-100 hover:border-red-200' }`}
               >
                  <X size={18} strokeWidth={3} />
               </button>
               <button 
                 onClick={() => toggleStatus(student.id, 'IJ')} 
                 className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${ attendance[student.id] === 'IJ' ? 'bg-amber-500 text-white border-amber-600 shadow-lg' : 'bg-white text-slate-300 border-slate-100 hover:border-amber-200' }`}
               >
                  <AlertOctagon size={18} strokeWidth={3} />
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-6">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="group relative bg-slate-900 hover:bg-blue-600 text-white px-16 py-6 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 disabled:bg-slate-300 flex items-center gap-4 border-b-8 border-slate-950 hover:border-blue-800"
        >
          <Save size={24} className={isSaving ? 'animate-spin' : ''} />
          <span className="uppercase text-sm tracking-[0.2em]">{isSaving ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}</span>
        </button>
      </div>
    </div>
  );
};

export default AttendanceRegister;
