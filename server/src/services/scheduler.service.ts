import cron, { ScheduledTask } from 'node-cron';
import { query } from '../db/pool';
import { sendDeadlineReminderEmail } from './email.service';

let activeCronJob: ScheduledTask | null = null;

/**
 * Audit upcoming deadlines and dispatch reminder emails for eligible tasks.
 * Enforces strict deduplication: a task is only notified once per deadline window
 * until the due date is modified.
 */
export async function processUpcomingDeadlines(): Promise<number> {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Query non-completed tasks due in the next 24 hours that haven't received a reminder
    const res = await query(
      `SELECT t.id, t.title, t.due_date, t.priority, t.status, u.name as user_name, u.email as user_email
       FROM tasks t
       JOIN users u ON t.owner_id = u.id
       WHERE t.status != 'completed'
         AND t.due_date IS NOT NULL
         AND t.due_date >= $1
         AND t.due_date <= $2
         AND t.reminder_sent_at IS NULL`,
      [now, in24Hours]
    );

    let sentCount = 0;
    for (const row of res.rows) {
      try {
        const result = await sendDeadlineReminderEmail(
          row.user_email,
          row.user_name,
          row.title,
          new Date(row.due_date),
          row.id,
          row.priority || 'medium',
          row.status || 'pending'
        );

        if (result.success) {
          // Record delivery timestamp in DB for strict deduplication
          await query('UPDATE tasks SET reminder_sent_at = $1 WHERE id = $2', [new Date(), row.id]);
          sentCount++;
        }
      } catch (sendErr: any) {
        console.error(`[Scheduler Error] Failed to send reminder for task "${row.title}" (${row.id}):`, sendErr.message);
      }
    }

    if (res.rows.length > 0) {
      console.log(`[Scheduler] Processed deadline reminders: ${sentCount}/${res.rows.length} delivered.`);
    }

    return sentCount;
  } catch (err: any) {
    console.error('[Scheduler Error] Error processing upcoming deadlines:', err.message);
    return 0;
  }
}

/**
 * Initialize background cron scheduler.
 * Runs once every hour at minute 0.
 * Safely cancels previous instance if invoked multiple times (e.g. hot-reloading).
 */
export function initScheduler(): void {
  if (activeCronJob) {
    activeCronJob.stop();
    activeCronJob = null;
  }

  // Schedule hourly check at minute 0
  activeCronJob = cron.schedule('0 * * * *', () => {
    console.log('[Scheduler] Executing scheduled hourly task deadline audit...');
    processUpcomingDeadlines().catch((err) => {
      console.error('[Scheduler Error] Cron run encountered error:', err.message);
    });
  });

  console.log('[Scheduler] Deadline reminder cron service registered (runs hourly).');
}

/**
 * Stop background scheduler on graceful shutdown
 */
export function stopScheduler(): void {
  if (activeCronJob) {
    activeCronJob.stop();
    activeCronJob = null;
    console.log('[Scheduler] Deadline reminder cron service stopped.');
  }
}
