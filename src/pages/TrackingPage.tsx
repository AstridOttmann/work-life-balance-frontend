import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Paper, Stack, Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import WorkIcon from '@mui/icons-material/Work';
import SpaIcon from '@mui/icons-material/Spa';
import dayjs from 'dayjs';
import { entriesApi, timeBlocksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DailyEntry } from '../types/entry';

interface TrackerState {
  status: 'idle' | 'running' | 'paused';
  blockId: number | null;
  dailyEntryId: number | null;
  startTime: string | null;      // "HH:mm" — for PUT on Stop
  startTimestamp: number | null; // Date.now() when last started or resumed
  accumulatedMs: number;         // ms elapsed before last pause
}

const IDLE: TrackerState = {
  status: 'idle',
  blockId: null,
  dailyEntryId: null,
  startTime: null,
  startTimestamp: null,
  accumulatedMs: 0,
};

function elapsedMs(t: TrackerState): number {
  const running = t.status === 'running' && t.startTimestamp != null
    ? Date.now() - t.startTimestamp : 0;
  return t.accumulatedMs + running;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function parseTimeAsToday(hhmmss: string): number {
  const [h, m, s = 0] = hhmmss.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d.getTime();
}

function calcTodaySummary(entry: DailyEntry | null) {
  const blocks = entry?.timeBlocks.filter(b => b.endTime != null) ?? [];
  const sum = (type: 'WORK' | 'FREE') =>
    blocks.filter(b => b.type === type).reduce((acc, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime!.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 1440;
      return acc + mins / 60;
    }, 0);
  return { work: sum('WORK'), free: sum('FREE') };
}

export default function TrackingPage({ isActive }: { isActive?: boolean }) {
  const [work, setWork] = useState<TrackerState>(IDLE);
  const [free, setFree] = useState<TrackerState>(IDLE);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [, setTick] = useState(0);
  const { toast } = useToast();

  const syncFromDB = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    const entry = entries[0] ?? null;
    setTodayEntry(entry);
    const now = Date.now();
    const open = entry?.timeBlocks.filter(b => b.endTime == null) ?? [];
    const workBlock = open.find(b => b.type === 'WORK');
    const freeBlock = open.find(b => b.type === 'FREE');
    if (workBlock) {
      const paused = workBlock.paused;
      const seg = workBlock.segmentStartTime ?? workBlock.startTime;
      setWork({
        status: paused ? 'paused' : 'running',
        blockId: workBlock.id, dailyEntryId: entry!.id,
        startTime: workBlock.startTime.substring(0, 5),
        startTimestamp: paused ? null : now,
        accumulatedMs: paused
          ? workBlock.elapsedMs
          : workBlock.elapsedMs + (now - parseTimeAsToday(seg)),
      });
    } else setWork(IDLE);
    if (freeBlock) {
      const paused = freeBlock.paused;
      const seg = freeBlock.segmentStartTime ?? freeBlock.startTime;
      setFree({
        status: paused ? 'paused' : 'running',
        blockId: freeBlock.id, dailyEntryId: entry!.id,
        startTime: freeBlock.startTime.substring(0, 5),
        startTimestamp: paused ? null : now,
        accumulatedMs: paused
          ? freeBlock.elapsedMs
          : freeBlock.elapsedMs + (now - parseTimeAsToday(seg)),
      });
    } else setFree(IDLE);
  }, []);

  useEffect(() => { syncFromDB(); }, [syncFromDB]);
  useEffect(() => { if (isActive) syncFromDB(); }, [isActive, syncFromDB]);

  // Tick aligned to wall-clock second boundaries so all devices display the same second
  useEffect(() => {
    if (work.status !== 'running' && free.status !== 'running') return;
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setTick(t => t + 1);
      interval = setInterval(() => setTick(t => t + 1), 1000);
    }, 1000 - (Date.now() % 1000));
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [work.status, free.status]);

  const ensureTodayEntry = useCallback(async (): Promise<number> => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    if (entries.length > 0) { setTodayEntry(entries[0]); return entries[0].id; }
    const created = await entriesApi.create({
      date: today, mood: 5, sleepingHours: null, health: null, notes: null,
    });
    setTodayEntry(created);
    return created.id;
  }, []);

  const refreshToday = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    setTodayEntry(entries[0] ?? null);
  }, []);

  const handleStart = useCallback(async (type: 'WORK' | 'FREE') => {
    try {
      const dailyEntryId = await ensureTodayEntry();
      const now = dayjs();
      const startTimeHHMM = now.format('HH:mm');
      const block = await timeBlocksApi.create({
        dailyEntryId, type, startTime: now.format('HH:mm:ss'), segmentStartTime: now.format('HH:mm:ss'),
      });
      const state: TrackerState = {
        status: 'running',
        blockId: block.id,
        dailyEntryId,
        startTime: startTimeHHMM,
        startTimestamp: Date.now(),
        accumulatedMs: 0,
      };
      if (type === 'WORK') setWork(state);
      else setFree(state);
    } catch {
      toast.error('Failed to start tracker');
    }
  }, [ensureTodayEntry, toast]);

  const handlePause = useCallback(async (type: 'WORK' | 'FREE') => {
    const tracker = type === 'WORK' ? work : free;
    const setter = type === 'WORK' ? setWork : setFree;
    if (tracker.status === 'running') {
      if (tracker.blockId && tracker.dailyEntryId && tracker.startTime) {
        const newAcc = tracker.accumulatedMs + (tracker.startTimestamp != null ? Date.now() - tracker.startTimestamp : 0);
        try {
          await timeBlocksApi.update(tracker.blockId, {
            dailyEntryId: tracker.dailyEntryId, type,
            startTime: tracker.startTime + ':00', paused: true, elapsedMs: newAcc,
          });
        } catch { toast.error('Failed to pause tracker'); return; }
        setter(prev => ({ ...prev, status: 'paused', startTimestamp: null, accumulatedMs: newAcc }));
      }
    } else if (tracker.status === 'paused') {
      if (!tracker.blockId || !tracker.dailyEntryId || !tracker.startTime) { toast.error('Failed to resume tracker'); return; }
      try {
        const now = dayjs();
        await timeBlocksApi.update(tracker.blockId, {
          dailyEntryId: tracker.dailyEntryId, type,
          startTime: tracker.startTime + ':00', paused: false,
          elapsedMs: tracker.accumulatedMs, segmentStartTime: now.format('HH:mm:ss'),
        });
        setter(prev => ({ ...prev, status: 'running', startTimestamp: Date.now() }));
      } catch { toast.error('Failed to resume tracker'); }
    }
  }, [work, free, toast]);

  const handleStop = useCallback(async (type: 'WORK' | 'FREE') => {
    const tracker = type === 'WORK' ? work : free;
    if (!tracker.blockId || !tracker.dailyEntryId || !tracker.startTime) return;
    try {
      await timeBlocksApi.update(tracker.blockId, {
        dailyEntryId: tracker.dailyEntryId, type,
        startTime: tracker.startTime + ':00', paused: false, endTime: dayjs().format('HH:mm:ss'),
      });
      if (type === 'WORK') setWork(IDLE); else setFree(IDLE);
      await refreshToday();
    } catch { toast.error('Failed to stop tracker'); }
  }, [work, free, refreshToday, toast]);

  const summary = calcTodaySummary(todayEntry);

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <TrackerCard
          type="WORK"
          tracker={work}
          otherStatus={free.status}
          onStart={() => handleStart('WORK')}
          onPause={() => handlePause('WORK')}
          onStop={() => handleStop('WORK')}
        />
        <TrackerCard
          type="FREE"
          tracker={free}
          otherStatus={work.status}
          onStart={() => handleStart('FREE')}
          onPause={() => handlePause('FREE')}
          onStop={() => handleStop('FREE')}
        />
      </Box>

      <Paper elevation={1} sx={{ p: 2, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display:'block' }}>Total Work today</Typography>
          <Typography variant="h6" color="primary">{formatHM(summary.work)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display:'block' }}>Total Free Time today</Typography>
          <Typography variant="h6" color="text.secondary">{formatHM(summary.free)}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}

interface TrackerCardProps {
  type: 'WORK' | 'FREE';
  tracker: TrackerState;
  otherStatus: TrackerState['status'];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

function TrackerCard({ type, tracker, otherStatus, onStart, onPause, onStop }: TrackerCardProps) {
  const label = type === 'WORK' ? 'Work Time' : 'Free Time';
  const elapsed = elapsedMs(tracker);

  const startDisabled  = tracker.status !== 'idle' || otherStatus === 'running';
  const pauseDisabled  = tracker.status === 'idle' || (tracker.status === 'paused' && otherStatus === 'running');
  const stopDisabled   = tracker.status === 'idle';

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {type === 'WORK' ? <WorkIcon color="primary" /> : <SpaIcon color="action" />}
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{label}</Typography>
        <Box sx={{ ml: 'auto' }}>
          {tracker.status === 'running' && <Chip label="Running" size="small" color="success" />}
          {tracker.status === 'paused'  && <Chip label="Paused"  size="small" color="warning" />}
          {tracker.status === 'idle'    && <Chip label="Idle"    size="small" variant="outlined" />}
        </Box>
      </Box>

      <Typography
        variant="h2"
        sx={{
          textAlign: 'center', fontFamily: 'monospace', my: 3,
          fontSize: { xs: '3rem', sm: '4rem' },
          color: tracker.status === 'idle' ? 'text.disabled' : 'text.primary',
        }}
      >
        {formatElapsed(elapsed)}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" disabled={startDisabled} onClick={onStart}
            sx={{ minWidth: 56, height: 56, borderRadius: 2 }}>
            <PlayArrowIcon />
          </Button>
          <Typography variant="caption" sx={{ display:'block', mt: 0.5 }}>Start</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" disabled={pauseDisabled} onClick={onPause}
            sx={{ minWidth: 56, height: 56, borderRadius: 2 }}>
            <PauseIcon />
          </Button>
          <Typography variant="caption" sx={{ display:'block', mt: 0.5 }}>
            {tracker.status === 'paused' ? 'Resume' : 'Pause'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" color="error" disabled={stopDisabled} onClick={onStop}
            sx={{ minWidth: 56, height: 56, borderRadius: 2 }}>
            <StopIcon />
          </Button>
          <Typography variant="caption" sx={{ display:'block', mt: 0.5 }}>Stop</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
