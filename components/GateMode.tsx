
import React, { useRef, useEffect, useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { Employee, RecognitionResult, AttendanceRecord } from '../types';

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
};

interface GateModeProps {
  onAdminAccess: () => void;
  onRecognitionSuccess: (employee: Employee) => void;
}

const GateMode: React.FC<GateModeProps> = ({ onAdminAccess, onRecognitionSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVerifyingLiveness, setIsVerifyingLiveness] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [systemMessage, setSystemMessage] = useState<string>("Initializing Camera...");

  useEffect(() => {
    const loadedEmployees = StorageService.getEmployees();
    setEmployees(loadedEmployees);
    if (loadedEmployees.length === 0) {
      setSystemMessage("No employees registered. Access Admin to enroll.");
    } else {
      setSystemMessage("Position face within the frame to verify identity");
    }
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    // If there are no employees, we don't start the scanning interval
    if (employees.length === 0) return;

    const interval = setInterval(() => {
      // Only process if we aren't already doing something and it's been long enough since the last success
      if (!isProcessing && !isVerifyingLiveness && !feedback) {
        processFrame();
      }
    }, 2500); // More frequent polling for better UX
    return () => clearInterval(interval);
  }, [isProcessing, isVerifyingLiveness, feedback, employees.length]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setSystemMessage(employees.length > 0 ? "System Ready - Scanning..." : "No employees registered.");
      }
    } catch (err) {
      console.error("Camera fail", err);
      setSystemMessage("Camera Access Denied. Check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) return null;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const processFrame = async () => {
    // 8 second cool-down after a SUCCESSFUL attendance mark
    if (Date.now() - lastCheckTime < 8000) return;
    
    const img = captureFrame();
    if (!img) return;

    setIsProcessing(true);
    try {
      const result = await GeminiService.identifyFace(img, employees);
      if (result.matched && result.employeeId) {
        await runLivenessVerification(result.employeeId);
      } else if (result.confidence > 0.6) {
        // High confidence mismatch
        console.log("Partial match detected but below threshold", result);
      }
    } catch (err) {
      console.error("Recognition Loop Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const runLivenessVerification = async (employeeId: string) => {
    setIsVerifyingLiveness(true);
    setLivenessProgress(0);
    const frames: string[] = [];
    
    speak("Please look at the camera for verification.");

    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 400));
      const f = captureFrame();
      if (f) frames.push(f);
      setLivenessProgress((i + 1) * 20);
    }

    try {
      const liveness = await GeminiService.verifyLiveness(frames);
      if (liveness.isLive && liveness.confidence > 0.7) {
        handleAttendance(employeeId);
        setLastCheckTime(Date.now());
      } else {
        speak("Verification failed. Please try again.");
        setFeedback({ 
          type: 'error', 
          title: 'Liveness Failed', 
          message: 'Please ensure you are a live person and not showing a photo/video.' 
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      setFeedback({ type: 'error', title: 'AI Error', message: 'Could not process biometric data.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsVerifyingLiveness(false);
    }
  };

  const handleAttendance = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const today = new Date().toISOString().split('T')[0];
    const records = StorageService.getAttendance();
    const existingRecord = records.find(r => r.employeeId === employeeId && r.date === today);

    const now = new Date();
    const isLate = now.getHours() >= 9 && now.getMinutes() > 0;

    let title = "";
    let message = "";

    if (!existingRecord) {
      // Fix: Added missing properties to satisfy the AttendanceRecord interface
      StorageService.recordAttendance({
        id: crypto.randomUUID(),
        employeeId: employee.id,
        employeeName: employee.name,
        date: today,
        checkIn: now.toISOString(),
        checkOut: null,
        status: isLate ? 'late' : 'on-time',
        deviceId: 'GATE_01',
        isSynced: false,
        breaks: [],
        overtimeMinutes: 0,
        isEarlyExit: false
      });
      title = `Welcome, ${employee.name.split(' ')[0]}`;
      message = isLate ? "Late arrival recorded." : "Check-in successful!";
      speak(title);
    } else if (!existingRecord.checkOut) {
      StorageService.recordAttendance({ ...existingRecord, checkOut: now.toISOString() });
      title = `Goodbye, ${employee.name.split(' ')[0]}`;
      message = "Check-out successful!";
      speak(title);
    } else {
      title = "Punched Out";
      message = "You have already completed your shift.";
    }

    setFeedback({ type: 'success', title, message });
    setTimeout(() => {
      setFeedback(null);
      onRecognitionSuccess(employee);
    }, 3000);
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden font-sans">
      <button onClick={onAdminAccess} className="absolute top-4 right-4 z-50 text-white/40 hover:text-white p-3 bg-white/5 rounded-full backdrop-blur-md transition-all">
        <i className="fa-solid fa-gear"></i>
      </button>

      <div className="absolute inset-0 bg-slate-950">
        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-all duration-1000 ${isVerifyingLiveness ? 'scale-105 saturate-150 blur-[2px]' : isProcessing ? 'saturate-100' : 'grayscale-[40%] opacity-80'}`} />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Empty State Warning */}
      {employees.length === 0 && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-sm w-full text-center shadow-2xl border-4 border-blue-500">
            <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mb-6 mx-auto">
              <i className="fa-solid fa-user-plus text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No Employees Enrolled</h2>
            <p className="text-slate-500 mb-8">Please log in as Admin to register your staff and begin using the gate.</p>
            <button onClick={onAdminAccess} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/30">
              Admin Login
            </button>
          </div>
        </div>
      )}

      {/* Futuristic HUD */}
      <div className="absolute inset-0 pointer-events-none border-[20px] border-black">
        {/* Viewfinder */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-96 border-2 transition-all duration-500 rounded-[60px] ${isVerifyingLiveness ? 'border-yellow-400 scale-110 shadow-[0_0_50px_rgba(250,204,21,0.5)]' : isProcessing ? 'border-blue-400 scale-105' : 'border-white/20'}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 text-white/40 uppercase tracking-[0.3em] text-[10px] font-black">
            {isProcessing ? 'Analyzing...' : 'Biometric Frame'}
          </div>
        </div>

        {/* Scan Line */}
        {(isProcessing || isVerifyingLiveness) && (
          <div className={`absolute top-0 left-0 w-full h-1 animate-[scan_3s_infinite] ${isVerifyingLiveness ? 'bg-yellow-400 shadow-[0_0_20px_yellow]' : 'bg-blue-500 shadow-[0_0_20px_cyan]'}`}></div>
        )}
      </div>

      {/* Top Banner */}
      <div className="absolute top-10 left-10 right-10 flex justify-between items-start pointer-events-none">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
          <h2 className="text-white font-black text-xs tracking-widest uppercase mb-1">Gate Terminal 01</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${employees.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white/60 text-xs font-bold uppercase">{employees.length > 0 ? 'Online' : 'Pending Enrollment'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-4xl font-black font-mono tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{new Date().toLocaleDateString([], { weekday: 'long' })}</p>
        </div>
      </div>

      {/* Bottom Interface */}
      <div className="absolute bottom-12 left-0 right-0 px-10 flex flex-col items-center">
        {isVerifyingLiveness ? (
          <div className="bg-yellow-400 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-pulse">
            <h3 className="text-black font-black uppercase text-center text-sm mb-3 tracking-widest">Verifying Liveness</h3>
            <div className="h-2 bg-black/10 rounded-full overflow-hidden">
               <div className="h-full bg-black transition-all" style={{ width: `${livenessProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className={`bg-black/60 backdrop-blur-md px-10 py-5 rounded-full border border-white/10 flex items-center space-x-4 ${isProcessing ? 'border-blue-500/50' : ''}`}>
             {isProcessing ? (
               <>
                 <i className="fa-solid fa-dna text-blue-500 animate-spin"></i>
                 <span className="text-white font-black uppercase tracking-widest text-xs">Matching Neural Signature...</span>
               </>
             ) : (
               <span className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] text-center">
                 {systemMessage}
               </span>
             )}
          </div>
        )}
      </div>

      {/* Success/Error Dialog */}
      {feedback && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center z-[100] animate-in fade-in duration-300">
           <div className={`p-1 w-full max-w-sm rounded-[40px] shadow-2xl ${feedback.type === 'success' ? 'bg-gradient-to-br from-green-400 to-emerald-600' : 'bg-gradient-to-br from-red-400 to-rose-600'}`}>
              <div className="bg-white rounded-[38px] p-10 flex flex-col items-center text-center">
                 <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 text-3xl ${feedback.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <i className={`fa-solid ${feedback.type === 'success' ? 'fa-check' : 'fa-xmark'}`}></i>
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 mb-2">{feedback.title}</h2>
                 <p className="text-slate-500 font-medium leading-relaxed mb-8">{feedback.message}</p>
                 <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-300 animate-[timer_3s_linear_forwards]"></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes timer { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default GateMode;
