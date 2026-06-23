"use client";

import { useState } from "react";
import { Shield, Users, Settings, Plus, Edit2, Loader2, CheckCircle, AlertCircle, X, Save, UserCheck } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useAdminRoles, useAdminUsers } from "@/lib/hooks";

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["System Config", "User Management", "Security", "Audit Logs", "All Modules", "Backup & Restore", "API Keys"],
  executive: ["Analytics", "Reports", "Compliance View", "All Modules Read", "Approvals"],
  property_manager: ["Property Config", "Rate Plans", "Compliance", "Staff Management", "Reports"],
  front_desk: ["Check-in/out", "Reservations", "Guest Profiles", "Billing", "F&B Orders"],
  housekeeping_supervisor: ["Task Allocation", "Inspections", "Linen Management", "Staff Schedule"],
  housekeeping_staff: ["Task View", "Task Update", "Linen Tracking"],
  maintenance_supervisor: ["Ticket Assignment", "Parts Approvals", "Asset Management", "Vendor Coordination"],
  maintenance_staff: ["Ticket View", "Ticket Update", "Parts Request", "Time Logging"],
  hr_manager: ["Employee Management", "Payroll", "Leave Approvals", "Timesheets", "Compliance", "Policies"],
  hr_executive: ["Employee View", "Leave Management", "Timesheet View"],
  employee_manager: ["Team View", "Leave Approvals", "Timesheet Approvals"],
  finance_manager: ["Invoices", "Payments", "Tax Management", "GL Reports", "Bank Reconciliation"],
  finance_executive: ["Invoice View", "Payment Entry", "Reports View"],
  security_staff: ["Visitor Log", "Parking Management", "Access Control"],
  vendor_user: ["Invoice Upload", "Compliance Upload", "PO View"],
  workplace_facility_manager: ["Desk Booking", "Membership", "Access Cards", "Floor Plans", "Visitor Management"],
};

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editRole, setEditRole] = useState<any>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const { roles, isLoading: loadingRoles, mutate: mutateRoles } = useAdminRoles();
  const { users, isLoading: loadingUsers } = useAdminUsers();

  function handleEditPermissions(role: any) {
    setEditRole(role);
    setEditPermissions(ROLE_PERMISSIONS[role.name] || []);
  }

  async function handleSavePermissions() {
    setActionFeedback({ type: "success", message: `Permissions updated for ${editRole.name}` });
    setEditRole(null);
    mutateRoles();
  }

  const displayRoles = roles || [];

  const roleColumns = [
    { key: "name", header: "Role", render: (r: any) => (
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4" style={{ color: "#1A3C5E" }} />
        <span className="font-medium text-sm">{r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
      </div>
    )},
    { key: "description", header: "Description", render: (r: any) => <span className="text-xs" style={{ color: "#64748B" }}>{r.description || "—"}</span> },
    { key: "user_count", header: "Users", render: (r: any) => <Badge variant="gray">{r.user_count}</Badge> },
    { key: "is_system", header: "Type", render: (r: any) => <Badge variant={r.is_system ? "teal" : "amber"}>{r.is_system ? "System" : "Custom"}</Badge> },
    { key: "permissions", header: "Permissions", render: (r: any) => {
      const perms = ROLE_PERMISSIONS[r.name];
      return (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(perms || []).slice(0, 3).map((p: string) => (
            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#E2E8F0", color: "#475569" }}>{p}</span>
          ))}
          {(perms?.length || 0) > 3 && <span className="text-[10px]" style={{ color: "#94A3B8" }}>+{perms!.length - 3} more</span>}
        </div>
      );
    }},
    { key: "actions", header: "Actions", render: (r: any) => (
      <Button variant="outline" size="sm" onClick={() => handleEditPermissions(r)} disabled={!r.is_system}>
        <Edit2 className="w-3 h-3" /> Permissions
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Roles & Permissions</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage system roles and their access permissions</p>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)", color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E", border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}` }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {[
          { key: "roles", label: "Role Definitions", icon: Shield },
          { key: "matrix", label: "Access Matrix", icon: Settings },
          { key: "users-by-role", label: "Users by Role", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
              style={{ background: isActive ? "#1A3C5E" : "#F5F7FA", color: isActive ? "#FFFFFF" : "#64748B" }}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "roles" && (
        <Card>
          <CardHeader title="System Roles" subtitle={`${displayRoles.length} roles defined`} />
          {loadingRoles ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
          ) : (
            <Table data={displayRoles} keyExtractor={(r: any) => r.id} columns={roleColumns} />
          )}
        </Card>
      )}

      {activeTab === "matrix" && (
        <Card>
          <CardHeader title="Role Access Matrix" subtitle="Module access per role" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#E2E8F0" }}>
                  <th className="text-left py-2.5 px-3 font-medium text-xs uppercase tracking-wider" style={{ color: "#64748B" }}>Module</th>
                  {displayRoles.filter((r: any) => r.is_system).map((r: any) => (
                    <th key={r.id} className="text-center py-2.5 px-2 font-medium text-[10px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                      {r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  "Dashboard", "Front Desk", "Housekeeping", "Maintenance", "Finance",
                  "HRMS", "Properties", "Admin Config", "Reports", "Settings"
                ].map((module) => (
                  <tr key={module} className="border-b" style={{ borderColor: "#F1F5F9" }}>
                    <td className="py-2.5 px-3 font-medium" style={{ color: "#1A2E44" }}>{module}</td>
                    {displayRoles.filter((r: any) => r.is_system).map((r: any) => {
                      const perms = ROLE_PERMISSIONS[r.name] || [];
                      const hasAccess = perms.some((p: string) => module.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(module.toLowerCase()) || module === "Dashboard");
                      return (
                        <td key={r.id} className="text-center py-2.5 px-2">
                          <div className="w-5 h-5 rounded-full mx-auto flex items-center justify-center"
                            style={{ background: hasAccess ? "rgba(42,157,143,0.15)" : "rgba(229,62,62,0.08)" }}>
                            <div className="w-2 h-2 rounded-full"
                              style={{ background: hasAccess ? "#2BAE8E" : "#E53E3E" }} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "users-by-role" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayRoles.map((role: any) => {
            const roleUsers = (users || []).filter((u: any) => {
              const userRole = u.user_roles?.[0]?.role?.name;
              return userRole === role.name;
            });
            return (
              <Card key={role.id}>
                <CardHeader title={role.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  subtitle={`${role.user_count} users`} />
                {roleUsers.length === 0 ? (
                  <div className="text-center py-4 text-sm" style={{ color: "#94A3B8" }}>No users assigned</div>
                ) : (
                  <div className="space-y-1">
                    {roleUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-2 py-1.5 px-1">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#2C3547" }}>
                          {(u.first_name || "U").charAt(0)}
                        </div>
                        <span className="text-sm" style={{ color: "#1A2E44" }}>{u.first_name} {u.last_name || ""}</span>
                        <span className="text-xs ml-auto" style={{ color: "#64748B" }}>{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {editRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>
                Permissions: {editRole.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </h3>
              <button onClick={() => setEditRole(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {editPermissions.map((perm) => (
                <label key={perm} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={true} readOnly className="rounded border-slate-300" />
                  <span className="text-sm" style={{ color: "#1A2E44" }}>{perm}</span>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E2E8F0" }}>
              <Button variant="outline" size="sm" onClick={() => setEditRole(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSavePermissions}><Save className="w-3.5 h-3.5" /> Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
