"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Plus, Trash2, Megaphone, Bell, AlertTriangle, ShieldAlert, ExternalLink, Power } from "lucide-react";

interface Broadcast {
  id: string;
  title: string;
  content: string;
  category: "announcement" | "feature" | "advertisement" | "maintenance" | "billing_reminder";
  priority: "normal" | "high" | "urgent";
  target_vertical: string;
  target_tenant_code: string | null;
  action_url: string | null;
  action_label: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function PlatformBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Broadcast["category"]>("announcement");
  const [priority, setPriority] = useState<Broadcast["priority"]>("normal");
  const [targetVertical, setTargetVertical] = useState("all");
  const [targetTenantCode, setTargetTenantCode] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/broadcasts");
      const data = await res.json();
      if (res.ok) {
        setBroadcasts(data.broadcasts || []);
      } else {
        setError(data.error || "Failed to fetch broadcasts");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching broadcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          priority,
          target_vertical: targetVertical,
          target_tenant_code: targetTenantCode.trim() || null,
          action_url: actionUrl.trim() || null,
          action_label: actionLabel.trim() || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setContent("");
        setActionUrl("");
        setActionLabel("");
        setTargetTenantCode("");
        fetchBroadcasts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create broadcast");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error creating broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/broadcasts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        setBroadcasts((prev) =>
          prev.map((b) => (b.id === id ? { ...b, is_active: !currentStatus } : b))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      const res = await fetch(`/api/admin/broadcasts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "feature":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Feature Ad</span>;
      case "billing_reminder":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Billing</span>;
      case "maintenance":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Maintenance</span>;
      case "advertisement":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><Megaphone className="w-3 h-3" /> Promotion</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Bell className="w-3 h-3" /> Announcement</span>;
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case "urgent":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white uppercase tracking-wider">Urgent</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-white uppercase tracking-wider">High</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700 uppercase tracking-wider">Normal</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-1">
            <Megaphone className="w-4 h-4" /> eHMS Service Provider Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-wide">
            Platform Broadcasts & Advertisements
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Publish feature updates, promotional announcements, and billing reminders to tenant dashboards.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg transition-all duration-200 self-start md:self-center"
        >
          <Plus className="w-4 h-4" /> New Broadcast
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Broadcasts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          Loading broadcasts...
        </div>
      ) : broadcasts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-800">No active broadcasts</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Create your first platform announcement or feature promotion to engage your tenant administrators.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {broadcasts.map((b) => (
            <div
              key={b.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md p-6 flex flex-col justify-between ${
                b.is_active ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(b.category)}
                    {getPriorityBadge(b.priority)}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-slate-600 whitespace-pre-line mb-4 line-clamp-3">{b.content}</p>

                {b.action_url && (
                  <a
                    href={b.action_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg mb-4 transition"
                  >
                    {b.action_label || "View Details"} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span>Target: <strong className="text-slate-700 uppercase">{b.target_vertical}</strong></span>
                  {b.target_tenant_code && (
                    <span>Tenant: <strong className="text-slate-700">{b.target_tenant_code}</strong></span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(b.id, b.is_active)}
                    title={b.is_active ? "Deactivate" : "Activate"}
                    className={`p-1.5 rounded-lg transition ${
                      b.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    title="Delete"
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Create Platform Broadcast</h2>
            <p className="text-xs text-slate-500 mb-5">
              This notice will be distributed immediately to target tenant dashboards.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., New AI Feature Released!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detailed announcement content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Broadcast["category"])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="feature">Feature Promotion</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="billing_reminder">Billing Reminder</option>
                    <option value="maintenance">System Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Broadcast["priority"])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Vertical</label>
                  <select
                    value={targetVertical}
                    onChange={(e) => setTargetVertical(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="all">All Verticals</option>
                    <option value="hotels">Hotels</option>
                    <option value="apartments">Serviced Apartments</option>
                    <option value="rental">Apartment Rental</option>
                    <option value="workplace">Workplace Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Specific Tenant Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., VISWA (Leave blank for all)"
                    value={targetTenantCode}
                    onChange={(e) => setTargetTenantCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Action Button Label (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Explore Feature"
                    value={actionLabel}
                    onChange={(e) => setActionLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Action URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
