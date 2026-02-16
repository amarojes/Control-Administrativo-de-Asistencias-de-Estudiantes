import React, { useState, useEffect } from 'react';
import { StorageService } from './services/StorageService';
import { User } from './types';
import Login from './screens/Login';
import Layout from './components/Layout';
import AdminDashboard from './screens/AdminDashboard';
import TeacherDashboard from './screens/TeacherDashboard';
import AttendanceRegister from './screens/AttendanceRegister';
import AIHelper from './screens/AIHelper';
import UserManagement from './screens/UserManagement';
import StudentManagement from './screens/StudentManagement';
import AttendanceReport from './screens/AttendanceReport';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedGroup, setSelectedGroup] = useState<{ grado: string, seccion: string } | null>(null);

  useEffect(() => {
    StorageService.init();
    const saved = localStorage.getItem('asistencia_session');
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('asistencia_session', JSON.stringify(user));
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('asistencia_session');
  };

  if (!currentUser) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    if (currentUser.rol === 'administrador') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'users': return <UserManagement />;
        case 'students': return <StudentManagement />;
        case 'attendance-report': return <AttendanceReport />;
        default: return <AdminDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard': return <TeacherDashboard user={currentUser} onSelectGroup={(g, s) => { setSelectedGroup({grado:g, seccion:s}); setActiveTab('attendance-view'); }} />;
        case 'attendance-view': return selectedGroup ? <AttendanceRegister grado={selectedGroup.grado} seccion={selectedGroup.seccion} onBack={() => setActiveTab('dashboard')} /> : null;
        case 'ai-helper': return <AIHelper />;
        default: return <TeacherDashboard user={currentUser} onSelectGroup={() => {}} />;
      }
    }
  };

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;