import { Router, Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Mock lab equipment database
interface LabEquipment {
  id: string;
  name: string;
  type: 'analyzer' | 'centrifuge' | 'incubator' | 'pcr_machine' | 'microscope' | 'refrigerator' | 'freezer';
  model: string;
  manufacturer: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  location: string;
  lastCalibration: string;
  nextCalibration: string;
  currentJob?: {
    sampleId: string;
    startTime: string;
    estimatedCompletion: string;
    progress: number;
  };
  metrics: {
    temperature?: number;
    humidity?: number;
    rpm?: number;
    pressure?: number;
  };
}

const equipment: LabEquipment[] = [
  {
    id: 'EQ-001',
    name: 'Hematology Analyzer',
    type: 'analyzer',
    model: 'XN-1000',
    manufacturer: 'Sysmex',
    status: 'online',
    location: 'Lab Room A-101',
    lastCalibration: '2026-03-01',
    nextCalibration: '2026-04-01',
    currentJob: {
      sampleId: 'SMP-2026-0001',
      startTime: new Date(Date.now() - 300000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 180000).toISOString(),
      progress: 65,
    },
    metrics: { temperature: 22.5 },
  },
  {
    id: 'EQ-002',
    name: 'Chemistry Analyzer',
    type: 'analyzer',
    model: 'AU5800',
    manufacturer: 'Beckman Coulter',
    status: 'online',
    location: 'Lab Room A-102',
    lastCalibration: '2026-03-10',
    nextCalibration: '2026-04-10',
    metrics: { temperature: 23.0 },
  },
  {
    id: 'EQ-003',
    name: 'High-Speed Centrifuge',
    type: 'centrifuge',
    model: 'Allegra X-30R',
    manufacturer: 'Beckman Coulter',
    status: 'online',
    location: 'Lab Room A-103',
    lastCalibration: '2026-02-15',
    nextCalibration: '2026-05-15',
    currentJob: {
      sampleId: 'SMP-2026-0015',
      startTime: new Date(Date.now() - 120000).toISOString(),
      estimatedCompletion: new Date(Date.now() + 480000).toISOString(),
      progress: 20,
    },
    metrics: { rpm: 4000, temperature: 4.0 },
  },
  {
    id: 'EQ-004',
    name: 'CO2 Incubator',
    type: 'incubator',
    model: 'MCO-230AIC',
    manufacturer: 'Panasonic',
    status: 'online',
    location: 'Lab Room B-201',
    lastCalibration: '2026-02-01',
    nextCalibration: '2026-05-01',
    metrics: { temperature: 37.0, humidity: 95, pressure: 1.01 },
  },
  {
    id: 'EQ-005',
    name: 'Real-Time PCR System',
    type: 'pcr_machine',
    model: 'QuantStudio 5',
    manufacturer: 'Thermo Fisher',
    status: 'maintenance',
    location: 'Lab Room B-202',
    lastCalibration: '2026-01-15',
    nextCalibration: '2026-04-15',
    metrics: {},
  },
  {
    id: 'EQ-006',
    name: 'Ultra-Low Freezer',
    type: 'freezer',
    model: 'TSX Series',
    manufacturer: 'Thermo Fisher',
    status: 'online',
    location: 'Storage Room C-301',
    lastCalibration: '2026-03-05',
    nextCalibration: '2026-06-05',
    metrics: { temperature: -80.2 },
  },
  {
    id: 'EQ-007',
    name: 'Sample Refrigerator',
    type: 'refrigerator',
    model: 'TSG Series',
    manufacturer: 'Thermo Fisher',
    status: 'error',
    location: 'Storage Room C-302',
    lastCalibration: '2026-02-20',
    nextCalibration: '2026-05-20',
    metrics: { temperature: 8.5 }, // Error: temp too high
  },
];

// Get all equipment
router.get('/', (req: Request, res: Response) => {
  const { status, type, location } = req.query;

  let filtered = [...equipment];

  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }
  if (type) {
    filtered = filtered.filter((e) => e.type === type);
  }
  if (location && typeof location === 'string') {
    filtered = filtered.filter((e) =>
      e.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  res.json({
    equipment: filtered,
    summary: {
      total: equipment.length,
      online: equipment.filter((e) => e.status === 'online').length,
      offline: equipment.filter((e) => e.status === 'offline').length,
      maintenance: equipment.filter((e) => e.status === 'maintenance').length,
      error: equipment.filter((e) => e.status === 'error').length,
    },
  });
});

// Get equipment by ID
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const eq = equipment.find((e) => e.id === id);

  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  res.json(eq);
});

// Get equipment status/metrics (real-time simulation)
router.get('/:id/status', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const eq = equipment.find((e) => e.id === id);

  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  // Simulate slight metric variations
  const metrics = { ...eq.metrics };
  if (metrics.temperature !== undefined) {
    metrics.temperature += (Math.random() - 0.5) * 0.2;
    metrics.temperature = Math.round(metrics.temperature * 10) / 10;
  }
  if (metrics.humidity !== undefined) {
    metrics.humidity += (Math.random() - 0.5) * 1;
    metrics.humidity = Math.round(metrics.humidity);
  }

  // Update job progress if running
  let currentJob = eq.currentJob;
  if (currentJob) {
    const start = new Date(currentJob.startTime).getTime();
    const end = new Date(currentJob.estimatedCompletion).getTime();
    const now = Date.now();
    const progress = Math.min(100, Math.round(((now - start) / (end - start)) * 100));
    currentJob = { ...currentJob, progress };
  }

  res.json({
    id: eq.id,
    name: eq.name,
    status: eq.status,
    metrics,
    currentJob,
    timestamp: new Date().toISOString(),
  });
});

// Send command to equipment (mock)
router.post('/:id/command', authenticateToken, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { command, parameters } = req.body;

  const eq = equipment.find((e) => e.id === id);
  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  if (eq.status !== 'online') {
    return res.status(400).json({
      error: `Equipment is ${eq.status}. Cannot accept commands.`,
    });
  }

  const validCommands = ['start', 'stop', 'pause', 'resume', 'calibrate', 'reset'];
  if (!validCommands.includes(command)) {
    return res.status(400).json({
      error: `Invalid command. Valid commands: ${validCommands.join(', ')}`,
    });
  }

  // Mock command execution
  res.json({
    success: true,
    equipmentId: id,
    command,
    parameters,
    message: `Command '${command}' sent to ${eq.name}`,
    timestamp: new Date().toISOString(),
  });
});

// Start a job on equipment
router.post('/:id/run', authenticateToken, (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { sampleId, protocol, estimatedMinutes } = req.body;

  const eqIndex = equipment.findIndex((e) => e.id === id);
  if (eqIndex === -1) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  const eq = equipment[eqIndex];

  if (eq.status !== 'online') {
    return res.status(400).json({
      error: `Equipment is ${eq.status}. Cannot start job.`,
    });
  }

  if (eq.currentJob) {
    return res.status(400).json({
      error: 'Equipment is already running a job',
      currentJob: eq.currentJob,
    });
  }

  const job = {
    sampleId: sampleId || `SMP-${Date.now()}`,
    startTime: new Date().toISOString(),
    estimatedCompletion: new Date(Date.now() + (estimatedMinutes || 10) * 60000).toISOString(),
    progress: 0,
  };

  equipment[eqIndex].currentJob = job;

  res.json({
    success: true,
    equipmentId: id,
    job,
    message: `Job started on ${eq.name}`,
  });
});

// Get equipment alerts
router.get('/alerts/all', (req: Request, res: Response) => {
  const alerts: Array<{
    equipmentId: string;
    equipmentName: string;
    type: 'calibration_due' | 'temperature_alert' | 'error' | 'maintenance';
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }> = [];

  const now = new Date();

  equipment.forEach((eq) => {
    // Check calibration
    const nextCal = new Date(eq.nextCalibration);
    const daysUntilCal = (nextCal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilCal < 0) {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'calibration_due',
        severity: 'critical',
        message: `Calibration overdue by ${Math.abs(Math.round(daysUntilCal))} days`,
      });
    } else if (daysUntilCal < 7) {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'calibration_due',
        severity: 'warning',
        message: `Calibration due in ${Math.round(daysUntilCal)} days`,
      });
    }

    // Check temperature alerts
    if (eq.type === 'refrigerator' && eq.metrics.temperature && eq.metrics.temperature > 8) {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'temperature_alert',
        severity: 'critical',
        message: `Temperature too high: ${eq.metrics.temperature}°C (should be 2-8°C)`,
      });
    }
    if (eq.type === 'freezer' && eq.metrics.temperature && eq.metrics.temperature > -70) {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'temperature_alert',
        severity: 'warning',
        message: `Temperature elevated: ${eq.metrics.temperature}°C`,
      });
    }

    // Check status
    if (eq.status === 'error') {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'error',
        severity: 'critical',
        message: 'Equipment reporting error status',
      });
    }
    if (eq.status === 'maintenance') {
      alerts.push({
        equipmentId: eq.id,
        equipmentName: eq.name,
        type: 'maintenance',
        severity: 'info',
        message: 'Equipment under maintenance',
      });
    }
  });

  res.json({
    alerts,
    summary: {
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
    },
  });
});

export default router;
