import { User, Student, AttendanceRecord } from '../types';

const KEYS = {
  USERS: 'asistencia_escolar_users',
  STUDENTS: 'asistencia_escolar_students',
  ATTENDANCE: 'asistencia_escolar_attendance'
};

const INITIAL_ADMIN: User = {
  id: 'admin-1',
  nombre: 'Admin',
  apellido: 'Principal',
  usuario: 'admin',
  contraseña: 'admin123',
  rol: 'administrador',
  activo: true
};

export class StorageService {
  static init() {
    if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify([INITIAL_ADMIN]));
    if (!localStorage.getItem(KEYS.STUDENTS)) localStorage.setItem(KEYS.STUDENTS, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.ATTENDANCE)) localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify([]));
  }

  static getUsers(): User[] { return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); }
  static saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) users[index] = { ...users[index], ...user };
    else users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    return users[index] || user;
  }
  static deleteUser(id: string) {
    const users = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
  static getStudents(): Student[] { return JSON.parse(localStorage.getItem(KEYS.STUDENTS) || '[]'); }
  static saveStudent(student: Student) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === student.id);
    if (index >= 0) students[index] = student;
    else students.push(student);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  }
  static deleteStudent(id: string) {
    const students = this.getStudents().filter(s => s.id !== id);
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  }
  static getAttendance(): AttendanceRecord[] { return JSON.parse(localStorage.getItem(KEYS.ATTENDANCE) || '[]'); }
  static markAttendance(record: Omit<AttendanceRecord, 'id'>) {
    const records = this.getAttendance();
    const recordId = `${record.estudiante_id}_${record.fecha}`;
    const index = records.findIndex(r => r.estudiante_id === record.estudiante_id && r.fecha === record.fecha);
    if (index >= 0) records[index] = { ...record, id: recordId };
    else records.push({ ...record, id: recordId });
    localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(records));
  }
  static importStudents(newStudents: Student[]) {
    const current = this.getStudents();
    const merged = [...current];
    newStudents.forEach(ns => {
      const idx = merged.findIndex(s => s.cedula_escolar === ns.cedula_escolar);
      if (idx >= 0) merged[idx] = ns;
      else merged.push(ns);
    });
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(merged));
  }
}