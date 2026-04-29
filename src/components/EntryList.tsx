import {
  IconButton, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { DailyEntry } from '../types/entry';

interface Props {
  entries: DailyEntry[];
  onEdit: (entry: DailyEntry) => void;
  onDelete: (id: number) => void;
}

export default function EntryList({ entries, onEdit, onDelete }: Props) {
  if (entries.length === 0) return null;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Work (h)</TableCell>
            <TableCell align="right">Free (h)</TableCell>
            <TableCell align="right">Sleep (h)</TableCell>
            <TableCell align="right">Appt.</TableCell>
            <TableCell align="right">Mood</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(e => (
            <TableRow key={e.id} hover>
              <TableCell>{e.date}</TableCell>
              <TableCell align="right">{e.workHours ?? '-'}</TableCell>
              <TableCell align="right">{e.freeTimeHours ?? '-'}</TableCell>
              <TableCell align="right">{e.sleepingHours ?? '-'}</TableCell>
              <TableCell align="right">{e.appointments.length}</TableCell>
              <TableCell align="right">{e.mood}/10</TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
