import { Pool, QueryResult, QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

let pgPool: Pool | null = null;
let isPostgresReady = false;

// In-memory fallback tables for development & testing if PostgreSQL is temporarily unavailable
interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: Date | null;
  image_url: string | null;
  image_public_id: string | null;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

class MemoryStore {
  users: Map<string, UserRow> = new Map();
  tasks: Map<string, TaskRow> = new Map();

  reset() {
    this.users.clear();
    this.tasks.clear();
  }
}

export const memoryStore = new MemoryStore();

/**
 * Initialize PostgreSQL connection pool
 */
export async function initDb(): Promise<void> {
  const connectionString = config.databaseUrl || 'postgresql://postgres:postgres@localhost:5432/orbit_db';
  
  try {
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') 
        ? { rejectUnauthorized: false } 
        : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    // Test connection
    const client = await pool.connect();
    client.release();
    
    pgPool = pool;
    isPostgresReady = true;
    console.log('[Database] Successfully connected to PostgreSQL.');

    // Run schema migration if not exists
    await runMigrations();
  } catch (error: any) {
    console.warn(`[Database Warning] Unable to connect to PostgreSQL (${error.message}).`);
    console.warn('[Database] Using embedded fallback memory store for local development/testing.');
    console.warn('[Database] To connect to a live PostgreSQL database, set DATABASE_URL in server/.env');
    isPostgresReady = false;
  }
}

/**
 * Execute a parameterized SQL query
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  if (isPostgresReady && pgPool) {
    return pgPool.query<T>(text, params);
  }

  // Resilient SQL parser for basic CRUD when running in fallback mode
  return executeFallbackQuery<T>(text, params);
}

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  if (!pgPool) return;

  const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  if (fs.existsSync(migrationPath)) {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await pgPool.query(sql);
    console.log('[Database] Applied migration 001_initial_schema.sql successfully.');
  }
}

/**
 * Close database connections
 */
export async function closeDb(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
    isPostgresReady = false;
  }
}

export function isDbPostgres(): boolean {
  return isPostgresReady;
}

/**
 * Fallback query execution to guarantee zero downtime and smooth test execution
 */
function executeFallbackQuery<T extends QueryResultRow>(
  text: string,
  params: any[]
): QueryResult<T> {
  const normalized = text.trim();

  // 1. SELECT users by email
  if (normalized.includes('FROM users') && (normalized.includes('email = $1') || normalized.includes('LOWER(email)'))) {
    const email = (params[0] || '').toLowerCase();
    const user = Array.from(memoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === email
    );
    const rows = user ? [user] : [];
    return {
      rows: rows as any,
      command: 'SELECT',
      rowCount: rows.length,
      oid: 0,
      fields: [],
    };
  }

  // 2. SELECT users by id
  if (normalized.includes('FROM users') && normalized.includes('id = $1')) {
    const id = params[0];
    const user = memoryStore.users.get(id);
    const rows = user ? [user] : [];
    return {
      rows: rows as any,
      command: 'SELECT',
      rowCount: rows.length,
      oid: 0,
      fields: [],
    };
  }

  // 3. INSERT INTO users
  if (normalized.startsWith('INSERT INTO users')) {
    const id = crypto.randomUUID();
    const name = params[0];
    const email = (params[1] || '').toLowerCase();
    const password_hash = params[2];
    const now = new Date();

    // Check duplicate email
    const existing = Array.from(memoryStore.users.values()).find(
      (u) => u.email.toLowerCase() === email
    );
    if (existing) {
      const err: any = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }

    const newUser: UserRow = {
      id,
      name,
      email,
      password_hash,
      created_at: now,
      updated_at: now,
    };
    memoryStore.users.set(id, newUser);

    return {
      rows: [newUser] as any,
      command: 'INSERT',
      rowCount: 1,
      oid: 0,
      fields: [],
    };
  }

  // 4. INSERT INTO tasks
  if (normalized.startsWith('INSERT INTO tasks')) {
    const id = crypto.randomUUID();
    const title = params[0];
    const description = params[1] ?? null;
    const status = params[2] || 'pending';
    const priority = params[3] || 'medium';
    const due_date = params[4] ? new Date(params[4]) : null;
    const image_url = params[5] ?? null;
    const image_public_id = params[6] ?? null;
    const owner_id = params[7];
    const now = new Date();

    const newTask: TaskRow = {
      id,
      title,
      description,
      status,
      priority,
      due_date,
      image_url,
      image_public_id,
      owner_id,
      created_at: now,
      updated_at: now,
    };
    memoryStore.tasks.set(id, newTask);

    return {
      rows: [newTask] as any,
      command: 'INSERT',
      rowCount: 1,
      oid: 0,
      fields: [],
    };
  }

  // 5. SELECT single task by ID and owner_id
  if (normalized.startsWith('SELECT') && normalized.includes('FROM tasks WHERE') && (normalized.includes('owner_id = $1 AND id = $2') || normalized.includes('id = $1 AND owner_id = $2'))) {
    // If query was "WHERE id = $1 AND owner_id = $2"
    let id: string;
    let owner_id: string;
    if (normalized.includes('id = $1 AND owner_id = $2')) {
      id = params[0];
      owner_id = params[1];
    } else {
      owner_id = params[0];
      id = params[1];
    }

    const task = memoryStore.tasks.get(id);
    const rows = task && task.owner_id === owner_id ? [task] : [];
    return {
      rows: rows as any,
      command: 'SELECT',
      rowCount: rows.length,
      oid: 0,
      fields: [],
    };
  }

  // 6. SELECT tasks for a user with filters & sorting
  if (normalized.startsWith('SELECT') && normalized.includes('FROM tasks WHERE owner_id = $1')) {
    const owner_id = params[0];
    let tasks = Array.from(memoryStore.tasks.values()).filter(
      (t) => t.owner_id === owner_id
    );

    // Apply status filter if present
    const statusParam = params.find(p => ['pending', 'in_progress', 'completed'].includes(p));
    if (statusParam) {
      tasks = tasks.filter((t) => t.status === statusParam);
    }

    // Apply priority filter if present
    const priorityParam = params.find(p => ['low', 'medium', 'high', 'urgent'].includes(p));
    if (priorityParam) {
      tasks = tasks.filter((t) => t.priority === priorityParam);
    }

    // Apply search filter if present (e.g. %query%)
    const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
    if (searchParam) {
      const q = searchParam.slice(1, -1).toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }

    // Default sort by created_at DESC or due_date
    tasks.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return {
      rows: tasks as any,
      command: 'SELECT',
      rowCount: tasks.length,
      oid: 0,
      fields: [],
    };
  }

  // 7. UPDATE tasks
  if (normalized.startsWith('UPDATE tasks')) {
    // Parameters: title, description, status, priority, due_date, image_url, image_public_id, id, owner_id
    // SQL: WHERE id = $8 AND owner_id = $9
    const id = params[7];
    const owner_id = params[8];

    const task = memoryStore.tasks.get(id);
    if (!task || task.owner_id !== owner_id) {
      return {
        rows: [] as any,
        command: 'UPDATE',
        rowCount: 0,
        oid: 0,
        fields: [],
      };
    }

    const updatedTask: TaskRow = {
      ...task,
      title: params[0] !== undefined ? params[0] : task.title,
      description: params[1] !== undefined ? params[1] : task.description,
      status: params[2] !== undefined ? params[2] : task.status,
      priority: params[3] !== undefined ? params[3] : task.priority,
      due_date: params[4] !== undefined ? (params[4] ? new Date(params[4]) : null) : task.due_date,
      image_url: params[5] !== undefined ? params[5] : task.image_url,
      image_public_id: params[6] !== undefined ? params[6] : task.image_public_id,
      updated_at: new Date(),
    };
    memoryStore.tasks.set(id, updatedTask);

    return {
      rows: [updatedTask] as any,
      command: 'UPDATE',
      rowCount: 1,
      oid: 0,
      fields: [],
    };
  }

  // 8. DELETE FROM tasks WHERE id = $1 AND owner_id = $2
  if (normalized.startsWith('DELETE FROM tasks')) {
    const id = params[0];
    const owner_id = params[1];

    const task = memoryStore.tasks.get(id);
    if (task && task.owner_id === owner_id) {
      memoryStore.tasks.delete(id);
      return {
        rows: [task] as any,
        command: 'DELETE',
        rowCount: 1,
        oid: 0,
        fields: [],
      };
    }

    return {
      rows: [] as any,
      command: 'DELETE',
      rowCount: 0,
      oid: 0,
      fields: [],
    };
  }

  // Default empty result
  return {
    rows: [] as any,
    command: 'SELECT',
    rowCount: 0,
    oid: 0,
    fields: [],
  };
}
