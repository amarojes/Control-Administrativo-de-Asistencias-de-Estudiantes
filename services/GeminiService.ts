
import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, Student } from "../types";

export class GeminiService {
  private prepareContext(students: Student[], attendance: AttendanceRecord[]) {
    return students.map(s => {
      const records = attendance.filter(r => r.estudiante_id === s.id);
      return {
        n: s.nombre_completo,
        f: records.filter(r => r.estado === 'I').length,
        j: records.filter(r => r.estado === 'IJ').length,
        p: records.filter(r => r.estado === 'A').length,
        g: `${s.grado}° ${s.seccion}`
      };
    }).filter(s => s.f > 0 || s.p > 0);
  }

  async analyzeAttendance(students: Student[], attendance: AttendanceRecord[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const dataSummary = JSON.stringify(this.prepareContext(students, attendance));
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza este resumen de asistencia y riesgos: ${dataSummary}`,
        config: { 
          systemInstruction: "Eres el Asistente de Control de Asistencia Institucional. Tu objetivo es analizar riesgos de deserción escolar y sugerir protocolos administrativos basados en la normativa educativa vigente. Sé profesional, directo y ejecutivo. No menciones nombres propios de IA." 
        }
      });
      return response.text;
    } catch (e) { 
      console.error("Error en GeminiService:", e);
      return "Lo siento, ha ocurrido un error al conectar con el asistente de control. Por favor, verifica tu conexión o intenta más tarde."; 
    }
  }

  async askQuestion(question: string, students: Student[], attendance: AttendanceRecord[], history: any[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const dataSummary = JSON.stringify(this.prepareContext(students, attendance));
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({ 
            role: h.role === 'user' ? 'user' : 'model', 
            parts: [{ text: h.content }] 
          })), 
          { role: 'user', parts: [{ text: question }] }
        ],
        config: { 
          systemInstruction: `Eres el Asistente Institucional de Control Administrativo. Tienes acceso a la base de datos de matrícula actual: ${dataSummary}. Responde consultas sobre estudiantes, justifica protocolos y ayuda al docente en la gestión administrativa. Mantén un tono formal e institucional.` 
        }
      });
      return response.text;
    } catch (e) { 
      console.error("Error en GeminiService (Chat):", e);
      return "Error al procesar la consulta administrativa."; 
    }
  }
}
