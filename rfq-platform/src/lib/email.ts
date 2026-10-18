export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    throw new Error('Email service is not configured');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, html }),
  });
  if (!response.ok) {
    console.error('Email provider rejected the invitation:', response.status);
    throw new Error('Email delivery failed');
  }
}
