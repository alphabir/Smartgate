
import React, { useRef, useEffect, useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { Employee, RecognitionResult, AttendanceRecord } from '../types';

const LOGO_URL = "https://lh3.googleusercontent.com/d/1lJPDezlGmSFBxZfO0agZtCAlsN-Zrnmk";

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
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
  const [members, setMembers] = useState<Employee[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [systemMessage, setSystemMessage] = useState<string>("Initializing Campus Scanner...");

  useEffect(() => {
    const loadedMembers = StorageService.getEmployees();
    setMembers(loadedMembers);
    if (loadedMembers.length === 0) {
      setSystemMessage("No members registered. Access Advisor Portal to enroll.");
    } else {
      setSystemMessage("Scan face to verify identity and record attendance");
    }
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (members.length === 0) return;
    const interval = setInterval(() => {
      if (!isProcessing && !isVerifyingLiveness && !feedback) {
        processFrame();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [isProcessing, isVerifyingLiveness, feedback, members.length]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setSystemMessage(members.length > 0 ? "Terminal Active - Scanning..." : "Advisor Registry Empty.");
      }
    } catch (err) {
      setSystemMessage("Visual Sensor Blocked. Check campus security permissions.");
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
    if (Date.now() - lastCheckTime < 8000) return;
    const img = captureFrame();
    if (!img) return;
    setIsProcessing(true);
    try {
      const result = await GeminiService.identifyFace(img, members);
      if (result.matched && result.employeeId) {
        await runLivenessVerification(result.employeeId);
      }
    } catch (err) {
      console.error("Biometric Registry Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const runLivenessVerification = async (memberId: string) => {
    setIsVerifyingLiveness(true);
    setLivenessProgress(0);
    const frames: string[] = [];
    speak("Verification in progress. Please remain still.");

    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 400));
      const f = captureFrame();
      if (f) frames.push(f);
      setLivenessProgress((i + 1) * 20);
    }

    try {
      const liveness = await GeminiService.verifyLiveness(frames);
      if (liveness.isLive && liveness.confidence > 0.7) {
        handleAttendance(memberId);
        setLastCheckTime(Date.now());
      } else {
        speak("Verification failed. Anti-spoofing alert.");
        setFeedback({ 
          type: 'error', 
          title: 'Identity Blocked', 
          message: 'Liveness check failed. Please ensure clear visibility.' 
        });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      setFeedback({ type: 'error', title: 'System Error', message: 'Biometric processor timeout.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsVerifyingLiveness(false);
    }
  };

  const handleAttendance = (memberId: string) => {
    const member = members.find(e => e.id === memberId);
    if (!member) return;

    const today = new Date().toISOString().split('T')[0];
    const records = StorageService.getAttendance();
    const existingRecord = records.find(r => r.employeeId === memberId && r.date === today);

    const now = new Date();
    const isLate = now.getHours() >= 9;

    let title = "";
    let message = "";

    if (!existingRecord) {
      StorageService.recordAttendance({
        id: crypto.randomUUID(),
        employeeId: member.id,
        employeeName: member.name,
        date: today,
        checkIn: now.toISOString(),
        checkOut: null,
        status: isLate ? 'late' : 'on-time',
        deviceId: 'CAMPUS_GATE_01',
        isSynced: false,
        breaks: [],
        overtimeMinutes: 0,
        isEarlyExit: false
      });
      title = `Welcome, ${member.name.split(' ')[0]}`;
      message = isLate ? "Late entry logged for session." : "Campus entry authorized.";
      speak(title);
    } else if (!existingRecord.checkOut) {
      StorageService.recordAttendance({ ...existingRecord, checkOut: now.toISOString() });
      title = `Safe Travels, ${member.name.split(' ')[0]}`;
      message = "Session concluded. Exit authorized.";
      speak(title);
    } else {
      title = "Registry Active";
      message = "You have already completed your daily attendance.";
    }

    setFeedback({ type: 'success', title, message });
    setTimeout(() => {
      setFeedback(null);
      onRecognitionSuccess(member);
    }, 3000);
  };

  return (
    <div className="relative h-screen w-screen bg-slate-950 overflow-hidden font-sans">
      <button onClick={onAdminAccess} className="absolute top-6 right-6 z-50 text-indigo-100/40 hover:text-white p-4 bg-indigo-500/10 rounded-3xl backdrop-blur-xl border border-indigo-500/20 transition-all hover:bg-indigo-600/20">
        <i className="fa-solid fa-graduation-cap text-xl"></i>
      </button>

      <div className="absolute inset-0">
        <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover transition-all duration-1000 ${isVerifyingLiveness ? 'scale-105 saturate-150 blur-[2px]' : isProcessing ? 'saturate-100' : 'grayscale-[40%] opacity-80'}`} />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {members.length === 0 && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-12 max-w-sm w-full text-center shadow-2xl border-4 border-indigo-600">
            <div className="w-24 h-24 bg-indigo-50 rounded-[35px] flex items-center justify-center mb-6 mx-auto overflow-hidden border-4 border-indigo-100 shadow-xl">
              <img src={LOGO_URL} alt="College Advisor Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">College Advisor Registry</h2>
            <p className="text-slate-500 mb-8 font-medium">Registry is currently empty. Please initialize member enrollment via the Advisor Portal.</p>
            <button onClick={onAdminAccess} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30">
              Enter Advisor Portal
            </button>
          </div>
        </div>
      )}

      {/* HUD Frame */}
      <div className="absolute inset-0 pointer-events-none border-[30px] border-slate-950/20">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-[450px] border-2 transition-all duration-500 rounded-[80px] ${isVerifyingLiveness ? 'border-amber-400 scale-110 shadow-[0_0_60px_rgba(251,191,36,0.3)]' : isProcessing ? 'border-indigo-400 scale-105' : 'border-white/20'}`}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-10 text-white/40 uppercase tracking-[0.4em] text-[9px] font-black">
            {isProcessing ? 'Analyzing Biometrics' : 'Advisor Sight System'}
          </div>
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 rounded-full"></div>
        </div>
        {(isProcessing || isVerifyingLiveness) && (
          <div className={`absolute left-0 w-full h-1 animate-[scan_3s_infinite] ${isVerifyingLiveness ? 'bg-amber-400 shadow-[0_0_20px_amber]' : 'bg-indigo-500 shadow-[0_0_20px_indigo]'}`}></div>
        )}
      </div>

      {/* Header Banner */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-start pointer-events-none">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl flex items-center space-x-4">
          <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-lg">
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-white font-black text-[10px] tracking-widest uppercase">The College Advisor | Campus Gate 01</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${members.length > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <span className="text-white/60 text-[9px] font-bold uppercase tracking-tighter">{members.length > 0 ? 'Neural Network Ready' : 'Registry Required'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-5xl font-black font-mono tracking-tighter leading-none mb-1">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-16 left-0 right-0 px-12 flex flex-col items-center">
        {isVerifyingLiveness ? (
          <div className="bg-amber-400 p-8 rounded-[40px] w-full max-w-md shadow-2xl">
            <h3 className="text-amber-950 font-black uppercase text-center text-xs mb-4 tracking-[0.3em]">Temporal Identity Validation</h3>
            <div className="h-3 bg-amber-900/10 rounded-full overflow-hidden">
               <div className="h-full bg-amber-950 transition-all duration-300" style={{ width: `${livenessProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className={`bg-slate-900/60 backdrop-blur-2xl px-12 py-6 rounded-full border border-white/10 flex items-center space-x-5 ${isProcessing ? 'border-indigo-500/50' : ''}`}>
             {isProcessing ? (
               <>
                 <i className="fa-solid fa-brain-circuit text-indigo-400 animate-pulse"></i>
                 <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Comparing Biometric Hashes...</span>
               </>
             ) : (
               <span className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] text-center">
                 {systemMessage}
               </span>
             )}
          </div>
        )}
      </div>

      {feedback && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-3xl flex items-center justify-center z-[100] animate-in fade-in duration-500">
           <div className={`p-1.5 w-full max-w-sm rounded-[50px] shadow-2xl ${feedback.type === 'success' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-rose-500 to-rose-700'}`}>
              <div className="bg-white rounded-[45px] p-12 flex flex-col items-center text-center">
                 <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 text-4xl ${feedback.type === 'success' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                    <i className={`fa-solid ${feedback.type === 'success' ? 'fa-user-check' : 'fa-user-lock'}`}></i>
                 </div>
                 <h2 className="text-3xl font-black text-slate-950 mb-3 tracking-tight">{feedback.title}</h2>
                 <p className="text-slate-500 font-bold leading-relaxed mb-10 text-sm px-4 uppercase tracking-wide">{feedback.message}</p>
                 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-200 animate-[timer_3s_linear_forwards]"></div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { top: 100%; opacity: 0; } }
        @keyframes timer { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default GateMode;
