import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Collapse,
  CircularProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getAuditLogs } from '../services/api';

interface AuditEntry {
  id: number;
  userId?: number;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
  metadata?: Record<string, any>;
}

const actionColors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  login: 'default',
  logout: 'default',
  view: 'default',
};

const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getAuditLogs(filters);
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      // Mock data for demo
      setLogs([
        {
          id: 1,
          userId: 1,
          userEmail: 'admin@ailims.com',
          action: 'create',
          entityType: 'workflow',
          entityId: 'wf-1',
          timestamp: new Date().toISOString(),
          newValues: { name: 'Blood Analysis Workflow' },
        },
        {
          id: 2,
          userId: 2,
          userEmail: 'tech@ailims.com',
          action: 'update',
          entityType: 'sample',
          entityId: 'smp-1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          oldValues: { status: 'pending' },
          newValues: { status: 'in_progress' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    const lowerAction = action.toLowerCase();
    for (const key of Object.keys(actionColors)) {
      if (lowerAction.includes(key)) {
        return actionColors[key];
      }
    }
    return 'default';
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Audit Trail</Typography>
        <IconButton onClick={fetchLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          size="small"
          label="Entity Type"
          value={filters.entityType}
          onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="workflow">Workflow</MenuItem>
          <MenuItem value="sample">Sample</MenuItem>
          <MenuItem value="user">User</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Action"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="create">Create</MenuItem>
          <MenuItem value="update">Update</MenuItem>
          <MenuItem value="delete">Delete</MenuItem>
        </TextField>
        <Button variant="outlined" size="small" onClick={fetchLogs}>
          Apply Filters
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Entity ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <TableRow
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell>{log.userEmail || 'System'}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={getActionColor(log.action)}
                      />
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>{log.entityId || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0 }}>
                      <Collapse in={expandedRow === log.id}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          {log.oldValues && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="error">
                                Old Values:
                              </Typography>
                              <pre style={{ margin: 0, fontSize: 12 }}>
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </Box>
                          )}
                          {log.newValues && (
                            <Box>
                              <Typography variant="caption" color="success.main">
                                New Values:
                              </Typography>
                              <pre style={{ margin: 0, fontSize: 12 }}>
                                {JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </Box>
                          )}
                          {log.metadata && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Metadata:
                              </Typography>
                              <pre style={{ margin: 0, fontSize: 12 }}>
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">No audit logs found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default AuditTrail;
