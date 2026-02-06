
import React, { useEffect, useState, useMemo } from 'react';
import { Employee, AttendanceRecord, BreakSession } from '../types';
import { StorageService } from '../services/storageService';

interface EmployeeDashboardProps {
  employee: Employee;
  onClose: () => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employee, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30); // Increased time for break management
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const refreshData = () => {
      const today = new Date().toISOString().split('T')[0];
      const records = StorageService.getAttendance();
      const record = records.find(r => r.employeeId === employee.id && r.date === today);
      setTodayRecord(record || null);
    };

    refreshData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [employee.id, onClose]);

  const isOnBreak = useMemo(() => {
    if (!todayRecord) return false;
    const lastBreak = todayRecord.breaks[todayRecord.breaks.length - 1];
    return lastBreak && !lastBreak.end;
  }, [todayRecord]);

  const handleToggleBreak = () => {
    if (!todayRecord) return;
    
    const newRecord = { ...todayRecord };
    const now = new Date().toISOString();

    if (isOnBreak) {
      // End break
      const breaks = [...newRecord.breaks];
      breaks[breaks.length - 1].end = now;
      newRecord.breaks = breaks;
    } else {
      // Start break
      newRecord.breaks = [...newRecord.breaks, { start: now, end: null }];
    }

    StorageService.recordAttendance(newRecord);
    setTodayRecord(newRecord);
    setTimeLeft(30); // Reset timer when active
  };

  const stats = useMemo(() => {
    if (!todayRecord || !todayRecord.checkIn) return { totalWork: 0, totalBreak: 0 };

    const checkInTime = new Date(todayRecord.checkIn).getTime();
    const endReference = todayRecord.checkOut ? new Date(todayRecord.checkOut).getTime() : currentTime.getTime();
    
    let totalBreakMs = 0;
    todayRecord.breaks.forEach(b => {
      const start = new Date(b.start).getTime();
      const end = b.end ? new Date(b.end).getTime() : currentTime.getTime();
      totalBreakMs += (end - start);
    });

    const totalDurationMs = endReference - checkInTime;
    const workDurationMs = totalDurationMs - totalBreakMs;

    return {
      totalWork: Math.max(0, workDurationMs),
      totalBreak: Math.max(0, totalBreakMs)
    };
  }, [todayRecord, currentTime]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-[48px] shadow-2xl overflow-hidden animate-[scaleUp_0.4s_ease-out] border-[12px] border-slate-800">
        <div className="flex flex-col md:flex-row">
          {/* Profile Section */}
          <div className="md:w-1/3 bg-slate-50 p-10 flex flex-col items-center text-center border-r border-slate-100">
            <div className="relative mb-6">
              <img 
                src={employee.thumbnail} 
                className="w-40 h-40 rounded-[50px] object-cover border-8 border-white shadow-xl"
                alt={employee.name}
              />
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg ${isOnBreak ? 'bg-amber-500' : 'bg-green-500'}`}>
                {isOnBreak ? 'Currently On Break' : 'Active Status'}
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-1">{employee.name}</h2>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-6">{employee.role}</p>
            
            <div className="w-full space-y-4 pt-6 border-t border-slate-200">
              <div className="text-left bg-white p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Work Hours</p>
                <p className="text-2xl font-black text-slate-800 font-mono">{formatDuration(stats.totalWork)}</p>
              </div>
              <div className="text-left bg-white p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Break Time</p>
                <p className="text-2xl font-black text-amber-600 font-mono">{formatDuration(stats.totalBreak)}</p>
              </div>
            </div>

            <div className="mt-8 text-left w-full px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</p>
              <p className="font-bold text-slate-700 text-sm">{employee.department} • {employee.id}</p>
            </div>
          </div>

          {/* Attendance & Controls Section */}
          <div className="flex-1 p-10 flex flex-col">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daily Performance</h1>
                <p className="text-slate-400 font-medium">{currentTime.toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <i className="fa-solid fa-right-to-bracket"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch In</span>
                </div>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="flex items-center space-x-4 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <i className="fa-solid fa-right-from-bracket"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch Out</span>
                </div>
                <p className="text-xl font-black text-slate-900 font-mono">
                  {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
            </div>

            {/* Break Controls */}
            <div className="flex-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Shift Controls</h3>
              <div className="grid grid-cols-1 gap-4">
                {todayRecord && !todayRecord.checkOut && (
                  <button 
                    onClick={handleToggleBreak}
                    className={`w-full p-8 rounded-[32px] flex items-center justify-between transition-all group ${isOnBreak ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'}`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${isOnBreak ? 'bg-white/20' : 'bg-white/10'}`}>
                        <i className={`fa-solid ${isOnBreak ? 'fa-play' : 'fa-coffee'}`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black">{isOnBreak ? 'End Break' : 'Take a Break'}</p>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">{isOnBreak ? 'Ready to work?' : 'Need a coffee?'}</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right opacity-30 group-hover:translate-x-1 transition-transform"></i>
                  </button>
                )}
                
                {(!todayRecord || todayRecord.checkOut) && (
                  <div className="bg-slate-100 p-8 rounded-[32px] text-center border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">Shift is currently inactive.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={onClose}
                className="bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-300 transition-all"
              >
                Close Terminal
              </button>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Session Expires</p>
                  <div className="flex items-center justify-end space-x-2">
                    <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
                    </div>
                    <p className="text-slate-900 font-black text-sm font-mono">{timeLeft}s</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;
