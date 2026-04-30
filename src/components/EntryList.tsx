import {
  Box, Chip, IconButton, Paper, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import type { DailyEntry } from '../types/entry';

interface Props {
  entries: DailyEntry[];
  onEdit: (entry: DailyEntry) => void;
  onDelete: (id: number) => void;
}

export default function EntryList({ entries, onEdit, onDelete }: Props) {
  if (entries.length === 0) return null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 3,
      }}
    >
      {entries.map(e => (
        <Paper
          key={e.id}
          elevation={2}
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: 6 },
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarTodayIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="text.primary">
                {e.date}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(e)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(e.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Stats chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Chip
              label={`Work ${e.workHours ?? '-'}h`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Free ${e.freeTimeHours ?? '-'}h`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Sleep ${e.sleepingHours ?? '-'}h`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Mood ${e.mood}/10`}
              size="small"
              color={e.mood >= 7 ? 'success' : e.mood >= 4 ? 'warning' : 'error'}
              variant="filled"
            />
          </Box>

          {/* Notes */}
          {e.notes && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {e.notes}
            </Typography>
          )}

          {/* Appointment count */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
            <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {e.appointments.length === 0
                ? 'No appointments'
                : `${e.appointments.length} appointment${e.appointments.length > 1 ? 's' : ''}`}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
