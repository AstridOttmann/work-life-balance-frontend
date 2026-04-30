import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, Paper, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventNoteIcon from '@mui/icons-material/EventNote';
import type { DailyEntry, DailyEntryInput } from '../types/entry';
import { entriesApi } from '../services/api';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import AppointmentList from '../components/AppointmentList';

export default function DashboardPage() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyEntry | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await entriesApi.getAll();
      setEntries([...data].sort((a, b) => b.date.localeCompare(a.date)));
      setError(null);
    } catch {
      setError('Could not load entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: DailyEntryInput) => {
    await entriesApi.create(data);
    setAddOpen(false);
    await load();
  };

  const handleUpdate = async (data: DailyEntryInput) => {
    if (!editTarget) return;
    await entriesApi.update(editTarget.id, data);
    setEditTarget(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    await entriesApi.delete(id);
    await load();
  };

  const entriesWithAppointments = entries.filter(e => e.appointments.length > 0);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{fontWeight: 700 }} color="text.primary">Daily Log</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          New Entry
        </Button>
      </Box>

      {/* Entry cards */}
      <EntryList
        entries={entries}
        onEdit={e => setEditTarget(e)}
        onDelete={handleDelete}
      />

      {entries.length === 0 && (
        <Typography color="text.secondary" sx={{mt:4, textAlign:"center"}}>
          No entries yet. Add your first day!
        </Typography>
      )}

      {/* Appointments section */}
      {entries.length > 0 && (
        <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2
          }}>
            <EventNoteIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{fontWeight:700}} color="text.primary">
              Appointments
            </Typography>
          </Box>

          {entriesWithAppointments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No appointments yet. Add one via an entry.
            </Typography>
          ) : (
            entriesWithAppointments.map((entry, i) => (
              <Box key={entry.id}>
                {i > 0 && <Divider sx={{ my: 2 }} />}
                <Typography
                  variant="subtitle2"
                  color="primary.main"
                  sx={{ fontWeight: 600, mb: 1 }}
                >
                  {entry.date}
                </Typography>
                <AppointmentList
                  dailyEntryId={entry.id}
                  appointments={entry.appointments}
                  onChange={load}
                />
              </Box>
            ))
          )}
        </Paper>
      )}

      {/* Dialogs */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Day Entry</DialogTitle>
        <DialogContent>
          <Box sx={{ pt:1 }}>
            <EntryForm onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Entry</DialogTitle>
        <DialogContent>
          <Box sx={{pt:1}}>
            {editTarget && (
              <EntryForm
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
