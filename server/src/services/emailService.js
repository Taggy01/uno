import nodemailer from 'nodemailer';

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const emailPort = Number(process.env.EMAIL_PORT) || 465;

  if (!emailUser || !emailPass) {
    throw new Error(
      'EMAIL_USER and EMAIL_PASS are not configured on the server.'
    );
  }

  const isGmail = emailHost.includes('gmail.com');

  console.log('[EMAIL SERVICE] Initializing SMTP transporter...');
  console.log(`[EMAIL SERVICE] Host: ${emailHost}`);
  console.log(`[EMAIL SERVICE] Port: ${emailPort}`);
  console.log(`[EMAIL SERVICE] User: ${emailUser}`);

  transporter = nodemailer.createTransport({
    ...(isGmail
      ? {
        service: 'gmail',
      }
      : {
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
      }),

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    await transporter.verify();

    console.log('[EMAIL SERVICE] SMTP connection verified successfully.');

    return transporter;
  } catch (error) {
    console.error('[EMAIL SERVICE] SMTP verification failed:');
    console.error(error);

    transporter = null;

    throw new Error(
      `SMTP connection failed: ${error.message}`
    );
  }
}

export async function sendOtpEmail(toEmail, otp, username) {
  // Keep this temporarily for debugging.
  console.log(
    `\n========================================
[UNO OTP CODE]
Verification code for ${toEmail}: ${otp}
========================================\n`
  );

  try {
    const mailClient = await getTransporter();

    const fromEmail =
      process.env.EMAIL_FROM ||
      `"UNO Online" <${process.env.EMAIL_USER}>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
              Roboto, Helvetica, Arial, sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
            padding: 24px;
          }

          .container {
            max-width: 480px;
            margin: 0 auto;
            background: #171717;
            border-radius: 20px;
            border: 1px solid #262626;
            padding: 32px;
            text-align: center;
          }

          .badge {
            display: inline-block;
            background-color: #dc2626;
            color: #ffffff;
            font-weight: 900;
            font-size: 16px;
            padding: 6px 14px;
            border-radius: 12px;
            margin-bottom: 16px;
          }

          h1 {
            font-size: 22px;
            margin: 0 0 8px 0;
            color: #ffffff;
          }

          p {
            color: #a3a3a3;
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 24px 0;
          }

          .otp-card {
            background: #0a0a0a;
            border: 1px dashed #3b82f6;
            border-radius: 16px;
            padding: 18px;
            margin: 20px 0;
          }

          .otp-code {
            font-family: monospace;
            font-size: 36px;
            letter-spacing: 8px;
            font-weight: bold;
            color: #60a5fa;
            margin: 0;
          }

          .expiry {
            font-size: 12px;
            color: #737373;
            margin-top: 8px;
          }

          .footer {
            font-size: 11px;
            color: #525252;
            margin-top: 24px;
            border-top: 1px solid #262626;
            padding-top: 16px;
          }
        </style>
      </head>

      <body>
        <div class="container">
          <div class="badge">UNO ONLINE</div>

          <h1>Verify Your Email</h1>

          <p>
            Hi <strong>${username || 'Player'}</strong>,
            use the verification code below to complete your
            UNO account registration:
          </p>

          <div class="otp-card">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 10 minutes</div>
          </div>

          <p style="font-size: 12px; margin-bottom: 0;">
            If you did not request this verification,
            you can safely ignore this email.
          </p>

          <div class="footer">
            UNO Online Arena • Secure Account Verification
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailClient.sendMail({
      from: fromEmail,
      to: toEmail,
      subject: `Your UNO Verification Code: ${otp}`,
      text: `
Your UNO verification code is: ${otp}

This code is valid for 10 minutes.

If you did not request this verification, you can safely ignore this email.
      `.trim(),
      html: htmlContent,
    });

    console.log(
      `[EMAIL DISPATCHED] OTP sent successfully to ${toEmail}`
    );

    console.log(`[EMAIL MESSAGE ID] ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error('\n========================================');
    console.error('[EMAIL ERROR] Failed to send OTP');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.error('========================================\n');

    if (
      error.message?.toLowerCase().includes('username and password')
    ) {
      console.error(
        '[GMAIL ERROR] Gmail rejected the credentials.'
      );

      console.error(
        '[GMAIL TIP] EMAIL_PASS must be a Google App Password, NOT your normal Gmail password.'
      );
    }

    throw error;
  }
}