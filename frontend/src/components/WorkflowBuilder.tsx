import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
  Fab,
  SwipeableDrawer,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SortableStep from './SortableStep';
import ComponentPalette from './ComponentPalette';
import { parseWorkflowFromNL, createWorkflow } from '../services/api';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: string;
}

const WorkflowBuilder: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [nlInput, setNlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(!isMobile);
  const [paletteDrawerOpen, setPaletteDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Add touch sensor for mobile drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addStep = (type: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: `New ${type} Step`,
      description: '',
      type,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, ...updates } : step)));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  const handleNLSubmit = async () => {
    if (!nlInput.trim()) return;

    setIsLoading(true);
    try {
      const result = await parseWorkflowFromNL(nlInput);
      if (result.success && result.workflow) {
        // Update workflow name and add parsed steps
        if (result.workflow.name) {
          setWorkflowName(result.workflow.name);
        }
        if (result.workflow.steps && result.workflow.steps.length > 0) {
          const newSteps = result.workflow.steps.map((step: any, index: number) => ({
            id: `step-${Date.now()}-${index}`,
            name: step.name,
            description: step.description || '',
            type: step.type || 'custom',
          }));
          setSteps([...steps, ...newSteps]);
        }
        setSnackbar({ open: true, message: 'Workflow parsed successfully!', severity: 'success' });
      }
      setNlInput('');
    } catch (error) {
      console.error('Error parsing workflow:', error);
      setSnackbar({ open: true, message: 'Failed to parse workflow. Please try again.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkflow = async () => {
    try {
      await createWorkflow({
        name: workflowName,
        description: '',
        steps: steps,
      });
      setSnackbar({ open: true, message: 'Workflow saved!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save workflow.', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, pb: { xs: 10, md: 2 } }}>
      {/* Workflow Progress Indicator */}
      {steps.length > 0 && (
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Workflow Progress
          </Typography>
          <Stepper 
            activeStep={activeStep} 
            alternativeLabel={!isSmall}
            orientation={isSmall ? 'vertical' : 'horizontal'}
            sx={{
              '& .MuiStepLabel-label': {
                fontSize: { xs: '0.7rem', sm: '0.875rem' },
              },
            }}
          >
            {steps.map((step, index) => (
              <Step key={step.id} onClick={() => setActiveStep(index)} sx={{ cursor: 'pointer' }}>
                <StepLabel>{step.name}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 2, md: 3 }, 
        flexDirection: { xs: 'column', md: 'row' },
      }}>
        {/* Left Panel - Component Palette (Desktop) */}
        {!isMobile && (
          <Box sx={{ width: 250, flexShrink: 0 }}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1">Components</Typography>
                <IconButton size="small" onClick={() => setPaletteOpen(!paletteOpen)}>
                  {paletteOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Collapse in={paletteOpen}>
                <ComponentPalette onAddComponent={addStep} />
              </Collapse>
            </Paper>
          </Box>
        )}

        {/* Center Panel - Workflow Canvas */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-input': {
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                },
              }}
              size={isMobile ? 'small' : 'medium'}
            />

            {/* Natural Language Input */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              mb: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
            }}>
              <TextField
                fullWidth
                label="Describe your workflow..."
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleNLSubmit()}
                placeholder={isMobile 
                  ? "e.g., Blood sample workflow"
                  : "e.g., Create a blood sample analysis workflow with collection, testing, and reporting steps"
                }
                disabled={isLoading}
                size={isMobile ? 'small' : 'medium'}
                multiline={isMobile}
                rows={isMobile ? 2 : 1}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  },
                }}
              />
              <Button 
                variant="contained" 
                onClick={handleNLSubmit} 
                disabled={isLoading || !nlInput.trim()}
                startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{ 
                  minHeight: { xs: 48, sm: 'auto' },
                  minWidth: { xs: '100%', sm: 80 },
                }}
              >
                {isLoading ? '' : isMobile ? 'Generate with AI' : 'AI'}
              </Button>
            </Box>

            {/* Drag and Drop Steps */}
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Workflow Steps ({steps.length})
            </Typography>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <Box sx={{ minHeight: { xs: 150, sm: 200 } }}>
                  {steps.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: { xs: 3, sm: 4 },
                        textAlign: 'center',
                        color: 'text.secondary',
                        borderStyle: 'dashed',
                      }}
                    >
                      <Typography sx={{ fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                        {isMobile 
                          ? 'Use AI or tap + to add steps'
                          : 'Drag components here or use natural language to add steps'
                        }
                      </Typography>
                    </Paper>
                  ) : (
                    steps.map((step) => (
                      <SortableStep
                        key={step.id}
                        step={step}
                        onUpdate={updateStep}
                        onRemove={removeStep}
                      />
                    ))
                  )}
                </Box>
              </SortableContext>
            </DndContext>

            {/* Action Buttons */}
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              gap: { xs: 1, sm: 2 }, 
              justifyContent: { xs: 'stretch', sm: 'flex-end' },
              flexDirection: { xs: 'column', sm: 'row' },
            }}>
              <Button 
                variant="outlined" 
                onClick={handleSaveWorkflow}
                fullWidth={isMobile}
                sx={{ minHeight: { xs: 48, sm: 'auto' } }}
              >
                Save Draft
              </Button>
              <Button 
                variant="contained" 
                startIcon={<PlayArrowIcon />} 
                disabled={steps.length === 0}
                fullWidth={isMobile}
                sx={{ minHeight: { xs: 48, sm: 'auto' } }}
              >
                Activate Workflow
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Right Panel - Properties (Desktop only) */}
        {!isMobile && (
          <Box sx={{ width: 250, flexShrink: 0 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Properties
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a step to edit its properties
              </Typography>
            </Paper>
        </Box>
        )}
      </Box>

      {/* Mobile FAB for adding components */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add component"
          onClick={() => setPaletteDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Mobile Component Palette Drawer */}
      <SwipeableDrawer
        anchor="bottom"
        open={paletteDrawerOpen}
        onClose={() => setPaletteDrawerOpen(false)}
        onOpen={() => setPaletteDrawerOpen(true)}
        disableSwipeToOpen
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '60vh',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 4,
              backgroundColor: 'grey.300',
              borderRadius: 2,
              mx: 'auto',
              mb: 2,
            }}
          />
          <Typography variant="h6" gutterBottom>
            Add Component
          </Typography>
          <ComponentPalette 
            onAddComponent={(type) => {
              addStep(type);
              setPaletteDrawerOpen(false);
            }} 
          />
        </Box>
      </SwipeableDrawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'right' }}
        sx={{ mb: isMobile ? 8 : 0 }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkflowBuilder;
