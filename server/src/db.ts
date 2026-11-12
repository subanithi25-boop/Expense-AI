import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  User,
  Expense,
  ExpenseReport,
  DepartmentBudget,
  CorporatePolicy,
  MileageClaim,
  NotificationItem,
  AuditLog,
  IntegrationStatus
} from './types';

export interface DatabaseSchema {
  users: User[];
  expenses: Expense[];
  reports: ExpenseReport[];
  budgets: DepartmentBudget[];
  policies: CorporatePolicy[];
  mileageClaims: MileageClaim[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  integrations: IntegrationStatus[];
}

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseStore {
  private data: DatabaseSchema = {
    users: [],
    expenses: [],
    reports: [],
    budgets: [],
    policies: [],
    mileageClaims: [],
    notifications: [],
    auditLogs: [],
    integrations: []
  };

  private isConnectedToMongo = false;

  constructor() {
    this.ensureDataDirectory();
    this.loadFromDisk();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const uploadsDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Migrate legacy users without passwordHash or with dummy hashes
        let modified = false;
        if (Array.isArray(this.data.users)) {
          const defaultHash = '$2a$10$Z/ZVsGrvnak0M8DcFSxmourrInl9RbaqqwMThKC2Y8zs5xLpNe/ey'; // genuine bcrypt hash for password123
          for (const u of this.data.users) {
            if (!u.passwordHash || u.passwordHash.length < 50 || u.passwordHash.includes('wT8m9PqQ')) {
              u.passwordHash = defaultHash;
              modified = true;
            }
          }
        }
        if (modified) {
          this.saveToDisk();
        }
      }
    } catch (err) {
      console.warn('[DB] Could not load db.json, using fresh in-memory data store:', err);
    }
  }

  public saveToDisk() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Failed to save db.json to disk:', err);
    }
  }

  public async connectMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('[DB] No MONGODB_URI provided in environment. Utilizing robust persistent store at server/data/db.json.');
      return;
    }
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      this.isConnectedToMongo = true;
      console.log('[DB] Connected successfully to MongoDB Atlas!');
    } catch (err: any) {
      console.warn(`[DB] MongoDB Atlas connection notice (${err.message}). Seamlessly running via persistent local JSON store.`);
      this.isConnectedToMongo = false;
    }
  }

  // Accessors
  get users(): User[] { return this.data.users; }
  set users(val: User[]) { this.data.users = val; this.saveToDisk(); }

  get expenses(): Expense[] { return this.data.expenses; }
  set expenses(val: Expense[]) { this.data.expenses = val; this.saveToDisk(); }

  get reports(): ExpenseReport[] { return this.data.reports; }
  set reports(val: ExpenseReport[]) { this.data.reports = val; this.saveToDisk(); }

  get budgets(): DepartmentBudget[] { return this.data.budgets; }
  set budgets(val: DepartmentBudget[]) { this.data.budgets = val; this.saveToDisk(); }

  get policies(): CorporatePolicy[] { return this.data.policies; }
  set policies(val: CorporatePolicy[]) { this.data.policies = val; this.saveToDisk(); }

  get mileageClaims(): MileageClaim[] { return this.data.mileageClaims; }
  set mileageClaims(val: MileageClaim[]) { this.data.mileageClaims = val; this.saveToDisk(); }

  get notifications(): NotificationItem[] {
    if (!Array.isArray(this.data.notifications)) {
      this.data.notifications = [];
    }
    return this.data.notifications;
  }
  set notifications(val: NotificationItem[]) { this.data.notifications = Array.isArray(val) ? val : []; this.saveToDisk(); }

  get auditLogs(): AuditLog[] { return this.data.auditLogs; }
  set auditLogs(val: AuditLog[]) { this.data.auditLogs = val; this.saveToDisk(); }

  get integrations(): IntegrationStatus[] { return this.data.integrations; }
  set integrations(val: IntegrationStatus[]) { this.data.integrations = val; this.saveToDisk(); }

  public resetAll(initial: DatabaseSchema) {
    // Preserve any registered user accounts outside the default seed users
    const seedUserIds = new Set(initial.users.map(u => u.id));
    const registeredUsers = (this.data.users || []).filter(u => !seedUserIds.has(u.id));

    this.data = {
      ...initial,
      users: [...initial.users, ...registeredUsers]
    };
    this.saveToDisk();
  }
}

export const db = new DatabaseStore();
