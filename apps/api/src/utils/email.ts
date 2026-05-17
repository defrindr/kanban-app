import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
        : undefined,
      secure: process.env.SMTP_SECURE === 'true',
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

const FROM = process.env.EMAIL_FROM || 'noreply@kanban.app';

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  try {
    const t = getTransporter();
    await t.sendMail({ from: FROM, to: options.to, subject: options.subject, html: options.html });
  } catch {
    // email failures are non-critical
  }
}

export function boardInviteEmail(inviterName: string, boardName: string, boardUrl: string) {
  return {
    subject: `${inviterName} invited you to ${boardName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Board Invitation</h2>
        <p><strong>${inviterName}</strong> invited you to the board <strong>${boardName}</strong>.</p>
        <a href="${boardUrl}" style="display:inline-block;padding:10px 20px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">View Board</a>
      </div>`,
  };
}

export function commentNotificationEmail(
  commenterName: string,
  cardTitle: string,
  boardName: string,
  commentContent: string,
  cardUrl: string
) {
  return {
    subject: `${commenterName} commented on ${cardTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>New Comment</h2>
        <p><strong>${commenterName}</strong> commented on <strong>${cardTitle}</strong> in ${boardName}:</p>
        <blockquote style="border-left:3px solid #ddd;padding:8px 16px;margin:12px 0;color:#555">${commentContent}</blockquote>
        <a href="${cardUrl}" style="display:inline-block;padding:10px 20px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">View Card</a>
      </div>`,
  };
}

export function assignmentNotificationEmail(
  assignerName: string,
  cardTitle: string,
  boardName: string,
  cardUrl: string
) {
  return {
    subject: `You were assigned to ${cardTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Card Assignment</h2>
        <p><strong>${assignerName}</strong> assigned you to <strong>${cardTitle}</strong> in ${boardName}.</p>
        <a href="${cardUrl}" style="display:inline-block;padding:10px 20px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:6px">View Card</a>
      </div>`,
  };
}
