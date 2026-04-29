import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogContent,
  DialogTitle, Divider, Paper, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
  const [detailEntry, setDetailEntry] = useState<DailyEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await entriesApi.getAll();
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      setEntries(sorted);
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
    if (detailEntry?.id === id) setDetailEntry(null);
    await load();
  };

  const openDetail = (entry: DailyEntry) => setDetailEntry(entry);

  const refreshDetail = async () => {
    if (!detailEntry) return;
    const updated = await entriesApi.getById(detailEntry.id);
    setDetailEntry(updated);
    setEntries(prev => prev.map(e => (e.id === updated.id ? updated : e)));
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Daily Log</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          New Entry
        </Button>
      </Box>

      <EntryList
        entries={entries}
        onEdit={e => setEditTarget(e)}
        onDelete={handleDelete}
      />

      {entries.length === 0 && (
        <Typography color="text.secondary" mt={4} textAlign="center">
          No entries yet. Add your first day!
        </Typography>
      )}

      {detailEntry && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" mb={1}>Appointments — {detailEntry.date}</Typography>
          <Divider sx={{ mb: 2 }} />
          <AppointmentList
            dailyEntryId={detailEntry.id}
            appointments={detailEntry.appointments}
            onChange={refreshDetail}
          />
        </Paper>
      )}

      {!detailEntry && entries.length > 0 && (
        <Box mt={2}>
          {entries.map(e => (
            <Button key={e.id} size="small" onClick={() => openDetail(e)} sx={{ mr: 1, mb: 1 }}>
              {e.date} ({e.appointments.length} appts)
            </Button>
          ))}
        </Box>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Day Entry</DialogTitle>
        <DialogContent>
          <Box pt={1}>
            <EntryForm onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Entry</DialogTitle>
        <DialogContent>
          <Box pt={1}>
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
