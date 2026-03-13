import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';

interface ComponentPaletteProps {
  onAddComponent: (type: string) => void;
}

const components = [
  { type: 'collection', label: 'Sample Collection', icon: <ScienceIcon /> },
  { type: 'analysis', label: 'Analysis Step', icon: <AnalyticsIcon /> },
  { type: 'review', label: 'Review & Approval', icon: <FactCheckIcon /> },
  { type: 'notification', label: 'Notification', icon: <NotificationsIcon /> },
  { type: 'custom', label: 'Custom Step', icon: <SettingsIcon /> },
];

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Components
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click to add or drag to workflow
      </Typography>
      <List>
        {components.map((component) => (
          <ListItemButton
            key={component.type}
            onClick={() => onAddComponent(component.type)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon>{component.icon}</ListItemIcon>
            <ListItemText primary={component.label} />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};

export default ComponentPalette;
