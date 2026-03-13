import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import WorkflowBuilder from './components/WorkflowBuilder';
import Navbar from './components/Navbar';
import NotificationsPanel from './components/NotificationsPanel';
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar 
            onNotificationsClick={() => setNotificationsOpen(true)}
            notificationCount={notificationCount}
          />
          <Box sx={{ flex: 1, p: 2 }}>
            <WorkflowBuilder />
          </Box>
          <NotificationsPanel 
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onUnreadCountChange={setNotificationCount}
          />
        </Box>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
