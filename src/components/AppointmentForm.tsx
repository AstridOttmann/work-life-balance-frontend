import { useState } from 'react';
import { Button, Stack, TextField } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { Appointment, AppointmentInput } from '../types/entry';

interface Props {
  dailyEntryId: number;
  initial?: Appointment;
  onSave: (data: AppointmentInput) => Promise<void>;
  onCancel: () => void;
}

export default function AppointmentForm({ dailyEntryId, initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState<Dayjs | null>(
    initial?.time ? dayjs(`2000-01-01T${initial.time}`) : null
  );
  const [durationHours, setDurationHours] = useState<string>(
    initial?.durationHours != null ? String(initial.durationHours) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        dailyEntryId,
        title: title.trim(),
        time: time ? time.format('HH:mm:ss') : null,
        durationHours: durationHours !== '' ? parseFloat(durationHours) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        autoFocus
      />
      <TimePicker
        label="Time"
        value={time}
        onChange={setTime}
        ampm={false}
      />
      <TextField
        label="Duration (hours)"
        type="number"
        inputProps={{ min: 0, max: 24, step: 0.5 }}
        value={durationHours}
        onChange={e => setDurationHours(e.target.value)}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !title.trim()}>
          {initial ? 'Update' : 'Add'}
        </Button>
      </Stack>
    </Stack>
  );
}
