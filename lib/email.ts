import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — emails will not be sent");
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const fromAddress = process.env.RESEND_FROM || "CybeHMS <onboarding@cybelinx.com>";

function baseEmailHtml(
  title: string,
  bodyHtml: string,
  ticketId: string,
  tenantCode: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr><td style="padding:32px 32px 16px;background:linear-gradient(135deg,#1A3C5E,#2BAE8E);text-align:center;">
        <h1 style="margin:0;font-size:20px;color:#FFFFFF;letter-spacing:-0.3px;">${title}</h1>
        <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Ticket #${ticketId.slice(0,8)} · ${tenantCode}</p>
      </td></tr>
      <tr><td style="padding:24px 32px 16px;color:#1A3C5E;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:16px 32px 24px;border-top:1px solid #E2E8F0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#94A3B8;">
          CybeHMS Support System · This is an automated notification from the Platform Admin.<br>
          Please do not reply directly to this email.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export async function sendTicketCreatedEmail(
  to: string,
  ticket: { id: string; subject: string; description?: string; priority: string; category: string; tenant_code: string },
  createdByName: string
) {
  const html = baseEmailHtml(
    "New Support Ticket Created",
    `<p style="margin:0 0 12px;">A new support ticket has been created by <strong>${createdByName}</strong> on behalf of your organization.</p>
     <table width="100%" cellpadding="8" cellspacing="0" style="background:#F5F7FA;border-radius:8px;font-size:13px;">
       <tr><td style="color:#64748B;width:80px;">Subject</td><td style="color:#1A3C5E;font-weight:600;">${ticket.subject}</td></tr>
       ${ticket.description ? `<tr><td style="color:#64748B;">Description</td><td style="color:#1A3C5E;">${ticket.description}</td></tr>` : ""}
       <tr><td style="color:#64748B;">Priority</td><td style="color:#1A3C5E;">${ticket.priority}</td></tr>
       <tr><td style="color:#64748B;">Category</td><td style="color:#1A3C5E;">${ticket.category}</td></tr>
     </table>`,
    ticket.id,
    ticket.tenant_code
  );

  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({
      from: fromAddress,
      to,
      subject: `[${ticket.tenant_code}] New Support Ticket: ${ticket.subject}`,
      html,
    });
  } catch (error) {
    console.error("Email send failed (ticket created):", error);
  }
}

export async function sendTicketReplyEmail(
  to: string,
  ticket: { id: string; subject: string; tenant_code: string },
  messageText: string,
  senderName: string
) {
  const html = baseEmailHtml(
    "New Reply on Support Ticket",
    `<p style="margin:0 0 12px;"><strong>${senderName}</strong> has replied to ticket <strong>${ticket.subject}</strong>.</p>
     <div style="background:#F5F7FA;border-radius:8px;padding:12px 16px;font-size:13px;color:#1A3C5E;border-left:3px solid #2BAE8E;">
       ${messageText.replace(/\n/g, "<br>")}
     </div>`,
    ticket.id,
    ticket.tenant_code
  );

  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({
      from: fromAddress,
      to,
      subject: `Re: [${ticket.tenant_code}] ${ticket.subject}`,
      html,
    });
  } catch (error) {
    console.error("Email send failed (ticket reply):", error);
  }
}

export async function sendWelcomeEmail(
  to: string,
  tenantName: string,
  adminName: string,
  adminEmail: string,
  tempPassword: string,
  loginUrl: string
) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Karla,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <tr><td style="padding:40px 40px 24px;background:linear-gradient(135deg,#1E3A8A,#3B82F6);text-align:center;">
        <h1 style="margin:0;font-size:24px;color:#FFFFFF;letter-spacing:-0.5px;font-weight:700;font-family:'Playfair Display SC',Georgia,serif;">Welcome to CybeHMS</h1>
        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your workspace has been provisioned successfully</p>
      </td></tr>
      <tr><td style="padding:32px 40px 16px;color:#1E40AF;font-size:14px;line-height:1.6;">
        <p style="margin:0 0 16px;">Dear <strong>${adminName}</strong>,</p>
        <p style="margin:0 0 16px;">
          We are pleased to inform you that <strong>${tenantName}</strong> has been successfully onboarded onto
          the CybeHMS platform. Your dedicated workspace is now live and ready for configuration.
        </p>

        <h3 style="margin:24px 0 12px;font-size:15px;color:#1E3A8A;font-weight:600;">Admin Credentials</h3>
        <table width="100%" cellpadding="8" cellspacing="0" style="background:#F8FAFC;border-radius:8px;font-size:13px;">
          <tr><td style="color:#64748B;width:100px;">Workspace</td><td style="color:#1E3A8A;font-weight:600;">${tenantName}</td></tr>
          <tr><td style="color:#64748B;">Login Email</td><td style="color:#1E3A8A;font-weight:600;">${adminEmail}</td></tr>
          <tr><td style="color:#64748B;">Password</td><td style="color:#1E3A8A;font-weight:600;font-family:'Courier New',monospace;font-size:14px;letter-spacing:1px;">${tempPassword}</td></tr>
        </table>

        <p style="margin:16px 0 0;font-size:12px;color:#E53E3E;">
          Please change your password after first login for security.
        </p>

        <a href="${loginUrl}" style="display:inline-block;margin:24px 0 8px;padding:14px 40px;background:#CA8A04;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">
          Access Dashboard
        </a>

        <h3 style="margin:32px 0 12px;font-size:15px;color:#1E3A8A;font-weight:600;">Next Steps</h3>
        <ol style="margin:0 0 16px;padding-left:20px;font-size:13px;color:#475569;">
          <li style="margin-bottom:6px;">Log in using the credentials above</li>
          <li style="margin-bottom:6px;">Set up your organization profile and preferences</li>
          <li style="margin-bottom:6px;">Add team members from the Admin panel</li>
          <li style="margin-bottom:6px;">Configure properties and enable features</li>
        </ol>
      </td></tr>
      <tr><td style="padding:24px 40px 32px;border-top:1px solid #E2E8F0;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#94A3B8;">
          CybeHMS — Cybelinx Hospitality Management System
        </p>
        <p style="margin:0;font-size:11px;color:#94A3B8;">
          This is an automated message from the CybeHMS Platform Team.
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({
      from: fromAddress,
      to,
      subject: `Welcome to CybeHMS — ${tenantName} Workspace Is Ready`,
      html,
    });
  } catch (error) {
    console.error("Email send failed (welcome):", error);
  }
}

export async function sendTicketStatusEmail(
  to: string,
  ticket: { id: string; subject: string; tenant_code: string; status: string },
  oldStatus: string,
  changedByName: string
) {
  const html = baseEmailHtml(
    "Support Ticket Status Updated",
    `<p style="margin:0 0 12px;"><strong>${changedByName}</strong> updated the status of ticket <strong>${ticket.subject}</strong>.</p>
     <table width="100%" cellpadding="8" cellspacing="0" style="background:#F5F7FA;border-radius:8px;font-size:13px;">
       <tr><td style="color:#64748B;width:80px;">Previous</td><td style="color:#1A3C5E;">${oldStatus.replace("_", " ")}</td></tr>
       <tr><td style="color:#64748B;">Current</td><td style="color:#1A3C5E;font-weight:600;">${ticket.status.replace("_", " ")}</td></tr>
     </table>`,
    ticket.id,
    ticket.tenant_code
  );

  const r = getResend();
  if (!r) return;
  try {
    await r.emails.send({
      from: fromAddress,
      to,
      subject: `[${ticket.tenant_code}] Status Updated: ${ticket.subject}`,
      html,
    });
  } catch (error) {
    console.error("Email send failed (ticket status):", error);
  }
}
