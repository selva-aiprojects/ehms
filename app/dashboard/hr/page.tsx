"use client";

import { useState, useEffect } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Users, AlertCircle, Loader2, RefreshCw, Search as SearchIcon, Calendar, Clock, BadgePercent, UserCheck, UserX, Briefcase, Mail, Phone, MapPin, Award, BookOpen, GraduationCap, LineChart, ListTodo, Star, UserPlus, UserMinus, ClipboardList, PieChart, TrendingUp, DollarSign, Settings } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useEmployees } from "@/lib/hooks";

const MOCK_EMPLOYEES = [
  { employee_code: "EMP-001", name: "Rajesh Mehta", dept: "Management", designation: "Property Manager", attendance_pct: 94, status: "active" },
  { employee_code: "EMP-042", name: "Priya Sharma", dept: "Front Office", designation: "Front Desk Exec", attendance_pct: 97, status: "active" },
  { employee_code: "EMP-087", name: "Ravi Kumar", dept: "Housekeeping", designation: "HK Staff", attendance_pct: 91, status: "active" },
  { employee_code: "EMP-103", name: "Suresh K.", dept: "Maintenance", designation: "Maint. Staff", attendance_pct: 88, status: "active" },
  { employee_code: "EMP-056", name: "Anita Desai", dept: "Finance", designation: "Finance Manager", attendance_pct: 99, status: "active" },
  { employee_code: "EMP-089", name: "Meena Pillai", dept: "Housekeeping", designation: "HK Supervisor", attendance_pct: 96, status: "active" },
  { employee_code: "EMP-034", name: "Arjun Sharma", dept: "Maintenance", designation: "Maint. Supervisor", attendance_pct: 93, status: "active" },
  { employee_code: "EMP-112", name: "Priya Nair", dept: "Human Resources", designation: "HR Manager", attendance_pct: 98, status: "active" },
  { employee_code: "EMP-067", name: "Vikram Iyer", dept: "Finance", designation: "Finance Executive", attendance_pct: 95, status: "active" },
  { employee_code: "EMP-023", name: "Kavya Menon", dept: "Front Office", designation: "Night Auditor", attendance_pct: 90, status: "active" },
];

const SHIFT_DATA = [
  { shift: "Morning (6A - 2P)", staff: 22, dept: "HK, Kitchen, Front Desk" },
  { shift: "Afternoon (2P - 10P)", staff: 18, dept: "Front Desk, Maintenance" },
  { shift: "Night (10P - 6A)", staff: 8, dept: "Security, Night Audit" },
];

const COMPLIANCE_DATA = [
  { label: "PF (Provident Fund)", amount: "\u20B91,85,000", status: "Processed" },
  { label: "ESI", amount: "\u20B942,000", status: "Processed" },
  { label: "Professional Tax", amount: "\u20B98,500", status: "Pending" },
  { label: "TDS", amount: "\u20B92,10,000", status: "Due" },
];

const RECRUITMENT_PIPELINE = [
  { stage: "Sourced", count: 48, color: "var(--color-text-faint)" },
  { stage: "Screened", count: 32, color: "var(--color-text-muted)" },
  { stage: "Interviewing", count: 18, color: "var(--color-warning)" },
  { stage: "Offered", count: 8, color: "var(--color-primary)" },
  { stage: "Hired", count: 5, color: "var(--color-navy)" },
];

const TRAINING_SESSIONS = [
  { title: "Hospitality Excellence", date: "22 Jun 2026", time: "10:00 AM - 1:00 PM", dept: "Front Office", enrolled: 12, status: "upcoming" as const },
  { title: "Fire Safety & Evacuation", date: "25 Jun 2026", time: "2:00 PM - 4:00 PM", dept: "All Staff", enrolled: 30, status: "upcoming" as const },
  { title: "POS System Upgrade", date: "28 Jun 2026", time: "9:00 AM - 12:00 PM", dept: "F&B, Front Desk", enrolled: 8, status: "upcoming" as const },
  { title: "Leadership Workshop", date: "05 Jul 2026", time: "10:00 AM - 5:00 PM", dept: "Management", enrolled: 6, status: "planned" as const },
  { title: "First Aid Certification", date: "10 Jul 2026", time: "9:00 AM - 4:00 PM", dept: "All Staff", enrolled: 20, status: "planned" as const },
];

const LEAVE_BALANCES = [
  { type: "Annual Leave", total: 18, used: 7, remaining: 11 },
  { type: "Sick Leave", total: 12, used: 4, remaining: 8 },
  { type: "Casual Leave", total: 10, used: 6, remaining: 4 },
  { type: "Personal Leave", total: 6, used: 2, remaining: 4 },
  { type: "Maternity Leave", total: 26, used: 0, remaining: 26 },
  { type: "Comp Off", total: 8, used: 3, remaining: 5 },
];

const TOP_PERFORMERS = [
  { name: "Priya Sharma", dept: "Front Office", rating: 4.9, badge: "Excellent", achievements: 12 },
  { name: "Anita Desai", dept: "Finance", rating: 4.8, badge: "Excellent", achievements: 9 },
  { name: "Rajesh Mehta", dept: "Management", rating: 4.7, badge: "Excellent", achievements: 15 },
  { name: "Meena Pillai", dept: "Housekeeping", rating: 4.6, badge: "Great", achievements: 8 },
  { name: "Vikram Iyer", dept: "Finance", rating: 4.5, badge: "Great", achievements: 6 },
  { name: "Arjun Sharma", dept: "Maintenance", rating: 4.4, badge: "Great", achievements: 7 },
  { name: "Kavya Menon", dept: "Front Office", rating: 4.3, badge: "Good", achievements: 5 },
];

const PAYROLL_HISTORY = [
  { run: "PR-2026-06", period: "1-15 Jun 2026", amount: "\u20B96,25,000", employees: 48, status: "completed" as const },
  { run: "PR-2026-05", period: "16-31 May 2026", amount: "\u20B96,18,500", employees: 48, status: "completed" as const },
  { run: "PR-2026-04", period: "1-15 May 2026", amount: "\u20B96,22,000", employees: 47, status: "completed" as const },
  { run: "PR-2026-03", period: "16-30 Apr 2026", amount: "\u20B96,10,000", employees: 47, status: "completed" as const },
  { run: "PR-2026-02", period: "1-15 Apr 2026", amount: "\u20B96,05,000", employees: 46, status: "completed" as const },
];

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

export default function HRPage() {
  const [search, setSearch] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { employees, isLoading, isError, mutate } = useEmployees(search || undefined);

  const displayEmployees = (employees as any[]) || [];
  const isLoadingDisplay = isLoading && !employees;

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const activeEmployees = displayEmployees.filter((e: any) => e.status === "active");
  const uniqueDepts = [...new Set(displayEmployees.map((e: any) => e.dept || e.department?.name || ""))].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>HRMS & Payroll</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Attendance, shifts, payroll & statutory compliance</p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--color-light)", color: "var(--color-text-muted)" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Syncing
            </div>
          )}
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Could not load live employee data. Displaying mock data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {isLoadingDisplay ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "var(--color-border)" }}>
              <div className="w-12 h-8 rounded mb-2" style={{ background: "var(--color-border-strong)" }} />
              <div className="w-16 h-3 rounded" style={{ background: "var(--color-border-strong)" }} />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-navy)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{activeEmployees.length}</div>
                <Users className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Total Employees</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-primary)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{displayEmployees.length === 0 ? 0 : 52}</div>
                <UserCheck className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">On Duty Today</div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--color-warning)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{displayEmployees.length === 0 ? 0 : 8}</div>
                <UserX className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>On Leave</div>
            </div>
            <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-primary)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl font-bold">{displayEmployees.length === 0 ? "₹0" : "₹12.5L"}</div>
                <Briefcase className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">Payroll MTD</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Directory", icon: Users, href: "/dashboard/hr/employees", color: "var(--color-navy)" },
          { label: "Timesheets", icon: Clock, href: "/dashboard/hr/timesheet", color: "var(--color-primary)" },
          { label: "Leave", icon: Calendar, href: "/dashboard/hr/leave", color: "var(--color-warning)" },
          { label: "Payroll", icon: DollarSign, href: "/dashboard/hr/payroll", color: "var(--color-danger)" },
          { label: "Compliance", icon: BadgePercent, href: "/dashboard/hr/compliance", color: "var(--color-primary)" },
          { label: "Shifts", icon: Clock, href: "/dashboard/hr/shifts", color: "var(--color-text-muted)" },
          { label: "Settings", icon: Settings, href: "/dashboard/hr/settings", color: "var(--color-navy)" },
        ].map((item) => (
          <a key={item.label} href={item.href}
            className="flex flex-col items-center justify-center p-3 rounded-xl text-center transition-all hover:scale-105"
            style={{ background: `${item.color}10`, color: item.color }}>
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </a>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Employee Directory"
          subtitle={`${activeEmployees.length} active \u00B7 ${uniqueDepts.length} departments`}
          action={
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                style={{ borderColor: "var(--color-border)", background: "var(--color-light)" }}
              />
            </div>
          }
        />
        {isLoadingDisplay ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : displayEmployees.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No employees found</p>
          </div>
        ) : (
          <Table
            data={displayEmployees}
            keyExtractor={(e) => e.employee_code || e.id || Math.random().toString()}
            columns={[
              { key: "employee_code", header: "Code", render: (e) => <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{e.employee_code}</span> },
              { key: "name", header: "Name", render: (e) => <span className="font-medium text-sm">{e.name || `${e.user?.first_name || ""} ${e.user?.last_name || ""}`}</span> },
              { key: "dept", header: "Department", render: (e) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{e.dept || e.department?.name || "\u2014"}</span> },
              { key: "designation", header: "Role", render: (e) => <span className="text-xs">{e.designation || "\u2014"}</span> },
              { key: "attendance_pct", header: "Attendance", render: (e) => (
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${e.attendance_pct || 0}%`, background: (e.attendance_pct || 0) >= 90 ? "var(--color-primary)" : (e.attendance_pct || 0) >= 75 ? "var(--color-warning)" : "var(--color-danger)" }} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{e.attendance_pct || e.attendance || 0}%</span>
                </div>
              )},
              { key: "status", header: "Status", render: () => <Badge variant="teal">Active</Badge> },
            ]}
          />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Shift Schedule" subtitle="Today" />
          <div className="space-y-3">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No active shifts scheduled</div>
            ) : (
              SHIFT_DATA.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 text-sm" style={{ borderBottom: i < SHIFT_DATA.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                      <span className="font-medium" style={{ color: "var(--color-text)" }}>{s.shift}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.dept}</div>
                  </div>
                  <Badge variant="teal">{s.staff} staff</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Statutory Compliance" subtitle="This month" />
          <div className="space-y-3 text-sm">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No compliance data recorded</div>
            ) : (
              COMPLIANCE_DATA.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < COMPLIANCE_DATA.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                  <div className="flex items-center gap-2">
                    <BadgePercent className="w-4 h-4" style={{ color: i < 2 ? "var(--color-primary)" : i < 3 ? "var(--color-warning)" : "var(--color-danger)" }} />
                    <span style={{ color: "var(--color-text)" }}>{c.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium" style={{ color: "var(--color-navy)" }}>{c.amount}</span>
                    <Badge variant={c.status === "Processed" ? "teal" : c.status === "Pending" ? "amber" : "red"}>{c.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Department Overview" subtitle="Headcount by department" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
          {["Front Office", "Housekeeping", "Maintenance", "Finance", "HR", "F&B"].map((dept) => {
            const count = displayEmployees.filter((e: any) => (e.dept || e.department?.name) === dept).length;
            return (
               <div key={dept} className="p-3 rounded-lg text-center" style={{ background: "var(--color-light)" }}>
                 <div className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{count || "—"}</div>
                 <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{dept}</div>
               </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Recruitment Pipeline" subtitle="Active openings - June 2026" />
          <div className="space-y-3">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No active job openings</div>
            ) : (
              RECRUITMENT_PIPELINE.map((stage, i) => {
                const pct = (stage.count / RECRUITMENT_PIPELINE[0].count) * 100;
                return (
                  <div key={stage.stage} className="flex items-center gap-3 text-sm">
                    <div className="w-24 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{stage.stage}</div>
                    <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--color-border)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: stage.color }} />
                    </div>
                    <div className="w-8 text-right font-bold text-xs" style={{ color: "var(--color-text)" }}>{stage.count}</div>
                  </div>
                );
              })
            )}
          </div>
          {displayEmployees.length > 0 && (
            <div className="mt-4 pt-3 grid grid-cols-2 gap-2 text-xs" style={{ borderTop: "1px solid var(--color-border)" }}>
              <div className="p-2 rounded text-center" style={{ background: "var(--color-light)" }}>
                <div className="font-bold" style={{ color: "var(--color-navy)" }}>5</div>
                <span style={{ color: "var(--color-text-muted)" }}>Open Positions</span>
              </div>
              <div className="p-2 rounded text-center" style={{ background: "var(--color-light)" }}>
                <div className="font-bold" style={{ color: "var(--color-primary)" }}>12</div>
                <span style={{ color: "var(--color-text-muted)" }}>This Month Hires</span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Training & Development" subtitle="Upcoming sessions" />
          <div className="space-y-2">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No upcoming training sessions</div>
            ) : (
              TRAINING_SESSIONS.slice(0, 4).map((t, i) => (
                <div key={i} className="p-3 rounded-lg text-sm" style={{ background: "var(--color-light)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-1.5" style={{ color: "var(--color-text)" }}>
                        <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                        {t.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Calendar className="w-3 h-3" /> {t.date}
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <Clock className="w-3 h-3" /> {t.time}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--color-text-faint)" }}>{t.dept} \u00B7 {t.enrolled} enrolled</div>
                    </div>
                    <Badge variant={t.status === "upcoming" ? "teal" : "gray"}>{t.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
          {displayEmployees.length > 0 && (
            <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <span>{TRAINING_SESSIONS.length} total sessions</span>
              <button className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>View Calendar</button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Leave Balance Summary" subtitle="Company-wide averages" />
          <div className="space-y-2">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No leave history recorded</div>
            ) : (
              LEAVE_BALANCES.map((l, i) => {
                const usedPct = (l.used / l.total) * 100;
                return (
                  <div key={l.type} className="flex items-center justify-between py-1.5 text-sm" style={{ borderBottom: i < LEAVE_BALANCES.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--color-text)" }}>{l.type}</span>
                        <span className="text-xs font-medium" style={{ color: "var(--color-navy)" }}>{l.remaining} left</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${usedPct}%`, background: usedPct > 60 ? "var(--color-warning)" : usedPct > 80 ? "var(--color-danger)" : "var(--color-primary)" }} />
                        </div>
                        <span className="text-[10px]" style={{ color: "var(--color-text-faint)" }}>{l.used}/{l.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Top Performers" subtitle="Highest rated employees this quarter" />
          <div className="space-y-2">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No performance records yet</div>
            ) : (
              TOP_PERFORMERS.map((p, i) => {
                const badgeColor = p.badge === "Excellent" ? "teal" as const : p.badge === "Great" ? "navy" as const : "amber" as const;
                return (
                  <div key={p.name} className="flex items-center justify-between py-2 text-sm" style={{ borderBottom: i < TOP_PERFORMERS.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: i === 0 ? "var(--color-warning)" : i < 3 ? "var(--color-primary)" : "var(--color-navy)" }}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "var(--color-text)" }}>{p.name}</div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.dept} \u00B7 {p.achievements} achievements</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3" style={{ color: "var(--color-warning)", fill: "var(--color-warning)" }} />
                        <span className="text-xs font-bold" style={{ color: "var(--color-text)" }}>{p.rating.toFixed(1)}</span>
                      </div>
                      <Badge variant={badgeColor}>{p.badge}</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {displayEmployees.length > 0 && (
            <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button className="text-xs font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                View Full Performance Report
              </button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Payroll History" subtitle="Last 5 payroll runs" />
          <div className="space-y-2">
            {displayEmployees.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">No payroll runs recorded yet</div>
            ) : (
              PAYROLL_HISTORY.map((pr, i) => (
                <div key={pr.run} className="flex items-center justify-between p-3 rounded-lg text-sm" style={{ background: i === 0 ? "rgba(var(--color-primary-dark-rgb),0.06)" : "var(--color-light)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: i === 0 ? "rgba(var(--color-primary-dark-rgb),0.15)" : "var(--color-border)" }}>
                      <DollarSign className="w-4 h-4" style={{ color: i === 0 ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: "var(--color-text)" }}>{pr.run}</div>
                      <div className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                        <Calendar className="w-3 h-3" /> {pr.period}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{ color: "var(--color-navy)" }}>{pr.amount}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{pr.employees} employees</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {displayEmployees.length > 0 && (
            <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" style={{ color: "var(--color-primary)" }} /> +3.2% vs last month</span>
              <button className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>Run Payroll</button>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Employee Engagement & Satisfaction" subtitle="Q2 2026 survey results" />
        {displayEmployees.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No survey results available</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
              {[
                { label: "Overall Satisfaction", score: "4.2/5", change: "+0.3", color: "var(--color-primary)" },
                { label: "Work Environment", score: "4.4/5", change: "+0.2", color: "var(--color-primary)" },
                { label: "Growth Opportunities", score: "3.8/5", change: "+0.1", color: "var(--color-warning)" },
                { label: "Management Support", score: "4.1/5", change: "+0.4", color: "var(--color-primary)" },
              ].map((s) => (
                <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: "var(--color-light)" }}>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.score}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.label}</div>
                  <div className="text-[10px] mt-0.5 flex items-center justify-center gap-0.5" style={{ color: s.color }}>
                    <TrendingUp className="w-2.5 h-2.5" /> {s.change} vs Q1
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <div className="flex items-center justify-between p-2 rounded" style={{ background: "var(--color-light)" }}>
                <span>Survey participation rate</span>
                <span className="font-semibold" style={{ color: "var(--color-navy)" }}>78% (42 of 54 employees)</span>
              </div>
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardHeader title="Certifications & Skills Matrix" subtitle="Department-wise skill coverage" />
        {displayEmployees.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">No skill coverage data recorded</div>
        ) : (
          <>
            <div className="space-y-4">
              {[
                { dept: "Front Office", skills: ["Hospitality Certification", "POS Systems", "CRM Software", "Multi-lingual"], coverage: 85 },
                { dept: "Housekeeping", skills: ["Cleaning Standards", "Chemical Handling", "Inventory Mgmt"], coverage: 78 },
                { dept: "Maintenance", skills: ["Electrical Safety", "Plumbing", "HVAC", "Fire Safety"], coverage: 72 },
                { dept: "Finance", skills: ["Tally ERP", "GST Compliance", "Financial Reporting"], coverage: 90 },
              ].map((d) => (
                <div key={d.dept}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: "var(--color-text)" }}>{d.dept}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{d.coverage}% coverage</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {d.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: "rgba(var(--color-primary-dark-rgb),0.1)", color: "var(--color-primary)" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--color-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${d.coverage}%`, background: d.coverage >= 85 ? "var(--color-primary)" : d.coverage >= 75 ? "var(--color-warning)" : "var(--color-danger)" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button className="text-xs font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                Manage Skills Matrix
              </button>
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardHeader title="Upcoming Birthdays & Anniversaries" subtitle="This month" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {displayEmployees.length === 0 ? (
            <div className="text-center col-span-2 py-6 text-xs text-slate-400">No upcoming events this month</div>
          ) : (
            [
              { name: "Priya Sharma", event: "Work Anniversary - 5 years", date: "22 Jun", icon: Star },
              { name: "Arjun Sharma", event: "Birthday", date: "25 Jun", icon: Star },
              { name: "Kavya Menon", event: "Birthday", date: "28 Jun", icon: Star },
              { name: "Rajesh Mehta", event: "Work Anniversary - 10 years", date: "30 Jun", icon: Star },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(var(--color-primary-dark-rgb),0.15)" }}>
                  <item.icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{item.name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.event} \u00B7 {item.date}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
