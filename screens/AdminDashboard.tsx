
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Student, AttendanceRecord } from '../types';
import { Users, BookOpen, TrendingUp, AlertTriangle, Info, ArrowUpRight, ShieldAlert, Phone, Printer, UserCheck, Calendar, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from 'recharts';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMales: 0,
    totalFemales: 0,
    totalTeachers: 0,
    totalRepresentatives: 0,
    attendanceRate: 0,
    morningCount: 0,
    afternoonCount: 0,
    todayJustified: 0
  });

  const [gradeData, setGradeData] = useState<any[]>([]);
  const [criticalStudents, setCriticalStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  useEffect(() => {
    const students = StorageService.getStudents();
    const users = StorageService.getUsers();
    const attendance = StorageService.getAttendance();
    const teachers = users.filter(u => u.rol === 'docente');

    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter(r => r.fecha === today);
    const todayAttendance = todayRecords.filter(r => r.estado === 'A');
    const todayJustified = todayRecords.filter(r => r.estado === 'IJ');

    const uniqueReps = new Set(
      students.map(s => s.nombre_representante?.trim().toUpperCase()).filter(name => name && name.length > 2)
    );

    setStats({
      totalStudents: students.length,
      totalMales: students.filter(s => s.sexo === 'M').length,
      totalFemales: students.filter(s => s.sexo === 'F').length,
      totalTeachers: teachers.length,
      totalRepresentatives: uniqueReps.size,
      attendanceRate: students.length > 0 ? Math.round((todayAttendance.length / students.length) * 100) : 0,
      todayJustified: todayJustified.length,
      morningCount: students.filter(s => s.turno === 'M' || s.seccion === 'A').length,
      afternoonCount: students.filter(s => s.turno === 'T' || s.seccion === 'B').length
    });

    const grades = ['1', '2', '3', '4', '5', '6'];
    setGradeData(grades.map(g => {
      const gradSts = students.filter(s => s.grado === g);
      return {
        name: `${g}° Grado`,
        Masculino: gradSts.filter(s => s.sexo === 'M').length,
        Femenino: gradSts.filter(s => s.sexo === 'F').length
      };
    }));

    setCriticalStudents(students.map(s => ({
      ...s,
      absences: attendance.filter(r => r.estudiante_id === s.id && r.estado === 'I').length
    })).filter(s => s.absences >= 3).sort((a, b) => b.absences - a.absences).slice(0, 5));

  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">REPORTE ADMINISTRATIVO</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Monitor de Matrícula y Asistencia Escolar</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Matrícula</p>
          <p className="text-4xl font-black text-slate-900 leading-none mt-1">{stats.totalStudents}</p>
          <div className="flex justify-between mt-4 text-[10px] font-black uppercase">
            <span className="text-blue-600">M: {stats.totalMales}</span>
            <span className="text-pink-500">F: {stats.totalFemales}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Docentes</p>
          <p className="text-4xl font-black text-slate-900 leading-none mt-1">{stats.totalTeachers}</p>
          <p className="text-[9px] font-bold text-green-600 uppercase mt-2">Actividad 100%</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Asistencia Hoy</p>
          <p className="text-4xl font-black text-blue-600 leading-none mt-1">{stats.attendanceRate}%</p>
          <p className="text-[9px] font-bold text-amber-500 uppercase mt-2">Justificados: {stats.todayJustified}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl border-b-8 border-blue-600 text-white">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Inasistencias Críticas</p>
          <p className="text-4xl font-black leading-none mt-1 text-red-500">{criticalStudents.length}</p>
          <p className="text-[9px] font-black text-white/50 uppercase mt-2">Casos en Alerta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-8 flex items-center gap-3">
             <Calendar size={20} className="text-blue-600" /> Matrícula por Grado
          </h2>
          <div className="h-64 min-h-[256px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Legend iconType="circle" />
                <Bar dataKey="Masculino" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Femenino" stackId="a" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <div className="bg-red-600 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShieldAlert size={24} />
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Inasistencias Críticas</h2>
            </div>
          </div>
          <div className="p-4 flex-1">
            {criticalStudents.length > 0 ? (
              <div className="space-y-2">
                {criticalStudents.map(student => (
                  <button key={student.id} onClick={() => setSelectedStudent(student)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50 rounded-2xl border border-transparent hover:border-red-200 transition-all group">
                    <div className="text-left">
                      <p className="text-sm font-black text-slate-900 uppercase">{student.nombre_completo}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{student.grado}° "{student.seccion}"</p>
                    </div>
                    <div className="flex items-center gap-4 text-red-600">
                      <span className="text-xl font-black">{student.absences} Faltas</span>
                      <Phone size={18} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-10 text-slate-300">
                <p className="font-black uppercase italic text-sm">Sin alertas registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase italic leading-tight">{selectedStudent.nombre_completo}</h2>
                <p className="text-white/50 text-xs font-bold uppercase mt-1">{selectedStudent.grado}° "{selectedStudent.seccion}"</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 bg-white/10 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                <p className="text-[10px] font-black text-red-400 uppercase">Historial de Faltas</p>
                <p className="text-3xl font-black text-red-600 italic">{selectedStudent.absences} INASISTENCIAS</p>
              </div>
              <div className="space-y-4">
                <p className="font-black text-slate-400 uppercase text-[10px]">Representante: {selectedStudent.nombre_representante}</p>
                <div className="flex items-center gap-4 bg-blue-50 p-5 rounded-2xl">
                  <Phone className="text-blue-600" />
                  <span className="text-xl font-black text-blue-700">{selectedStudent.telefono_contacto || 'PENDIENTE'}</span>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
