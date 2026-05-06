import { useState } from 'react';
import {
  AppBar, Box, Container, Tab, Tabs, Toolbar, Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';
import TrackingPage from './pages/TrackingPage';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginDialog from './components/LoginDialog';
import AccountMenu from './components/AccountMenu';

function AppShell() {
  const { token } = useAuth();
  const [tab, setTab] = useState(1);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flex: 1 }} />
          <Typography variant="h6">Work-Life Balance</Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <AccountMenu />
          </Box>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          centered
          sx={{ bgcolor: 'primary.dark' }}
        >
          <Tab label="Tracking" />
          <Tab label="Daily Log" />
          <Tab label="Statistics" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box hidden={tab !== 0}><TrackingPage isActive={tab === 0} /></Box>
        <Box hidden={tab !== 1}><DashboardPage isActive={tab === 1} /></Box>
        <Box hidden={tab !== 2}><SummaryPage isActive={tab === 2} /></Box>
      </Container>

      <LoginDialog open={!token} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AppShell />
        </LocalizationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
