
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Student, AttendanceRecord } from '../types';
import { ClipboardList, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, CalendarDays } from 'lucide-react';

const AttendanceReport: React.FC = () => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [monthlyData, setMonthlyData] = useState<{
    students: Student[], 
    days: { num: number, label: string, isWeekend: boolean }[], 
    records: Record<string, string>
  }>({
    students: [],
    days: [],
    records: {}
  });

  useEffect(() => {
    const students = StorageService.getStudents();
    const attendance = StorageService.getAttendance();
    const uniqueSections = Array.from(new Set(students.map(s => `${s.grado}-${s.seccion}`))).sort();
    setSections(uniqueSections);
    
    if (uniqueSections.length > 0 && !selectedSection) {
      setSelectedSection(uniqueSections[0]);
    }

    if (viewMode === 'daily') {
      const recordsOnDate = attendance.filter(r => r.fecha === reportDate);
      const summary = uniqueSections.map(sectionKey => {
        const [grado, seccion] = sectionKey.split('-');
        const sectionStudents = students.filter(s => s.grado === grado && s.seccion === seccion);
        const totalInscritos = sectionStudents.length;
        const sectionRecords = recordsOnDate.filter(r => sectionStudents.some(s => s.id === r.estudiante_id));
        
        const asistencias = sectionRecords.filter(r => r.estado === 'A').length;
        const inasistencias = sectionRecords.filter(r => r.estado === 'I').length;
        const justificadas = sectionRecords.filter(r => r.estado === 'IJ').length;

        return {
          seccion: `${grado}° "${seccion}"`,
          cleanSeccion: `${grado}${seccion}`,
          matricula: totalInscritos,
          asistencia: asistencias,
          inasistencias,
          justificadas,
          logro: totalInscritos > 0 ? Math.round((asistencias / totalInscritos) * 100) : 0
        };
      });
      setReportData(summary);
    } else if (selectedSection) {
      const [grado, seccion] = selectedSection.split('-');
      const sectionStudents = students.filter(s => s.grado === grado && s.seccion === seccion).sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
      const date = new Date(reportDate + 'T00:00:00');
      const month = date.getMonth();
      const year = date.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const daysArray = Array.from({length: daysInMonth}, (_, i) => {
        const dayNum = i + 1;
        const d = new Date(year, month, dayNum);
        const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
        const dayIndex = d.getDay();
        return { num: dayNum, label: labels[dayIndex], isWeekend: dayIndex === 0 || dayIndex === 6 };
      });

      const recordsMap: Record<string, string> = {};
      attendance.forEach(r => {
        const rDate = new Date(r.fecha + 'T00:00:00');
        if (rDate.getMonth() === month && rDate.getFullYear() === year) {
          recordsMap[`${r.estudiante_id}-${rDate.getDate()}`] = r.estado;
        }
      });

      setMonthlyData({ students: sectionStudents, days: daysArray, records: recordsMap });
    }
  }, [reportDate, viewMode, selectedSection]);

  const changeDate = (days: number) => {
    const current = new Date(reportDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    setReportDate(current.toISOString().split('T')[0]);
  };

  const exportCSV = () => {
    if (viewMode === 'daily' && reportData.length === 0) {
      alert("No hay datos cargados.");
      return;
    }
    
    let csvContent = "";
    const SEP = ";"; 

    if (viewMode === 'daily') {
      csvContent += "REPORTE DIARIO\n";
      csvContent += `FECHA;${reportDate}\n\n`;
      csvContent += `SECCION${SEP}MATRICULA${SEP}ASISTENCIAS${SEP}INASISTENCIAS${SEP}JUSTIFICADAS${SEP}LOGRO %\n`;
      reportData.forEach(r => {
        csvContent += `${r.cleanSeccion}${SEP}${r.matricula}${SEP}${r.asistencia}${SEP}${r.inasistencias}${SEP}${r.justificadas}${SEP}${r.logro}%\n`;
      });
    } else {
      const [grado, seccion] = selectedSection.split('-');
      csvContent += `MATRIZ MENSUAL - SECCION ${grado}${seccion}\n`;
      csvContent += `FECHA;${reportDate}\n\n`;
      csvContent += "ESTUDIANTE";
      monthlyData.days.forEach(d => csvContent += `${SEP}${d.label}${d.num}`);
      csvContent += "\n";
      monthlyData.students.forEach(s => {
        csvContent += s.nombre_completo;
        monthlyData.days.forEach(d => {
          csvContent += `${SEP}${monthlyData.records[`${s.id}-${d.num}`] || '-'}`;
        });
        csvContent += "\n";
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_${viewMode}_${reportDate.replace(/-/g, '')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintAction = () => {
    setIsPrinting(true);
    // Disparo inmediato para evitar que el estado bloquee el proceso
    window.print();
    // Restaurar estado tras el diálogo de impresión
    setTimeout(() => setIsPrinting(false), 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm print:hidden no-print">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Módulo de Reportes</h1>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2 transition-all ${viewMode === 'daily' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>Vista Diaria</button>
              <button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2 transition-all ${viewMode === 'monthly' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>Matriz Mensual</button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {viewMode === 'monthly' && (
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="flex-1 lg:flex-none pl-4 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 uppercase text-[10px] outline-none shadow-sm cursor-pointer">
              {sections.map(s => <option key={s} value={s}>{s.replace('-', '° "') + '"'}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 flex-1 lg:flex-none justify-between">
            <button onClick={() => changeDate(-1)} className="p-2.5 hover:bg-white rounded-xl text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-2 px-2 border-x border-slate-200">
               <CalendarDays size={16} className="text-blue-600" />
               <input type={viewMode === 'daily' ? 'date' : 'month'} value={viewMode === 'daily' ? reportDate : reportDate.substring(0, 7)} onChange={e => setReportDate(e.target.value + (viewMode === 'monthly' ? '-01' : ''))} className="bg-transparent font-black text-slate-900 uppercase text-[10px] outline-none" />
            </div>
            <button onClick={() => changeDate(1)} className="p-2.5 hover:bg-white rounded-xl text-slate-400 transition-colors"><ChevronRight size={18} /></button>
          </div>
          
          <div className="flex flex-col gap-2 w-full lg:w-auto">
            <button onClick={exportCSV} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all shadow-lg font-black text-[10px] uppercase tracking-widest border-b-4 border-green-800">
              <FileSpreadsheet size={18} />
              <span>{viewMode === 'daily' ? 'REPORTE DIARIO EN EXCEL' : 'MATRIZ MENSUAL EN EXCEL'}</span>
            </button>
            <button 
              onClick={handlePrintAction} 
              disabled={isPrinting}
              className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl transition-all shadow-lg font-black text-[10px] uppercase tracking-widest border-b-4 border-red-800 ${isPrinting ? 'opacity-50 cursor-wait' : 'hover:bg-red-700'}`}
            >
              <Printer size={18} className={isPrinting ? 'animate-pulse' : ''} /> 
              <span>{isPrinting ? 'IMPRIMIENDO...' : (viewMode === 'daily' ? 'REPORTE DIARIO EN PDF' : 'MATRIZ MENSUAL EN PDF')}</span>
            </button>
          </div>
        </div>
      </header>

      <div id="report-content" className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden min-h-[400px] flex flex-col p-8 md:p-12">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-8">
          <div className="text-[10px] font-black uppercase leading-tight text-slate-800">
            República Bolivariana de Venezuela<br/>
            Ministerio del Poder Popular para la Educación<br/>
            Sistema de Control Administrativo de Asistencias de Estudiantes<br/>
            Escuela "EPE MARIA INOCENCIA VILLEGAS"
          </div>
          <div className="text-right">
            <h2 className="text-xl font-black uppercase italic text-slate-900">
              {viewMode === 'daily' ? 'Reporte Diario de Asistencia' : 'Matriz Mensual de Control'}
            </h2>
            <p className="text-[10px] font-black uppercase text-blue-600">Fecha de Emisión: {reportDate}</p>
          </div>
        </div>

        {viewMode === 'daily' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Sección</th>
                  <th className="px-6 py-5 text-center">Matrícula</th>
                  <th className="px-4 py-5 text-center text-green-600">Presentes</th>
                  <th className="px-4 py-5 text-center text-red-600">Inasistentes</th>
                  <th className="px-8 py-5 text-right text-blue-600">Logro (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase italic">{row.seccion}</td>
                    <td className="px-6 py-5 text-center font-bold text-slate-600">{row.matricula}</td>
                    <td className="px-4 py-5 text-center font-bold text-green-600">{row.asistencia}</td>
                    <td className="px-4 py-5 text-center font-bold text-red-600">{row.inasistencias}</td>
                    <td className="px-8 py-5 text-right font-black text-blue-600">{row.logro}%</td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-sm">Sin datos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-100">
              <thead>
                <tr className="bg-slate-50 text-[7px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-4 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">Estudiante</th>
                  {monthlyData.days.map(d => (
                    <th key={d.num} className={`px-1 py-4 text-center border-r border-slate-100 ${d.isWeekend ? 'bg-slate-100/50' : ''}`}>{d.num}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.students.map(s => (
                  <tr key={s.id} className="text-[8px]">
                    <td className="px-6 py-2 font-black text-slate-900 uppercase truncate border-r border-slate-200 sticky left-0 bg-white z-10">{s.nombre_completo}</td>
                    {monthlyData.days.map(d => (
                      <td key={d.num} className={`p-0 text-center border-r border-slate-50 font-bold ${monthlyData.records[`${s.id}-${d.num}`] === 'I' ? 'text-red-500 bg-red-50/30' : monthlyData.records[`${s.id}-${d.num}`] === 'A' ? 'text-green-600' : ''}`}>
                        {monthlyData.records[`${s.id}-${d.num}`] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-auto flex justify-between items-end px-10 pt-16">
          <div className="text-center">
            <div className="w-48 border-t-2 border-slate-900 mb-2"></div>
            <p className="text-[9px] font-black uppercase text-slate-900">Firma del Docente</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-t-2 border-slate-900 mb-2"></div>
            <p className="text-[9px] font-black uppercase text-slate-900">Firma del Director</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
