import { useState } from 'react';
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, Divider,
  IconButton, List, ListItem, ListItemText, Typography, Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Appointment, AppointmentInput } from '../types/entry';
import AppointmentForm from './AppointmentForm';
import { appointmentsApi } from '../services/api';

interface Props {
  dailyEntryId: number;
  appointments: Appointment[];
  onChange: () => void;
}

export default function AppointmentList({ dailyEntryId, appointments, onChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);

  const handleCreate = async (data: AppointmentInput) => {
    await appointmentsApi.create(data);
    setAddOpen(false);
    onChange();
  };

  const handleUpdate = async (data: AppointmentInput) => {
    if (!editTarget) return;
    await appointmentsApi.update(editTarget.id, data);
    setEditTarget(null);
    onChange();
  };

  const handleDelete = async (id: number) => {
    await appointmentsApi.delete(id);
    onChange();
  };

  const formatTime = (t: string | null) => {
    if (!t) return null;
    return t.substring(0, 5); // "HH:mm"
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Button startIcon={<AddIcon />} size="small" onClick={() => setAddOpen(true)}>
          Add
        </Button>
      </Box>

      {appointments.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No appointments</Typography>
      ) : (
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
                  secondary={
                    <Box display="flex" gap={1} mt={0.5}>
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
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Appointment</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <AppointmentForm
              dailyEntryId={dailyEntryId}
              onSave={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Appointment</DialogTitle>
        <DialogContent>
          <Box pt={1}>
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
