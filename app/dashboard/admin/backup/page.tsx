"use client";

import { useState } from "react";
import { Database, Download, Upload, Clock, CheckCircle, AlertCircle, Loader2, RefreshCw, Server, HardDrive, Activity } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useAdminBackups } from "@/lib/hooks";

export default function BackupPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { backups, isLoading: loadingBackups, mutate: mutateBackups } = useAdminBackups();

  const displayBackups = backups || [];

  async function handleCreateBackup() {
    setIsBackingUp(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ backup_type: "full" }) });
      if (res.ok) {
        setActionFeedback({ type: "success", message: "Full backup initiated successfully" });
        mutateBackups();
      } else {
        const d = await res.json();
        setActionFeedback({ type: "error", message: d.error || "Backup failed" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error initiating backup" });
    } finally {
      setIsBackingUp(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Backup & Restore</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Database backups, restore management, and system recovery</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCreateBackup} disabled={isBackingUp}>
            {isBackingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Create Backup
          </Button>
          <button onClick={() => mutateBackups()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }}>
            <RefreshCw className={`w-4 h-4 ${loadingBackups ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)", color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)", border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}` }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Backups", value: displayBackups.length, icon: Database, color: "var(--color-navy)" },
          { label: "Successful", value: displayBackups.filter((b: any) => b.status === "completed").length, icon: CheckCircle, color: "var(--color-primary)" },
          { label: "Failed", value: displayBackups.filter((b: any) => b.status === "failed").length, icon: AlertCircle, color: "var(--color-danger)" },
          { label: "In Progress", value: displayBackups.filter((b: any) => b.status === "pending" || b.status === "running").length, icon: Clock, color: "var(--color-warning)" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Backup History" subtitle="All backup jobs" />
        {loadingBackups ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-text-faint)" }} /></div>
        ) : displayBackups.length === 0 ? (
          <div className="text-center py-8">
            <Database className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No backup history. Create your first backup.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  {["Type", "Status", "Size", "Started", "Completed", "Error"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 font-medium text-xs uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayBackups.map((b: any) => (
                  <tr key={b.id} className="border-b" style={{ borderColor: "var(--color-light)" }}>
                    <td className="py-2.5 px-3">
                      <span className="font-medium" style={{ color: "var(--color-text)" }}>{b.backup_type}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={b.status === "completed" ? "teal" : b.status === "failed" ? "red" : b.status === "running" ? "amber" : "gray"}>{b.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{b.file_size_bytes ? `${(b.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "—"}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{b.started_at ? new Date(b.started_at).toLocaleString() : "—"}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: "var(--color-text-muted)" }}>{b.completed_at ? new Date(b.completed_at).toLocaleString() : "—"}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: "var(--color-danger)" }}>{b.error_message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Restore Points" subtitle="Available recovery snapshots" />
          <div className="space-y-3">
            {[
              { label: "Auto-backup (Daily)", schedule: "Every 2:00 AM", retention: "30 days", size: "~2.4 GB" },
              { label: "Pre-migration Snapshot", schedule: "17 Jun 2026", retention: "Permanent", size: "~2.1 GB" },
              { label: "Weekly Full Backup", schedule: "Every Sunday 3:00 AM", retention: "12 weeks", size: "~2.4 GB" },
            ].map((rp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{rp.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{rp.schedule} · {rp.retention} · {rp.size}</div>
                </div>
                <Button variant="outline" size="sm"><Upload className="w-3 h-3" /> Restore</Button>
              </div>
            ))}
            <div className="pt-2 text-xs" style={{ color: "var(--color-text-faint)" }}>
              <Clock className="w-3 h-3 inline mr-1" />
              Auto-backup runs daily at 2:00 AM. Last successful: {displayBackups.find((b: any) => b.status === "completed") ? new Date(displayBackups.find((b: any) => b.status === "completed").created_at).toLocaleDateString() : "N/A"}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Storage Overview" subtitle="Backup storage usage" />
          <div className="space-y-4">
            {[
              { label: "Database Backups", used: "3.2 GB", total: "10 GB", pct: 32, color: "var(--color-navy)" },
              { label: "Media Files", used: "8.1 GB", total: "50 GB", pct: 16, color: "var(--color-primary)" },
              { label: "Configuration", used: "12 MB", total: "500 MB", pct: 2, color: "var(--color-warning)" },
              { label: "Logs Archive", used: "450 MB", total: "5 GB", pct: 9, color: "var(--color-primary)" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "var(--color-text)" }}>{s.label}</span>
                  <span style={{ color: "var(--color-text-muted)" }}>{s.used} / {s.total}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "var(--color-border)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <span><HardDrive className="w-3 h-3 inline mr-1" /> Total Used</span>
            <span className="font-semibold" style={{ color: "var(--color-text)" }}>11.7 GB / 65.5 GB (17.9%)</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
