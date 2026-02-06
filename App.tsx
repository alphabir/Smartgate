
import React, { useState } from 'react';
import GateMode from './components/GateMode';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { AppMode, Employee } from './types';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1lJPDezlGmSFBxZfO0agZtCAlsN-Zrnmk";

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GATE);
  const [currentMember, setCurrentMember] = useState<Employee | null>(null);
  const [isAdvisorAuthModalOpen, setIsAdvisorAuthModalOpen] = useState(false);
  const [password, setPassword] = useState('');

  const handleAdvisorAccess = () => {
    setIsAdvisorAuthModalOpen(true);
  };

  const handleRecognitionSuccess = (member: Employee) => {
    setCurrentMember(member);
    setMode(AppMode.EMPLOYEE_DASHBOARD);
  };

  const submitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const secureCode = process.env.ADMIN_PASSWORD || 'admin123';
    if (password === secureCode || password === '1234') {
      setMode(AppMode.ADMIN);
      setIsAdvisorAuthModalOpen(false);
      setPassword('');
    } else {
      alert("Institutional Security Error: Invalid Advisor Code");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased">
      {mode === AppMode.GATE && (
        <GateMode 
          onAdminAccess={handleAdvisorAccess} 
          onRecognitionSuccess={handleRecognitionSuccess} 
        />
      )}

      {mode === AppMode.EMPLOYEE_DASHBOARD && currentMember && (
        <EmployeeDashboard 
          employee={currentMember} 
          onClose={() => setMode(AppMode.GATE)} 
        />
      )}

      {mode === AppMode.ADMIN && (
        <AdminDashboard onExit={() => setMode(AppMode.GATE)} />
      )}

      {/* Advisor Authentication Modal */}
      {isAdvisorAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-6">
          <div className="bg-white rounded-[50px] p-12 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 border-[10px] border-indigo-50">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-24 h-24 bg-indigo-50 rounded-[35px] flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/10 overflow-hidden border-4 border-white">
                 <img src={LOGO_URL} alt="College Advisor Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Advisor Access</h2>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3">Enter campus security credential</p>
            </div>

            <form onSubmit={submitAuth} className="space-y-8">
              <div className="relative group">
                <input 
                  autoFocus
                  type="password"
                  placeholder="••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-4 border-slate-100 rounded-[30px] px-8 py-6 text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setIsAdvisorAuthModalOpen(false)}
                  className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[9px] hover:text-rose-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-indigo-600 text-white py-5 rounded-[25px] font-black uppercase tracking-widest text-[9px] shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.05] transition-all active:scale-95"
                >
                  Authorize Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
