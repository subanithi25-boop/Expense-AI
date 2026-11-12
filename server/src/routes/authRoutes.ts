import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { JWT_SECRET, authenticate, AuthenticatedRequest } from '../middleware/authMiddleware';
import { authRateLimiter } from '../middleware/rateLimiter';
import { validateEmail, validatePasswordStrength } from '../utils/validation';
import { AuditService } from '../services/auditService';
import { User, UserRole } from '../types';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticates user via registered email and password.
 * Rate-limited to prevent brute-force attacks.
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Mandatory fields check
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  // 2. Email format validation
  if (!validateEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password cannot be empty.' });
  }

  // 3. User lookup by case-insensitive email
  const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);

  // 4. Secure bcrypt comparison (generic error to prevent account enumeration)
  let isValidPassword = false;
  if (user && user.passwordHash) {
    try {
      isValidPassword = bcrypt.compareSync(password, user.passwordHash);
    } catch {
      isValidPassword = false;
    }
  }

  if (!user || !isValidPassword) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // 5. Generate secure JWT token
  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 6. Audit trail logging
  AuditService.log({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'user',
    entityId: user.id,
    details: `User signed in successfully: ${user.email} (${user.role.toUpperCase()})`
  });

  // 7. Return sanitized response (never expose passwordHash or secrets)
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle
    }
  });
});

/**
 * POST /api/auth/register
 * Creates a new user account with strict email and password validation.
 * Rate-limited to prevent automated bulk registrations.
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    confirmPassword,
    role = 'employee',
    department = 'Engineering',
    jobTitle = 'Team Member'
  } = req.body;

  // 1. Mandatory fields check
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  // 2. Backend email format validation
  if (!validateEmail(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // 3. Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({
      error: passwordCheck.errors.join(' ')
    });
  }

  // 4. Password confirmation check (if confirmPassword provided)
  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ error: 'Password and Confirm Password must match.' });
  }

  // 5. Prevent duplicate accounts with case-insensitive email comparison
  const existingUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(409).json({
      error: 'An account with this email address already exists. Please sign in.'
    });
  }

  // 6. Secure password hashing with bcrypt (salt factor 10)
  const passwordHash = bcrypt.hashSync(password, 10);

  // 7. Create new user record
  const newUser: User = {
    id: uuidv4(),
    email: cleanEmail,
    name: cleanName,
    passwordHash,
    role: (role as UserRole) || 'employee',
    department: department || 'Engineering',
    jobTitle: jobTitle || 'Team Member',
    organizationId: 'org-spendwise-01',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
    createdAt: new Date().toISOString()
  };

  const users = db.users;
  users.push(newUser);
  db.users = users;

  // 8. Generate secure JWT token
  const token = jwt.sign(
    { id: newUser.id, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 9. Audit trail logging
  AuditService.log({
    actorId: newUser.id,
    actorName: newUser.name,
    actorRole: newUser.role,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: newUser.id,
    details: `New account registered: ${newUser.name} (${newUser.email}) - Role: ${newUser.role}`
  });

  // 10. Return sanitized response
  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      avatarUrl: newUser.avatarUrl,
      jobTitle: newUser.jobTitle
    }
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user profile.
 */
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
  }

  return res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      avatarUrl: req.user.avatarUrl,
      jobTitle: req.user.jobTitle
    }
  });
});

export default router;
