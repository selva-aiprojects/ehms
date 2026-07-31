"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Loader2, AlertCircle, RefreshCw
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "rgba(var(--color-primary-rgb),0.08)", text: "var(--color-primary)" },
  in_progress: { bg: "rgba(var(--color-info-rgb),0.08)", text: "var(--color-info)" },
  awaiting_tenant: { bg: "rgba(var(--color-warning-rgb),0.08)", text: "var(--color-warning)" },
  resolved: { bg: "rgba(var(--color-text-muted-rgb),0.08)", text: "var(--color-text-muted)" },
  closed: { bg: "rgba(var(--color-danger-rgb),0.08)", text: "var(--color-danger)" },
};

interface TicketMessage {
  id: string;
  sender_type: "admin" | "tenant" | "system";
  sender_name: string;
  sender_email: string;
  message: string;
  created_at: string;
}

interface TicketDetail {
  id: string;
  tenant_code: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  messages: TicketMessage[];
}

export default function TenantTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const ticketId = params.id as string;

  function loadTicket() {
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ticket) setTicket(data.ticket);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (ticketId) loadTicket(); }, [ticketId]);

  async function handleSendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        loadTicket();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to send");
      }
    } catch {
      alert("Network error");
    }
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error || "Ticket not found"}</p>
        <button onClick={() => router.push("/dashboard/tickets")}
          className="mt-3 text-sm font-medium" style={{ color: "var(--color-primary)" }}
        >&larr; Back to tickets</button>
      </div>
    );
  }

  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;

  return (
    <div>
      <button onClick={() => router.push("/dashboard/tickets")}
        className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </button>

      <div className="rounded-xl p-5 mb-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-navy)" }}>{ticket.subject}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-mono font-semibold" style={{ color: "var(--color-primary)" }}>{ticket.tenant_code}</span>
              <span>Created {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              <span>Updated {new Date(ticket.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RefreshCw className="w-4 h-4 cursor-pointer" style={{ color: "var(--color-text-faint)" }} onClick={loadTicket} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium"
            style={{ background: sc.bg, color: sc.text }}
          >
            {ticket.status.replace("_", " ")}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{ticket.category}</span>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Priority: {ticket.priority}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {ticket.description && (
            <div className="rounded-xl p-4" style={{ background: "var(--color-light)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-navy)" }}>{ticket.description}</p>
            </div>
          )}

          {ticket.messages && ticket.messages.length > 0 && (
            <div className="space-y-2">
              {ticket.messages.map((msg) => {
                const isAdmin = msg.sender_type === "admin";
                const isSystem = msg.sender_type === "system";
                return (
                  <div key={msg.id}
                    className="rounded-xl p-4"
                    style={{
                      background: isSystem ? "rgba(var(--color-text-muted-rgb),0.04)" : "var(--color-white)",
                      border: `1px solid var(--color-border)`,
                      borderLeft: `3px solid ${isAdmin ? "var(--color-primary)" : isSystem ? "var(--color-text-faint)" : "var(--color-info)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: isAdmin ? "var(--color-primary)" : isSystem ? "var(--color-text-muted)" : "var(--color-info)" }}>
                        {isAdmin ? "Support Team" : isSystem ? "System" : "You"}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-faint)" }}>
                        {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-navy)" }}>{msg.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <div className="rounded-xl p-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                rows={3} placeholder="Type your reply..."
                className="w-full text-sm resize-none outline-none"
                style={{ color: "var(--color-navy)" }}
              />
              <div className="flex items-center justify-end mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                <button onClick={handleSendReply} disabled={sending || !replyText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
                >
                  {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send Reply
                </button>
              </div>
            </div>
          )}

          {(ticket.status === "resolved" || ticket.status === "closed") && (
            <div className="rounded-xl p-4 text-center" style={{ background: "rgba(var(--color-text-muted-rgb),0.04)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                This ticket is {ticket.status}. No further replies can be sent.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-faint)" }}>Ticket Info</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Status</span>
                <span className="font-medium" style={{ color: sc.text }}>{ticket.status.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Priority</span>
                <span style={{ color: "var(--color-navy)" }}>{ticket.priority}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Category</span>
                <span style={{ color: "var(--color-navy)" }}>{ticket.category}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Messages</span>
                <span style={{ color: "var(--color-navy)" }}>{ticket.messages?.length || 0}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-muted)" }}>Resolved</span>
                  <span className="text-xs" style={{ color: "var(--color-navy)" }}>
                    {new Date(ticket.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
