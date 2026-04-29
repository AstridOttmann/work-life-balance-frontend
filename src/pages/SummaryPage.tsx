import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, ButtonGroup, CircularProgress,
  Divider, Paper, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import type { Summary } from '../types/entry';
import { entriesApi } from '../services/api';
import SummaryCharts from '../components/SummaryCharts';

type Period = 'weekly' | 'monthly';

export default function SummaryPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [date, setDate] = useState(dayjs());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await entriesApi.getSummary(period, date.format('YYYY-MM-DD'));
      setSummary(data);
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
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5">Summary</Typography>
        <ButtonGroup size="small">
          <Button variant={period === 'weekly' ? 'contained' : 'outlined'} onClick={() => setPeriod('weekly')}>
            Weekly
          </Button>
          <Button variant={period === 'monthly' ? 'contained' : 'outlined'} onClick={() => setPeriod('monthly')}>
            Monthly
          </Button>
        </ButtonGroup>
      </Box>

      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button variant="outlined" size="small" onClick={() => navigate(-1)} startIcon={<ChevronLeftIcon />}>
          Prev
        </Button>
        <Typography variant="body1" flexGrow={1} textAlign="center">{periodLabel}</Typography>
        <Button variant="outlined" size="small" onClick={() => navigate(1)} endIcon={<ChevronRightIcon />}>
          Next
        </Button>
      </Box>

      {loading && <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && summary && (
        <>
          <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
            {[
              { label: 'Work', value: summary.totalWorkHours, unit: 'h', color: '#1976d2' },
              { label: 'Free time', value: summary.totalFreeTimeHours, unit: 'h', color: '#4caf50' },
              { label: 'Sleep', value: summary.totalSleepingHours, unit: 'h', color: '#9c27b0' },
              { label: 'Appointments', value: summary.totalAppointmentHours, unit: 'h', color: '#ff9800' },
              { label: 'Avg Mood', value: summary.avgMood.toFixed(1), unit: '/10', color: '#e91e63' },
            ].map(stat => (
              <Paper key={stat.label} variant="outlined" sx={{ p: 2, textAlign: 'center', flex: '1 1 120px' }}>
                <Typography variant="h5" color={stat.color} fontWeight="bold">
                  {stat.value}{stat.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Paper>
            ))}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {summary.entries.length === 0 ? (
            <Typography color="text.secondary" textAlign="center">No entries for this period.</Typography>
          ) : (
            <SummaryCharts summary={summary} />
          )}
        </>
      )}
    </Box>
  );
}
