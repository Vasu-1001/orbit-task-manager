import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { config } from '../config/env';

async function migrate() {
  const connectionString = config.databaseUrl || 'postgresql://postgres:postgres@localhost:5432/orbit_db';
  console.log(`[Migrate] Running migrations against: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') 
      ? { rejectUnauthorized: false } 
      : undefined
  });

  try {
    const client = await pool.connect();
    console.log('[Migrate] Connected to PostgreSQL.');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      console.log(`[Migrate] Executing ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`[Migrate] Migration ${file} completed successfully.`);
    }
    
    client.release();
  } catch (error: any) {
    console.error('[Migrate Error]', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
