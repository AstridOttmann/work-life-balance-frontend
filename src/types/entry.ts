export interface TimeBlock {
  id: number;
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime: string | null;   // null while tracker is running or paused
  paused: boolean;
  elapsedMs: number;
  segmentStartTime: string | null;
}

export interface TimeBlockInput {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime?: string;          // omitted when starting a tracker
  paused?: boolean;
  elapsedMs?: number;
  segmentStartTime?: string;
}

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
  health: number | null;
  notes: string | null;
  timeBlocks: TimeBlock[];
  appointments: Appointment[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyEntryInput {
  date: string;
  sleepingHours: number | null;
  mood: number;
  health: number | null;
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
  avgHealth: number;
  entries: DailyEntry[];
}
