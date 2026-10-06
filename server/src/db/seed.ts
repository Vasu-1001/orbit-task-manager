import bcrypt from 'bcryptjs';
import { query, initDb, closeDb } from './pool';

async function seed() {
  await initDb();
  console.log('[Seed] Seeding database with initial demo data...');

  try {
    // Check if demo user already exists
    const existing = await query('SELECT * FROM users WHERE email = $1', ['demo@orbit.app']);
    let userId: string;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`[Seed] Demo user already exists (id: ${userId}).`);
    } else {
      const passwordHash = await bcrypt.hash('DemoPassword123!', 12);
      const userRes = await query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        ['Demo User', 'demo@orbit.app', passwordHash]
      );
      userId = userRes.rows[0].id;
      console.log(`[Seed] Created demo user: demo@orbit.app / DemoPassword123! (id: ${userId})`);
    }

    // Seed tasks if empty
    const tasksRes = await query('SELECT * FROM tasks WHERE owner_id = $1', [userId]);
    if (tasksRes.rows.length === 0) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const demoTasks = [
        {
          title: 'Design System Polish: Refine Contrast & Tokens',
          description: 'Harmonize slate neutrals, ensure accessible contrast ratios across light/dark themes, and audit focus rings.',
          status: 'completed',
          priority: 'high',
          due_date: yesterday,
        },
        {
          title: 'Implement Multi-User Isolation Tests',
          description: 'Verify cross-tenant security: Ensure User A cannot view, mutate, or delete User B tasks.',
          status: 'in_progress',
          priority: 'urgent',
          due_date: tomorrow,
        },
        {
          title: 'Configure Cloudinary Secure Asset Delivery',
          description: 'Upload high-resolution task attachments with responsive transformations and clean up deleted assets.',
          status: 'pending',
          priority: 'high',
          due_date: tomorrow,
        },
        {
          title: 'Ship Deadline Radar & Focus Mode UI',
          description: 'Deliver the distraction-reduced Focus Mode and time-horizon visual clustering for upcoming deadlines.',
          status: 'pending',
          priority: 'medium',
          due_date: nextWeek,
        },
      ];

      for (const t of demoTasks) {
        await query(
          `INSERT INTO tasks (title, description, status, priority, due_date, owner_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [t.title, t.description, t.status, t.priority, t.due_date, userId]
        );
      }
      console.log(`[Seed] Seeded ${demoTasks.length} demo tasks for demo user.`);
    } else {
      console.log(`[Seed] Demo user already has ${tasksRes.rows.length} tasks.`);
    }

    console.log('[Seed] Seeding completed.');
  } catch (error: any) {
    console.error('[Seed Error]', error);
  } finally {
    await closeDb();
  }
}

seed();
