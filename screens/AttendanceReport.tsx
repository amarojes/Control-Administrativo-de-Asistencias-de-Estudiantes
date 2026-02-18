
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/StorageService';
import { Student, AttendanceRecord } from '../types';
import { ClipboardList, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, CalendarDays, AlertCircle } from 'lucide-react';

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
      alert("No hay datos cargados para exportar en esta fecha.");
      return;
    }
    
    let csvContent = "";
    const SEP = ";"; 

    if (viewMode === 'daily') {
      csvContent += "REPORTE DIARIO DE ASISTENCIA\n";
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

    // Exportación sin BOM para evitar símbolos extraños como ï»¿
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte_${viewMode === 'daily' ? 'diario' : 'mensual'}_${reportDate.replace(/-/g, '')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintAction = () => {
    // Aseguramos foco y pequeño retardo para que el DOM esté listo
    window.focus();
    setTimeout(() => {
        window.print();
    }, 250);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      <style>{`
        @media print {
          html, body { 
            height: auto !important; 
            overflow: visible !important; 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
          }
          #root, main { 
            height: auto !important; 
            overflow: visible !important; 
            position: static !important; 
            display: block !important; 
          }
          .report-container { 
            display: block !important; 
            overflow: visible !important; 
            width: 100% !important; 
            border: 1px solid #000 !important; 
            border-radius: 0 !important; 
          }
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            font-size: 9pt !important; 
            color: #000 !important; 
          }
          th, td { 
            border: 1px solid #000 !important; 
            padding: 6px !important; 
            background: transparent !important; 
            color: #000 !important; 
          }
          .print-header { 
            display: flex !important; 
            margin-bottom: 20px !important; 
            width: 100% !important; 
          }
          .no-print, header, nav, aside, button { 
            display: none !important; 
          }
          @page { 
            size: landscape; 
            margin: 1.5cm; 
          }
        }
        .print-header { display: none; }
      `}</style>

      <div className="print-header flex items-center justify-between border-b-2 border-black pb-4 mb-6">
        <div className="text-[10px] font-bold uppercase leading-tight">
          República Bolivariana de Venezuela<br/>
          Ministerio del Poder Popular para la Educación<br/>
          Control Administrativo Institucional
        </div>
        <div className="text-right">
          <h1 className="text-lg font-black uppercase italic text-slate-900">
            {viewMode === 'daily' ? 'Reporte Diario de Asistencia' : 'Matriz de Control Mensual'}
          </h1>
          <p className="text-[10px] font-black uppercase text-blue-600">Fecha: {reportDate}</p>
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
            <button onClick={exportCSV} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all shadow-lg font-black text-[9px] uppercase tracking-widest border-b-4 border-green-800">
              <FileSpreadsheet size={18} />
              <span>DESCARGAR EXCEL</span>
            </button>
            <button onClick={handlePrintAction} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg font-black text-[9px] uppercase tracking-widest border-b-4 border-slate-700">
              <Printer size={18} /> 
              <span>IMPRIMIR REPORTE</span>
            </button>
          </div>
        </div>
      </header>

      <div className="report-container bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl overflow-hidden min-h-[300px] flex flex-col">
        {viewMode === 'daily' ? (
          <div className="overflow-x-auto">
            <div className="bg-slate-900 p-6 no-print flex justify-between items-center text-white">
              <h2 className="text-lg font-black uppercase italic tracking-tighter">Consolidado Diario de Asistencia</h2>
              <span className="bg-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{reportDate}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-8 py-5">Sección Escolar</th>
                  <th className="px-6 py-5 text-center">Matrícula</th>
                  <th className="px-4 py-5 text-center text-green-600">Presentes</th>
                  <th className="px-4 py-5 text-center text-red-600">Inasistentes</th>
                  <th className="px-8 py-5 text-right text-blue-600">Logro (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase italic">{row.seccion}</td>
                    <td className="px-6 py-5 text-center font-bold text-slate-600">{row.matricula}</td>
                    <td className="px-4 py-5 text-center font-bold text-green-600">{row.asistencia}</td>
                    <td className="px-4 py-5 text-center font-bold text-red-600">{row.inasistencias}</td>
                    <td className="px-8 py-5 text-right font-black text-blue-600">{row.logro}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="bg-slate-900 p-6 no-print text-white">
              <h2 className="text-lg font-black uppercase italic tracking-tighter">Matriz de Control Mensual de Asistencia</h2>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[7px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-4 sticky left-0 bg-slate-50 z-10 w-64 print:static">Nombre del Estudiante</th>
                  {monthlyData.days.map(d => (
                    <th key={d.num} className={`px-1 py-4 text-center ${d.isWeekend ? 'bg-slate-100' : ''}`}>{d.num}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyData.students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors text-[8px]">
                    <td className="px-6 py-2 sticky left-0 bg-white font-black text-slate-900 uppercase truncate print:static">{s.nombre_completo}</td>
                    {monthlyData.days.map(d => (
                      <td key={d.num} className="p-0 text-center border-r border-slate-50">
                        {monthlyData.records[`${s.id}-${d.num}`] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-12 print:block hidden border-t-2 border-black mt-16 text-center">
        <div className="grid grid-cols-3 gap-20">
           <div className="border-t border-black pt-2 text-[10px] font-black uppercase">Firma del Docente</div>
           <div className="w-24 h-24 border-2 border-black border-dashed rounded-full flex items-center justify-center mx-auto text-[7px] font-black uppercase">Sello Plantel</div>
           <div className="border-t border-black pt-2 text-[10px] font-black uppercase">Dirección / Sello</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
