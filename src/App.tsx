import { useState } from 'react';
import {
  AppBar, Box, Container, Tab, Tabs, Toolbar, Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Work-Life Balance
          </Typography>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="secondary"
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
  );
}
