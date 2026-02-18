
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
    const groupStudents = allStudents.filter(s => s.grado === grado && s.seccion === seccion);
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
      if (!confirm(`Atención: Solo ha marcado a ${totalMarked} de ${students.length} estudiantes. ¿Desea guardar así?`)) {
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
    setTimeout(() => setIsSaving(false), 800);
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
          <input type="text" placeholder="Filtrar estudiante por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-blue-600 outline-none transition-all" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-xl transition-colors ${attendance[student.id] ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                {student.nombre_completo[0]}
              </div>
              <div>
                <p className="font-black text-slate-900 uppercase text-base leading-tight">{student.nombre_completo}</p>
                {attendance[student.id] ? (
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-3 py-1 rounded-full border inline-block ${
                    attendance[student.id] === 'A' ? 'bg-green-50 text-green-600 border-green-100' : 
                    attendance[student.id] === 'I' ? 'bg-red-50 text-red-600 border-red-100' : 
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    ESTADO: {attendance[student.id] === 'A' ? 'PRESENTE' : attendance[student.id] === 'I' ? 'FALTA' : 'JUSTIFICADA'}
                  </p>
                ) : (
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">Pendiente por marcar</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 justify-center sm:justify-end">
               <button 
                 onClick={() => toggleStatus(student.id, 'A')} 
                 className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all border-4 ${ attendance[student.id] === 'A' ? 'bg-green-600 text-white border-green-800 shadow-xl scale-110 z-10' : 'bg-white text-slate-300 border-slate-50 hover:border-green-200 shadow-sm' }`}
               >
                  <Check size={40} strokeWidth={3} />
                  <span className="text-[10px] font-black mt-2 uppercase">PRESENTE</span>
               </button>
               <button 
                 onClick={() => toggleStatus(student.id, 'I')} 
                 className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all border-4 ${ attendance[student.id] === 'I' ? 'bg-red-600 text-white border-red-800 shadow-xl scale-110 z-10' : 'bg-white text-slate-300 border-slate-50 hover:border-red-200 shadow-sm' }`}
               >
                  <X size={40} strokeWidth={3} />
                  <span className="text-[10px] font-black mt-2 uppercase">FALTA</span>
               </button>
               <button 
                 onClick={() => toggleStatus(student.id, 'IJ')} 
                 className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex flex-col items-center justify-center transition-all border-4 ${ attendance[student.id] === 'IJ' ? 'bg-amber-500 text-white border-amber-700 shadow-xl scale-110 z-10' : 'bg-white text-slate-300 border-slate-50 hover:border-amber-200 shadow-sm' }`}
               >
                  <AlertOctagon size={40} strokeWidth={3} />
                  <span className="text-[10px] font-black mt-2 uppercase text-center leading-none">JUSTIFICA</span>
               </button>
            </div>
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-slate-300 font-black uppercase italic tracking-widest text-sm">
            No se encontraron alumnos con ese criterio
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-4">
        <div className="w-full h-px bg-slate-200"></div>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Fin de la lista de Estudiantes</p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="group relative bg-slate-900 hover:bg-blue-600 text-white px-20 py-6 rounded-[2.5rem] font-black shadow-2xl transition-all active:scale-95 disabled:bg-slate-300 flex items-center gap-4 border-b-8 border-slate-950 hover:border-blue-800"
          >
            <Save size={24} className={isSaving ? 'animate-spin' : ''} />
            <span className="uppercase text-sm tracking-[0.2em]">{isSaving ? 'PROCESANDO...' : 'GUARDAR CAMBIOS'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceRegister;
