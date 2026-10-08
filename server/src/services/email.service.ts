import nodemailer from 'nodemailer';
import { config } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

/**
 * Sanitize and escape HTML entities to prevent HTML injection / XSS attacks in email templates
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returns configured nodemailer Transporter.
 * In automated test suites, automatically falls back to isolated jsonTransport
 * to keep unit tests fast, deterministic, and network-independent.
 */
export function getTransporter(): nodemailer.Transporter {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

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
      console.log(`[Email] Configured standard SMTP transporter (${config.email.host}:${config.email.port}).`);
    } else {
      transporter = nodemailer.createTransport({ jsonTransport: true });
      console.log('[Email] Running in simulated/mock mode (configure EMAIL_USER & EMAIL_PASS in .env for live delivery).');
    }
  }
  return transporter;
}

/**
 * Reset transporter cache to allow reloading credentials dynamically
 */
export function resetTransporter(): void {
  transporter = null;
}

/**
 * Verify live SMTP connection with current transporter configuration without exposing credentials
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const mailer = getTransporter();
    await mailer.verify();
    return {
      success: true,
      message: `SMTP connection to ${config.email.host}:${config.email.port} verified successfully.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `SMTP verification failed for ${config.email.host}:${config.email.port} - ${err.message}`,
    };
  }
}

/**
 * Generate Universal Responsive Table-Based HTML for Welcome Email
 * (Compatible with Gmail, Outlook, Apple Mail, iOS, Android)
 */
export function getWelcomeEmailHtml(name: string): string {
  const safeName = escapeHtml(name);
  const clientUrl = escapeHtml(config.clientUrl);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ORBIT — Personal Work OS</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; border-bottom: 1px solid #1f2937;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #6366f1; text-transform: uppercase;">
                      ⚡ ORBIT
                    </span>
                    <span style="font-size: 13px; color: #94a3b8; font-weight: 500; margin-left: 8px;">
                      Personal Work OS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Welcome aboard, ${safeName}!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                Your workspace is ready. ORBIT is engineered to help you execute with clarity, track deadlines effortlessly, and maintain deep focus.
              </p>

              <!-- Feature Highlights Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #cbd5e1;">
                          <strong style="color: #818cf8;">🎯 Focus Mode:</strong> Zero-distraction task execution.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #cbd5e1;">
                          <strong style="color: #818cf8;">📡 Deadline Radar:</strong> Visual grouping across upcoming time horizons.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 12px; font-size: 14px; color: #cbd5e1;">
                          <strong style="color: #818cf8;">📊 Personal Analytics:</strong> Real-time task velocity and completion insights.
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #cbd5e1;">
                          <strong style="color: #818cf8;">🖼️ Cloudinary Media:</strong> Fast, high-res attachment hosting with automated previews.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                    <a href="${clientUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #4f46e5;">
                      Launch Your Workspace →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Safe Fallback URL -->
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                If the button above does not work, copy and paste this link into your browser:<br />
                <a href="${clientUrl}" target="_blank" style="color: #818cf8; word-break: break-all;">${clientUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0b0f19; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                You received this email because an account was registered with this email address on ORBIT.
              </p>
              <p style="margin: 0; font-size: 12px; color: #475569;">
                © 2026 ORBIT Personal Work OS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text Fallback for Welcome Email
 */
export function getWelcomeEmailPlainText(name: string): string {
  return `Welcome aboard, ${name}!

Your workspace is ready. ORBIT is engineered to help you execute with clarity, track deadlines effortlessly, and maintain deep focus.

What you can do in ORBIT:
- Focus Mode: Zero-distraction task execution.
- Deadline Radar: Visual grouping across upcoming time horizons.
- Personal Analytics: Real-time task velocity and completion insights.
- Cloudinary Media: Fast, high-res attachment hosting with automated previews.

Launch your workspace:
${config.clientUrl}

If you did not sign up for this account, you can safely ignore this email.

© 2026 ORBIT Personal Work OS. All rights reserved.`;
}

/**
 * Generate Universal Responsive Table-Based HTML for Deadline Reminder Email
 * (Compatible with Gmail, Outlook, Apple Mail, iOS, Android)
 */
export function getDeadlineReminderHtml(
  userName: string,
  taskTitle: string,
  dueDateFormatted: string,
  taskId: string,
  priority: string = 'medium',
  status: string = 'pending'
): string {
  const safeUserName = escapeHtml(userName);
  const safeTaskTitle = escapeHtml(taskTitle);
  const safePriority = escapeHtml(priority).toUpperCase();
  const safeStatus = escapeHtml(status).replace('_', ' ').toUpperCase();
  const taskUrl = `${config.clientUrl}/tasks?id=${encodeURIComponent(taskId)}`;
  const safeTaskUrl = escapeHtml(taskUrl);

  const priorityColor =
    priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f59e0b' : priority === 'low' ? '#10b981' : '#6366f1';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ORBIT — Task Deadline Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #f8fafc;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #1f2937;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="display: inline-block; font-size: 18px; font-weight: 800; letter-spacing: 0.05em; color: #6366f1; text-transform: uppercase;">
                      ⚡ ORBIT
                    </span>
                    <span style="font-size: 13px; color: #94a3b8; font-weight: 500; margin-left: 8px;">
                      Deadline Alert
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <!-- Urgent Badge -->
              <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px;">
                ⏰ Deadline Approaching (Within 24 Hours)
              </span>

              <h1 style="margin: 0 0 14px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Hi ${safeUserName}, your task is due soon
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                A scheduled priority task has an approaching deadline within the next 24 hours:
              </p>

              <!-- Task Details Card -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; border-left: 4px solid ${priorityColor}; border-top: 1px solid #1f2937; border-right: 1px solid #1f2937; border-bottom: 1px solid #1f2937; border-radius: 8px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 10px;">
                      ${safeTaskTitle}
                    </div>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size: 13px; color: #94a3b8; padding-bottom: 6px;">
                          <strong>Due Date:</strong> <span style="color: #f59e0b; font-weight: 600;">${dueDateFormatted}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #94a3b8; padding-bottom: 6px;">
                          <strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: 600;">${safePriority}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #94a3b8;">
                          <strong>Current Status:</strong> <span style="color: #cbd5e1;">${safeStatus}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                    <a href="${safeTaskUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #4f46e5;">
                      View Task in ORBIT →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Safe Fallback URL -->
              <p style="margin: 0 0 16px 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                If the button above does not work, visit:<br />
                <a href="${safeTaskUrl}" target="_blank" style="color: #818cf8; word-break: break-all;">${safeTaskUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #0b0f19; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
                Sent automatically by the ORBIT Deadline Radar scheduler.
              </p>
              <p style="margin: 0; font-size: 12px; color: #475569;">
                © 2026 ORBIT Personal Work OS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Plain-text Fallback for Deadline Reminder Email
 */
export function getDeadlineReminderPlainText(
  userName: string,
  taskTitle: string,
  dueDateFormatted: string,
  taskId: string,
  priority: string = 'medium',
  status: string = 'pending'
): string {
  const taskUrl = `${config.clientUrl}/tasks?id=${encodeURIComponent(taskId)}`;

  return `Hi ${userName},

You have an upcoming deadline on ORBIT within the next 24 hours:

Task: ${taskTitle}
Due Date: ${dueDateFormatted}
Priority: ${priority.toUpperCase()}
Status: ${status.replace('_', ' ').toUpperCase()}

View and manage your task in ORBIT:
${taskUrl}

Sent automatically by ORBIT Personal Work OS.
© 2026 ORBIT Personal Work OS. All rights reserved.`;
}

/**
 * Safely masks email addresses for privacy-compliant operational logging
 * Example: 'alex.morgan@company.com' -> 'al***n@company.com'
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

/**
 * Dispatch Welcome Email asynchronously
 */
export async function sendWelcomeEmail(
  toEmail: string,
  name: string
): Promise<{ success: boolean; messageId?: string; previewUrl?: string | false }> {
  const mailer = getTransporter();
  const html = getWelcomeEmailHtml(name);
  const text = getWelcomeEmailPlainText(name);
  const maskedRecipient = maskEmail(toEmail);

  console.log(`[EMAIL] Welcome email send started`);
  console.log(`[EMAIL] Recipient: ${maskedRecipient}`);

  try {
    const info = await mailer.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: 'Welcome to ORBIT — Personal Work OS',
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL] SMTP accepted message`);
    console.log(`[EMAIL] Message ID: ${info.messageId || 'mock'}`);
    if (previewUrl) {
      console.log(`[EMAIL Sandbox Preview] ${previewUrl}`);
      console.log(`[EMAIL Sandbox Notice] Provider is Ethereal Email (simulated test sandbox). Messages do not route to real recipient inboxes.`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err: any) {
    console.error(`[EMAIL Error] Failed to send welcome email to ${maskedRecipient}: ${err.message}`);
    return { success: false };
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
  taskId: string,
  priority: string = 'medium',
  status: string = 'pending'
): Promise<{ success: boolean; messageId?: string; previewUrl?: string | false }> {
  const mailer = getTransporter();
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(dueDate);

  const html = getDeadlineReminderHtml(userName, taskTitle, formattedDate, taskId, priority, status);
  const text = getDeadlineReminderPlainText(userName, taskTitle, formattedDate, taskId, priority, status);
  const maskedRecipient = maskEmail(toEmail);

  console.log(`[EMAIL] Deadline reminder send started for task "${taskTitle}"`);
  console.log(`[EMAIL] Recipient: ${maskedRecipient}`);

  try {
    const info = await mailer.sendMail({
      from: config.email.from,
      to: toEmail,
      subject: `⏰ Deadline Reminder: "${taskTitle}" is due soon`,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[EMAIL] SMTP accepted message`);
    console.log(`[EMAIL] Message ID: ${info.messageId || 'mock'}`);
    if (previewUrl) {
      console.log(`[EMAIL Sandbox Preview] ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err: any) {
    console.error(`[EMAIL Error] Failed to send reminder email to ${maskedRecipient}: ${err.message}`);
    return { success: false };
  }
}
