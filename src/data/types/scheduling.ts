export interface AppointmentType {
  id: string;
  clinicId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  colorHex: string;
  isActive: boolean;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'cancelled'
  | 'no_show'
  | 'completed'
  | 'rescheduled';

export type ConfirmationMethod = 'phone' | 'email' | 'sms' | 'in_person';
export type ReminderType = 'sms' | 'email' | 'call';

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  providerId: string;
  appointmentTypeId: string;
  startTime: string; // ISO datetime
  endTime: string;
  status: AppointmentStatus;
  confirmedAt: string | null;
  confirmationMethod: ConfirmationMethod | null;
  notes: string | null;
  treatmentPlanned: boolean;
  reminderSentAt: string | null;
  reminderType: ReminderType | null;
  noShowReason: string | null;
  rescheduledToAppointmentId: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}
