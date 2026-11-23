import type { Timestamp } from 'firebase/firestore';

export type CareTab = 'home' | 'medications' | 'tasks' | 'family';

export interface CareProfile {
  id: string;
  ownerId: string;
  recipientName: string;
  age: number;
  dateOfBirth: string;
  bloodType: string;
  primaryDoctor: string;
  address: string;
  allergies: string;
  careNotes: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Medication {
  id: string;
  ownerId: string;
  name: string;
  dosage: string;
  instructions: string;
  timeHour: number;
  timeMinute: number;
  reminderEnabled: boolean;
  lastTakenDay: string;
  lastTakenTimeLabel: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CareTask {
  id: string;
  ownerId: string;
  title: string;
  details: string;
  dueHour: number;
  dueMinute: number;
  lastCompletedDay: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Appointment {
  id: string;
  ownerId: string;
  doctorName: string;
  specialty: string;
  location: string;
  dateISO: string;
  timeHour: number;
  timeMinute: number;
  notes: string;
  isCompleted: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EmergencyContact {
  id: string;
  ownerId: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  isPrimary: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface FamilyMember {
  id: string;
  ownerId: string;
  name: string;
  relationship: string;
  role: string;
  phoneNumber: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CareUpdate {
  id: string;
  ownerId: string;
  authorName: string;
  message: string;
  createdAt?: Timestamp;
}

export interface AdherenceLog {
  id: string;
  ownerId: string;
  dayKey: string;
  medicationId: string;
  medicationName: string;
  takenAtLabel: string;
  createdAt?: Timestamp;
}
