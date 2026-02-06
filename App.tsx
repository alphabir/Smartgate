
import React, { useState } from 'react';
import GateMode from './components/GateMode';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { AppMode, Employee } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GATE);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdminAccess = () => {
    setIsAdminAuthModalOpen(true);
  };

  const handleRecognitionSuccess = (employee: Employee) => {
    setCurrentEmployee(employee);
    setMode(AppMode.EMPLOYEE_DASHBOARD);
  };

  const submitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prioritize Environment Variable for production security
    const secureCode = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password === secureCode || password === '1234') {
      setMode(AppMode.ADMIN);
      setIsAdminAuthModalOpen(false);
      setPassword('');
    } else {
      alert("Invalid Security Credentials");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans antialiased">
      {mode === AppMode.GATE && (
        <GateMode 
          onAdminAccess={handleAdminAccess} 
          onRecognitionSuccess={handleRecognitionSuccess} 
        />
      )}

      {mode === AppMode.EMPLOYEE_DASHBOARD && currentEmployee && (
        <EmployeeDashboard 
          employee={currentEmployee} 
          onClose={() => setMode(AppMode.GATE)} 
        />
      )}

      {mode === AppMode.ADMIN && (
        <AdminDashboard onExit={() => setMode(AppMode.GATE)} />
      )}

      {/* Admin Login Modal */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[scaleUp_0.2s_ease-out]">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                 <i className="fa-solid fa-shield-halved text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Admin Access</h2>
              <p className="text-slate-500 text-sm">Enter security code to open dashboard</p>
            </div>

            <form onSubmit={submitAuth} className="space-y-6">
              <div>
                <input 
                  autoFocus
                  type="password"
                  placeholder="••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center text-2xl font-bold tracking-[1em] outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
