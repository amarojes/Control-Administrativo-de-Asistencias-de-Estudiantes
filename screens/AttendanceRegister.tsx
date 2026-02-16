
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Student, AttendanceStatus, AttendanceRecord } from '../types';
import { ArrowLeft, Save, Search, Phone, Check, X, AlertOctagon, Info } from 'lucide-react';

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
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    students.forEach(student => {
      StorageService.markAttendance({
        estudiante_id: student.id,
        fecha: today,
        estado: attendance[student.id] || 'A'
      });
    });
    setTimeout(() => setIsSaving(false), 800);
  };

  const filteredStudents = students.filter(s => 
    s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
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
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest disabled:bg-slate-300"
        >
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Filtrar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-blue-600 outline-none" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredStudents.map(student => (
          <div key={student.id} className="bg-white p-4 rounded-[2rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">
                {student.nombre_completo[0]}
              </div>
              <p className="font-black text-slate-900 uppercase text-sm">{student.nombre_completo}</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => toggleStatus(student.id, 'A')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${ (attendance[student.id] || 'A') === 'A' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-slate-300 border-2' }`}>
                  <Check size={20} />
               </button>
               <button onClick={() => toggleStatus(student.id, 'I')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${ attendance[student.id] === 'I' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-slate-300 border-2' }`}>
                  <X size={20} />
               </button>
               <button onClick={() => toggleStatus(student.id, 'IJ')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${ attendance[student.id] === 'IJ' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-300 border-2' }`}>
                  <AlertOctagon size={20} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceRegister;
