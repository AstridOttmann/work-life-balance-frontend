import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Box, Typography } from '@mui/material';
import type { Summary } from '../types/entry';

interface Props {
  summary: Summary;
}

export default function SummaryCharts({ summary }: Props) {
  const barData = summary.entries.map(e => ({
    date: e.date.substring(5), // "MM-DD"
    Work: e.workHours ?? 0,
    'Free time': e.freeTimeHours ?? 0,
    Sleep: e.sleepingHours ?? 0,
    Appointments: e.appointments.reduce((s, a) => s + (a.durationHours ?? 0), 0),
  }));

  const moodData = summary.entries
    .filter(e => e.mood != null)
    .map(e => ({ date: e.date.substring(5), Mood: e.mood }));

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        Time distribution (hours)
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Work" stackId="a" fill="#1976d2" />
          <Bar dataKey="Free time" stackId="a" fill="#4caf50" />
          <Bar dataKey="Sleep" stackId="a" fill="#9c27b0" />
          <Bar dataKey="Appointments" stackId="a" fill="#ff9800" />
        </BarChart>
      </ResponsiveContainer>

      <Typography variant="subtitle1" fontWeight="bold" mt={3} mb={1}>
        Mood trend
      </Typography>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={moodData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[1, 10]} ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} />
          <Tooltip />
          <Line type="monotone" dataKey="Mood" stroke="#e91e63" strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
