export type Role = 'administrador' | 'docente';
export type AttendanceStatus = 'A' | 'I' | 'IJ';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  contraseña?: string;
  rol: Role;
  grado?: string;
  seccion?: string;
  activo: boolean;
}

export interface Student {
  id: string;
  nombre_completo: string;
  cedula_escolar: string;
  cedula_identidad?: string;
  sexo: 'M' | 'F';
  grado: string;
  seccion: string;
  turno: 'M' | 'T';
  nombre_representante?: string;
  telefono_contacto?: string;
  direccion?: string;
}

export interface AttendanceRecord {
  id: string;
  estudiante_id: string;
  fecha: string;
  estado: AttendanceStatus;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}