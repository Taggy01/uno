/**
 * Brevo (formerly Sendinblue) REST API Client
 * Dispatches transactional emails via Brevo v3 SMTP API.
 */

export async function sendEmail({ to, toName, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'no-reply@uno-game.com';
  const fromName = process.env.BREVO_FROM_NAME || 'UNO Online';

  if (!apiKey) {
    console.warn('[BREVO WARNING] BREVO_API_KEY is missing in .env. Logging email to console:');
    console.log(`[DEV EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { messageId: `mock-${Date.now()}` };
  }

  const endpoint = 'https://api.brevo.com/v3/smtp/email';

  const payload = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: [
      {
        email: to,
        name: toName || 'Player',
      },
    ],
    subject: subject,
    htmlContent: html,
  };

  if (text) {
    payload.textContent = text;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    result = { message: responseText };
  }

  if (!response.ok) {
    const errMsg = result.message || `Brevo API error ${response.status}: ${responseText}`;
    throw new Error(errMsg);
  }

  return result;
}
