import nodemailer from 'nodemailer';
import { config } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.email.isConfigured) {
      transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
      console.log('[Email] Configured standard SMTP transporter.');
    } else {
      // JSON / Mock transport for development and testing
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      console.log('[Email] Running in simulated/mock mode (configure EMAIL_USER & EMAIL_PASS in .env for live delivery).');
    }
  }
  return transporter;
}

/**
 * Responsive HTML Template: Welcome Email
 */
export function getWelcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ORBIT</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .card { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 36px 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .logo { display: inline-flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; color: #818cf8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; line-height: 1.3; }
    p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; margin-top: 12px; margin-bottom: 24px; }
    .features { background: #0f172a; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #334155; }
    .feature-item { font-size: 14px; color: #94a3b8; margin: 8px 0; }
    .feature-item strong { color: #e2e8f0; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">⚡ ORBIT — Personal Work OS</div>
    <h1>Welcome aboard, ${name}!</h1>
    <p>Your workspace is ready. ORBIT is designed to help you execute with surgical clarity, track deadlines effortlessly, and maintain deep focus.</p>
    
    <div class="features">
      <div class="feature-item">🎯 <strong>Focus Mode:</strong> Zero-distraction task execution.</div>
      <div class="feature-item">📡 <strong>Deadline Radar:</strong> Visual grouping across upcoming time horizons.</div>
      <div class="feature-item">📊 <strong>Personal Work Insights:</strong> Real-time completion statistics and velocity.</div>
      <div class="feature-item">🖼️ <strong>Cloudinary Attachments:</strong> High-res task previews with automatic optimization.</div>
    </div>

    <a href="${config.clientUrl}" class="btn">Launch Your Workspace</a>

    <p style="font-size: 13px; color: #94a3b8;">If you did not sign up for this account, you can safely ignore this email.</p>
    <div class="footer">© 2026 ORBIT Personal Work OS. All rights reserved.</div>
  </div>
</body>
</html>
  `;
}

/**
 * Responsive HTML Template: Task Deadline Reminder
 */
export function getDeadlineReminderTemplate(userName: string, taskTitle: string, dueDateFormatted: string, taskId: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Deadline Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
    .card { max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 36px 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .badge { display: inline-block; background-color: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin-bottom: 18px; }
    .task-box { background: #0f172a; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px 20px; margin: 20px 0; border: 1px solid #334155; }
    .task-title { font-size: 17px; font-weight: 600; color: #f8fafc; margin-bottom: 6px; }
    .task-due { font-size: 13px; color: #fbbf24; font-weight: 500; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 11px 24px; border-radius: 8px; margin-top: 12px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">⏰ Upcoming Deadline Reminder</div>
    <h1>Hi ${userName}, you have a deadline approaching</h1>
    <p>A priority task is scheduled for completion within the next 24 hours:</p>
    
    <div class="task-box">
      <div class="task-title">${taskTitle}</div>
      <div class="task-due">Due: ${dueDateFormatted}</div>
    </div>

    <a href="${config.clientUrl}/tasks" class="btn">View Task in Orbit</a>

    <div class="footer">Sent automatically by ORBIT Personal Work OS.</div>
  </div>
</body>
</html>
  `;
}

/**
 * Dispatch Welcome Email
 */
export async function sendWelcomeEmail(toEmail: string, name: string): Promise<boolean> {
  const mailer = getTransporter();
  const html = getWelcomeEmailTemplate(name);

  try {
    const info = await mailer.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: 'Welcome to ORBIT — Personal Work OS',
      html,
    });
    console.log(`[Email] Welcome email sent to ${toEmail} (Message ID: ${info.messageId || 'mock'})`);
    return true;
  } catch (err: any) {
    console.warn(`[Email Error] Failed to send welcome email to ${toEmail}: ${err.message}`);
    return false;
  }
}

/**
 * Dispatch Task Deadline Reminder Email
 */
export async function sendDeadlineReminderEmail(
  toEmail: string,
  userName: string,
  taskTitle: string,
  dueDate: Date,
  taskId: string
): Promise<boolean> {
  const mailer = getTransporter();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dueDate);

  const html = getDeadlineReminderTemplate(userName, taskTitle, formattedDate, taskId);

  try {
    const info = await mailer.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: `Deadline Reminder: "${taskTitle}" is due soon`,
      html,
    });
    console.log(`[Email] Reminder sent to ${toEmail} for task "${taskTitle}" (ID: ${info.messageId || 'mock'})`);
    return true;
  } catch (err: any) {
    console.warn(`[Email Error] Failed to send reminder email to ${toEmail}: ${err.message}`);
    return false;
  }
}
