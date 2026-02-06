
export type ShiftType = 'FIXED' | 'OPEN' | 'ROTATIONAL' | 'NIGHT';
export type SalaryType = 'DAILY' | 'HOURLY' | 'WEEKLY' | 'MONTHLY' | 'WORK_BASIS';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Define the interface for biometric recognition results from Gemini
export interface RecognitionResult {
  matched: boolean;
  employeeId?: string | null;
  confidence: number;
  message?: string;
}

export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  gracePeriod: number; // minutes
  breakDuration: number; // minutes
  minOvertimeHours: number;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  type: 'PUBLIC' | 'OPTIONAL';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'SICK' | 'CASUAL' | 'PAID';
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason: string;
}

export interface SalaryConfig {
  type: SalaryType;
  baseAmount: number;
  currency: string;
  overtimeRate: number; // multiplier e.g. 1.5
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  visualSignature: string;
  thumbnail: string;
  // Professional Details
  joiningDate: string;
  shiftId: string;
  salaryConfig: SalaryConfig;
  // Personal Details
  dob: string;
  phone: string;
  email: string;
  address: string;
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
}

export interface BreakSession {
  start: string;
  end: string | null;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'on-time' | 'late' | 'absent' | 'leave';
  deviceId: string;
  isSynced: boolean;
  breaks: BreakSession[];
  overtimeMinutes: number;
  isEarlyExit: boolean;
}

export enum AppMode {
  GATE = 'GATE',
  ADMIN = 'ADMIN',
  EMPLOYEE_DASHBOARD = 'EMPLOYEE_DASHBOARD'
}

export enum AdminTab {
  DASHBOARD = 'DASHBOARD',
  EMPLOYEES = 'EMPLOYEES',
  SHIFTS = 'SHIFTS',
  PAYROLL = 'PAYROLL',
  POLICY = 'POLICY',
  REPORTS = 'REPORTS'
}
