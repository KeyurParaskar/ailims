import { Theme } from '@mui/material/styles';

// Responsive breakpoints for AILIMS
export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

// Common responsive styles
export const responsiveStyles = {
  // Container padding based on screen size
  containerPadding: {
    xs: 1,
    sm: 2,
    md: 3,
  },
  
  // Card/Paper elevation and border-radius
  cardStyles: (theme: Theme) => ({
    borderRadius: {
      xs: theme.spacing(1),
      md: theme.spacing(2),
    },
  }),

  // Flex layouts that stack on mobile
  flexColumn: {
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    gap: { xs: 2, md: 3 },
  },

  // Hide on mobile
  hideOnMobile: {
    display: { xs: 'none', sm: 'block' },
  },

  // Hide on desktop
  hideOnDesktop: {
    display: { xs: 'block', sm: 'none' },
  },

  // Full width on mobile
  fullWidthMobile: {
    width: { xs: '100%', md: 'auto' },
  },

  // Touch-friendly button sizes
  touchButton: {
    minHeight: 48,
    minWidth: 48,
    padding: { xs: '12px 16px', sm: '8px 16px' },
  },

  // Spacing for touch targets
  touchSpacing: {
    gap: { xs: 1.5, sm: 1 },
  },
};

// Typography responsive variants
export const responsiveTypography = {
  h1: {
    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
  },
  h2: {
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
  },
  h3: {
    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
  },
  h6: {
    fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
  },
  body1: {
    fontSize: { xs: '0.875rem', sm: '1rem' },
  },
  body2: {
    fontSize: { xs: '0.8rem', sm: '0.875rem' },
  },
};

// Navigation responsive styles
export const navStyles = {
  // Bottom nav for mobile
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1200,
    display: { xs: 'flex', md: 'none' },
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
  },
  
  // Side nav for desktop
  sideNav: {
    display: { xs: 'none', md: 'flex' },
    width: 250,
    flexShrink: 0,
  },

  // Hamburger menu for mobile
  mobileMenu: {
    display: { xs: 'flex', md: 'none' },
  },
};

// Workflow builder specific responsive styles
export const workflowBuilderStyles = {
  // Palette panel
  palette: {
    width: { xs: '100%', md: '240px' },
    maxHeight: { xs: '200px', md: 'none' },
    overflow: { xs: 'auto', md: 'visible' },
  },

  // Canvas area
  canvas: {
    flex: 1,
    minWidth: 0, // Prevent flex overflow
    width: { xs: '100%', md: 'auto' },
  },

  // Properties panel
  properties: {
    width: { xs: '100%', md: '280px' },
  },

  // Stepper (horizontal on desktop, vertical on mobile)
  stepper: {
    '& .MuiStepLabel-label': {
      fontSize: { xs: '0.75rem', sm: '0.875rem' },
      display: { xs: 'none', sm: 'block' },
    },
    '& .MuiStepIcon-root': {
      fontSize: { xs: '1.25rem', sm: '1.5rem' },
    },
  },

  // Step cards
  stepCard: {
    padding: { xs: 1.5, sm: 2 },
    marginBottom: { xs: 1, sm: 1.5 },
  },

  // Input fields
  inputField: {
    '& .MuiInputBase-input': {
      fontSize: { xs: '0.875rem', sm: '1rem' },
      padding: { xs: '12px 14px', sm: '14px' },
    },
  },
};

// Dashboard responsive styles  
export const dashboardStyles = {
  // Stats cards grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, 1fr)',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(4, 1fr)',
    },
    gap: { xs: 1.5, sm: 2 },
  },

  // Charts container
  chartContainer: {
    height: { xs: 250, sm: 300, md: 350 },
  },

  // Table responsive
  tableContainer: {
    overflowX: 'auto',
    '& .MuiTableCell-root': {
      whiteSpace: 'nowrap',
      padding: { xs: '8px', sm: '16px' },
    },
  },
};

// Equipment monitoring responsive styles
export const equipmentStyles = {
  // Equipment card grid
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      lg: 'repeat(3, 1fr)',
    },
    gap: 2,
  },

  // Metric display
  metricDisplay: {
    fontSize: { xs: '1.5rem', sm: '2rem' },
    fontWeight: 600,
  },
};
