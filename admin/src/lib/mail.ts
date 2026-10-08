import nodemailer, { type Transporter } from 'nodemailer';

// Lazily-built SMTP transport from env (Gmail by default — see .env). If SMTP
// isn't configured, sending is skipped silently so flows never break.
let cached: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, ''); // app passwords are shown spaced
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  cached = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user, pass },
  });
  return cached;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('SMTP not configured — skipping email to', opts.to);
    return { sent: false as const };
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER!;
  await transporter.sendMail({
    from: `The Merchant Boston <${from}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return { sent: true as const };
}
