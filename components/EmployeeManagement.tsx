
import React, { useState, useRef, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Employee, Shift, SalaryType } from '../types';

interface EmployeeManagementProps {
  onRefresh: () => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onRefresh }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollStep, setEnrollStep] = useState<1 | 2>(1); 
  const [activeTab, setActiveTab] = useState<'PROFESSIONAL' | 'PERSONAL' | 'BANK'>('PROFESSIONAL');
  
  const [formData, setFormData] = useState({
    name: '', department: '', role: '', 
    shiftId: '', joiningDate: new Date().toISOString().split('T')[0],
    salaryType: 'MONTHLY' as SalaryType, baseAmount: 0, overtimeRate: 1.5,
    email: '', phone: '', dob: '', address: '',
    bankAccount: '', ifsc: '', bankName: ''
  });

  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setEmployees(StorageService.getEmployees());
    const loadedShifts = StorageService.getShifts();
    setShifts(loadedShifts);
    if (loadedShifts.length > 0) setFormData(prev => ({ ...prev, shiftId: loadedShifts[0].id }));
  }, []);

  const startEnrollmentCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { console.error(err); }
  };

  const captureEnrollmentImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setCapturedImages(prev => [...prev, canvas.toDataURL('image/jpeg', 0.8)]);
  };

  const handleFinishEnrollment = async () => {
    setIsProcessingEnrollment(true);
    try {
      const signature = await GeminiService.generateVisualSignature(capturedImages);
      const newEmployee: Employee = {
        id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        name: formData.name,
        department: formData.department,
        role: formData.role,
        status: 'active',
        visualSignature: signature,
        thumbnail: capturedImages[0],
        joiningDate: formData.joiningDate,
        shiftId: formData.shiftId,
        salaryConfig: {
          type: formData.salaryType,
          baseAmount: formData.baseAmount,
          currency: 'INR',
          overtimeRate: formData.overtimeRate
        },
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        address: formData.address,
        bankDetails: {
          accountNumber: formData.bankAccount,
          ifsc: formData.ifsc,
          bankName: formData.bankName
        }
      };
      StorageService.saveEmployee(newEmployee);
      setEmployees(prev => [...prev, newEmployee]);
      setIsEnrollModalOpen(false);
      onRefresh();
    } catch (err) { alert("AI enrollment failed."); }
    finally { setIsProcessingEnrollment(false); }
  };

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Personnel Directory</h3>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Found {employees.length} matched records</p>
        </div>
        <button 
          onClick={() => setIsEnrollModalOpen(true)}
          className="bg-blue-600 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <i className="fa-solid fa-user-plus mr-3"></i> Add Corporate User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-200 group hover:shadow-2xl hover:border-blue-200 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                 <img src={emp.thumbnail} className="w-32 h-32 rounded-[40px] object-cover border-8 border-slate-50 shadow-inner group-hover:scale-110 transition-transform duration-500" />
                 <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 text-white rounded-2xl flex items-center justify-center border-4 border-white">
                    <i className="fa-solid fa-check text-xs"></i>
                 </div>
              </div>
              <h4 className="font-black text-slate-900 text-xl mb-1">{emp.name}</h4>
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6">{emp.role}</p>
              
              <div className="w-full grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Department</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{emp.department}</p>
                 </div>
                 <div className="bg-slate-50 p-4 rounded-2xl text-left border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Employee ID</p>
                    <p className="text-sm font-bold text-slate-700 font-mono">{emp.id}</p>
                 </div>
              </div>

              <div className="flex w-full space-x-3">
                 <button className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-all">
                    Profile Details
                 </button>
                 <button className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                    <i className="fa-solid fa-trash-can"></i>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
            <div className="bg-slate-50 px-12 py-10 border-b border-slate-200 flex justify-between items-center shrink-0">
               <div>
                 <h3 className="font-black text-slate-900 text-3xl tracking-tight">Enrollment Protocol</h3>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Complete all identity vectors</p>
               </div>
               <button onClick={() => setIsEnrollModalOpen(false)} className="w-14 h-14 bg-white border border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                  <i className="fa-solid fa-xmark text-2xl"></i>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
              {enrollStep === 1 ? (
                <div className="space-y-12">
                  <div className="flex space-x-6 border-b border-slate-100 pb-4">
                     {['PROFESSIONAL', 'PERSONAL', 'BANK'].map(t => (
                       <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`text-xs font-black uppercase tracking-widest pb-2 px-2 transition-all ${activeTab === t ? 'text-blue-600 border-b-4 border-blue-600' : 'text-slate-400'}`}
                       >
                        {t} Details
                       </button>
                     ))}
                  </div>

                  {activeTab === 'PROFESSIONAL' && (
                    <div className="grid grid-cols-2 gap-8 animate-[fadeIn_0.3s_ease-out]">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Full Legal Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none focus:border-blue-500 font-bold transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Department</label>
                        <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none focus:border-blue-500 font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Official Role</label>
                        <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none focus:border-blue-500 font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Assigned Shift</label>
                        <select value={formData.shiftId} onChange={e => setFormData({...formData, shiftId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold">
                           {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Pay Type</label>
                        <select value={formData.salaryType} onChange={e => setFormData({...formData, salaryType: e.target.value as SalaryType})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold">
                           <option value="MONTHLY">Monthly Fixed</option>
                           <option value="DAILY">Daily Wage</option>
                           <option value="HOURLY">Hourly Rate</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Base Compensation (INR)</label>
                        <input type="number" value={formData.baseAmount} onChange={e => setFormData({...formData, baseAmount: Number(e.target.value)})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'PERSONAL' && (
                    <div className="grid grid-cols-2 gap-8 animate-[fadeIn_0.3s_ease-out]">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Primary Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Contact Number</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'BANK' && (
                    <div className="grid grid-cols-2 gap-8 animate-[fadeIn_0.3s_ease-out]">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Bank Name</label>
                        <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Account Number</label>
                        <input type="text" value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">IFSC Code</label>
                        <input type="text" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 outline-none font-bold" />
                      </div>
                    </div>
                  )}

                  <div className="pt-10 flex justify-end shrink-0">
                    <button 
                      onClick={() => { setEnrollStep(2); startEnrollmentCamera(); }}
                      className="bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center space-x-4"
                    >
                      <span>Phase II: Face Capture</span>
                      <i className="fa-solid fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="relative rounded-[40px] overflow-hidden bg-black aspect-video flex items-center justify-center shadow-2xl border-[12px] border-slate-100">
                     <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                     <canvas ref={canvasRef} className="hidden" />
                     <div className="absolute inset-0 border-4 border-dashed border-white/20 pointer-events-none m-8 rounded-[32px]"></div>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-8 rounded-[32px] border border-slate-200">
                    <div>
                       <h4 className="font-black text-slate-900 text-xl leading-none mb-1">Neural Capture</h4>
                       <p className="text-slate-500 font-bold text-sm tracking-tight">Need {Math.max(0, 5 - capturedImages.length)} more valid frames</p>
                    </div>
                    <button onClick={captureEnrollmentImage} disabled={capturedImages.length >= 8} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-30">
                      <i className="fa-solid fa-aperture mr-3 text-lg animate-spin-slow"></i> Snapshot
                    </button>
                  </div>

                  <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide">
                     {capturedImages.map((img, i) => (
                       <img key={i} src={img} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md shrink-0" />
                     ))}
                  </div>

                  <div className="flex space-x-4 shrink-0">
                    <button onClick={() => setEnrollStep(1)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-200">
                      Back to Specs
                    </button>
                    <button 
                      onClick={handleFinishEnrollment} 
                      disabled={capturedImages.length < 5 || isProcessingEnrollment}
                      className="flex-[2] bg-green-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-green-500/30 hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-4"
                    >
                      {isProcessingEnrollment ? (
                        <>
                          <i className="fa-solid fa-brain-circuit animate-pulse text-lg"></i>
                          <span>Neural Syncing...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-shield-check text-lg"></i>
                          <span>Finalize Activation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
