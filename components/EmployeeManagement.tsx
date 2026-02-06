
import React, { useState, useRef, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { GeminiService } from '../services/geminiService';
import { Employee, Shift, SalaryType } from '../types';

interface EmployeeManagementProps {
  onRefresh: () => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onRefresh }) => {
  const [members, setMembers] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Shift[]>([]);
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
    setMembers(StorageService.getEmployees());
    const loadedSchedules = StorageService.getShifts();
    setSchedules(loadedSchedules);
    if (loadedSchedules.length > 0) setFormData(prev => ({ ...prev, shiftId: loadedSchedules[0].id }));
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
      const newMember: Employee = {
        id: `MEMBER-${Math.floor(10000 + Math.random() * 90000)}`,
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
      StorageService.saveEmployee(newMember);
      setMembers(prev => [...prev, newMember]);
      setIsEnrollModalOpen(false);
      onRefresh();
    } catch (err) { alert("Advisor AI biometric sync failed."); }
    finally { setIsProcessingEnrollment(false); }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex justify-between items-center bg-white p-10 rounded-[50px] shadow-sm border border-indigo-50">
        <div>
          <h3 className="text-3xl font-black text-slate-950 tracking-tight">Campus Registry</h3>
          <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">Active Database: {members.length} Identities Verified</p>
        </div>
        <button 
          onClick={() => setIsEnrollModalOpen(true)}
          className="bg-indigo-600 text-white px-12 py-6 rounded-[30px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-4"
        >
          <i className="fa-solid fa-user-graduate text-lg"></i> 
          <span>Enroll New Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {members.map((emp) => (
          <div key={emp.id} className="bg-white p-12 rounded-[55px] shadow-sm border border-indigo-50 group hover:shadow-2xl hover:border-indigo-400 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
               <i className="fa-solid fa-qrcode text-indigo-300"></i>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                 <img src={emp.thumbnail} className="w-40 h-40 rounded-[60px] object-cover border-[10px] border-slate-50 shadow-2xl group-hover:scale-105 transition-transform duration-700" />
                 <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 text-white rounded-3xl flex items-center justify-center border-4 border-white shadow-lg">
                    <i className="fa-solid fa-fingerprint text-sm"></i>
                 </div>
              </div>
              <h4 className="font-black text-slate-950 text-2xl mb-2 tracking-tight">{emp.name}</h4>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-8">{emp.role}</p>
              
              <div className="w-full grid grid-cols-2 gap-4 mb-10">
                 <div className="bg-indigo-50/50 p-5 rounded-[24px] text-left border border-indigo-100/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Faculty/Dept</p>
                    <p className="text-xs font-black text-slate-900 truncate">{emp.department}</p>
                 </div>
                 <div className="bg-indigo-50/50 p-5 rounded-[24px] text-left border border-indigo-100/30">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Registry ID</p>
                    <p className="text-xs font-black text-indigo-600 font-mono tracking-tighter">{emp.id.split('-')[1]}</p>
                 </div>
              </div>

              <div className="flex w-full space-x-4">
                 <button className="flex-1 bg-slate-950 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-[9px] shadow-xl hover:bg-indigo-600 transition-all">
                    Member Dossier
                 </button>
                 <button className="w-16 h-16 bg-rose-50 text-rose-500 rounded-[24px] hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-user-minus"></i>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-10 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[60px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
            <div className="bg-indigo-50/30 px-14 py-12 border-b border-indigo-100 flex justify-between items-center">
               <div>
                 <h3 className="font-black text-slate-950 text-4xl tracking-tight">Identity Enrollment</h3>
                 <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.4em] mt-3">Campus Protocol: Secure Biometric Registration</p>
               </div>
               <button onClick={() => setIsEnrollModalOpen(false)} className="w-16 h-16 bg-white border border-indigo-100 rounded-3xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all">
                  <i className="fa-solid fa-xmark text-3xl"></i>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-14 bg-white">
              {enrollStep === 1 ? (
                <div className="space-y-12">
                  <div className="flex space-x-10 border-b border-indigo-50 pb-6">
                     {['PROFESSIONAL', 'PERSONAL', 'BANK'].map(t => (
                       <button 
                        key={t}
                        onClick={() => setActiveTab(t as any)}
                        className={`text-[10px] font-black uppercase tracking-[0.3em] pb-3 px-2 transition-all relative ${activeTab === t ? 'text-indigo-600' : 'text-slate-400'}`}
                       >
                        {t} Profile
                        {activeTab === t && <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full"></span>}
                       </button>
                     ))}
                  </div>

                  {activeTab === 'PROFESSIONAL' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in slide-in-from-left-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Member Full Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none focus:border-indigo-500 font-black text-slate-950 transition-all" placeholder="Enter academic legal name..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Department / Faculty</label>
                        <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none focus:border-indigo-500 font-black" placeholder="e.g. Computer Science" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Registry Role</label>
                        <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none focus:border-indigo-500 font-black" placeholder="e.g. Senior Lecturer" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Assigned Schedule</label>
                        <select value={formData.shiftId} onChange={e => setFormData({...formData, shiftId: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black text-slate-900">
                           {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Remuneration Logic</label>
                        <select value={formData.salaryType} onChange={e => setFormData({...formData, salaryType: e.target.value as SalaryType})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black text-slate-900">
                           <option value="MONTHLY">Institutional Salary</option>
                           <option value="DAILY">Daily Stipend</option>
                           <option value="HOURLY">Session Rate</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'PERSONAL' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in slide-in-from-left-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Official Email (@college.edu)</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Secure Contact</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black" />
                      </div>
                      <div className="col-span-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Residential Registry Address</label>
                         <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black min-h-[120px]" />
                      </div>
                    </div>
                  )}

                  {activeTab === 'BANK' && (
                    <div className="grid grid-cols-2 gap-10 animate-in fade-in slide-in-from-left-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Institutional Bank</label>
                        <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Account Number</label>
                        <input type="text" value={formData.bankAccount} onChange={e => setFormData({...formData, bankAccount: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Branch Code / IFSC</label>
                        <input type="text" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} className="w-full bg-indigo-50/30 border-2 border-indigo-50 rounded-[28px] px-8 py-5 outline-none font-black" />
                      </div>
                    </div>
                  )}

                  <div className="pt-12 flex justify-end">
                    <button 
                      onClick={() => { setEnrollStep(2); startEnrollmentCamera(); }}
                      className="bg-indigo-600 text-white px-14 py-6 rounded-[32px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all flex items-center space-x-5"
                    >
                      <span>Phase II: Biometric Capture</span>
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                  <div className="relative rounded-[60px] overflow-hidden bg-slate-950 aspect-video flex items-center justify-center shadow-3xl border-[20px] border-slate-50">
                     <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-80" />
                     <canvas ref={canvasRef} className="hidden" />
                     <div className="absolute inset-0 border-2 border-dashed border-indigo-400/30 m-12 rounded-[50px]"></div>
                     <div className="absolute top-10 left-10 bg-indigo-600 px-6 py-2 rounded-full text-white font-black text-[9px] uppercase tracking-widest animate-pulse">Visual Stream Active</div>
                  </div>

                  <div className="flex justify-between items-center bg-indigo-50/30 p-10 rounded-[45px] border border-indigo-100/50">
                    <div>
                       <h4 className="font-black text-slate-950 text-2xl tracking-tight mb-2">Neural Identity Mapping</h4>
                       <p className="text-indigo-500 font-black text-[10px] uppercase tracking-widest">{capturedImages.length >= 5 ? 'Registry ready for synchronization' : `Awaiting ${5 - capturedImages.length} additional valid vectors`}</p>
                    </div>
                    <button onClick={captureEnrollmentImage} disabled={capturedImages.length >= 8} className="bg-slate-950 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all disabled:opacity-20 flex items-center space-x-4">
                      <i className="fa-solid fa-camera-retro text-xl"></i>
                      <span>Capture Vector</span>
                    </button>
                  </div>

                  <div className="flex space-x-6 overflow-x-auto pb-8 scrollbar-hide">
                     {capturedImages.map((img, i) => (
                       <div key={i} className="relative group shrink-0">
                          <img src={img} className="w-32 h-32 rounded-[35px] object-cover border-4 border-white shadow-xl grayscale hover:grayscale-0 transition-all" />
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-black">#{i+1}</div>
                       </div>
                     ))}
                  </div>

                  <div className="flex space-x-6">
                    <button onClick={() => setEnrollStep(1)} className="flex-1 bg-slate-100 text-slate-600 py-6 rounded-[30px] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 transition-all">
                      Review Registry Profile
                    </button>
                    <button 
                      onClick={handleFinishEnrollment} 
                      disabled={capturedImages.length < 5 || isProcessingEnrollment}
                      className="flex-[2] bg-indigo-600 text-white py-6 rounded-[30px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all disabled:opacity-30 flex items-center justify-center space-x-6"
                    >
                      {isProcessingEnrollment ? (
                        <>
                          <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                          <span>Advisor AI Synchronizing...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-user-check text-xl"></i>
                          <span>Activate Campus Identity</span>
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
