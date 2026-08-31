import dns from 'node:dns';
import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Resolve smtp.gmail.com to IPv4.
 * Render may attempt IPv6, which can result in:
 * ENETUNREACH ...:465
 */
async function resolveGmailIPv4() {
  return new Promise((resolve, reject) => {
    dns.lookup(
      'smtp.gmail.com',
      { family: 4 },
      (error, address) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address);
      }
    );
  });
}

/**
 * Create and verify the SMTP transporter.
 */
async function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      'EMAIL_USER and EMAIL_PASS are not configured on the server.'
    );
  }

  console.log('[EMAIL SERVICE] Initializing SMTP transporter...');
  console.log(`[EMAIL SERVICE] User: ${emailUser}`);

  let gmailIPv4;

  try {
    gmailIPv4 = await resolveGmailIPv4();

    console.log(
      `[EMAIL SERVICE] Gmail IPv4 address: ${gmailIPv4}`
    );
  } catch (error) {
    console.error(
      '[EMAIL SERVICE] Could not resolve Gmail IPv4 address:',
      error
    );

    throw new Error(
      `Could not resolve smtp.gmail.com: ${error.message}`
    );
  }

  transporter = nodemailer.createTransport({
    host: gmailIPv4,
    port: 465,
    secure: true,

    auth: {
      user: emailUser,
      pass: emailPass,
    },

    // Important when connecting directly to Google's IP address.
    tls: {
      servername: 'smtp.gmail.com',
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  try {
    console.log('[EMAIL SERVICE] Verifying SMTP connection...');

    await transporter.verify();

    console.log(
      '[EMAIL SERVICE] SMTP connection verified successfully.'
    );

    return transporter;
  } catch (error) {
    console.error(
      '[EMAIL SERVICE] SMTP verification failed:'
    );

    console.error(error);

    transporter = null;

    throw new Error(
      `SMTP connection failed: ${error.message}`
    );
  }
}

/**
 * Send OTP verification email.
 */
export async function sendOtpEmail(
  toEmail,
  otp,
  username
) {
  // Keep this temporarily for debugging.
  // Remove OTP logging in production.
  console.log(
    `
========================================
[UNO OTP CODE]
Verification code for ${toEmail}: ${otp}
========================================
`
  );

  try {
    const mailClient = await getTransporter();

    const fromEmail =
      process.env.EMAIL_FROM ||
      `"UNO Online" <${process.env.EMAIL_USER}>`;

    const safeUsername = username || 'Player';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>UNO Verification Code</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      color: #ffffff;
      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
    }

    .wrapper {
      width: 100%;
      padding: 40px 16px;
      box-sizing: border-box;
      background-color: #0a0a0a;
    }

    .container {
      max-width: 480px;
      margin: 0 auto;
      padding: 32px;
      box-sizing: border-box;

      background-color: #171717;

      border: 1px solid #262626;
      border-radius: 20px;

      text-align: center;
    }

    .badge {
      display: inline-block;

      margin-bottom: 18px;
      padding: 7px 15px;

      background-color: #dc2626;
      color: #ffffff;

      border-radius: 12px;

      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }

    h1 {
      margin: 0 0 10px;

      color: #ffffff;

      font-size: 24px;
      line-height: 1.3;
    }

    .intro {
      margin: 0 0 24px;

      color: #a3a3a3;

      font-size: 14px;
      line-height: 1.6;
    }

    .otp-card {
      margin: 24px 0;
      padding: 22px 16px;

      background-color: #0a0a0a;

      border: 1px dashed #3b82f6;
      border-radius: 16px;
    }

    .otp-code {
      margin: 0;

      color: #60a5fa;

      font-family: monospace;
      font-size: 36px;
      font-weight: 700;

      letter-spacing: 8px;
    }

    .expiry {
      margin-top: 10px;

      color: #737373;

      font-size: 12px;
    }

    .warning {
      margin: 0;

      color: #737373;

      font-size: 12px;
      line-height: 1.5;
    }

    .footer {
      margin-top: 28px;
      padding-top: 18px;

      border-top: 1px solid #262626;

      color: #525252;

      font-size: 11px;
      line-height: 1.5;
    }
  </style>
</head>

<body>

  <div class="wrapper">

    <div class="container">

      <div class="badge">
        UNO ONLINE
      </div>

      <h1>
        Verify Your Email
      </h1>

      <p class="intro">
        Hi <strong>${safeUsername}</strong>,
        use the verification code below to complete
        your UNO account registration.
      </p>

      <div class="otp-card">

        <p class="otp-code">
          ${otp}
        </p>

        <div class="expiry">
          This code is valid for 10 minutes.
        </div>

      </div>

      <p class="warning">
        If you did not request this verification,
        you can safely ignore this email.
      </p>

      <div class="footer">
        UNO Online Arena • Secure Account Verification
      </div>

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
Hi ${safeUsername},

Your UNO Online verification code is:

${otp}

This code is valid for 10 minutes.

If you did not request this verification, you can safely ignore this email.

UNO Online Arena
      `.trim(),

      html: htmlContent,
    });

    console.log(
      `[EMAIL DISPATCHED] Successfully sent OTP to ${toEmail}`
    );

    console.log(
      `[EMAIL MESSAGE ID] ${info.messageId}`
    );

    console.log(
      `[EMAIL RESPONSE] ${info.response || 'Accepted by SMTP server'}`
    );

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error(
      `
========================================
[EMAIL ERROR]
Failed to send OTP
========================================
`
    );

    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.error('Response Code:', error.responseCode);

    console.error(
      '========================================\n'
    );

    if (
      error.message
        ?.toLowerCase()
        .includes('username and password')
    ) {
      console.error(
        '[GMAIL ERROR] Gmail rejected the credentials.'
      );

      console.error(
        '[GMAIL TIP] EMAIL_PASS must be a Google App Password, not your normal Gmail password.'
      );
    }

    if (error.code === 'EAUTH') {
      console.error(
        '[GMAIL TIP] Check EMAIL_USER and EMAIL_PASS.'
      );

      console.error(
        '[GMAIL TIP] Make sure EMAIL_PASS is a 16-character Google App Password.'
      );
    }

    if (
      error.code === 'ESOCKET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED'
    ) {
      console.error(
        '[SMTP ERROR] Could not establish a connection with Gmail SMTP.'
      );
    }

    // IMPORTANT:
    // Do NOT return success here.
    // Let the controller know that the email failed.
    throw error;
  }
}