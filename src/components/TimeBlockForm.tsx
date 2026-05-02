import { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { TimeBlock, TimeBlockInput } from '../types/entry';

interface Props {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  initial?: TimeBlock;
  onSave: (data: TimeBlockInput) => Promise<void>;
  onCancel: () => void;
}

export default function TimeBlockForm({ dailyEntryId, type, initial, onSave, onCancel }: Props) {
  const [startTime, setStartTime] = useState<Dayjs | null>(
    initial?.startTime ? dayjs(`2000-01-01T${initial.startTime}`) : dayjs()
  );
  const [endTime, setEndTime] = useState<Dayjs | null>(
    initial?.endTime ? dayjs(`2000-01-01T${initial.endTime}`) : dayjs()
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!startTime || !endTime) return;
    setSaving(true);
    try {
      await onSave({
        dailyEntryId,
        type,
        startTime: startTime.format('HH:mm:ss'),
        endTime: endTime.format('HH:mm:ss'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <TimePicker label="Start" value={startTime} onChange={setStartTime} ampm={false} />
      <TimePicker label="End"   value={endTime}   onChange={setEndTime}   ampm={false} />
      <Stack spacing={1}  sx={{ direction:'row', justifyContent:'flex-end'}}>
        <Button onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !startTime || !endTime}>
          {initial ? 'Update' : 'Add'}
        </Button>
      </Stack>
    </Stack>
  );
}
