
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, AttendanceRecord, AdminTab, Shift, Holiday, SalaryType } from '../types';
import EmployeeManagement from './EmployeeManagement';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1lJPDezlGmSFBxZfO0agZtCAlsN-Zrnmk";

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.DASHBOARD);
  const [members, setMembers] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<Shift[]>([]);
  const [calendar, setCalendar] = useState<Holiday[]>([]);

  useEffect(() => {
    setMembers(StorageService.getEmployees());
    setAttendance(StorageService.getAttendance());
    setSchedules(StorageService.getShifts());
    setCalendar(StorageService.getHolidays());
  }, [activeTab]);

  const calculateFinancials = (emp: Employee) => {
    const records = attendance.filter(r => r.employeeId === emp.id);
    const presentCount = records.filter(r => r.checkIn).length;
    let total = 0;
    if (emp.salaryConfig.type === 'MONTHLY') total = emp.salaryConfig.baseAmount;
    else if (emp.salaryConfig.type === 'DAILY') total = emp.salaryConfig.baseAmount * presentCount;
    return total;
  };

  return (
    <div className="flex h-screen bg-indigo-50/30 font-sans">
      <aside className="w-80 bg-slate-950 text-white flex flex-col shadow-[10px_0_40px_rgba(0,0,0,0.1)]">
        <div className="p-12">
          <div className="flex items-center space-x-4 mb-2">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 overflow-hidden border-2 border-indigo-500/30 ring-4 ring-indigo-500/10">
              <img src={LOGO_URL} alt="College Advisor" className="w-full h-full object-cover scale-90" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-white">College Advisor</h1>
              <p className="text-[9px] text-indigo-400 font-black tracking-[0.3em] uppercase mt-1">Campus Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-8 space-y-3 overflow-y-auto mt-6">
          {[
            { id: AdminTab.DASHBOARD, icon: 'fa-table-columns', label: 'Command Center' },
            { id: AdminTab.EMPLOYEES, icon: 'fa-user-group', label: 'Academic Registry' },
            { id: AdminTab.SHIFTS, icon: 'fa-clock-rotate-left', label: 'Schedule Matrix' },
            { id: AdminTab.PAYROLL, icon: 'fa-money-bill-transfer', label: 'Financial Hub' },
            { id: AdminTab.POLICY, icon: 'fa-gavel', label: 'Institutional Policy' },
            { id: AdminTab.REPORTS, icon: 'fa-chart-pie', label: 'Data Intelligence' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center space-x-5 px-6 py-5 rounded-[24px] transition-all group ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'text-slate-500 hover:text-indigo-100 hover:bg-slate-900'}`}
            >
              <i className={`fa-solid ${tab.icon} w-6 text-xl transition-transform group-hover:scale-110`}></i>
              <span className="font-black text-xs uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-slate-900">
          <button onClick={onExit} className="w-full flex items-center justify-center space-x-3 py-5 bg-rose-500/10 text-rose-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
            <i className="fa-solid fa-power-off"></i>
            <span>Log Out Advisor</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-3xl px-14 py-10 flex justify-between items-center border-b border-indigo-100/50">
          <div>
            <h2 className="text-4xl font-black text-slate-950 tracking-tight">{activeTab}</h2>
            <div className="flex items-center space-x-2 mt-2">
               <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Institutional Node 01 | Active Session</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-slate-950 font-black leading-none text-lg">Advisor Prime</p>
              <p className="text-indigo-600 text-[10px] font-black uppercase mt-1">Superuser Access</p>
            </div>
            <div className="w-16 h-16 bg-white border border-indigo-100 rounded-[28px] overflow-hidden flex items-center justify-center text-white shadow-xl shadow-indigo-600/5">
              <img src={LOGO_URL} alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="p-14">
          {activeTab === AdminTab.DASHBOARD && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-4 gap-10">
                {[
                  { label: 'Campus Registry', val: members.length, icon: 'fa-address-card', color: 'indigo' },
                  { label: 'Verified Present', val: attendance.filter(r => r.date === new Date().toISOString().split('T')[0]).length, icon: 'fa-circle-check', color: 'emerald' },
                  { label: 'Absence Alerts', val: 0, icon: 'fa-bell-slash', color: 'rose' },
                  { label: 'Weekly Hours', val: '284h', icon: 'fa-chart-column', color: 'violet' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-10 rounded-[45px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-indigo-50/50 hover:shadow-2xl hover:-translate-y-2 transition-all">
                    <div className={`w-14 h-14 bg-${s.color}-50 text-${s.color}-600 rounded-3xl flex items-center justify-center mb-8`}>
                      <i className={`fa-solid ${s.icon} text-2xl`}></i>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{s.label}</p>
                    <p className="text-5xl font-black text-slate-950 tracking-tighter">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-10">
                <div className="col-span-2 bg-white p-12 rounded-[50px] border border-indigo-50 shadow-sm">
                   <h3 className="text-2xl font-black text-slate-950 mb-10 tracking-tight">Academic Compliance Timeline</h3>
                   <div className="h-[350px] bg-slate-50/50 rounded-[40px] flex items-center justify-center border-2 border-dashed border-indigo-100">
                      <div className="text-center">
                         <i className="fa-solid fa-chart-line text-4xl text-indigo-200 mb-4"></i>
                         <p className="text-indigo-300 font-black uppercase tracking-widest text-[10px]">Real-time Visualization Loading...</p>
                      </div>
                   </div>
                </div>
                <div className="bg-slate-950 p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-[60px] rounded-full"></div>
                   <h3 className="text-2xl font-black mb-10 tracking-tight">AI Health Score</h3>
                   <div className="space-y-10">
                      <div className="flex items-center justify-between">
                         <span className="text-indigo-200 font-bold tracking-wide uppercase text-xs">Model Fidelity</span>
                         <span className="text-indigo-400 font-black text-xl">99.94%</span>
                      </div>
                      <div className="w-full h-4 bg-white/5 rounded-full ring-1 ring-white/10">
                         <div className="w-[99.9%] h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                      </div>
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed">
                         Biometric comparison vectors are processed via Gemini 3 Pro for unmatched security and spoofing protection.
                      </p>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === AdminTab.EMPLOYEES && <EmployeeManagement onRefresh={() => {}} />}

          {activeTab === AdminTab.SHIFTS && (
            <div className="bg-white p-14 rounded-[50px] shadow-sm border border-indigo-50 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center mb-14">
                <div>
                   <h3 className="text-3xl font-black text-slate-950 tracking-tight">Campus Schedules</h3>
                   <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Manage session timing and faculty hours</p>
                </div>
                <button className="bg-indigo-600 text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/30">
                  Define New Session
                </button>
              </div>
              <div className="grid grid-cols-2 gap-10">
                {schedules.map(shift => (
                  <div key={shift.id} className="p-10 rounded-[40px] border-2 border-indigo-50 bg-indigo-50/20 hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="text-2xl font-black text-slate-950 group-hover:text-indigo-600 transition-colors">{shift.name}</h4>
                        <div className="flex items-center space-x-2 mt-2">
                           <i className="fa-solid fa-tag text-[9px] text-indigo-400"></i>
                           <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{shift.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-indigo-600 font-mono tracking-tighter">{shift.startTime} - {shift.endTime}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Core Hours</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                       <div className="bg-white p-5 rounded-[24px] border border-indigo-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Grace Period</p>
                          <p className="font-black text-slate-950">{shift.gracePeriod} min</p>
                       </div>
                       <div className="bg-white p-5 rounded-[24px] border border-indigo-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Interval</p>
                          <p className="font-black text-slate-950">{shift.breakDuration} min</p>
                       </div>
                       <div className="bg-white p-5 rounded-[24px] border border-indigo-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Late Threshold</p>
                          <p className="font-black text-slate-950">1 hr</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AdminTab.PAYROLL && (
            <div className="bg-white rounded-[50px] shadow-sm border border-indigo-50 overflow-hidden animate-in fade-in duration-500">
              <div className="p-14 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/30">
                 <div>
                    <h3 className="text-3xl font-black text-slate-950 tracking-tight">Financial Disbursements</h3>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Active Cycle: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                 </div>
                 <div className="flex space-x-5">
                    <button className="bg-white text-slate-700 px-8 py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] border border-indigo-100 shadow-sm">Export Registry</button>
                    <button className="bg-indigo-600 text-white px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20">Authorize Payments</button>
                 </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-indigo-50">
                  <tr>
                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Member</th>
                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Agreement Type</th>
                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Index</th>
                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/50">
                  {members.map(emp => (
                    <tr key={emp.id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="px-12 py-10">
                        <div className="flex items-center space-x-6">
                          <img src={emp.thumbnail} className="w-16 h-16 rounded-[24px] object-cover border-4 border-white shadow-lg" />
                          <div>
                            <p className="font-black text-slate-950 text-lg leading-none mb-2">{emp.name}</p>
                            <p className="text-xs text-indigo-600 font-black uppercase tracking-widest">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <span className="bg-indigo-100 text-indigo-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{emp.salaryConfig.type}</span>
                        <p className="mt-3 text-sm font-black text-slate-700">₹{emp.salaryConfig.baseAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-12 py-10 font-mono font-black text-slate-500 text-lg">
                        {attendance.filter(r => r.employeeId === emp.id).length} <span className="text-slate-300 text-xs">/ 22 sessions</span>
                      </td>
                      <td className="px-12 py-10">
                        <p className="text-2xl font-black text-slate-950 tracking-tighter">₹{calculateFinancials(emp).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Status: Calculated</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === AdminTab.POLICY && (
            <div className="grid grid-cols-2 gap-14 animate-in fade-in duration-500">
               <div className="bg-white p-14 rounded-[50px] shadow-sm border border-indigo-50">
                  <h3 className="text-3xl font-black text-slate-950 mb-10 tracking-tight">Academic Calendar</h3>
                  <div className="space-y-6">
                     {calendar.length === 0 ? (
                        <div className="p-16 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-indigo-100">
                           <i className="fa-solid fa-calendar-plus text-5xl text-indigo-200 mb-6"></i>
                           <p className="text-indigo-400 font-black uppercase tracking-widest text-[10px]">No Special Events Scheduled</p>
                           <button onClick={() => StorageService.saveHoliday({ id: '1', date: '2024-05-01', name: 'Founder\'s Day', type: 'PUBLIC' })} className="mt-6 text-indigo-600 font-black text-xs uppercase tracking-widest border-b-2 border-indigo-600 pb-1">Quick Initialize</button>
                        </div>
                     ) : (
                        calendar.map(h => (
                          <div key={h.id} className="flex items-center justify-between p-8 bg-indigo-50/20 rounded-[32px] border border-indigo-100/50 hover:bg-indigo-50 transition-colors">
                             <div className="flex items-center space-x-6">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                                   <i className="fa-solid fa-star"></i>
                                </div>
                                <div>
                                   <p className="font-black text-slate-950 text-lg tracking-tight">{h.name}</p>
                                   <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1">{h.date}</p>
                                </div>
                             </div>
                             <span className="bg-amber-100 text-amber-700 px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{h.type}</span>
                          </div>
                        ))
                     )}
                  </div>
               </div>
               <div className="bg-white p-14 rounded-[50px] shadow-sm border border-indigo-50">
                  <h3 className="text-3xl font-black text-slate-950 mb-10 tracking-tight">Absence Policy</h3>
                  <div className="space-y-8">
                     {[
                       { type: 'Medical Leave', quota: '15 Sessions', color: 'rose' },
                       { type: 'Personal Leave', quota: '10 Sessions', color: 'indigo' },
                       { type: 'Research Leave', quota: '20 Sessions', color: 'emerald' }
                     ].map((l, i) => (
                       <div key={i} className="flex items-center justify-between p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-indigo-200 transition-all">
                          <div className="flex items-center space-x-6">
                             <div className={`w-4 h-4 rounded-full bg-${l.color}-500 shadow-[0_0_15px_rgba(0,0,0,0.1)] ring-4 ring-${l.color}-500/10`}></div>
                             <p className="font-black text-slate-950 text-xl tracking-tight leading-none">{l.type}</p>
                          </div>
                          <p className="font-black text-slate-700 bg-white px-5 py-2 rounded-full border border-slate-200 text-sm">{l.quota}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
