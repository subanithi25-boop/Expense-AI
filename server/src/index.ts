import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './db';
import { seedDatabase } from './seed';
import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';
import reportRoutes from './routes/reportRoutes';
import approvalRoutes from './routes/approvalRoutes';
import budgetRoutes from './routes/budgetRoutes';
import mileageRoutes from './routes/mileageRoutes';
import policyRoutes from './routes/policyRoutes';
import integrationRoutes from './routes/integrationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { authenticate, AuthenticatedRequest } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Initialize and auto-seed if empty
if (db.users.length === 0 || db.expenses.length === 0) {
  console.log('[SpendWise AI] Initializing empty database with seed data...');
  seedDatabase();
}

// Connect to MongoDB Atlas if URI is provided
db.connectMongo();

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    product: 'SpendWise AI',
    version: '1.0.0',
    mode: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Seed reset endpoint for testing
app.post('/api/seed/reset', (req, res) => {
  seedDatabase();
  res.json({ success: true, message: 'Database reset to initial state' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/mileage', mileageRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Audit logs route
app.get('/api/audit-logs', authenticate, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'admin' && user.role !== 'finance' && user.role !== 'manager') {
    return res.status(403).json({ error: 'Audit logs restricted to management' });
  }
  res.json({ auditLogs: db.auditLogs.slice(0, 100) });
});

// Production Frontend Static Assets (if client is built)
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SpendWise AI Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` SpendWise AI Backend API Server running on port ${PORT}`);
  console.log(` Ready to process expenses, receipts, and workflows`);
  console.log(`====================================================`);
});
