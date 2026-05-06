import { useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider,
  IconButton, List, ListItem, ListItemText, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TimeBlock, TimeBlockInput } from '../types/entry';
import TimeBlockForm from './TimeBlockForm';
import { timeBlocksApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  blocks: TimeBlock[];
  onChange: () => void;
  label: string;
}

function blockDuration(b: TimeBlock): string {
  if (!b.endTime) return '';
  const [sh, sm] = b.startTime.split(':').map(Number);
  const [eh, em] = b.endTime.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function TimeBlockList({ dailyEntryId, type, blocks, onChange, label }: Props) {
  const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>(blocks);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeBlock | null>(null);
  const { toast } = useToast();
  const color = type === 'WORK' ? '#1976d2' : '#4caf50';

  const handleCreate = async (data: TimeBlockInput) => {
    const created = await timeBlocksApi.create(data);
    setAddOpen(false);
    setLocalBlocks(prev => [...prev, created]);
    toast.success(`${label} block added`);
    onChange();
  };

  const handleUpdate = async (data: TimeBlockInput) => {
    if (!editTarget) return;
    const updated = await timeBlocksApi.update(editTarget.id, data);
    setEditTarget(null);
    setLocalBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    toast.success('Updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    await timeBlocksApi.delete(id);
    setLocalBlocks(prev => prev.filter(b => b.id !== id));
    toast.success('Deleted');
    onChange();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color }}>{label}</Typography>
        <Button startIcon={<AddIcon />} size="small" onClick={() => setAddOpen(true)}>Add</Button>
      </Box>

      {localBlocks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No entries</Typography>
      ) : (
        <List disablePadding>
          {localBlocks.map((b, i) => (
            <Box key={b.id}>
              {i > 0 && <Divider />}
              <ListItem
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {b.endTime !== null && (
                      <IconButton size="small" onClick={() => setEditTarget(b)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleDelete(b.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    b.endTime == null ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{b.startTime.substring(0, 5)}</span>
                        <Chip label="Running" size="small" color="success" />
                      </Box>
                    ) : (
                      `${b.startTime.substring(0, 5)} – ${b.endTime.substring(0, 5)}`
                    )
                  }
                  secondary={b.endTime != null ? blockDuration(b) : null}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add {label} Block</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TimeBlockForm dailyEntryId={dailyEntryId} type={type} onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit {label} Block</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {editTarget && (
              <TimeBlockForm dailyEntryId={dailyEntryId} type={type} initial={editTarget} onSave={handleUpdate} onCancel={() => setEditTarget(null)} />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
