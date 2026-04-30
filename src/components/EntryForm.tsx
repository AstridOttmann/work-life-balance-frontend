import { useState } from 'react';
import {
  Box, Button, Slider, TextField, Typography, Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { DailyEntry, DailyEntryInput } from '../types/entry';

interface Props {
  initial?: DailyEntry;
  onSave: (data: DailyEntryInput) => Promise<void>;
  onCancel?: () => void;
}

export default function EntryForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState<Dayjs | null>(
    initial ? dayjs(initial.date) : dayjs()
  );
  const [workHours, setWorkHours] = useState<string>(
    initial?.workHours != null ? String(initial.workHours) : ''
  );
  const [freeTimeHours, setFreeTimeHours] = useState<string>(
    initial?.freeTimeHours != null ? String(initial.freeTimeHours) : ''
  );
  const [sleepingHours, setSleepingHours] = useState<string>(
    initial?.sleepingHours != null ? String(initial.sleepingHours) : ''
  );
  const [mood, setMood] = useState<number>(initial?.mood ?? 5);
  const [notes, setNotes] = useState<string>(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const toNum = (v: string) => (v === '' ? null : parseFloat(v));

  const handleSubmit = async () => {
    if (!date) return;
    setSaving(true);
    try {
      await onSave({
        date: date.format('YYYY-MM-DD'),
        workHours: toNum(workHours),
        freeTimeHours: toNum(freeTimeHours),
        sleepingHours: toNum(sleepingHours),
        mood,
        notes: notes || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <DatePicker
        label="Date"
        value={date}
        onChange={setDate}
        disabled={!!initial}
      />

      <TextField
        label="Work hours"
        type="number"
        slotProps={{ htmlInput: { min: 0, max: 24, step: 0.5 } }}
        value={workHours}
        onChange={e => setWorkHours(e.target.value)}
      />
      <TextField
        label="Free time hours"
        type="number"
        slotProps={{ htmlInput: { min: 0, max: 24, step: 0.5 } }}
        value={freeTimeHours}
        onChange={e => setFreeTimeHours(e.target.value)}
      />
      <TextField
        label="Sleeping hours"
        type="number"
        slotProps={{ htmlInput: { min: 0, max: 24, step: 0.5 } }}
        value={sleepingHours}
        onChange={e => setSleepingHours(e.target.value)}
      />

      <Box>
        <Typography gutterBottom>Mood: {mood}/10</Typography>
        <Slider
          value={mood}
          onChange={(_, v) => setMood(v as number)}
          min={1}
          max={10}
          step={1}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      <TextField
        label="Notes"
        multiline
        minRows={3}
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        )}
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !date}>
          {initial ? 'Update' : 'Save'}
        </Button>
      </Stack>
    </Stack>
  );
}
