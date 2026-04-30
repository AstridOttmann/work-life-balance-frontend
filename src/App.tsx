import { useState } from 'react';
import {
  AppBar, Box, Container, Tab, Tabs, Toolbar, Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <ToastProvider>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Typography variant="h6">
            Work-Life Balance
          </Typography>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          centered
          sx={{ bgcolor: 'primary.dark' }}
        >
          <Tab label="Daily Log" />
          <Tab label="Summary" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box hidden={tab !== 0}><DashboardPage /></Box>
        <Box hidden={tab !== 1}><SummaryPage /></Box>
      </Container>
    </LocalizationProvider>
    </ToastProvider>
  );
}
