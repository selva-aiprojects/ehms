"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Users, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Star, CheckCircle, Clock, User, Phone, Mail, Building
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useEmployees, useHKStats, useDepartments } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full" style={{ background: "#CBD5E1" }} />
        <div><div className="w-24 h-4 rounded mb-1" style={{ background: "#CBD5E1" }} /><div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} /></div>
      </div>
      <div className="w-full h-2 rounded mb-2" style={{ background: "#CBD5E1" }} />
      <div className="flex gap-2"><div className="w-16 h-5 rounded" style={{ background: "#CBD5E1" }} /><div className="w-16 h-5 rounded" style={{ background: "#CBD5E1" }} /></div>
    </div>
  );
}

export default function HKStaffPage() {
  const [search, setSearch] = useState("");
  const [staffPerformance, setStaffPerformance] = useState<any[]>([]);
  const [perfLoading, setPerfLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { departments } = useDepartments();
  const hkDept = (departments || []).find((d: any) => d.name?.toLowerCase().includes("housekeeping") || d.code?.toLowerCase() === "hk");
  const { employees, isLoading, isError, mutate } = useEmployees(search || undefined, hkDept?.id || undefined);
  const { hkStats, mutate: mutateStats } = useHKStats();

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    fetch("/api/housekeeping/stats")
      .then((r) => r.json())
      .then((data) => {
        const perf = data?.staff_performance || data?.data?.staff_performance || [];
        setStaffPerformance(Array.isArray(perf) ? perf : []);
      })
      .catch(() => {})
      .finally(() => setPerfLoading(false));
  }, []);

  const displayEmployees = employees || [];
  const performanceMap = new Map<string, any>();
  staffPerformance.forEach((sp: any) => {
    performanceMap.set(sp.employee_id || sp.id || sp.name?.toLowerCase(), sp);
  });

  const isLoadingDisplay = isLoading && !employees;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Staff Performance</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Housekeeping team productivity and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <button onClick={() => { mutate(); mutateStats(); setPerfLoading(true); fetch("/api/housekeeping/stats").then(r => r.json()).then(data => { const perf = data?.staff_performance || data?.data?.staff_performance || []; setStaffPerformance(Array.isArray(perf) ? perf : []); }).catch(() => {}).finally(() => setPerfLoading(false)); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Failed to load staff data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(43,174,142,0.08)" : "rgba(229,62,62,0.08)",
          color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: feedback.type === "success" ? "1px solid rgba(43,174,142,0.2)" : "1px solid rgba(229,62,62,0.2)",
        }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{displayEmployees.length}</div>
            <Users className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Staff</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{hkStats?.completed_today ?? staffPerformance.reduce((a: number, s: any) => a + (s.completed_tasks || 0), 0)}</div>
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Completed Today</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold">{hkStats?.in_progress ?? 0}</div>
            <Clock className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">In Progress</div>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#F5F7FA" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>
              {staffPerformance.length > 0 ? (staffPerformance.reduce((a: number, s: any) => a + (s.avg_rating || 0), 0) / staffPerformance.length).toFixed(1) : "—"}
            </div>
            <Star className="w-5 h-5" style={{ color: "#64748B" }} />
          </div>
          <div className="text-xs" style={{ color: "#64748B" }}>Avg Rating</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Staff Performance Cards"
          subtitle="Individual productivity metrics"
          action={
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}
              />
            </div>
          }
        />
        {isLoadingDisplay || perfLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No staff found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayEmployees.map((emp: any, i: number) => {
              const perf = performanceMap.get(emp.id) || performanceMap.get(emp.user_id) || {};
              const completed = perf.completed_tasks ?? perf.completed ?? 0;
              const avgRating = perf.avg_rating ?? perf.rating ?? "—";
              const status = perf.current_status || "available";
              const initials = ((emp.user?.first_name?.[0] || "") + (emp.user?.last_name?.[0] || "")).toUpperCase() || "?";
              return (
                <div key={emp.id} className="rounded-xl p-4 transition-all hover:shadow-md" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: "#1A3C5E" }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>
                        {emp.user ? `${emp.user.first_name} ${emp.user.last_name || ""}` : emp.name || emp.employee_code || "Staff"}
                      </div>
                      <div className="text-xs" style={{ color: "#64748B" }}>{emp.designation || "—"}</div>
                    </div>
                    <Badge variant={status === "available" || status === "active" ? "teal" : status === "busy" ? "amber" : "gray"}>
                      {status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs mb-3" style={{ color: "#64748B" }}>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" style={{ color: "#2BAE8E" }} /> {completed} done</span>
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" style={{ color: "#F5A623" }} /> {avgRating}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(completed * 25, 100)}%`, background: "#2BAE8E" }} />
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "#64748B" }}>
                    {emp.user?.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" /> {emp.user.email}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Staff Overview"
          subtitle={`${displayEmployees.length} housekeeping staff`}
        />
        {isLoadingDisplay ? (
          <div className="space-y-1">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : displayEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No staff data</p>
          </div>
        ) : (
          <Table
            data={displayEmployees}
            keyExtractor={(e: any) => e.id}
            columns={[
              { key: "name", header: "Staff Name", render: (e: any) => (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1A3C5E" }}>
                    {((e.user?.first_name?.[0] || "") + (e.user?.last_name?.[0] || "")).toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-sm">{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.name || e.employee_code || "—"}</span>
                </div>
              )},
              { key: "completed", header: "Completed Tasks", render: (e: any) => {
                const p = performanceMap.get(e.id) || performanceMap.get(e.user_id) || {};
                return <span className="text-sm">{p.completed_tasks ?? p.completed ?? 0}</span>;
              }},
              { key: "rating", header: "Avg Rating", render: (e: any) => {
                const p = performanceMap.get(e.id) || performanceMap.get(e.user_id) || {};
                const r = p.avg_rating ?? p.rating;
                return (
                  <span className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3" style={{ color: r >= 4 ? "#2BAE8E" : r >= 3 ? "#F5A623" : "#E53E3E" }} />
                    {r != null ? r : "—"}
                  </span>
                );
              }},
              { key: "status", header: "Current Status", render: (e: any) => {
                const p = performanceMap.get(e.id) || performanceMap.get(e.user_id) || {};
                const st = p.current_status || (e.is_active !== false ? "active" : "inactive");
                return <Badge variant={st === "active" || st === "available" ? "teal" : st === "busy" ? "amber" : "gray"}>{st.replace(/_/g, " ")}</Badge>;
              }},
              { key: "designation", header: "Role", render: (e: any) => <span className="text-xs" style={{ color: "#64748B" }}>{e.designation || "—"}</span> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
