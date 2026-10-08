import { config } from '../config/env';
import { maskEmail, parseSender, verifyBrevoConnection, sendWelcomeEmail } from '../services/email.service';

async function main() {
  console.log('==================================================');
  console.log('ORBIT — BREVO HTTP API EMAIL DIAGNOSTIC');
  console.log('==================================================');

  const hasApiKey = Boolean(config.email.apiKey);
  const from = config.email.from;
  const sender = parseSender(from);

  console.log(`[Config] BREVO_API_KEY: ${hasApiKey ? 'CONFIGURED (' + config.email.apiKey.length + ' chars)' : 'MISSING'}`);
  console.log(`[Config] EMAIL_FROM:    ${from}`);
  console.log(`[Config] Sender Name:   ${sender.name}`);
  console.log(`[Config] Sender Email:  ${sender.email}`);

  if (!hasApiKey) {
    console.warn('\n[WARNING] BREVO_API_KEY is not configured in server/.env or environment.');
    console.warn('For real inbox delivery via Brevo HTTP API, configure in server/.env:');
    console.warn('  BREVO_API_KEY=<your_brevo_v3_api_key>');
    console.warn('  EMAIL_FROM="ORBIT Work OS <your_verified_sender@domain.com>"\n');
  }

  console.log('\n[Diagnostic] Pinging Brevo API v3 account endpoint (HTTPS)...');
  const verifyResult = await verifyBrevoConnection();

  if (verifyResult.success) {
    console.log(`[SUCCESS] ${verifyResult.message}`);
  } else {
    console.error(`[FAILURE] ${verifyResult.message}`);
  }

  // Check if an optional recipient was provided via CLI argument
  const targetRecipient = process.argv[2];
  if (targetRecipient) {
    console.log(`\n[Diagnostic] Dispatching test email via Brevo API to ${maskEmail(targetRecipient)}...`);
    try {
      const sendResult = await sendWelcomeEmail(targetRecipient, 'Diagnostic User');
      if (sendResult.success) {
        console.log(`[SUCCESS] Message dispatched! Message ID: ${sendResult.messageId}`);
      } else {
        console.error(`[FAILURE] Message dispatch failed.`);
        process.exit(1);
      }
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

