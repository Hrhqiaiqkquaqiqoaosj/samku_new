import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);

  console.log('Layout received user:', currentUser);

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        role={currentUser?.role}
      />
        {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;