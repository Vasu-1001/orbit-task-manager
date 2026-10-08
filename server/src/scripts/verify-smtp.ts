import { config } from '../config/env';
import { getTransporter, maskEmail, verifySmtpConnection } from '../services/email.service';

async function main() {
  console.log('==================================================');
  console.log('ORBIT — SMTP CONNECTION & DELIVERABILITY DIAGNOSTIC');
  console.log('==================================================');

  const host = config.email.host;
  const port = config.email.port;
  const secure = config.email.secure;
  const hasUser = Boolean(config.email.user);
  const hasPass = Boolean(config.email.pass);
  const from = config.email.from;

  console.log(`[Config] EMAIL_HOST:    ${host}`);
  console.log(`[Config] EMAIL_PORT:    ${port}`);
  console.log(`[Config] EMAIL_SECURE:  ${secure}`);
  console.log(`[Config] EMAIL_USER:    ${hasUser ? maskEmail(config.email.user) : 'MISSING'}`);
  console.log(`[Config] EMAIL_PASS:    ${hasPass ? 'CONFIGURED (' + config.email.pass.length + ' chars)' : 'MISSING'}`);
  console.log(`[Config] EMAIL_FROM:    ${from}`);

  if (host.includes('ethereal')) {
    console.warn('\n[WARNING] EMAIL_HOST is currently set to Ethereal Email (Development Sandbox).');
    console.warn('Ethereal does NOT deliver to real Gmail/Outlook inboxes.');
    console.warn('For real inbox delivery, configure Brevo SMTP in server/.env:');
    console.warn('  EMAIL_HOST=smtp-relay.brevo.com');
    console.warn('  EMAIL_PORT=587');
    console.warn('  EMAIL_SECURE=false');
    console.warn('  EMAIL_USER=<your_brevo_smtp_login>');
    console.warn('  EMAIL_PASS=<your_brevo_smtp_key>');
    console.warn('  EMAIL_FROM="ORBIT Work OS <your_verified_sender@domain.com>"\n');
  }

  console.log('\n[Diagnostic] Initiating transporter.verify() TLS handshake...');
  const verifyResult = await verifySmtpConnection();

  if (verifyResult.success) {
    console.log(`[SUCCESS] ${verifyResult.message}`);
  } else {
    console.error(`[FAILURE] ${verifyResult.message}`);
    process.exit(1);
  }

  // Check if an optional recipient was provided via CLI argument
  const targetRecipient = process.argv[2];
  if (targetRecipient) {
    console.log(`\n[Diagnostic] Sending test email to ${maskEmail(targetRecipient)}...`);
    const transporter = getTransporter();
    try {
      const sendResult = await transporter.sendMail({
        from: config.email.from,
        to: targetRecipient,
        subject: 'ORBIT — Real Transactional SMTP Delivery Test',
        text: 'This is a test notification from ORBIT Personal Work OS verifying real SMTP delivery.',
        html: `
          <div style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 32px; border-radius: 12px;">
            <h2 style="color: #6366f1;">⚡ ORBIT — Real Delivery Test</h2>
            <p>Your transactional SMTP provider (${host}:${port}) has successfully routed this email.</p>
            <p style="color: #94a3b8; font-size: 13px;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      console.log(`[SUCCESS] Message dispatched!`);
      console.log(`[Result] Message ID: ${sendResult.messageId}`);
      console.log(`[Result] SMTP Response: ${sendResult.response}`);
    } catch (sendErr: any) {
      console.error(`[FAILURE] Failed to dispatch test email: ${sendErr.message}`);
      process.exit(1);
    }
  } else {
    console.log('\n[Info] To send a live test message to an external mailbox, run:');
    console.log('       npx ts-node src/scripts/verify-smtp.ts <your_email@gmail.com>');
  }
}

main().catch((err) => {
  console.error('[Error] Unexpected diagnostic error:', err.message);
  process.exit(1);
});
