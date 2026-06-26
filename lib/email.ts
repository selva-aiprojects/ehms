import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const fromAddress = process.env.RESEND_FROM || "eHMS <onboarding@cognivectra.com>";

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
          eHMS Support System · This is an automated notification from the Platform Admin.<br>
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

  try {
    await resend.emails.send({
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

  try {
    await resend.emails.send({
      from: fromAddress,
      to,
      subject: `Re: [${ticket.tenant_code}] ${ticket.subject}`,
      html,
    });
  } catch (error) {
    console.error("Email send failed (ticket reply):", error);
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

  try {
    await resend.emails.send({
      from: fromAddress,
      to,
      subject: `[${ticket.tenant_code}] Status Updated: ${ticket.subject}`,
      html,
    });
  } catch (error) {
    console.error("Email send failed (ticket status):", error);
  }
}
