
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
    if (viewMode !== 'monthly' || !selectedSection) return;
    const parts = selectedSection.split('-');
    const grado = parts[0];
    const seccion = parts[1];
    const dateObj = new Date(reportDate + 'T00:00:00');
    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase();
    
    const rows: string[][] = [];
    rows.push([`REPORTE ADMINISTRATIVO DE ASISTENCIA - ${grado} SECCION ${seccion}`]);
    rows.push([`PERIODO: ${monthName} DE ${dateObj.getFullYear()}`]);
    rows.push([]);
    
    const headers = ['ESTUDIANTE'];
    // Filtrar fines de semana para el Excel y usar Inicial+Número (L1, M2...)
    monthlyData.days.filter(d => !d.isWeekend).forEach(d => headers.push(`${d.label}${d.num}`));
    headers.push('TOTAL ASIST.', 'TOTAL FALTAS', 'TOTAL JUST.');
    rows.push(headers);

    monthlyData.students.forEach(s => {
      let cA = 0, cF = 0, cFJ = 0;
      const row = [s.nombre_completo.toUpperCase()];
      monthlyData.days.filter(d => !d.isWeekend).forEach(d => {
        const status = monthlyData.records[`${s.id}-${d.num}`];
        if (status === 'A') { cA++; row.push('A'); }
        else if (status === 'I') { cF++; row.push('F'); }
        else if (status === 'IJ') { cFJ++; row.push('FJ'); }
        else row.push('-');
      });
      row.push(cA.toString(), cF.toString(), cFJ.toString());
      rows.push(row);
    });

    const csvContent = "\ufeff" + rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Reporte_${grado}${seccion}_${monthName}.csv`;
    link.click();
  };

  const getMonthlyTotals = () => {
    const dayTotals: Record<number, number> = {};
    let grandA = 0, grandF = 0, grandFJ = 0;

    monthlyData.days.forEach(d => { dayTotals[d.num] = 0; });

    monthlyData.students.forEach(s => {
      monthlyData.days.forEach(d => {
        const status = monthlyData.records[`${s.id}-${d.num}`];
        if (status === 'A') {
          dayTotals[d.num]++;
          grandA++;
        } else if (status === 'I') {
          grandF++;
        } else if (status === 'IJ') {
          grandFJ++;
        }
      });
    });

    return { dayTotals, grandA, grandF, grandFJ };
  };

  const { dayTotals, grandA, grandF, grandFJ } = getMonthlyTotals();

  return (
    <div className="space-y-6 animate-in fade-in duration-700 text-left">
      <style>{`
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          .print\\:hidden { display: none !important; }
          .print\\:visible { display: flex !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 2px solid #000 !important; font-size: 7pt !important; }
          th, td { border: 1px solid #000 !important; padding: 2px 1px !important; color: #000 !important; text-align: center; }
          .signature-box { border-top: 2px solid #000; width: 100%; text-align: center; margin-top: 40px; padding-top: 8px; font-weight: 900; text-transform: uppercase; font-size: 7pt; }
        }
        .print-only { display: none; }
      `}</style>

      {/* CABECERA PARA IMPRESIÓN */}
      <div className="print:visible flex items-center justify-between border-b-4 border-black pb-4 mb-8 hidden">
        <div className="text-[9px] font-black uppercase leading-tight">
          REPÚBLICA BOLIVARIANA DE VENEZUELA<br/>
          MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN<br/>
          CENTRO DE CONTROL ADMINISTRATIVO
        </div>
        <div className="text-center">
          <h1 className="text-xl font-black uppercase italic tracking-tighter">REPORTE ADMINISTRATIVO DE ASISTENCIA</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em]">{viewMode === 'daily' ? 'Consolidado Diario' : 'Matriz de Control Mensual'}</p>
        </div>
        <div className="text-right text-[9px] font-bold uppercase">
          FECHA: {new Date().toLocaleDateString('es-ES')}<br/>
          {viewMode === 'monthly' && selectedSection && `SECCIÓN: ${selectedSection.replace('-', '° "') + '"'}`}
        </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Generación de Reportes</h1>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setViewMode('daily')} className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2 ${viewMode === 'daily' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>Diario</button>
              <button onClick={() => setViewMode('monthly')} className={`px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2 ${viewMode === 'monthly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>Mensual</button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {viewMode === 'monthly' && (
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="pl-4 pr-10 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 uppercase text-[11px] outline-none shadow-sm cursor-pointer">
              {sections.map(s => <option key={s} value={s}>{s.replace('-', '° "') + '"'}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <button onClick={() => changeDate(-1)} className="p-3 hover:bg-white rounded-xl text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
            <div className="flex items-center gap-3 px-3 border-x border-slate-200">
               <CalendarDays size={18} className="text-blue-600" />
               <input type={viewMode === 'daily' ? 'date' : 'month'} value={viewMode === 'daily' ? reportDate : reportDate.substring(0, 7)} onChange={e => setReportDate(e.target.value + (viewMode === 'monthly' ? '-01' : ''))} className="bg-transparent font-black text-slate-900 uppercase text-[11px] outline-none" />
            </div>
            <button onClick={() => changeDate(1)} className="p-3 hover:bg-white rounded-xl text-slate-400 transition-colors"><ChevronRight size={20} /></button>
          </div>
          <div className="flex gap-2">
            {viewMode === 'monthly' && (
              <button onClick={exportCSV} title="Exportar a Excel" className="p-4 bg-green-50 text-green-600 border border-green-200 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm">
                <FileSpreadsheet size={20} />
              </button>
            )}
            <button 
              type="button" 
              onClick={() => (window as any).forcePrint()} 
              className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest px-6"
            >
              <Printer size={20} /> Imprimir
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'daily' ? (
        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden print:border-none">
          <div className="bg-slate-900 p-8 print:bg-slate-50 print:border-b-4 print:border-black">
            <h2 className="text-xl font-black text-white print:text-black uppercase italic tracking-tighter">CONSOLIDADO DIARIO ESTRUCTURAL - {new Date(reportDate + 'T00:00:00').toLocaleDateString('es-ES').toUpperCase()}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-900 text-[10px] font-black text-slate-900 uppercase tracking-widest print:text-black">
                  <th className="px-8 py-6 text-left">GRADO Y SECCIÓN</th>
                  <th className="px-6 py-6 text-center">MATRÍCULA</th>
                  <th className="px-4 py-6 text-center">ASISTENTES</th>
                  <th className="px-4 py-6 text-center">INASISTENTES</th>
                  <th className="px-4 py-6 text-center">JUSTIFICADAS</th>
                  <th className="px-8 py-6 text-center">LOGRO %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-black">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-8 py-6 text-2xl font-black text-slate-900 italic uppercase text-left">{row.seccion}</td>
                    <td className="px-6 py-6 text-center font-black">{row.matricula}</td>
                    <td className="px-4 py-6 text-center font-black text-green-600">{row.asistencia}</td>
                    <td className="px-4 py-6 text-center font-black text-red-600">{row.inasistencias}</td>
                    <td className="px-4 py-6 text-center font-black text-amber-500">{row.justificadas}</td>
                    <td className="px-8 py-6 text-center font-black bg-slate-50/50">{row.logro}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MATRIZ MENSUAL - DISEÑO LINEAL SOLICITADO */
        <div className="bg-white rounded-none border-2 border-slate-100 shadow-xl overflow-hidden print:border-none">
           <div className="bg-slate-900 p-8 flex justify-between items-center text-white print:bg-slate-50 print:text-black print:border-b-4 print:border-black">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">MATRIZ MENSUAL DE CONTROL ASISTENCIAL</h2>
              <p className="text-[11px] font-black uppercase tracking-widest">{new Date(reportDate + 'T00:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
           </div>
           <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border-2 border-slate-900">
                 <thead>
                    <tr className="bg-slate-50 text-[8px] font-black text-slate-900 uppercase tracking-widest print:text-black">
                       <th className="px-4 py-4 text-left border-b-2 border-r-2 border-slate-900 sticky left-0 bg-slate-50 z-10 w-56 print:static">ESTUDIANTES</th>
                       {monthlyData.days.map(d => (
                         <th key={d.num} className={`px-1 py-4 border-b-2 border-r border-slate-900 text-center min-w-[28px] ${d.isWeekend ? 'bg-slate-200' : ''}`}>
                            <div className="flex flex-col items-center">
                              <span className="text-[7px] leading-none mb-1 text-blue-600 font-black">{d.label}</span>
                              <span className="leading-none">{d.num}</span>
                            </div>
                         </th>
                       ))}
                       <th className="px-2 py-4 border-b-2 border-r border-slate-900 text-center text-green-700 bg-green-50/30">A</th>
                       <th className="px-2 py-4 border-b-2 border-r border-slate-900 text-center text-red-700 bg-red-50/30">F</th>
                       <th className="px-2 py-4 border-b-2 border-slate-900 text-center text-amber-700 bg-amber-50/30">FJ</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {monthlyData.students.map(s => {
                       let countA = 0, countF = 0, countFJ = 0;
                       return (
                         <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 border-r-2 border-slate-900 sticky left-0 bg-white font-black text-slate-900 uppercase text-[9px] print:static truncate">{s.nombre_completo}</td>
                            {monthlyData.days.map(d => {
                               const status = monthlyData.records[`${s.id}-${d.num}`];
                               if (status === 'A') countA++;
                               if (status === 'I') countF++;
                               if (status === 'IJ') countFJ++;
                               return (
                                 <td key={d.num} className={`p-0 border-r border-slate-200 text-center ${d.isWeekend ? 'bg-slate-50' : ''}`}>
                                    <div className={`w-full h-8 flex items-center justify-center font-black text-[9px] ${
                                      status === 'I' ? 'bg-red-600 text-white' : 
                                      status === 'A' ? 'bg-green-600 text-white' : 
                                      status === 'IJ' ? 'bg-amber-500 text-white' : 
                                      'text-slate-100'
                                    }`}>
                                       {status === 'A' ? 'A' : status === 'I' ? 'F' : status === 'IJ' ? 'FJ' : ''}
                                    </div>
                                 </td>
                               );
                            })}
                            <td className="px-2 py-3 bg-green-50 text-center font-black text-green-700 text-[10px] border-l border-slate-900">{countA}</td>
                            <td className="px-2 py-3 bg-red-50 text-center font-black text-red-700 text-[10px] border-l border-slate-900">{countF}</td>
                            <td className="px-2 py-3 bg-amber-50 text-center font-black text-amber-700 text-[10px] border-l border-slate-900">{countFJ}</td>
                         </tr>
                       );
                    })}
                 </tbody>
                 {/* FILA DE TOTALES - AUDITORÍA */}
                 <tfoot>
                    <tr className="bg-slate-900 text-white font-black text-[8px] uppercase tracking-widest print:bg-slate-50 print:text-black">
                       <td className="px-4 py-4 border-r-2 border-t-2 border-slate-900 sticky left-0 bg-slate-900 text-left print:static">TOTAL ASISTENCIA DIARIA</td>
                       {monthlyData.days.map(d => (
                         <td key={d.num} className={`px-1 py-4 border-r border-t-2 border-slate-900 text-center ${d.isWeekend ? 'bg-slate-800 print:bg-slate-100' : ''}`}>
                            {dayTotals[d.num] > 0 ? dayTotals[d.num] : '-'}
                         </td>
                       ))}
                       <td className="px-2 py-4 border-t-2 border-l border-slate-900 text-center bg-green-900 text-green-100 print:bg-slate-100 print:text-black">{grandA}</td>
                       <td className="px-2 py-4 border-t-2 border-l border-slate-900 text-center bg-red-900 text-red-100 print:bg-slate-100 print:text-black">{grandF}</td>
                       <td className="px-2 py-4 border-t-2 border-l border-slate-900 text-center bg-amber-900 text-amber-100 print:bg-slate-100 print:text-black">{grandFJ}</td>
                    </tr>
                 </tfoot>
              </table>
           </div>
           
           <div className="p-12 print:block hidden">
            <div className="grid grid-cols-3 gap-16">
               <div className="signature-box">Firma del Docente de Aula</div>
               <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 border-2 border-black border-dashed rounded-full flex items-center justify-center text-[8px] font-black uppercase text-center">Sello del<br/>Plantel</div>
               </div>
               <div className="signature-box">Firma de la Dirección</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;
