import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
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
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [nlInput, setNlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
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
    <Box sx={{ p: 2 }}>
      {/* Workflow Progress Indicator */}
      {steps.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Workflow Progress
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={step.id} onClick={() => setActiveStep(index)} sx={{ cursor: 'pointer' }}>
                <StepLabel>{step.name}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* Left Panel - Component Palette */}
        <Box sx={{ flex: '1 1 250px', maxWidth: { xs: '100%', md: '25%' } }}>
          <ComponentPalette onAddComponent={addStep} />
        </Box>

        {/* Center Panel - Workflow Canvas */}
        <Box sx={{ flex: '2 1 400px', maxWidth: { xs: '100%', md: '50%' } }}>
          <Paper sx={{ p: 2 }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Natural Language Input */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
              <TextField
                fullWidth
                label="Describe your workflow in natural language..."
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleNLSubmit()}
                placeholder="e.g., Create a blood sample analysis workflow with collection, testing, and reporting steps"
                disabled={isLoading}
              />
              <Button 
                variant="contained" 
                onClick={handleNLSubmit} 
                disabled={isLoading || !nlInput.trim()}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
              >
                {isLoading ? '' : 'AI'}
              </Button>
            </Box>

            {/* Drag and Drop Steps */}
            <Typography variant="subtitle1" gutterBottom>
              Workflow Steps ({steps.length})
            </Typography>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <Box sx={{ minHeight: 200 }}>
                  {steps.length === 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        color: 'text.secondary',
                        borderStyle: 'dashed',
                      }}
                    >
                      Drag components here or use natural language to add steps
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
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={handleSaveWorkflow}>Save Draft</Button>
              <Button variant="contained" startIcon={<PlayArrowIcon />} disabled={steps.length === 0}>
                Activate Workflow
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* Right Panel - Properties */}
        <Box sx={{ flex: '1 1 250px', maxWidth: { xs: '100%', md: '25%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Properties
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a step to edit its properties
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkflowBuilder;
