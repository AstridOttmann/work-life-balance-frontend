import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress,
  Divider, Paper, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import type { Summary } from '../types/entry';
import { entriesApi } from '../services/api';
import SummaryCharts from '../components/SummaryCharts';

type Period = 'weekly' | 'monthly';

function formatHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SummaryPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [date, setDate] = useState(dayjs());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await entriesApi.getSummary(period, date.format('YYYY-MM-DD'));
      setSummary(data);
      setError(null);
    } catch {
      setError('Could not load summary.');
    } finally {
      setLoading(false);
    }
  }, [period, date]);

  useEffect(() => { load(); }, [load]);

  const navigate = (dir: -1 | 1) => {
    setDate(prev =>
      period === 'weekly' ? prev.add(dir * 7, 'day') : prev.add(dir, 'month')
    );
  };

  const periodLabel = summary
    ? `${summary.startDate} → ${summary.endDate}`
    : '';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Summary</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant={period === 'weekly' ? 'contained' : 'outlined'} onClick={() => setPeriod('weekly')}>
            Weekly
          </Button>
          <Button size="small" variant={period === 'monthly' ? 'contained' : 'outlined'} onClick={() => setPeriod('monthly')}>
            Monthly
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)} startIcon={<ChevronLeftIcon />}>
          Prev
        </Button>
        <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 600 }}>{periodLabel}</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(1)} endIcon={<ChevronRightIcon />}>
          Next
        </Button>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && summary && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {[
              { label: 'Work',         value: formatHM(summary.totalWorkHours),        color: '#1976d2' },
              { label: 'Free time',    value: formatHM(summary.totalFreeTimeHours),    color: '#4caf50' },
              { label: 'Sleep',        value: formatHM(summary.totalSleepingHours),    color: '#9c27b0' },
              { label: 'Appointments', value: formatHM(summary.totalAppointmentHours), color: '#ff9800' },
              { label: 'Avg Mood',     value: `${summary.avgMood.toFixed(1)}/10`,      color: '#e91e63' },
              { label: 'Avg Health',   value: `${summary.avgHealth.toFixed(1)}/10`,    color: '#00897b' },
            ].map(stat => (
              <Paper key={stat.label} variant="outlined" sx={{ p: 2, textAlign: 'center', flex: '1 1 120px' }}>
                <Typography variant="h5" color={stat.color} sx={{ fontWeight: 'bold' }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Paper>
            ))}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {summary.entries.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center" }}>No entries for this period.</Typography>
          ) : (
            <SummaryCharts summary={summary} />
          )}
        </>
      )}
    </Box>
  );
}
