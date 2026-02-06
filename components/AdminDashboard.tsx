
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Employee, AttendanceRecord, AdminTab, Shift, Holiday, SalaryType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import EmployeeManagement from './EmployeeManagement';

interface AdminDashboardProps {
  onExit: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(AdminTab.DASHBOARD);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    setEmployees(StorageService.getEmployees());
    setAttendance(StorageService.getAttendance());
    setShifts(StorageService.getShifts());
    setHolidays(StorageService.getHolidays());
  }, [activeTab]);

  const calculatePayroll = (emp: Employee) => {
    const records = attendance.filter(r => r.employeeId === emp.id);
    const presentDays = records.filter(r => r.checkIn).length;
    let totalPay = 0;

    if (emp.salaryConfig.type === 'MONTHLY') {
      totalPay = emp.salaryConfig.baseAmount;
    } else if (emp.salaryConfig.type === 'DAILY') {
      totalPay = emp.salaryConfig.baseAmount * presentDays;
    }

    return totalPay;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-building-shield text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">SmartGate</h1>
              <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase">Enterprise Suite</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto">
          {[
            { id: AdminTab.DASHBOARD, icon: 'fa-gauge-high', label: 'Command Center' },
            { id: AdminTab.EMPLOYEES, icon: 'fa-users-gear', label: 'Staff Management' },
            { id: AdminTab.SHIFTS, icon: 'fa-calendar-day', label: 'Shift Scheduler' },
            { id: AdminTab.PAYROLL, icon: 'fa-file-invoice-dollar', label: 'Financial Hub' },
            { id: AdminTab.POLICY, icon: 'fa-scale-balanced', label: 'Company Policy' },
            { id: AdminTab.REPORTS, icon: 'fa-chart-line', label: 'Advanced Analytics' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <i className={`fa-solid ${tab.icon} w-6 text-lg`}></i>
              <span className="font-bold text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-800">
          <button onClick={onExit} className="w-full flex items-center justify-center space-x-3 py-4 bg-red-500/10 text-red-400 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-red-500 hover:text-white transition-all">
            <i className="fa-solid fa-power-off"></i>
            <span>Deactivate Terminal</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 relative">
        <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-12 py-8 flex justify-between items-center border-b border-slate-200">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{activeTab}</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Portal Version 3.1.0-EA</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right mr-4">
              <p className="text-slate-900 font-black leading-none">System Administrator</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase">Root Access Granted</p>
            </div>
            <div className="w-14 h-14 bg-white border-2 border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 shadow-sm">
              <i className="fa-solid fa-user-shield text-xl"></i>
            </div>
          </div>
        </div>

        <div className="p-12">
          {activeTab === AdminTab.DASHBOARD && (
            <div className="space-y-12 animate-[fadeIn_0.5s_ease-out]">
              <div className="grid grid-cols-4 gap-8">
                {[
                  { label: 'Active Roster', val: employees.length, icon: 'fa-id-badge', color: 'blue' },
                  { label: 'Today Present', val: attendance.filter(r => r.date === new Date().toISOString().split('T')[0]).length, icon: 'fa-user-check', color: 'green' },
                  { label: 'Pending Leaves', val: 2, icon: 'fa-calendar-minus', color: 'amber' },
                  { label: 'OT Accumulated', val: '42h', icon: 'fa-stopwatch', color: 'indigo' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className={`w-12 h-12 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                      <i className={`fa-solid ${s.icon} text-xl`}></i>
                    </div>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{s.label}</p>
                    <p className="text-4xl font-black text-slate-900">{s.val}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                   <h3 className="text-xl font-black text-slate-900 mb-8">Shift Compliance Matrix</h3>
                   <div className="h-[300px] bg-slate-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold italic">Dynamic Attendance Heatmap Loading...</p>
                   </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                   <h3 className="text-xl font-black text-slate-900 mb-8">Resource Health</h3>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-slate-500 font-bold">Face Recognition Confidence</span>
                         <span className="text-green-600 font-black">99.8%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full">
                         <div className="w-[99%] h-full bg-green-500 rounded-full"></div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === AdminTab.EMPLOYEES && <EmployeeManagement onRefresh={() => {}} />}

          {activeTab === AdminTab.SHIFTS && (
            <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-200 animate-[fadeIn_0.5s_ease-out]">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900">Configured Shifts</h3>
                <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30">
                  Add New Shift
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {shifts.map(shift => (
                  <div key={shift.id} className="p-8 rounded-3xl border-2 border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-slate-900">{shift.name}</h4>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-black uppercase px-3 py-1 rounded-full">{shift.type}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-blue-600 font-mono">{shift.startTime} - {shift.endTime}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Shift Duration: 9 Hours</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Grace Period</p>
                          <p className="font-bold text-slate-800">{shift.gracePeriod}m</p>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Break Time</p>
                          <p className="font-bold text-slate-800">{shift.breakDuration}m</p>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-200">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Min. OT</p>
                          <p className="font-bold text-slate-800">{shift.minOvertimeHours}h</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === AdminTab.PAYROLL && (
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 overflow-hidden animate-[fadeIn_0.5s_ease-out]">
              <div className="p-12 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-900">Payroll Generation - {new Date().toLocaleString('default', { month: 'long' })}</h3>
                 <div className="flex space-x-4">
                    <button className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm">Download All PDF</button>
                    <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-600/20">Process Batch</button>
                 </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Details</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Pay Structure</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Days Present</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Gross Estimate</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-4">
                          <img src={emp.thumbnail} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-100" />
                          <div>
                            <p className="font-black text-slate-900 leading-none mb-1">{emp.name}</p>
                            <p className="text-xs text-slate-400 font-bold">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{emp.salaryConfig.type}</span>
                        <p className="mt-2 text-sm font-bold text-slate-700">₹{emp.salaryConfig.baseAmount.toLocaleString()}</p>
                      </td>
                      <td className="px-10 py-8 font-mono font-bold text-slate-600">
                        {attendance.filter(r => r.employeeId === emp.id).length} / 22
                      </td>
                      <td className="px-10 py-8">
                        <p className="text-lg font-black text-slate-900">₹{calculatePayroll(emp).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-green-600 uppercase">Net Payable</p>
                      </td>
                      <td className="px-10 py-8">
                        <button className="text-blue-600 font-bold text-sm hover:underline">View Ledger</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === AdminTab.POLICY && (
            <div className="grid grid-cols-2 gap-12 animate-[fadeIn_0.5s_ease-out]">
               <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-200">
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Holiday Calendar 2024</h3>
                  <div className="space-y-4">
                     {holidays.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                           <i className="fa-solid fa-calendar-day text-4xl text-slate-300 mb-4"></i>
                           <p className="text-slate-400 font-bold">No Holidays Defined</p>
                           <button onClick={() => StorageService.saveHoliday({ id: '1', date: '2024-01-01', name: 'New Year', type: 'PUBLIC' })} className="mt-4 text-blue-600 font-bold">Add Sample Holiday</button>
                        </div>
                     ) : (
                        holidays.map(h => (
                          <div key={h.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                             <div>
                                <p className="font-black text-slate-900">{h.name}</p>
                                <p className="text-xs text-slate-400">{h.date}</p>
                             </div>
                             <span className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{h.type}</span>
                          </div>
                        ))
                     )}
                  </div>
               </div>
               <div className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-200">
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Leave Entitlements</h3>
                  <div className="space-y-6">
                     {[
                       { type: 'Sick Leave', quota: '12 Days', color: 'red' },
                       { type: 'Casual Leave', quota: '12 Days', color: 'blue' },
                       { type: 'Privilege Leave', quota: '18 Days', color: 'green' }
                     ].map((l, i) => (
                       <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center space-x-4">
                             <div className={`w-3 h-3 rounded-full bg-${l.color}-500`}></div>
                             <p className="font-black text-slate-900 tracking-tight">{l.type}</p>
                          </div>
                          <p className="font-black text-slate-700">{l.quota} / Year</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
