export interface Appointment {
  id: number;
  dailyEntryId: number;
  title: string;
  time: string | null;       // "HH:mm:ss"
  durationHours: number | null;
}

export interface AppointmentInput {
  dailyEntryId: number;
  title: string;
  time: string | null;
  durationHours: number | null;
}

export interface DailyEntry {
  id: number;
  date: string;              // "YYYY-MM-DD"
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  notes: string | null;
  appointments: Appointment[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyEntryInput {
  date: string;
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  notes: string | null;
}

export interface Summary {
  period: string;
  startDate: string;
  endDate: string;
  totalWorkHours: number;
  totalFreeTimeHours: number;
  totalSleepingHours: number;
  totalAppointmentHours: number;
  appointmentCount: number;
  avgMood: number;
  entries: DailyEntry[];
}
