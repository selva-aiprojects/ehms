"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Loader2, Send, Settings, Users, BarChart3, Plus, Search, CheckCircle, Clock, AlertTriangle, Megaphone, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useJourney } from "@/components/providers/JourneyProvider";

function formatTime(ts: string | null) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
}

export default function WhatsAppPage() {
  const { selectedPropertyId } = useJourney();
  const [tab, setTab] = useState<"conversations" | "templates" | "campaigns" | "config" | "analytics">("conversations");

  // Data
  const [config, setConfig] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  const fetchData = async () => {
    if (!selectedPropertyId) return;
    setLoading(true);
    try {
      const [configRes, convRes, tplRes, campRes] = await Promise.all([
        fetch(`/api/whatsapp/config?property_id=${selectedPropertyId}`),
        fetch(`/api/whatsapp/conversations?property_id=${selectedPropertyId}`),
        fetch(`/api/whatsapp/templates?property_id=${selectedPropertyId}`),
        fetch(`/api/whatsapp/campaigns?property_id=${selectedPropertyId}`),
      ]);

      if (configRes.ok) setConfig(await configRes.json());
      if (convRes.ok) setConversations(await convRes.json());
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (campRes.ok) setCampaigns(await campRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedPropertyId]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    setSending(true);
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedPropertyId,
          conversation_id: selectedConv.id,
          phone_number: selectedConv.phone_number,
          text_body: newMessage,
          message_type: "text",
        }),
      });
      setNewMessage("");
      // Refetch conversation messages
      fetchData();
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConvs = conversations.filter((c: any) =>
    !searchTerm || c.phone_number?.includes(searchTerm) || c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.guest_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMessages = conversations.reduce((sum: number, c: any) => sum + (Number(c.unread_count) || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(37,211,102,0.10)" }}>
            <MessageSquare className="w-5 h-5" style={{ color: "#25D366" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>WhatsApp Business</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>
              {config?.enabled ? "Connected" : "Not configured"} · {conversations.length} conversations
            </p>
          </div>
        </div>
        {!config?.enabled && (
          <Button onClick={() => setTab("config")} size="sm">
            <Settings className="w-3.5 h-3.5" /> Configure
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Active Chats</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "#25D366" }}>{conversations.filter((c: any) => c.status === "active").length}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Unread Messages</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: totalMessages > 0 ? "#F59E0B" : "#10B981" }}>{totalMessages}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Templates</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "#3B82F6" }}>{templates.length}</p>
        </Card>
        <Card>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>Campaigns</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: "#8B5CF6" }}>{campaigns.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#F1F5F9", width: "fit-content" }}>
        {(["conversations", "templates", "campaigns", "analytics", "config"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${tab === t ? "bg-white shadow-sm" : ""}`}
            style={{ color: tab === t ? "#1A3C5E" : "#64748B" }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Conversations Tab */}
      {tab === "conversations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: "500px" }}>
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <Card padding={false}>
              <div className="p-3 border-b" style={{ borderColor: "#E2E8F0" }}>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#94A3B8" }} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>
              </div>
              <div className="divide-y max-h-[450px] overflow-y-auto" style={{ borderColor: "#E2E8F0" }}>
                {loading ? (
                  <div className="py-8 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#25D366" }} />
                  </div>
                ) : filteredConvs.length === 0 ? (
                  <div className="py-8 text-center">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
                    <p className="text-xs" style={{ color: "#94A3B8" }}>No conversations</p>
                  </div>
                ) : (
                  filteredConvs.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConv(c)}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition-colors cursor-pointer ${selectedConv?.id === c.id ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: "#1A3C5E" }}>
                          {c.guest_name || c.contact_name || c.phone_number}
                        </span>
                        <span className="text-[10px]" style={{ color: "#94A3B8" }}>{formatTime(c.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] truncate" style={{ color: "#64748B" }}>{c.last_message_preview || "No messages"}</p>
                        {Number(c.unread_count) > 0 && (
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#25D366" }}>
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card padding={false} className="h-full flex flex-col">
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "#E2E8F0" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#25D366" }}>
                      {(selectedConv.guest_name || selectedConv.phone_number || "?")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{selectedConv.guest_name || selectedConv.contact_name || selectedConv.phone_number}</p>
                      <p className="text-[10px]" style={{ color: "#94A3B8" }}>{selectedConv.phone_number} · {selectedConv.status}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ background: "#F0FDF4", minHeight: "300px" }}>
                    <div className="text-center">
                      <span className="text-[10px] px-3 py-1 rounded-full" style={{ background: "rgba(37,211,102,0.10)", color: "#25D366" }}>
                        Conversation started
                      </span>
                    </div>
                    {/* Placeholder messages */}
                    <div className="flex justify-start">
                      <div className="max-w-[70%] p-3 rounded-xl text-xs" style={{ background: "white", color: "#1A3C5E" }}>
                        <p>Start typing to send a message to this guest.</p>
                        <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>WhatsApp Business API integration ready</p>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t flex items-center gap-2" style={{ borderColor: "#E2E8F0" }}>
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 text-xs border rounded-lg px-3 py-2"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50"
                      style={{ background: "#25D366" }}
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="text-center">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
                    <p className="text-sm" style={{ color: "#94A3B8" }}>Select a conversation</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {tab === "templates" && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Message Templates</h3>
            <Button size="sm"><Plus className="w-3.5 h-3.5" /> New Template</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {templates.map((tpl: any) => (
              <div key={tpl.id} className="border rounded-xl p-4 hover:shadow-sm transition-shadow" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{tpl.name}</span>
                  <Badge variant={tpl.status === "approved" ? "teal" : tpl.status === "pending" ? "amber" : "gray"}>
                    {tpl.status}
                  </Badge>
                </div>
                <p className="text-[10px] mb-2" style={{ color: "#64748B" }}>{tpl.category}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#1A3C5E" }}>
                  {tpl.body_text?.slice(0, 150)}{tpl.body_text?.length > 150 ? "..." : ""}
                </p>
                {tpl.variables && tpl.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tpl.variables.map((v: any, i: number) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50" style={{ color: "#3B82F6" }}>{`{{${i + 1}}}`}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {templates.length === 0 && (
              <div className="col-span-full py-8 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
                <p className="text-sm" style={{ color: "#94A3B8" }}>No templates yet. Configure WhatsApp to get started.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Campaigns Tab */}
      {tab === "campaigns" && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>Broadcast Campaigns</h3>
            <Button size="sm"><Plus className="w-3.5 h-3.5" /> New Campaign</Button>
          </div>
          {campaigns.length === 0 ? (
            <div className="py-12 text-center">
              <Megaphone className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
              <p className="text-sm" style={{ color: "#94A3B8" }}>No campaigns yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: "#F5F7FA" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Campaign</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Template</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Status</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Recipients</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Sent</th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Read</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "#E2E8F0" }}>
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "#1A3C5E" }}>{c.name}</td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "#64748B" }}>{c.template_name || "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={c.status === "completed" ? "teal" : c.status === "sending" ? "amber" : "gray"}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#1A3C5E" }}>{c.recipient_count}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#3B82F6" }}>{c.sent_count}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#10B981" }}>{c.read_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Analytics Tab */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3C5E" }}>Message Volume (7 days)</h3>
            <div className="h-48 flex items-end gap-1">
              {[35, 42, 28, 55, 63, 48, 37].map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t" style={{ height: `${v * 2}px`, background: "#25D366" }} />
                  <span className="text-[9px]" style={{ color: "#94A3B8" }}>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#1A3C5E" }}>Response Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#64748B" }}>Avg Response Time</span>
                <span className="text-xs font-bold" style={{ color: "#1A3C5E" }}>4.2 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#64748B" }}>Messages Sent Today</span>
                <span className="text-xs font-bold" style={{ color: "#3B82F6" }}>37</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#64748B" }}>Delivery Rate</span>
                <span className="text-xs font-bold" style={{ color: "#10B981" }}>98.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#64748B" }}>Read Rate</span>
                <span className="text-xs font-bold" style={{ color: "#10B981" }}>82.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: "#64748B" }}>Template Usage</span>
                <span className="text-xs font-bold" style={{ color: "#8B5CF6" }}>12 today</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Config Tab */}
      {tab === "config" && (
        <ConfigPanel config={config} propertyId={selectedPropertyId} onSaved={fetchData} />
      )}
    </div>
  );
}

function ConfigPanel({ config, propertyId, onSaved }: { config: any; propertyId: string | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    enabled: config?.enabled || false,
    provider: config?.provider || "meta",
    phone_number_id: config?.phone_number_id || "",
    whatsapp_business_id: config?.whatsapp_business_id || "",
    access_token: config?.access_token || "",
    webhook_verify_token: config?.webhook_verify_token || "",
    display_name: config?.display_name || "",
    auto_welcome: config?.auto_welcome ?? true,
    auto_checkin_reminder: config?.auto_checkin_reminder ?? true,
    auto_checkout_reminder: config?.auto_checkout_reminder ?? true,
    auto_feedback_request: config?.auto_feedback_request ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!propertyId) return;
    setSaving(true);
    try {
      await fetch("/api/whatsapp/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, ...form }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>WhatsApp Business Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Provider</label>
            <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }}>
              <option value="meta">Meta (WhatsApp Business API)</option>
              <option value="twilio">Twilio</option>
              <option value="gupshup">Gupshup</option>
              <option value="360dialog">360dialog</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Phone Number ID</label>
            <input value={form.phone_number_id} onChange={(e) => setForm({ ...form, phone_number_id: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }} placeholder="From Meta dashboard" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>WhatsApp Business ID</label>
            <input value={form.whatsapp_business_id} onChange={(e) => setForm({ ...form, whatsapp_business_id: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Access Token</label>
            <input type="password" value={form.access_token} onChange={(e) => setForm({ ...form, access_token: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }} placeholder="EAA..." />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Webhook Verify Token</label>
            <input value={form.webhook_verify_token} onChange={(e) => setForm({ ...form, webhook_verify_token: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Display Name</label>
            <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }} />
          </div>
        </div>

        <hr style={{ borderColor: "#E2E8F0" }} />

        <h4 className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>Auto-Messaging</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { key: "auto_welcome", label: "Welcome Message" },
            { key: "auto_checkin_reminder", label: "Check-in Reminder" },
            { key: "auto_checkout_reminder", label: "Check-out Reminder" },
            { key: "auto_feedback_request", label: "Feedback Request" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setForm({ ...form, [key]: !form[key as keyof typeof form] })}
              className={`p-2 rounded-lg border-2 text-xs font-medium cursor-pointer transition-all ${form[key as keyof typeof form] ? "border-green-400 bg-green-50" : "border-gray-200"}`}
              style={{ color: form[key as keyof typeof form] ? "#10B981" : "#94A3B8" }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Configuration"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
