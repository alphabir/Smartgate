
import React, { useEffect, useState, useMemo } from 'react';
import { Employee, AttendanceRecord, BreakSession } from '../types';
import { StorageService } from '../services/storageService';

interface EmployeeDashboardProps {
  employee: Employee;
  onClose: () => void;
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employee, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(30);
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
      const breaks = [...newRecord.breaks];
      breaks[breaks.length - 1].end = now;
      newRecord.breaks = breaks;
    } else {
      newRecord.breaks = [...newRecord.breaks, { start: now, end: null }];
    }
    StorageService.recordAttendance(newRecord);
    setTodayRecord(newRecord);
    setTimeLeft(30);
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
    return { totalWork: Math.max(0, totalDurationMs - totalBreakMs), totalBreak: Math.max(0, totalBreakMs) };
  }, [todayRecord, currentTime]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 font-sans">
      <div className="max-w-6xl w-full bg-white rounded-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden border-[15px] border-slate-900 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col md:flex-row min-h-[700px]">
          {/* Academic Profile */}
          <div className="md:w-1/3 bg-indigo-50/40 p-14 flex flex-col items-center text-center border-r border-indigo-100">
            <div className="relative mb-8">
              <img 
                src={employee.thumbnail} 
                className="w-48 h-48 rounded-[60px] object-cover border-[12px] border-white shadow-2xl"
                alt={employee.name}
              />
              <div className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-white text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-xl ${isOnBreak ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                {isOnBreak ? 'Session Interval' : 'Academic Load Active'}
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-950 leading-tight mb-2 tracking-tight">{employee.name}</h2>
            <p className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-10">{employee.role}</p>
            
            <div className="w-full space-y-6 pt-10 border-t border-indigo-100/50">
              <div className="text-left bg-white p-6 rounded-[30px] border border-indigo-100/50 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Academic Hours</p>
                <p className="text-3xl font-black text-slate-950 font-mono tracking-tighter">{formatDuration(stats.totalWork)}</p>
              </div>
              <div className="text-left bg-white p-6 rounded-[30px] border border-indigo-100/50 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Break Duration</p>
                <p className="text-3xl font-black text-amber-600 font-mono tracking-tighter">{formatDuration(stats.totalBreak)}</p>
              </div>
            </div>

            <div className="mt-12 text-left w-full px-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Faculty & Registry ID</p>
              <div className="flex items-center space-x-2">
                 <i className="fa-solid fa-university text-indigo-400 text-xs"></i>
                 <p className="font-black text-slate-700 text-xs truncate">{employee.department} • {employee.id.split('-')[1]}</p>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="flex-1 p-16 flex flex-col">
            <div className="flex justify-between items-start mb-14">
              <div>
                <h1 className="text-4xl font-black text-slate-950 tracking-tight">Academic Daily Record</h1>
                <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mt-2">{currentTime.toLocaleDateString(undefined, { dateStyle: 'full' })}</p>
              </div>
              <div className="bg-slate-950 px-6 py-3 rounded-2xl flex items-center space-x-3 text-white">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-widest">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="bg-indigo-50/30 p-8 rounded-[40px] border border-indigo-100/30 group hover:bg-indigo-50 transition-colors">
                <div className="flex items-center space-x-5 mb-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-door-open text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Campus Entry</span>
                </div>
                <p className="text-3xl font-black text-slate-950 font-mono tracking-tighter">
                  {todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>

              <div className="bg-indigo-50/30 p-8 rounded-[40px] border border-indigo-100/30 group hover:bg-indigo-50 transition-colors">
                <div className="flex items-center space-x-5 mb-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-400 shadow-sm border border-indigo-50 group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-door-closed text-2xl"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Campus Exit</span>
                </div>
                <p className="text-3xl font-black text-slate-950 font-mono tracking-tighter">
                  {todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Advisor Session Controls</h3>
              <div className="grid grid-cols-1">
                {todayRecord && !todayRecord.checkOut && (
                  <button 
                    onClick={handleToggleBreak}
                    className={`w-full p-10 rounded-[45px] flex items-center justify-between transition-all group ${isOnBreak ? 'bg-amber-500 text-white shadow-2xl shadow-amber-500/30' : 'bg-slate-950 text-white shadow-2xl shadow-slate-950/30'}`}
                  >
                    <div className="flex items-center space-x-8">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl ${isOnBreak ? 'bg-white/20' : 'bg-indigo-600/30'}`}>
                        <i className={`fa-solid ${isOnBreak ? 'fa-hourglass-start' : 'fa-mug-hot'}`}></i>
                      </div>
                      <div className="text-left">
                        <p className="text-3xl font-black tracking-tight">{isOnBreak ? 'Resume Session' : 'Take Recess'}</p>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{isOnBreak ? 'Return to academic duties' : 'Pause current activity'}</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-3 transition-transform">
                       <i className="fa-solid fa-chevron-right text-xl"></i>
                    </div>
                  </button>
                )}
                
                {(!todayRecord || todayRecord.checkOut) && (
                  <div className="bg-slate-50 p-12 rounded-[45px] text-center border-4 border-dashed border-indigo-50">
                    <i className="fa-solid fa-moon text-4xl text-indigo-100 mb-4 block"></i>
                    <p className="text-indigo-300 font-black uppercase tracking-widest text-xs">Registry session is currently inactive.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-indigo-50 flex items-center justify-between">
              <button 
                onClick={onClose}
                className="bg-slate-100 text-slate-700 px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-100 hover:text-indigo-600 transition-all"
              >
                Exit Dashboard
              </button>
              <div className="text-right">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mb-3">Advisor Session Security</p>
                <div className="flex items-center justify-end space-x-4">
                  <div className="h-2.5 w-40 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(timeLeft / 30) * 100}%` }}></div>
                  </div>
                  <p className="text-slate-950 font-black text-base font-mono leading-none">{timeLeft}s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
