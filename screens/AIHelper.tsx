
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, BrainCircuit, Info, User as UserIcon, Bot } from 'lucide-react';
import { GeminiService } from '../services/GeminiService';
import { StorageService } from '../services/StorageService';
import { ChatMessage } from '../types';

const AIHelper: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const steps = [
    "Sincronizando con base de datos institucional...",
    "Analizando matrícula y asistencia...",
    "Evaluando riesgos de permanencia...",
    "Consultando protocolos administrativos...",
    "Finalizando reporte para el docente..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % steps.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const runInitialAnalysis = async () => {
    setLoading(true);
    try {
      const gemini = new GeminiService();
      const students = StorageService.getStudents();
      const attendance = StorageService.getAttendance();
      
      const result = await gemini.analyzeAttendance(students, attendance);
      if (result) {
        setMessages([{
          role: 'assistant',
          content: result,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    const newUserMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const gemini = new GeminiService();
      const students = StorageService.getStudents();
      const attendance = StorageService.getAttendance();
      
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await gemini.askQuestion(userMessage, students, attendance, chatHistory);
      
      if (response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in zoom-in-95 duration-500 h-[calc(100vh-160px)] flex flex-col">
      <header className="text-center space-y-2 shrink-0">
        <div className="flex items-center justify-center gap-5">
           <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg text-white">
              <Bot size={28} />
           </div>
           <div className="text-left">
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">Asistente de Control</h1>
              <p className="text-blue-600 font-bold uppercase tracking-widest text-[9px] mt-1">Análisis de Permanencia Estudiantil</p>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {messages.length === 0 && !loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                <BrainCircuit size={48} />
              </div>
              <div className="max-w-sm space-y-4">
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">¿Cómo puedo ayudarle, Docente?</h3>
                <p className="text-slate-500 text-sm italic font-medium">
                  Puedo analizar la asistencia de su grupo, generar protocolos de citación o identificar alumnos con riesgo de abandono escolar basado en el Control Administrativo.
                </p>
              </div>
              <button
                onClick={runInitialAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-blue-600/20 transition-all flex items-center gap-4 uppercase text-xs tracking-widest group"
              >
                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                Iniciar Análisis de Control
              </button>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'}`}>
                      {msg.role === 'user' ? <UserIcon size={14} /> : <span className="font-black italic text-[10px]">C</span>}
                    </div>
                    <div className={`p-6 rounded-[1.8rem] text-sm leading-relaxed text-left ${
                      msg.role === 'user' 
                      ? 'bg-blue-50 text-blue-900 rounded-tr-none font-bold italic' 
                      : 'bg-white border-2 border-slate-100 text-slate-700 rounded-tl-none font-medium prose prose-slate max-w-none shadow-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        msg.content
                      )}
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-4 ${msg.role === 'user' ? 'text-blue-300' : 'text-slate-300'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start animate-pulse">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                      <Loader2 size={14} className="animate-spin" />
                    </div>
                    <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[1.8rem] rounded-tl-none">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {steps[loadingStep]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="bg-slate-50 p-6 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-inner focus-within:border-blue-600 transition-all">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escriba su consulta administrativa al asistente..." 
                className="flex-1 bg-transparent border-none outline-none text-slate-900 font-bold placeholder:text-slate-300 text-sm"
                disabled={loading}
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95"
            >
              <Send size={24} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Info size={10} className="text-slate-400" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sistema de Control Administrativo Institucional</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIHelper;
