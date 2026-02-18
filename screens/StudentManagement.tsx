
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/StorageService';
import { Student } from '../types';
import { Plus, Upload, Trash2, Search, UserPlus, Download, Edit2, X, Check, FileSpreadsheet, MapPin, Phone, User as UserIcon, CreditCard, Info } from 'lucide-react';

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    nombre_completo: '',
    cedula_escolar: '',
    sexo: 'M',
    grado: '1',
    seccion: 'A',
    turno: 'M',
    nombre_representante: '',
    telefono_contacto: '',
    direccion: ''
  });

  useEffect(() => {
    setStudents(StorageService.getStudents());
  }, []);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ ...student });
    } else {
      setEditingStudent(null);
      setFormData({ 
        nombre_completo: '', 
        cedula_escolar: '', 
        sexo: 'M', 
        grado: '1', 
        seccion: 'A',
        turno: 'M',
        nombre_representante: '',
        telefono_contacto: '',
        direccion: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const student: Student = { 
      id: editingStudent?.id || `s-${Date.now()}`, 
      ...formData 
    };
    StorageService.saveStudent(student);
    setStudents(StorageService.getStudents());
    setIsModalOpen(false);
  };

  const downloadTemplate = () => {
    const headers = "NOMBRE COMPLETO;Cedula Escolar/Cedula;SEXO;GRADO;SECCION;REPRESENTANTE;TELEFONO;DIRECCION";
    const example = "\nJUAN ARMANDO PEREZ;11512345678;M;1;A;PEDRO PEREZ;04120000000;AV. BOLIVAR SECTOR 1" + 
                    "\nMARIA VALENTINA RIVAS;30123456;F;2;B;ELENA RIVAS;04241112233;CALLE PAEZ CASA 5";
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, headers + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_matricula_institucional.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      const newStudents: Student[] = lines.filter(l => l.trim()).map((line, i) => {
        const [nombre, cedula, sexo, grado, seccion, rep, tel, dir] = line.split(';');
        return {
          id: `s-imp-${Date.now()}-${i}`,
          nombre_completo: nombre?.trim().toUpperCase() || 'SIN NOMBRE',
          cedula_escolar: cedula?.trim() || 'S/C',
          sexo: (sexo?.trim().toUpperCase() === 'F' ? 'F' : 'M') as 'M' | 'F',
          grado: grado?.trim() || '1',
          seccion: seccion?.trim() || 'A',
          turno: 'M',
          nombre_representante: rep?.trim().toUpperCase() || '',
          telefono_contacto: tel?.trim() || '',
          direccion: dir?.trim().toUpperCase() || ''
        };
      });
      StorageService.importStudents(newStudents);
      setStudents(StorageService.getStudents());
      alert(`Importación completada: ${newStudents.length} registros cargados.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">MATRÍCULA INSTITUCIONAL</h1>
            <p className="text-slate-500 font-bold uppercase text-[8px] md:text-[10px] tracking-widest mt-1">Control de Datos y Representantes</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button 
            onClick={downloadTemplate} 
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200 font-black text-[9px] uppercase tracking-widest px-4"
          >
            <Download size={16} /> Plantilla
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 p-3 bg-slate-50 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all border border-blue-100 font-black text-[9px] uppercase tracking-widest px-4"
          >
            <Upload size={16} /> Cargar
          </button>
          <button 
            onClick={() => handleOpenModal()} 
            className="w-full lg:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
          >
            Nuevo Ingreso
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
        </div>
      </header>

      <div className="bg-white p-4 md:p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar por Nombre, Cédula o Representante..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-blue-600 outline-none transition-all text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[950px] border-collapse">
          <thead className="bg-slate-900 text-[9px] font-black text-blue-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-6 text-left">Aula</th>
              <th className="px-6 py-6 text-left">Estudiante</th>
              <th className="px-6 py-6 text-left">Identificación</th>
              <th className="px-6 py-6 text-left">Representante y Contacto</th>
              <th className="px-6 py-6 text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students
              .filter(s => 
                s.nombre_completo.includes(searchTerm.toUpperCase()) || 
                s.cedula_escolar.includes(searchTerm) ||
                (s.nombre_representante && s.nombre_representante.includes(searchTerm.toUpperCase()))
              )
              .map(student => (
              <tr key={student.id} className="hover:bg-blue-50/40 transition-colors group">
                <td className="px-6 py-6 text-left">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-black text-[10px] border border-blue-100">
                    {student.grado}° "{student.seccion}"
                  </span>
                </td>
                <td className="px-6 py-6 text-left">
                  <p className="font-black text-slate-900 uppercase text-sm leading-tight">{student.nombre_completo}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{student.sexo === 'M' ? 'MASCULINO' : 'FEMENINO'}</p>
                </td>
                <td className="px-6 py-6 text-left">
                  <div className="flex flex-col items-start gap-1">
                     <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700">
                        <CreditCard size={12} className="text-slate-300 shrink-0" />
                        {student.cedula_escolar}
                     </div>
                     <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${student.cedula_escolar.length >= 11 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {student.cedula_escolar.length >= 11 ? 'C. ESCOLAR' : 'C. IDENTIDAD'}
                     </span>
                  </div>
                </td>
                <td className="px-6 py-6 text-left">
                  <div className="space-y-1">
                    <p className="uppercase text-[10px] font-black text-slate-900 flex items-center gap-2">
                       <UserIcon size={12} className="text-blue-600" />
                       {student.nombre_representante || '---'}
                    </p>
                    {student.telefono_contacto && (
                      <p className="text-[9px] font-bold text-blue-600 flex items-center gap-2">
                        <Phone size={12} /> {student.telefono_contacto}
                      </p>
                    )}
                    {student.direccion && (
                       <p className="text-[8px] text-slate-400 uppercase flex items-center gap-2 truncate max-w-[200px]">
                         <MapPin size={10} /> {student.direccion}
                       </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(student)} 
                      className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm border border-blue-100"
                      title="Editar Estudiante"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => { if(confirm('¿Eliminar registro?')) { StorageService.deleteStudent(student.id); setStudents(StorageService.getStudents()); }}} 
                      className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm border border-red-100"
                      title="Eliminar Estudiante"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center">
                  <div className="flex flex-col items-center gap-4 text-slate-200">
                    <FileSpreadsheet size={64} strokeWidth={1} />
                    <p className="font-black uppercase italic text-sm tracking-widest">Base de Datos Institucional Vacía</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 border-4 border-white">
            <div className="bg-slate-900 p-6 md:p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-xl font-black uppercase italic tracking-tighter">Expediente del Alumno</h2>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Control de Matrícula</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar text-left">
              <div className="space-y-1 col-span-full">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Completo del Estudiante</label>
                <input required value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value.toUpperCase()})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 focus:bg-white transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cédula Escolar / C.I.</label>
                <input required value={formData.cedula_escolar} onChange={e => setFormData({...formData, cedula_escolar: e.target.value})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Género</label>
                <select value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value as 'M' | 'F'})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 text-sm">
                  <option value="M">MASCULINO</option>
                  <option value="F">FEMENINO</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Grado</label>
                <select value={formData.grado} onChange={e => setFormData({...formData, grado: e.target.value})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 text-sm">
                  {['1','2','3','4','5','6'].map(g => <option key={g} value={g}>{g}° Grado</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Sección</label>
                <select value={formData.seccion} onChange={e => setFormData({...formData, seccion: e.target.value})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 text-sm">
                  {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-full border-t border-slate-100 pt-4 mt-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Datos del Representante Legal</p>
                </div>
              </div>
              <div className="space-y-1 col-span-full">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre del Representante</label>
                <input value={formData.nombre_representante} onChange={e => setFormData({...formData, nombre_representante: e.target.value.toUpperCase()})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 transition-all text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono de Contacto</label>
                <input value={formData.telefono_contacto} onChange={e => setFormData({...formData, telefono_contacto: e.target.value})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 text-sm" placeholder="0412-0000000" />
              </div>
              <div className="space-y-1 col-span-full">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Dirección de Domicilio</label>
                <textarea value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value.toUpperCase()})} className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600 transition-all min-h-[80px] text-sm resize-none" />
              </div>
              <button type="submit" className="w-full col-span-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl mt-4 border-b-4 border-blue-800 transition-all active:scale-95">Guardar Registro Institucional</button>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default StudentManagement;
