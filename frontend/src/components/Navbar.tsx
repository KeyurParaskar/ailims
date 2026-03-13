import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import AISearch from './AISearch';

interface NavbarProps {
  onNotificationsClick?: () => void;
  notificationCount?: number;
}

const Navbar: React.FC<NavbarProps> = ({ onNotificationsClick, notificationCount = 0 }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <ScienceIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          AI-LIMS
        </Typography>
        
        {/* AI-Powered Search with Voice */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <AISearch />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={onNotificationsClick}>
            <Badge badgeContent={notificationCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
