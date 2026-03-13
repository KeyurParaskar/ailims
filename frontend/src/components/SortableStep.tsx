import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
} from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import { WorkflowStep } from './WorkflowBuilder';

interface SortableStepProps {
  step: WorkflowStep;
  onUpdate: (id: string, updates: Partial<WorkflowStep>) => void;
  onRemove: (id: string) => void;
}

const stepTypeColors: Record<string, string> = {
  collection: '#4caf50',
  analysis: '#2196f3',
  review: '#ff9800',
  notification: '#9c27b0',
  custom: '#607d8b',
};

const SortableStep: React.FC<SortableStepProps> = ({ step, onUpdate, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1,
        borderLeft: `4px solid ${stepTypeColors[step.type] || stepTypeColors.custom}`,
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mt: 1 }}>
        <DragIndicatorIcon color="action" />
      </Box>
      
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <TextField
            size="small"
            value={step.name}
            onChange={(e) => onUpdate(step.id, { name: e.target.value })}
            variant="standard"
            sx={{ flex: 1 }}
          />
          <Chip
            label={step.type}
            size="small"
            sx={{
              bgcolor: stepTypeColors[step.type] || stepTypeColors.custom,
              color: 'white',
            }}
          />
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Add description..."
          value={step.description}
          onChange={(e) => onUpdate(step.id, { description: e.target.value })}
          multiline
          maxRows={2}
        />
      </Box>

      <IconButton onClick={() => onRemove(step.id)} size="small" color="error">
        <DeleteIcon />
      </IconButton>
    </Paper>
  );
};

export default SortableStep;
