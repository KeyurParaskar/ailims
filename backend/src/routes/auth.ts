import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { generateToken, authenticateToken, requireRole, ROLES, AuthRequest } from '../middleware/auth';

const router = Router();

// In-memory user storage for demo (replace with database)
interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
}

let users: User[] = [
  {
    id: 1,
    email: 'admin@ailims.com',
    password: bcrypt.hashSync('admin123', 10),
    firstName: 'Admin',
    lastName: 'User',
    role: ROLES.ADMIN,
    createdAt: new Date(),
  },
  {
    id: 2,
    email: 'manager@ailims.com',
    password: bcrypt.hashSync('manager123', 10),
    firstName: 'Lab',
    lastName: 'Manager',
    role: ROLES.LAB_MANAGER,
    createdAt: new Date(),
  },
  {
    id: 3,
    email: 'tech@ailims.com',
    password: bcrypt.hashSync('tech123', 10),
    firstName: 'Lab',
    lastName: 'Technician',
    role: ROLES.LAB_TECH,
    createdAt: new Date(),
  },
];

let nextUserId = 4;

// Register new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      id: nextUserId++,
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || ROLES.LAB_TECH,
      createdAt: new Date(),
    };

    users.push(newUser);

    // Generate token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = users.find((u) => u.id === req.user?.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
});

// Get all users (admin only)
router.get(
  '/users',
  authenticateToken,
  requireRole(ROLES.ADMIN, ROLES.LAB_MANAGER),
  (req: AuthRequest, res: Response) => {
    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      createdAt: u.createdAt,
    }));

    res.json({ users: safeUsers });
  }
);

// Update user role (admin only)
router.put(
  '/users/:id/role',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id as string);
    const { role } = req.body;

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!Object.values(ROLES).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    users[userIndex].role = role;

    res.json({
      success: true,
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        role: users[userIndex].role,
      },
    });
  }
);

// Delete user (admin only)
router.delete(
  '/users/:id',
  authenticateToken,
  requireRole(ROLES.ADMIN),
  (req: AuthRequest, res: Response) => {
    const userId = parseInt(req.params.id as string);

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (req.user?.userId === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    users.splice(userIndex, 1);
    res.json({ success: true, message: 'User deleted' });
  }
);

export default router;
