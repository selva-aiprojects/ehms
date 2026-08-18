"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  FileText, Upload, Download, Search, Filter, Trash2,
  AlertCircle, Loader2, RefreshCw, Plus, X, Check, Save
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { usePolicyDocuments } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

interface PolicyDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  department: string;
  version: string;
  effective_date: string;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_content: string;
  created_at: string;
}

const CATEGORIES = ["all", "policy", "form", "handbook", "compliance", "training"];

const CATEGORY_COLORS: Record<string, string> = {
  policy: "var(--color-navy)",
  form: "var(--color-primary)",
  handbook: "var(--color-warning)",
  compliance: "var(--color-danger)",
  training: "#8B5CF6",
};

const EMPTY_FORM = {
  title: "", category: "policy", description: "",
  department: "", effective_date: "", version: "1.0",
};

export default function PolicyDocumentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formData, setFormData] = useState<Record<string, any>>({ ...EMPTY_FORM });
  const [fileData, setFileData] = useState<{ content: string; name: string; type: string; size: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { policyDocuments, isLoading, isError, mutate } = usePolicyDocuments(categoryFilter !== "all" ? categoryFilter : undefined);
  const documents = policyDocuments || [];

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      setFileData({ content: base64, name: file.name, type: file.type, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!formData.title || !fileData) {
      setFeedback({ type: "error", message: "Title and file are required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/hr/policy-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          file_name: fileData.name,
          file_type: fileData.type,
          file_size: fileData.size,
          file_content: fileData.content,
        }),
      });
      if (!res.ok) throw new Error("Upload failed");
      setFeedback({ type: "success", message: "Document uploaded successfully" });
      setShowForm(false);
      setFormData({ ...EMPTY_FORM });
      setFileData(null);
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to upload document" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (doc: PolicyDocument) => {
    const byteChars = atob(doc.file_content);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNums[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNums);
    const blob = new Blob([byteArray], { type: doc.file_type || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name || `${doc.title}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const categoryBadge = (cat: string) => {
    const color = CATEGORY_COLORS[cat] || "var(--color-text-muted)";
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-4" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Policy Documents</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Upload, browse, and download HR policy documents</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ background: "var(--color-primary)" }}
          >
            {showForm ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            {showForm ? "Cancel" : "Upload Document"}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(var(--color-primary-rgb),0.08)" : "rgba(var(--color-danger-rgb),0.08)",
          color: feedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
          border: feedback.type === "success" ? "1px solid rgba(var(--color-primary-rgb),0.2)" : "1px solid rgba(var(--color-danger-rgb),0.2)",
        }}>
          {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Failed to load documents.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader title="Upload Policy Document" subtitle="Fill in the details and select a file" />
          <div className="p-6 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Title *</label>
                <input
                  type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Category</label>
                <select
                  value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "var(--color-text)" }}
                >
                  {CATEGORIES.filter((c) => c !== "all").map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Department</label>
                <input
                  type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Version</label>
                <input
                  type="text" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Effective Date</label>
                <input
                  type="date" value={formData.effective_date} onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                  style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Description</label>
              <textarea
                rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%", resize: "vertical" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>File *</label>
              <div style={{ border: "1px dashed var(--color-border-strong)", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
                <input type="file" onChange={handleFileChange} />
                {fileData && (
                  <p className="text-xs mt-2" style={{ color: "var(--color-primary)" }}>{fileData.name} ({(fileData.size / 1024).toFixed(1)} KB)</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowForm(false); setFileData(null); }}
                className="px-4 py-1.5 rounded-lg text-xs font-medium"
                style={{ color: "var(--color-text-muted)", background: "var(--color-light)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                style={{ background: "var(--color-primary)" }}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Document Repository"
          subtitle={`${documents.length} documents`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                <select
                  value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-light)", color: "var(--color-text)" }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c === "all" ? "All Categories" : c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No documents found</p>
          </div>
        ) : (
          <Table
            data={documents}
            keyExtractor={(d: any) => d.id}
            columns={[
              { key: "title", header: "Title", render: (d: any) => (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" style={{ color: "var(--color-navy)" }} />
                  <span className="font-medium text-sm">{d.title}</span>
                </div>
              )},
              { key: "category", header: "Category", render: (d: any) => categoryBadge(d.category) },
              { key: "department", header: "Department", render: (d: any) => (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{d.department || "—"}</span>
              )},
              { key: "version", header: "Version", render: (d: any) => (
                <span className="text-xs font-mono" style={{ color: "var(--color-text-muted)" }}>v{d.version || "1.0"}</span>
              )},
              { key: "effective_date", header: "Effective Date", render: (d: any) => (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{d.effective_date ? new Date(d.effective_date).toLocaleDateString() : "—"}</span>
              )},
              { key: "uploaded_by", header: "Uploaded By", render: (d: any) => (
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{d.uploaded_by || "—"}</span>
              )},
              { key: "actions", header: "Actions", render: (d: any) => (
                <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => handleDownload(d)} className="p-1 rounded hover:bg-gray-100" title="Download">
                    <Download className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                  </button>
                </div>
              )},
            ]}
          />
        )}
      </Card>
    </div>
  );
}
