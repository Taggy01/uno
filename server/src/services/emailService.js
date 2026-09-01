// emailService.js – uses Brevo (formerly Sendinblue) for sending OTP emails
import { sendEmail } from './brevoClient.js';

/**
 * Send OTP verification email using Brevo.
 * Configured with BREVO_API_KEY, BREVO_FROM_EMAIL, and optional BREVO_FROM_NAME in server/.env.
 */
export async function sendOtpEmail(toEmail, otp, username) {
  const safeUsername = username || 'Player';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>UNO Verification Code</title>
        <style>
          body { margin:0; padding:0; background:#0a0a0a; color:#fff; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
          .wrapper { width:100%; padding:40px 16px; box-sizing:border-box; background:#0a0a0a; }
          .container { max-width:480px; margin:auto; padding:32px; background:#171717; border:1px solid #262626; border-radius:20px; text-align:center; }
          .badge { display:inline-block; margin-bottom:18px; padding:7px 15px; background:#dc2626; color:#fff; border-radius:12px; font-size:15px; font-weight:900; }
          h1 { margin:0 0 10px; font-size:24px; color:#fff; }
          .intro { margin:0 0 24px; color:#a3a3a3; font-size:14px; }
          .otp-card { margin:24px 0; padding:22px 16px; background:#0a0a0a; border:1px dashed #3b82f6; border-radius:16px; }
          .otp-code { margin:0; color:#60a5fa; font-family:monospace; font-size:36px; font-weight:700; letter-spacing:8px; }
          .expiry { margin-top:10px; color:#737373; font-size:12px; }
          .warning { margin:0; color:#737373; font-size:12px; line-height:1.5; }
          .footer { margin-top:28px; padding-top:18px; border-top:1px solid #262626; color:#525252; font-size:11px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="badge">UNO ONLINE</div>
            <h1>Verify Your Email</h1>
            <p class="intro">Hi <strong>${safeUsername}</strong>, use the verification code below to complete your UNO account registration.</p>
            <div class="otp-card">
              <p class="otp-code">${otp}</p>
              <div class="expiry">This code is valid for 10 minutes.</div>
            </div>
            <p class="warning">If you did not request this verification, you can safely ignore this email.</p>
            <div class="footer">UNO Online Arena • Secure Account Verification via Brevo</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `Hi ${safeUsername},\n\nYour UNO Online verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this verification, you can safely ignore this email.\n\nUNO Online Arena`;

  try {
    const result = await sendEmail({
      to: toEmail,
      toName: safeUsername,
      subject: `Your UNO Verification Code: ${otp}`,
      html: htmlContent,
      text: textContent,
    });
    console.log(`[BREVO DISPATCHED] Successfully sent OTP to ${toEmail} (MessageId: ${result.messageId || 'ok'})`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[BREVO ERROR] Failed to send OTP email:', error.message);
    throw error;
  }
}