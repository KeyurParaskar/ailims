import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  BottomNavigation,
  BottomNavigationAction,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Badge,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  notificationCount?: number;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon />, mobileNav: true },
  { id: 'workflows', label: 'Workflows', icon: <AccountTreeIcon />, mobileNav: true },
  { id: 'search', label: 'Search', icon: <SearchIcon />, mobileNav: true },
  { id: 'equipment', label: 'Equipment', icon: <PrecisionManufacturingIcon />, mobileNav: false },
  { id: 'reports', label: 'Reports', icon: <AssessmentIcon />, mobileNav: false },
  { id: 'audit', label: 'Audit Log', icon: <HistoryIcon />, mobileNav: false },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, mobileNav: false },
];

const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate, notificationCount = 0 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mobileNavItems = navigationItems.filter((item) => item.mobileNav);

  // Mobile bottom navigation items (limited to 4-5 items)
  const bottomNavValue = mobileNavItems.findIndex((item) => item.id === currentPage);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setDrawerOpen(false);
  };

  // Drawer content for full navigation
  const drawerContent = (
    <Box sx={{ width: 280, pt: 2 }}>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          AI-LIMS
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Laboratory Management System
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => handleNavigation(item.id)}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: currentPage === item.id ? 'primary.main' : 'inherit',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: currentPage === item.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('notifications')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Notifications" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigation('profile')}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar position="fixed" color="default" elevation={1}>
          <Toolbar sx={{ minHeight: { xs: 56 } }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              AI-LIMS
            </Typography>
            <IconButton color="inherit" onClick={() => onNavigate('notifications')}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Slide-out Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Side Navigation */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 250,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <BottomNavigation
          value={bottomNavValue}
          onChange={(event, newValue) => {
            handleNavigation(mobileNavItems[newValue].id);
          }}
          showLabels
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              padding: '6px 0',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                '&.Mui-selected': {
                  fontSize: '0.75rem',
                },
              },
            },
          }}
        >
          {mobileNavItems.map((item) => (
            <BottomNavigationAction
              key={item.id}
              label={item.label}
              icon={item.icon}
            />
          ))}
          <BottomNavigationAction
            label="More"
            icon={<MenuIcon />}
            onClick={(e) => {
              e.preventDefault();
              handleDrawerToggle();
            }}
          />
        </BottomNavigation>
      )}
    </>
  );
};

export default MobileNav;
