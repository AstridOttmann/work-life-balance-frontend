import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, FormControl, InputLabel, MenuItem,
  Paper, Select, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventNoteIcon from '@mui/icons-material/EventNote';
import dayjs from 'dayjs';
import type { DailyEntry, DailyEntryInput } from '../types/entry';
import type { AppointmentInput } from '../types/entry';
import { entriesApi, appointmentsApi, timeBlocksApi } from '../services/api';
import EntryForm from '../components/EntryForm';
import EntryList from '../components/EntryList';
import AppointmentList from '../components/AppointmentList';
import AppointmentForm from '../components/AppointmentForm';
import { useToast } from '../context/ToastContext';

export default function DashboardPage({ isActive }: { isActive?: boolean }) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyEntry | null>(null);
  const [newApptOpen, setNewApptOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const { toast } = useToast();

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
  useEffect(() => { if (isActive !== false) load(); }, [isActive, load]);

  useEffect(() => {
    const handleVisibility = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [load]);

  const handleCreate = async (data: DailyEntryInput, pendingBlocks?: { type: 'WORK' | 'FREE'; startTime: string; endTime: string }[]) => {
    const created = await entriesApi.create(data);
    if (pendingBlocks && pendingBlocks.length > 0) {
      await Promise.all(pendingBlocks.map(b =>
        timeBlocksApi.create({ dailyEntryId: created.id, type: b.type, startTime: b.startTime, endTime: b.endTime })
      ));
    }
    setAddOpen(false);
    toast.success('Entry created');
    await load();
  };

  const handleUpdate = async (data: DailyEntryInput) => {
    if (!editTarget) return;
    await entriesApi.update(editTarget.id, data);
    setEditTarget(null);
    toast.success('Entry updated');
    await load();
  };

  const handleDelete = async (id: number) => {
    await entriesApi.delete(id);
    toast.success('Entry deleted');
    await load();
  };

  const openNewAppt = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultEntry = entries.find(e => e.date === today) ?? entries[0];
    setSelectedEntryId(defaultEntry?.id ?? null);
    setNewApptOpen(true);
  };

  const handleNewApptCreate = async (data: AppointmentInput) => {
    await appointmentsApi.create(data);
    setNewApptOpen(false);
    toast.success('Appointment created');
    await load();
  };

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
        onViewAppointments={id => {
          document.getElementById(`appointments-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
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
            justifyContent: 'space-between',
            mb: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventNoteIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{fontWeight:700}} color="text.primary">
                Appointments
              </Typography>
            </Box>
            <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openNewAppt}>
              New Appointment
            </Button>
          </Box>

          {entries.map((entry, i) => (
            <Box key={entry.id} id={`appointments-${entry.id}`}>
              {i > 0 && <Divider sx={{ my: 2 }} />}
              <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600, mb: 1 }}>
                {entry.date}
              </Typography>
              <AppointmentList
                dailyEntryId={entry.id}
                appointments={entry.appointments}
                onChange={load}
              />
            </Box>
          ))}
        </Paper>
      )}

      {/* New Entry dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Day Entry</DialogTitle>
        <DialogContent>
          <Box sx={{ pt:1 }}>
            <EntryForm onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Entry dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editTarget && `${dayjs(editTarget.date).format('dddd')}, ${editTarget.date}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{pt:1}}>
            {editTarget && (
              <EntryForm
                initial={editTarget}
                onSave={handleUpdate}
                onCancel={() => setEditTarget(null)}
                onRefresh={load}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* New Appointment dialog */}
      <Dialog open={newApptOpen} onClose={() => setNewApptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Date</InputLabel>
              <Select
                value={selectedEntryId ?? ''}
                label="Date"
                onChange={e => setSelectedEntryId(Number(e.target.value))}
              >
                {entries.map(entry => (
                  <MenuItem key={entry.id} value={entry.id}>{entry.date}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedEntryId != null && (
              <AppointmentForm
                key={selectedEntryId}
                dailyEntryId={selectedEntryId}
                onSave={handleNewApptCreate}
                onCancel={() => setNewApptOpen(false)}
              />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
