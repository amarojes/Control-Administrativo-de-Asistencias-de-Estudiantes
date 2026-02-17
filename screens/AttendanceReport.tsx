
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
    let rows: string[][] = [];
    if (viewMode === 'daily') {
      rows.push(["REPORTE DIARIO DE ASISTENCIA"]);
      rows.push(["FECHA", reportDate]);
      rows.push([]);
      rows.push(["SECCION", "MATRICULA", "ASISTENCIAS", "INASISTENCIAS", "JUSTIFICADAS", "LOGRO %"]);
      reportData.forEach(r => rows.push([r.seccion, r.matricula, r.asistencia, r.inasistencias, r.justificadas, `${r.logro}%`]));
    } else {
      const [grado, seccion] = selectedSection.split('-');
      rows.push([`MATRIZ MENSUAL - ${grado} SECCION ${seccion}`]);
      rows.push([`FECHA REPORTE`, reportDate]);
      rows.push([]);
      const headers = ["ESTUDIANTE"];
      monthlyData.days.forEach(d => headers.push(`${d.label}${d.num}`));
      rows.push(headers);
      monthlyData.students.forEach(s => {
        const row = [s.nombre_completo];
        monthlyData.days.forEach(d => row.push(monthlyData.records[`${s.id}-${d.num}`] || '-'));
        rows.push(row);
      });
    }

    const csvContent = "\ufeff" + rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_asistencia_${viewMode}_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAction = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-header { display: flex !important; margin-bottom: 2rem; border-bottom: 2px solid black; padding-bottom: 1rem; }
          .report-container { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; }
          table { width: 100% !important; border: 1px solid black !important; font-size: 8pt !important; border-collapse: collapse !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; text-align: left !important; }
          .text-center-print { text-align: center !important; }
          @page { size: auto; margin: 1.5cm; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Cabecera de Impresión */}
      <div className="print-header flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase leading-tight">
          República Bolivariana de Venezuela<br/>
          Ministerio del Poder Popular para la Educación<br/>
          Control de Asistencia Institucional
        </div>
        <div className="text-right">
          <h1 className="text-xl font-black uppercase tracking-tighter italic">Reporte de Asistencia</h1>
          <p className="text-[10px] uppercase font-black text-blue-600">{reportDate}</p>
        </div>
      </div>

      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm no-print">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Módulo de Reportes</h1>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2 transition-all ${viewMode === 'daily' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>Vista Diaria</button>
              <button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2 transition-all ${viewMode === 'monthly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>Vista Mensual</button>
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
          
          <div className="flex gap-2 w-full lg:w-auto">
            <button 
              onClick={exportCSV} 
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all shadow-lg active:scale-95 font-black text-[10px] uppercase tracking-widest"
              title="Descargar archivo para Excel"
            >
              <FileSpreadsheet size={18} />
              <span>Exportar Excel</span>
            </button>
            <button 
              onClick={handlePrintAction} 
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-black text-[10px] uppercase tracking-widest border-b-4 border-slate-700"
              title="Abrir diálogo de impresión"
            >
              <Printer size={18} /> 
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="report-container bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {viewMode === 'daily' ? (
          <div className="overflow-x-auto">
            <div className="bg-slate-900 p-6 no-print flex justify-between items-center">
              <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">Consolidado Diario de Asistencia</h2>
              <span className="bg-blue-600 text-[9px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest">{reportDate}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Grado y Sección</th>
                  <th className="px-6 py-5 text-center">Matrícula</th>
                  <th className="px-4 py-5 text-center">Asistentes</th>
                  <th className="px-4 py-5 text-center">Inasistentes</th>
                  <th className="px-4 py-5 text-center">Justificadas</th>
                  <th className="px-8 py-5 text-right">Logro %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase italic">{row.seccion}</td>
                    <td className="px-6 py-5 text-center font-bold text-slate-600">{row.matricula}</td>
                    <td className="px-4 py-5 text-center font-bold text-green-600">{row.asistencia}</td>
                    <td className="px-4 py-5 text-center font-bold text-red-600">{row.inasistencias}</td>
                    <td className="px-4 py-5 text-center font-bold text-amber-500">{row.justificadas}</td>
                    <td className="px-8 py-5 text-right font-black text-blue-600">{row.logro}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <div className="bg-slate-900 p-6 no-print flex justify-between items-center">
                <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">Matriz de Control Mensual</h2>
                <div className="flex gap-2">
                   <span className="bg-slate-800 text-[9px] font-black text-blue-400 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-700">Mes: {new Date(reportDate + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                </div>
             </div>
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50 text-[8px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <th className="px-6 py-4 text-left border-r border-slate-100 sticky left-0 bg-slate-50 z-10 w-64 print:static">Estudiantes</th>
                      {monthlyData.days.map(d => (
                        <th key={d.num} className={`px-1 py-4 border-r border-slate-100 text-center min-w-[28px] ${d.isWeekend ? 'bg-slate-100' : ''}`}>
                           <div className="flex flex-col items-center">
                             <span className="text-[7px] text-blue-600 font-black">{d.label}</span>
                             <span>{d.num}</span>
                           </div>
                        </th>
                      ))}
                      <th className="px-3 py-4 text-center text-green-700 bg-green-50">A</th>
                      <th className="px-3 py-4 text-center text-red-700 bg-red-50">F</th>
                      <th className="px-3 py-4 text-center text-amber-700 bg-amber-50">FJ</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {monthlyData.students.map(s => {
                      let countA = 0, countF = 0, countFJ = 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-3 border-r border-slate-200 sticky left-0 bg-white font-black text-slate-900 uppercase text-[9px] print:static truncate">{s.nombre_completo}</td>
                           {monthlyData.days.map(d => {
                              const status = monthlyData.records[`${s.id}-${d.num}`];
                              if (status === 'A') countA++;
                              if (status === 'I') countF++;
                              if (status === 'IJ') countFJ++;
                              return (
                                <td key={d.num} className={`p-0 border-r border-slate-100 text-center ${d.isWeekend ? 'bg-slate-50/50' : ''}`}>
                                   <div className={`w-full h-8 flex items-center justify-center font-black text-[9px] ${
                                     status === 'I' ? 'bg-red-600 text-white' : 
                                     status === 'A' ? 'bg-green-600 text-white' : 
                                     status === 'IJ' ? 'bg-amber-500 text-white' : 
                                     'text-slate-200'
                                   }`}>
                                      {status === 'A' ? 'A' : status === 'I' ? 'F' : status === 'IJ' ? 'FJ' : '-'}
                                   </div>
                                </td>
                              );
                           })}
                           <td className="px-3 py-3 bg-green-50 text-center font-black text-green-700 text-[10px]">{countA}</td>
                           <td className="px-3 py-3 bg-red-50 text-center font-black text-red-700 text-[10px]">{countF}</td>
                           <td className="px-3 py-3 bg-amber-50 text-center font-black text-amber-700 text-[10px]">{countFJ}</td>
                        </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </div>

      <div className="p-12 print:block hidden border-t-2 border-black mt-20">
        <div className="grid grid-cols-3 gap-20">
           <div className="border-t border-black pt-2 text-center text-[10px] font-black uppercase">Docente Responsable</div>
           <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-24 h-24 border-2 border-black border-dashed rounded-full flex items-center justify-center text-[8px] font-black uppercase text-center">Sello de<br/>Control de Estudios</div>
           </div>
           <div className="border-t border-black pt-2 text-center text-[10px] font-black uppercase">Dirección / Sello Plantel</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
