import { describe, it, expect } from 'vitest';
import {
  parseSender,
  maskEmail,
  escapeHtml,
  getWelcomeEmailHtml,
  getWelcomeEmailPlainText,
  getDeadlineReminderHtml,
  getDeadlineReminderPlainText,
  sendWelcomeEmail,
  sendDeadlineReminderEmail,
} from '../src/services/email.service';

describe('Brevo Email Service & Utility Functions', () => {
  describe('parseSender()', () => {
    it('parses standard quoted sender with display name and email', () => {
      const parsed = parseSender('"ORBIT Work OS <noreply@orbit.app>"');
      expect(parsed.name).toBe('ORBIT Work OS');
      expect(parsed.email).toBe('noreply@orbit.app');
    });

    it('parses unquoted display name with angle brackets', () => {
      const parsed = parseSender('ORBIT Work OS <alerts@orbit.app>');
      expect(parsed.name).toBe('ORBIT Work OS');
      expect(parsed.email).toBe('alerts@orbit.app');
    });

    it('parses single-quoted display name', () => {
      const parsed = parseSender("'ORBIT Team' <team@orbit.app>");
      expect(parsed.name).toBe('ORBIT Team');
      expect(parsed.email).toBe('team@orbit.app');
    });

    it('parses bare angle bracket email', () => {
      const parsed = parseSender('<notifications@orbit.app>');
      expect(parsed.name).toBe('ORBIT Work OS');
      expect(parsed.email).toBe('notifications@orbit.app');
    });

    it('parses plain email address', () => {
      const parsed = parseSender('support@orbit.app');
      expect(parsed.name).toBe('ORBIT Work OS');
      expect(parsed.email).toBe('support@orbit.app');
    });

    it('handles empty or missing input with safe defaults', () => {
      expect(parseSender('')).toEqual({ name: 'ORBIT Work OS', email: 'noreply@orbit.app' });
      expect(parseSender(undefined)).toEqual({ name: 'ORBIT Work OS', email: 'noreply@orbit.app' });
    });
  });

  describe('maskEmail()', () => {
    it('masks standard email addresses for privacy compliance', () => {
      expect(maskEmail('alex.morgan@company.com')).toBe('al***n@company.com');
      expect(maskEmail('john@example.com')).toBe('jo***n@example.com');
    });

    it('handles short usernames safely', () => {
      expect(maskEmail('ab@example.com')).toBe('a***@example.com');
      expect(maskEmail('a@example.com')).toBe('a***@example.com');
    });

    it('handles invalid emails gracefully', () => {
      expect(maskEmail('')).toBe('***');
      expect(maskEmail('invalid')).toBe('***');
    });
  });

  describe('escapeHtml()', () => {
    it('escapes dangerous HTML characters to prevent XSS injection', () => {
      const malicious = '<script>alert("xss & \'hack\'")</script>';
      const safe = escapeHtml(malicious);
      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;script&gt;');
      expect(safe).toContain('&amp;');
      expect(safe).toContain('&quot;');
      expect(safe).toContain('&#39;');
    });
  });

  describe('Templates and Sending', () => {
    it('generates welcome email HTML containing product branding and user name', () => {
      const html = getWelcomeEmailHtml('Diana Prince');
      expect(html).toContain('Diana Prince');
      expect(html).toContain('ORBIT');
      expect(html).toContain('Personal Work OS');
      expect(html).toContain('Focus Mode');
      expect(html).toContain('Deadline Radar');
    });

    it('generates welcome email plain text version', () => {
      const text = getWelcomeEmailPlainText('Diana Prince');
      expect(text).toContain('Welcome aboard, Diana Prince!');
      expect(text).toContain('ORBIT Personal Work OS');
    });

    it('generates deadline reminder HTML with formatted task details', () => {
      const html = getDeadlineReminderHtml(
        'Bruce Wayne',
        'Audit Batmobile Systems',
        'Tomorrow, 5:00 PM',
        'task-12345',
        'urgent',
        'in_progress'
      );
      expect(html).toContain('Bruce Wayne');
      expect(html).toContain('Audit Batmobile Systems');
      expect(html).toContain('Tomorrow, 5:00 PM');
      expect(html).toContain('URGENT');
    });

    it('generates deadline reminder plain text version', () => {
      const text = getDeadlineReminderPlainText(
        'Bruce Wayne',
        'Audit Batmobile Systems',
        'Tomorrow, 5:00 PM',
        'task-12345',
        'urgent',
        'in_progress'
      );
      expect(text).toContain('Bruce Wayne');
      expect(text).toContain('Audit Batmobile Systems');
    });

    it('sendWelcomeEmail dispatches successfully without throwing', async () => {
      const result = await sendWelcomeEmail('test.recipient@example.com', 'Test User');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });

    it('sendDeadlineReminderEmail dispatches successfully without throwing', async () => {
      const result = await sendDeadlineReminderEmail(
        'test.recipient@example.com',
        'Test User',
        'Finish Quarterly Report',
        new Date(Date.now() + 12 * 60 * 60 * 1000),
        'task-test-999',
        'high',
        'in_progress'
      );
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('messageId');
    });
  });
});
