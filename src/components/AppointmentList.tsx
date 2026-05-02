import { useState } from 'react';
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, Divider,
  IconButton, List, ListItem, ListItemText, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Appointment, AppointmentInput } from '../types/entry';
import AppointmentForm from './AppointmentForm';
import { appointmentsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  dailyEntryId: number;
  appointments: Appointment[];
  onChange: () => void;
}

export default function AppointmentList({ dailyEntryId, appointments, onChange }: Props) {
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const handleUpdate = async (data: AppointmentInput) => {
    if (!editTarget) return;
    await appointmentsApi.update(editTarget.id, data);
    setEditTarget(null);
    toast.success('Appointment updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    await appointmentsApi.delete(id);
    toast.success('Appointment deleted');
    onChange();
  };

  const formatTime = (t: string | null) => {
    if (!t) return null;
    return t.substring(0, 5);
  };

  if (appointments.length === 0) {
    return <Typography variant="body2" color="text.secondary">No appointments</Typography>;
  }

  return (
    <Box>
      <List disablePadding>
        {appointments.map((a, i) => (
          <Box key={a.id}>
            {i > 0 && <Divider />}
            <ListItem
              disablePadding
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" onClick={() => setEditTarget(a)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(a.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={a.title}
                slotProps={{ secondary: { component: 'div' } }}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    {a.time && <Chip label={formatTime(a.time)} size="small" />}
                    {a.durationHours != null && (
                      <Chip label={`${a.durationHours}h`} size="small" variant="outlined" />
                    )}
                  </Box>
                }
              />
            </ListItem>
          </Box>
        ))}
      </List>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {editTarget && (
              <AppointmentForm
                dailyEntryId={dailyEntryId}
                initial={editTarget}
                onSave={handleUpdate}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
