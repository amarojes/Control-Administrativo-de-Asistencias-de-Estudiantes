
import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/StorageService';
import { Student } from '../types';
import { Plus, Upload, Trash2, Search, UserPlus, Download, Edit2, X, Check } from 'lucide-react';

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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1);
      const newStudents: Student[] = lines.filter(l => l.trim()).map((line, i) => {
        const [nombre, cedula, sexo, grado, seccion] = line.split(';');
        return {
          id: `s-imp-${Date.now()}-${i}`,
          nombre_completo: nombre.trim().toUpperCase(),
          cedula_escolar: cedula.trim(),
          sexo: (sexo?.trim().toUpperCase() === 'F' ? 'F' : 'M') as 'M' | 'F',
          grado: grado?.trim() || '1',
          seccion: seccion?.trim() || 'A',
          turno: 'M'
        };
      });
      StorageService.importStudents(newStudents);
      setStudents(StorageService.getStudents());
      alert(`Importados ${newStudents.length} estudiantes.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">MATRÍCULA ESCOLAR</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Gestión de Alumnos Activos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200">
            <Upload size={20} />
          </button>
          <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
            Nuevo Ingreso
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" />
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Buscar alumno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-blue-600 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">Aula</th>
                <th className="px-8 py-6">Estudiante</th>
                <th className="px-8 py-6">Representante</th>
                <th className="px-8 py-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.filter(s => s.nombre_completo.includes(searchTerm.toUpperCase())).map(student => (
                <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-900">{student.grado}° "{student.seccion}"</td>
                  <td className="px-8 py-6 uppercase font-bold text-sm">{student.nombre_completo}</td>
                  <td className="px-8 py-6 text-xs text-slate-500 uppercase">{student.nombre_representante || 'Sin Datos'}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(student)} className="p-2 text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                      <button onClick={() => { if(confirm('¿Eliminar?')) { StorageService.deleteStudent(student.id); setStudents(StorageService.getStudents()); }}} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-8 text-white">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">{editingStudent ? 'Editar Ficha' : 'Nueva Matrícula'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <input placeholder="NOMBRE COMPLETO" required value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value.toUpperCase()})} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600" />
              <input placeholder="CÉDULA" required value={formData.cedula_escolar} onChange={e => setFormData({...formData, cedula_escolar: e.target.value})} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-600" />
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.grado} onChange={e => setFormData({...formData, grado: e.target.value})} className="px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black">
                  {['1','2','3','4','5','6'].map(g => <option key={g} value={g}>{g}° Grado</option>)}
                </select>
                <select value={formData.seccion} onChange={e => setFormData({...formData, seccion: e.target.value})} className="px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black">
                  {['A','B','C'].map(s => <option key={s} value={s}>Sección {s}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Guardar Estudiante</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
