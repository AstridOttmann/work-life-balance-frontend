import { useState } from 'react';
import {
  Box, Button, Divider, IconButton, List, ListItem, ListItemText,
  Slider, Stack, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { DailyEntry, DailyEntryInput } from '../types/entry';
import TimeBlockList from './TimeBlockList';

type PendingBlock = { type: 'WORK' | 'FREE'; startTime: string; endTime: string };

interface Props {
  initial?: DailyEntry;
  onSave: (data: DailyEntryInput, pendingBlocks?: PendingBlock[]) => Promise<void>;
  onCancel?: () => void;
  onRefresh?: () => void;
}

function toSleepParts(hours: number | null) {
  if (hours == null) return { h: '', m: '' };
  return { h: String(Math.floor(hours)), m: String(Math.round((hours % 1) * 60)) };
}

function blockDuration(start: string, end: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function EntryForm({ initial, onSave, onCancel, onRefresh }: Props) {
  const [date, setDate] = useState<Dayjs | null>(
    initial ? dayjs(initial.date) : dayjs()
  );
  const initSleep = toSleepParts(initial?.sleepingHours ?? null);
  const [sleepH, setSleepH] = useState(initSleep.h);
  const [sleepM, setSleepM] = useState(initSleep.m);
  const [mood, setMood] = useState<number>(initial?.mood ?? 5);
  const [health, setHealth] = useState<number>(initial?.health ?? 5);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  // Pending blocks (create mode only)
  const [pendingBlocks, setPendingBlocks] = useState<PendingBlock[]>([]);
  const [addingType, setAddingType] = useState<'WORK' | 'FREE' | null>(null);
  const [addStart, setAddStart] = useState<Dayjs>(dayjs());
  const [addEnd, setAddEnd] = useState<Dayjs>(dayjs());

  const confirmAdd = () => {
    if (!addingType) return;
    setPendingBlocks(prev => [...prev, {
      type: addingType,
      startTime: addStart.format('HH:mm:ss'),
      endTime: addEnd.format('HH:mm:ss'),
    }]);
    setAddingType(null);
  };

  const handleSubmit = async () => {
    if (!date) return;
    setSaving(true);
    try {
      const sleepingHours = sleepH || sleepM
        ? (parseInt(sleepH || '0') + parseInt(sleepM || '0') / 60)
        : null;
      await onSave(
        { date: date.format('YYYY-MM-DD'), sleepingHours, mood, health, notes: notes || null },
        !initial ? pendingBlocks : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <DatePicker label="Date" value={date} onChange={setDate} disabled={!!initial} />

      {/* Time blocks — live API when editing, buffered locally when creating */}
      {initial ? (
        <>
          <TimeBlockList
            dailyEntryId={initial.id}
            type="WORK"
            blocks={initial.timeBlocks?.filter(b => b.type === 'WORK') ?? []}
            onChange={onRefresh ?? (() => {})}
            label="Work"
          />
          <TimeBlockList
            dailyEntryId={initial.id}
            type="FREE"
            blocks={initial.timeBlocks?.filter(b => b.type === 'FREE') ?? []}
            onChange={onRefresh ?? (() => {})}
            label="Free time"
          />
        </>
      ) : (
        <>
          {(['WORK', 'FREE'] as const).map(type => {
            const color = type === 'WORK' ? '#1976d2' : '#4caf50';
            const label = type === 'WORK' ? 'Work' : 'Free time';
            const blocks = pendingBlocks.filter(b => b.type === type);
            return (
              <Box key={type}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color }}>{label}</Typography>
                  <Button size="small" startIcon={<AddIcon />}
                    onClick={() => { setAddStart(dayjs()); setAddEnd(dayjs()); setAddingType(type); }}
                    disabled={addingType !== null && addingType !== type}
                  >
                    Add
                  </Button>
                </Box>

                {blocks.length === 0 && addingType !== type && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>No entries</Typography>
                )}

                {blocks.length > 0 && (
                  <List disablePadding>
                    {blocks.map((b, i) => {
                      const globalIdx = pendingBlocks.indexOf(b);
                      return (
                        <ListItem key={i} disablePadding secondaryAction={
                          <IconButton size="small" onClick={() =>
                            setPendingBlocks(prev => prev.filter((_, idx) => idx !== globalIdx))
                          }>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }>
                          <ListItemText
                            primary={`${b.startTime.substring(0, 5)} – ${b.endTime.substring(0, 5)}`}
                            secondary={blockDuration(b.startTime, b.endTime)}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}

                {addingType === type && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1, flexWrap: 'wrap' }}>
                    <TimePicker label="Start" value={addStart} onChange={v => v && setAddStart(v)} ampm={false} sx={{ flex: 1, minWidth: 130 }} />
                    <TimePicker label="End" value={addEnd} onChange={v => v && setAddEnd(v)} ampm={false} sx={{ flex: 1, minWidth: 130 }} />
                    <Button onClick={confirmAdd}>Add</Button>
                    <Button color="inherit" onClick={() => setAddingType(null)}>Cancel</Button>
                  </Box>
                )}
              </Box>
            );
          })}
        </>
      )}

      <Divider />

      <Box>
        <Typography gutterBottom>Sleeping hours</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Hours" type="number" slotProps={{ htmlInput: { min: 0, max: 24 } }}
            value={sleepH} onChange={e => setSleepH(e.target.value)} sx={{ flex: 1 }} />
          <TextField label="Minutes" type="number" slotProps={{ htmlInput: { min: 0, max: 59 } }}
            value={sleepM} onChange={e => setSleepM(e.target.value)} sx={{ flex: 1 }} />
        </Box>
      </Box>

      <Box>
        <Typography gutterBottom>Mood: {mood}/10</Typography>
        <Slider value={mood} onChange={(_, v) => setMood(v as number)} min={1} max={10} step={0.1}
          marks={[1,2,3,4,5,6,7,8,9,10].map(v => ({ value: v, label: String(v) }))} valueLabelDisplay="auto" />
      </Box>

      <Box>
        <Typography gutterBottom>Health: {health}/10</Typography>
        <Slider value={health} onChange={(_, v) => setHealth(v as number)} min={1} max={10} step={0.1}
          marks={[1,2,3,4,5,6,7,8,9,10].map(v => ({ value: v, label: String(v) }))} valueLabelDisplay="auto" />
      </Box>

      <TextField label="Notes" multiline minRows={3} value={notes} onChange={e => setNotes(e.target.value)} />

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        {onCancel && <Button onClick={onCancel} disabled={saving}>Cancel</Button>}
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !date}>
          {initial ? 'Update' : 'Save'}
        </Button>
      </Stack>
    </Stack>
  );
}
