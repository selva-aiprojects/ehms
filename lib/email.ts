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
  loginUrl: string,
  workspaces?: { type: string; name: string; is_primary?: boolean }[]
) {
  let workspacesTable = "";
  if (workspaces && workspaces.length > 0) {
    const typeLabelMap: Record<string, string> = {
      hotels: "Hotel",
      apartments: "Serviced Apartment",
      rental: "Apartment Rental",
      workplace: "Workplace Services"
    };

    const rows = workspaces.map(w => {
      const typeLabel = typeLabelMap[w.type] || w.type;
      const statusBadge = w.is_primary 
        ? `<span style="background:#FEF9C3;color:#854D0E;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;border:1px solid #FEF08A;">Primary</span>`
        : `<span style="background:#F1F5F9;color:#475569;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;">Active</span>`;
      return `
        <tr style="border-bottom:1px solid #E2E8F0;">
          <td style="padding:12px 16px;color:#1E3A8A;font-weight:600;text-align:left;">${w.name}</td>
          <td style="padding:12px 16px;color:#475569;text-align:left;">${typeLabel}</td>
          <td style="padding:12px 16px;text-align:right;">${statusBadge}</td>
        </tr>`;
    }).join("");

    workspacesTable = `
      <h3 style="margin:28px 0 12px;font-size:16px;color:#1E3A8A;font-weight:600;font-family:'Playfair Display SC',Georgia,serif;letter-spacing:0.5px;">Registered Properties & Workspaces</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;font-size:13px;border-collapse:collapse;margin-bottom:20px;box-shadow:0 1px 2px rgba(0,0,0,0.02);">
        <thead>
          <tr style="background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
            <th style="padding:12px 16px;color:#64748B;font-weight:600;text-align:left;">Property / Workspace Name</th>
            <th style="padding:12px 16px;color:#64748B;font-weight:600;text-align:left;">Vertical Type</th>
            <th style="padding:12px 16px;color:#64748B;font-weight:600;text-align:right;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=device-width">
  <title>Welcome to CybeHMS</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Karla',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(30,58,138,0.06), 0 1px 3px rgba(30,58,138,0.04);border:1px solid #E2E8F0;">
          <!-- Top Header Gradient -->
          <tr>
            <td style="padding:48px 40px 36px;background:linear-gradient(135deg,#1E3A8A 0%,#3B82F6 100%);text-align:center;">
              <h1 style="margin:0;font-size:28px;color:#FFFFFF;letter-spacing:-0.5px;font-weight:700;font-family:'Playfair Display SC',Georgia,serif;">Welcome to CybeHMS</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);letter-spacing:0.5px;text-transform:uppercase;">Enterprise Hospitality & Facilities Platform</p>
            </td>
          </tr>
          <!-- Bottom Border Accent -->
          <tr>
            <td height="4" style="background:#CA8A04;line-height:4px;font-size:4px;">&nbsp;</td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:40px 40px 24px;color:#334155;font-size:14px;line-height:1.6;">
              <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${adminName}</strong>,</p>
              <p style="margin:0 0 20px;">
                We are thrilled to welcome <strong>${tenantName}</strong> to the CybeHMS platform. Your organization account has been successfully provisioned, and your multi-vertical workspace is ready for immediate setup and configurations.
              </p>

              <!-- Credentials Box -->
              <h3 style="margin:28px 0 12px;font-size:16px;color:#1E3A8A;font-weight:600;font-family:'Playfair Display SC',Georgia,serif;letter-spacing:0.5px;">Your Administrator Credentials</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#EFF6FF;border-left:4px solid #CA8A04;border-radius:0 8px 8px 0;font-size:13px;margin-bottom:24px;border-collapse:collapse;">
                <tr>
                  <td style="padding:14px 16px;color:#475569;width:120px;border-bottom:1px solid rgba(30,58,138,0.06);">Organization</td>
                  <td style="padding:14px 16px;color:#1E3A8A;font-weight:600;border-bottom:1px solid rgba(30,58,138,0.06);">${tenantName}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;color:#475569;border-bottom:1px solid rgba(30,58,138,0.06);">Admin Username</td>
                  <td style="padding:14px 16px;color:#1E3A8A;font-weight:600;border-bottom:1px solid rgba(30,58,138,0.06);">${adminEmail}</td>
                </tr>
                <tr>
                  <td style="padding:14px 16px;color:#475569;">Temp Password</td>
                  <td style="padding:14px 16px;color:#E53E3E;font-weight:600;font-family:'Courier New',monospace;font-size:15px;letter-spacing:1px;">${tempPassword}</td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:12px;color:#DC2626;background:#FEF2F2;padding:8px 12px;border-radius:6px;display:inline-block;">
                ⚠️ <strong>Security Notice:</strong> Please reset your password immediately upon accessing the dashboard for the first time.
              </p>

              <!-- Access Button -->
              <div style="text-align:center;margin:32px 0 32px;">
                <a href="${loginUrl}" style="display:inline-block;padding:14px 44px;background:#CA8A04;color:#FFFFFF;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 6px rgba(202,138,4,0.15);transition:all 0.2s ease;">
                  Access EHMS Portal
                </a>
              </div>

              <!-- Workspaces List -->
              ${workspacesTable}

              <!-- Next Steps Instructions -->
              <h3 style="margin:28px 0 12px;font-size:16px;color:#1E3A8A;font-weight:600;font-family:'Playfair Display SC',Georgia,serif;letter-spacing:0.5px;">Getting Started Checklist</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#475569;">
                <tr>
                  <td valign="top" style="padding:6px 0;width:24px;color:#CA8A04;font-weight:bold;">1.</td>
                  <td style="padding:6px 0;">Log in to the dashboard using the workspace URL and temporary password.</td>
                </tr>
                <tr>
                  <td valign="top" style="padding:6px 0;width:24px;color:#CA8A04;font-weight:bold;">2.</td>
                  <td style="padding:6px 0;">Navigate to <strong>Settings</strong> to update your business profile, upload corporate logos, and verify currencies or timezones.</td>
                </tr>
                <tr>
                  <td valign="top" style="padding:6px 0;width:24px;color:#CA8A04;font-weight:bold;">3.</td>
                  <td style="padding:6px 0;">Go to the <strong>Properties</strong> module to configure buildings, floor layout rooms, and customize property feature toggles.</td>
                </tr>
                <tr>
                  <td valign="top" style="padding:6px 0;width:24px;color:#CA8A04;font-weight:bold;">4.</td>
                  <td style="padding:6px 0;">Navigate to <strong>User Management</strong> (Admin panel) to add team members and allocate their role-based scopes.</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;background:#F8FAFC;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#475569;font-weight:600;font-family:'Playfair Display SC',Georgia,serif;">
                CybeHMS &middot; Cybelinx Hospitality Management System
              </p>
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                This is an automated notification from your CybeHMS Provider. Please do not reply directly to this mail.<br>
                For support, contact us at <a href="mailto:support@cybelinx.com" style="color:#3B82F6;text-decoration:none;">support@cybelinx.com</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
