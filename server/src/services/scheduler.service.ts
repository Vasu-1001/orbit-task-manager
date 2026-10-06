import cron from 'node-cron';
import { query } from '../db/pool';
import { sendDeadlineReminderEmail } from './email.service';

/**
 * Check upcoming deadlines and send reminder emails
 */
export async function processUpcomingDeadlines(): Promise<number> {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find non-completed tasks due within next 24 hours
    const res = await query(
      `SELECT t.id, t.title, t.due_date, u.name as user_name, u.email as user_email
       FROM tasks t
       JOIN users u ON t.owner_id = u.id
       WHERE t.status != 'completed'
         AND t.due_date IS NOT NULL
         AND t.due_date >= $1
         AND t.due_date <= $2`,
      [now, in24Hours]
    );

    let sentCount = 0;
    for (const row of res.rows) {
      const success = await sendDeadlineReminderEmail(
        row.user_email,
        row.user_name,
        row.title,
        new Date(row.due_date),
        row.id
      );
      if (success) sentCount++;
    }

    console.log(`[Scheduler] Processed deadline reminders: ${sentCount}/${res.rows.length} delivered.`);
    return sentCount;
  } catch (err: any) {
    console.error('[Scheduler Error] Error processing upcoming deadlines:', err.message);
    return 0;
  }
}

/**
 * Initialize background cron scheduler
 */
export function initScheduler(): void {
  // Run once every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('[Scheduler] Executing scheduled hourly task deadline audit...');
    processUpcomingDeadlines();
  });

  console.log('[Scheduler] Deadline reminder cron service registered (runs hourly).');
}
