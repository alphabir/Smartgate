
import { Employee, AttendanceRecord, Shift, Holiday, LeaveRequest } from '../types';

const KEYS = {
  EMPLOYEES: 'smartgate_employees',
  ATTENDANCE: 'smartgate_attendance',
  SHIFTS: 'smartgate_shifts',
  HOLIDAYS: 'smartgate_holidays',
  LEAVES: 'smartgate_leaves'
};

export const StorageService = {
  // Initialization defaults
  initDefaults: () => {
    if (!localStorage.getItem(KEYS.SHIFTS)) {
      const defaultShift: Shift = {
        id: 'SHIFT-DEFAULT',
        name: 'Standard Morning',
        type: 'FIXED',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriod: 15,
        breakDuration: 60,
        minOvertimeHours: 1
      };
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify([defaultShift]));
    }
  },

  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  },

  saveEmployee: (employee: Employee) => {
    const employees = StorageService.getEmployees();
    const existing = employees.findIndex(e => e.id === employee.id);
    if (existing > -1) employees[existing] = employee;
    else employees.push(employee);
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  deleteEmployee: (id: string) => {
    const employees = StorageService.getEmployees();
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees.filter(e => e.id !== id)));
  },

  getShifts: (): Shift[] => {
    const data = localStorage.getItem(KEYS.SHIFTS);
    return data ? JSON.parse(data) : [];
  },

  saveShift: (shift: Shift) => {
    const shifts = StorageService.getShifts();
    shifts.push(shift);
    localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
  },

  getAttendance: (): AttendanceRecord[] => {
    const data = localStorage.getItem(KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },

  recordAttendance: (record: AttendanceRecord) => {
    const all = StorageService.getAttendance();
    const index = all.findIndex(r => r.employeeId === record.employeeId && r.date === record.date);
    if (index > -1) all[index] = record;
    else all.push(record);
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(all));
  },

  getHolidays: (): Holiday[] => {
    const data = localStorage.getItem(KEYS.HOLIDAYS);
    return data ? JSON.parse(data) : [];
  },

  saveHoliday: (h: Holiday) => {
    const hs = StorageService.getHolidays();
    hs.push(h);
    localStorage.setItem(KEYS.HOLIDAYS, JSON.stringify(hs));
  }
};

StorageService.initDefaults();
