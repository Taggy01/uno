import nodemailer from 'nodemailer';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. If explicit SMTP env credentials are provided
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const isGmail = (process.env.EMAIL_HOST || '').includes('gmail') || (process.env.EMAIL_USER || '').includes('gmail');
    
    transporter = nodemailer.createTransport({
      service: isGmail ? 'gmail' : undefined,
      host: isGmail ? undefined : (process.env.EMAIL_HOST || 'smtp.gmail.com'),
      port: Number(process.env.EMAIL_PORT) || (isGmail ? 465 : 587),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });
    return transporter;
  }

  // 2. Otherwise create test inbox for development
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 5000,
    });
    console.log(`[EMAIL SERVICE] Initialized dev test email client: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[EMAIL SERVICE] Could not create test SMTP account:', err.message);
    return null;
  }
}

export async function sendOtpEmail(toEmail, otp, username) {
  // Always log OTP to server console for guaranteed visibility
  console.log(`\n========================================\n[UNO OTP CODE] Verification code for ${toEmail}: ${otp}\n========================================\n`);

  try {
    const mailClient = await getTransporter();
    if (!mailClient) {
      return { success: true, simulated: true };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 24px; }
          .container { max-width: 480px; margin: 0 auto; background: #171717; border-radius: 20px; border: 1px solid #262626; padding: 32px; text-align: center; }
          .badge { display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: 900; font-size: 16px; padding: 6px 14px; border-radius: 12px; margin-bottom: 16px; }
          h1 { font-size: 22px; margin: 0 0 8px 0; color: #ffffff; }
          p { color: #a3a3a3; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0; }
          .otp-card { background: #0a0a0a; border: 1px dashed #3b82f6; border-radius: 16px; padding: 18px; margin: 20px 0; }
          .otp-code { font-family: monospace; font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #60a5fa; margin: 0; }
          .expiry { font-size: 12px; color: #737373; margin-top: 8px; }
          .footer { font-size: 11px; color: #525252; margin-top: 24px; border-top: 1px solid #262626; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">UNO ONLINE</div>
          <h1>Verify Your Email</h1>
          <p>Hi <strong>${username || 'Player'}</strong>, use the verification code below to complete your UNO account registration:</p>
          
          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 10 minutes</div>
          </div>
          
          <p style="font-size: 12px; margin-bottom: 0;">If you did not request this verification, you can safely ignore this email.</p>
          
          <div class="footer">
            UNO Online Arena • Secure Account Verification
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailClient.sendMail({
      from: process.env.EMAIL_FROM || `"UNO Online" <${process.env.EMAIL_USER || 'no-reply@unogame.online'}>`,
      to: toEmail,
      subject: `Your UNO Verification Code: ${otp}`,
      text: `Your UNO verification code is: ${otp}. This code is valid for 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[EMAIL DISPATCHED] Successfully sent OTP to ${toEmail}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[EMAIL PREVIEW LINK]: ${previewUrl}`);
    }

    return { success: true, previewUrl };
  } catch (error) {
    console.error(`\n[EMAIL NOTICE] SMTP Delivery Notice: ${error.message}`);
    if (error.message && error.message.includes('Username and Password not accepted')) {
      console.warn(`[GMAIL TIP] For Gmail (get.uno.mail@gmail.com), you must generate a 16-character "App Password" at: https://myaccount.google.com/apppasswords`);
    }
    // Return gracefully so OTP verification step continues
    return { success: true, simulated: true };
  }
}

