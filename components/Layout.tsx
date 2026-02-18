
import React, { useEffect, useRef, useState } from 'react';
import { User, LogOut, LayoutDashboard, Users, FileBarChart, Bot, ClipboardList, ClipboardCheck, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const isAdmin = user.rol === 'administrador';
  const mainRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const menuItems = isAdmin 
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'users', label: 'Personal', icon: Users },
        { id: 'students', label: 'Matrícula', icon: FileBarChart },
        { id: 'attendance-report', label: 'Reportes', icon: ClipboardList },
      ]
    : [
        { id: 'dashboard', label: 'Gestión de Asistencia', icon: LayoutDashboard },
        { id: 'ai-helper', label: 'Asistente IA', icon: Bot },
      ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 md:p-8 flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
          <ClipboardCheck className="text-white" size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] md:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none">Control de</span>
          <span className="text-[10px] md:text-[11px] font-black text-blue-600 uppercase tracking-tight leading-none">Asistencia</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 md:py-4 rounded-2xl transition-all ${
              activeTab === item.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-1' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-400'} />
            <span className="font-black text-[10px] md:text-xs uppercase tracking-widest text-left">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-100 space-y-4 shrink-0">
        <div className="bg-slate-900 p-4 md:p-5 rounded-2xl md:rounded-3xl flex items-center gap-3 border border-slate-800">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border shrink-0 ${user.id === 'admin-1' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-blue-600/10 border-blue-600 text-blue-500'}`}>
            <User size={16} />
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-[9px] md:text-[10px] font-black text-white truncate uppercase tracking-tighter">{user.nombre} {user.apellido}</p>
            <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] ${user.id === 'admin-1' ? 'text-amber-500' : 'text-blue-400'}`}>
              {user.rol}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden print:block">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0 z-30 no-print">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="text-blue-600" size={24} />
          <span className="text-xs font-black uppercase italic tracking-tighter">Control de Asistencia</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-100 rounded-xl">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden no-print" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-white flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col z-20 shadow-xl no-print h-screen">
        <SidebarContent />
      </aside>

      <main ref={mainRef} className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-slate-50 relative scroll-smooth print:h-auto print:overflow-visible">
        <div className="w-full max-w-7xl mx-auto p-4 md:p-10 pb-24 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
