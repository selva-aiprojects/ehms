"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Search, X, Loader2, RefreshCw, CheckCircle, AlertCircle, Edit2, Trash2, Activity, Clock, ToggleLeft, ToggleRight, Shield, Filter, ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useAdminUsers, useAdminRoles, useProperties, useAdminAuditEvents, useAuditLogs } from "@/lib/hooks";
import { useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser } from "@/lib/hooks/mutations";

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_name: "property_manager",
    property_id: "",
  });

  const { users, isLoading: loadingUsers, mutate: mutateUsers } = useAdminUsers({
    search: searchQuery || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    property_id: workspaceFilter || undefined,
  });
  const { roles, isLoading: loadingRoles } = useAdminRoles();
  const { properties = [] } = useProperties();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { auditEvents, isLoading: loadingEvents } = useAdminAuditEvents(selectedUserId ? { limit: 20, event_type: `user_${selectedUserId}` } : undefined);

  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayUsers = (users || []) as any[];
  const activeUsers = displayUsers.filter((u: any) => u.is_active !== false).length;
  const inactiveUsers = displayUsers.filter((u: any) => u.is_active === false).length;
  const last24hLogins = displayUsers.filter((u: any) => {
    if (!u.last_login) return false;
    return Date.now() - new Date(u.last_login).getTime() < 86400000;
  }).length;

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newUser.first_name,
          last_name: newUser.last_name || null,
          email: newUser.email,
          password: newUser.password,
          role_name: newUser.role_name,
          property_id: newUser.property_id || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: `User created: ${newUser.first_name} ${newUser.last_name || ""}` });
        setShowAddModal(false);
        setNewUser({ first_name: "", last_name: "", email: "", password: "", role_name: "property_manager", property_id: "" });
        mutateUsers();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Failed to create user" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error creating user" });
    }
  }

  function handleOpenEdit(user: any) {
    setEditUser({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || "",
      email: user.email,
      role_name: user.user_roles?.[0]?.role?.name || user.role || "",
      property_id: user.user_roles?.[0]?.property_id || user.property_id || "",
      is_active: user.is_active !== false,
    });
    setShowEditModal(true);
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: editUser.first_name,
          last_name: editUser.last_name || null,
          email: editUser.email,
          role_name: editUser.role_name,
          property_id: editUser.property_id || null,
          is_active: editUser.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({ type: "success", message: `User updated: ${editUser.first_name}` });
        setShowEditModal(false);
        setEditUser(null);
        mutateUsers();
      } else {
        setActionFeedback({ type: "error", message: data.error || "Failed to update user" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error updating user" });
    }
  }

  async function handleToggleStatus(user: any) {
    setActionFeedback(null);
    try {
      const newStatus = user.is_active === false;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.ok) {
        setActionFeedback({ type: "success", message: `${user.first_name} ${newStatus ? "activated" : "deactivated"}` });
        mutateUsers();
      } else {
        const data = await res.json();
        setActionFeedback({ type: "error", message: data.error || "Failed to toggle status" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error toggling status" });
    }
  }

  async function handleDeleteUser(id: string) {
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setActionFeedback({ type: "success", message: "User deleted permanently" });
        setShowDeleteConfirm(null);
        mutateUsers();
      } else {
        const data = await res.json();
        setActionFeedback({ type: "error", message: data.error || "Failed to delete user" });
      }
    } catch {
      setActionFeedback({ type: "error", message: "Network error deleting user" });
    }
  }

  function handleExpandRow(user: any) {
    if (expandedUserId === user.id) {
      setExpandedUserId(null);
      setSelectedUserId(null);
    } else {
      setExpandedUserId(user.id);
      setSelectedUserId(user.id);
    }
  }

  const userColumns = [
    { key: "name", header: "Name", render: (u: any) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "#2C3547" }}>
          {(u.first_name || "U").charAt(0)}
        </div>
        <div>
          <div className="font-medium text-sm" style={{ color: "#1A2E44" }}>{u.first_name} {u.last_name || ""}</div>
          <div className="text-[10px]" style={{ color: "#94A3B8" }}>ID: {u.id?.slice(0, 8) || "—"}</div>
        </div>
      </div>
    )},
    { key: "email", header: "Email", render: (u: any) => (
      <span className="text-xs" style={{ color: "#64748B" }}>{u.email}</span>
    )},
    { key: "role", header: "Role", render: (u: any) => (
      <Badge variant="navy">{u.user_roles?.[0]?.role?.name?.replace(/_/g, " ")?.replace(/\b\w/g, (c: string) => c.toUpperCase()) || u.role || "—"}</Badge>
    )},
    { key: "scope", header: "Workspace Scope", render: (u: any) => {
      const propId = u.user_roles?.[0]?.property_id || u.property_id;
      const propName = propId ? properties.find((p: any) => p.id === propId)?.name : null;
      return (
        <span className="text-xs" style={{ color: propId ? "#1A3C5E" : "#64748B" }}>
          {propName || (propId ? "Specific" : "Global")}
        </span>
      );
    }},
    { key: "last_login", header: "Last Login", render: (u: any) => {
      if (!u.last_login) return <span className="text-xs" style={{ color: "#94A3B8" }}>Never</span>;
      const diff = Date.now() - new Date(u.last_login).getTime();
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      let display: string;
      if (hours < 1) display = `${mins}m ago`;
      else if (hours < 24) display = `${hours}h ago`;
      else display = new Date(u.last_login).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return <span className="text-xs" style={{ color: hours < 24 ? "#2BAE8E" : "#64748B" }}>{display}</span>;
    }},
    { key: "status", header: "Status", render: (u: any) => (
      <div className="flex items-center gap-2">
        <Badge variant={u.is_active !== false ? "teal" : "red"}>{u.is_active !== false ? "Active" : "Inactive"}</Badge>
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
          className="p-1 rounded transition-colors hover:bg-slate-100"
          title={u.is_active !== false ? "Deactivate" : "Activate"}
        >
          {u.is_active !== false ? (
            <ToggleRight className="w-4 h-4" style={{ color: "#2BAE8E" }} />
          ) : (
            <ToggleLeft className="w-4 h-4" style={{ color: "#94A3B8" }} />
          )}
        </button>
      </div>
    )},
    { key: "actions", header: "Actions", render: (u: any) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(u); }}
          className="p-1.5 rounded-lg transition-colors hover:bg-slate-100" title="Edit user">
          <Edit2 className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(u.id); }}
          className="p-1.5 rounded-lg transition-colors hover:bg-red-50" title="Delete user">
          <Trash2 className="w-3.5 h-3.5" style={{ color: "#E53E3E" }} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleExpandRow(u); }}
          className="p-1.5 rounded-lg transition-colors hover:bg-slate-100" title="View activity">
          {expandedUserId === u.id ? (
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" style={{ color: "#64748B" }} />
          )}
        </button>
      </div>
    )},
  ];

  const TABS = [
    { key: "users", label: "All Users", icon: Users },
    { key: "activity", label: "User Activity", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>User Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>System users, roles, permissions, and activity tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-3.5 h-3.5" /> Add User
          </Button>
          <button onClick={() => mutateUsers()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
              style={{
                background: isActive ? "#1A3C5E" : "#F5F7FA",
                color: isActive ? "#FFFFFF" : "#64748B",
              }}>
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "users" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: "#1A3C5E" }} />
                <span className="text-xs font-semibold" style={{ color: "#64748B" }}>Total Users</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>{displayUsers.length}</span>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(42,157,143,0.08)", border: "1px solid rgba(42,157,143,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4" style={{ color: "#2BAE8E" }} />
                <span className="text-xs font-semibold" style={{ color: "#64748B" }}>Active</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: "#2BAE8E" }}>{activeUsers}</span>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(229,62,62,0.06)", border: "1px solid rgba(229,62,62,0.15)" }}>
              <div className="flex items-center gap-2 mb-1">
                <X className="w-4 h-4" style={{ color: "#E53E3E" }} />
                <span className="text-xs font-semibold" style={{ color: "#64748B" }}>Inactive</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: "#E53E3E" }}>{inactiveUsers}</span>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" style={{ color: "#F5A623" }} />
                <span className="text-xs font-semibold" style={{ color: "#64748B" }}>Last 24h Logins</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: "#F5A623" }}>{last24hLogins}</span>
            </div>
          </div>

          <Card>
            <CardHeader
              title="System Users"
              subtitle={`${displayUsers.length} users · ${activeUsers} active · ${inactiveUsers} inactive`}
              action={
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                    <input type="text" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none w-44"
                      style={{ borderColor: "#E2E8F0" }} />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                        <X className="w-3 h-3" style={{ color: "#94A3B8" }} />
                      </button>
                    )}
                  </div>
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border outline-none bg-white"
                    style={{ borderColor: "#E2E8F0", color: roleFilter ? "#1A2E44" : "#94A3B8" }}>
                    <option value="">All Roles</option>
                    {(roles || []).map((r: any) => (
                      <option key={r.id} value={r.name}>{r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>
                    ))}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border outline-none bg-white"
                    style={{ borderColor: "#E2E8F0", color: statusFilter ? "#1A2E44" : "#94A3B8" }}>
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select value={workspaceFilter} onChange={(e) => setWorkspaceFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border outline-none bg-white"
                    style={{ borderColor: "#E2E8F0", color: workspaceFilter ? "#1A2E44" : "#94A3B8" }}>
                    <option value="">All Workspaces</option>
                    {properties.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              }
            />
            {loadingUsers ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
            ) : displayUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                <p className="text-sm" style={{ color: "#64748B" }}>No users found matching your filters</p>
              </div>
            ) : (
              <div>
                <Table data={displayUsers} keyExtractor={(u: any) => u.id || Math.random().toString()} columns={userColumns} />
                {expandedUserId && (
                  <div className="border-t px-4 py-4" style={{ borderColor: "#E2E8F0", background: "#FAFBFC" }}>
                    {(() => {
                      const expandedUser = displayUsers.find((u: any) => u.id === expandedUserId);
                      if (!expandedUser) return null;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" style={{ color: "#1A3C5E" }} />
                            <h4 className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>
                              Activity Timeline — {expandedUser.first_name} {expandedUser.last_name || ""}
                            </h4>
                          </div>
                          <div className="relative pl-6 space-y-0">
                            {loadingEvents ? (
                              <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: "#94A3B8" }} /></div>
                            ) : (auditEvents || []).length === 0 ? (
                              <div className="text-xs py-2" style={{ color: "#94A3B8" }}>
                                <Clock className="w-3 h-3 inline mr-1" />No recent activity recorded
                              </div>
                            ) : (
                              (auditEvents || []).slice(0, 8).map((e: any, i: number) => (
                                <div key={e.id || i} className="relative pb-3 last:pb-0">
                                  {i < Math.min((auditEvents || []).length, 8) - 1 && (
                                    <div className="absolute left-0 top-2 bottom-0 w-px" style={{ background: "#E2E8F0" }} />
                                  )}
                                  <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2" style={{
                                    background: "#FFFFFF",
                                    borderColor: e.severity === "error" || e.severity === "critical" ? "#E53E3E" : e.severity === "warning" ? "#F5A623" : "#2BAE8E",
                                  }} />
                                  <div className="ml-4">
                                    <div className="text-xs font-medium" style={{ color: "#1A2E44" }}>{e.title || e.action || e.event_type}</div>
                                    <div className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "#94A3B8" }}>
                                      <span>{e.description || ""}</span>
                                      {e.created_at && <span>· {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === "activity" && (
        <Card>
          <CardHeader title="User Activity" subtitle="Audit events across all system users"
            action={
              <div className="flex items-center gap-2">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs rounded-lg border outline-none bg-white"
                  style={{ borderColor: "#E2E8F0", color: roleFilter ? "#1A2E44" : "#94A3B8" }}>
                  <option value="">All Roles</option>
                  {(roles || []).map((r: any) => (
                    <option key={r.id} value={r.name}>{r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
            } />
          {loadingEvents ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
          ) : (auditEvents || []).length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-6 h-6 mx-auto mb-2" style={{ color: "#94A3B8" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No audit events recorded yet</p>
            </div>
          ) : (
            <div className="space-y-0">
              {(auditEvents || []).map((e: any, i: number) => {
                const severityColor = e.severity === "error" || e.severity === "critical" ? "#E53E3E" : e.severity === "warning" ? "#F5A623" : "#2BAE8E";
                const severityBg = e.severity === "error" || e.severity === "critical" ? "rgba(229,62,62,0.08)" : e.severity === "warning" ? "rgba(245,166,35,0.08)" : "rgba(42,157,143,0.08)";
                return (
                  <div key={e.id || i} className="flex items-start gap-3 py-3 px-1"
                    style={{ borderBottom: i < (auditEvents || []).length - 1 ? "1px solid #F1F5F9" : "none" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: severityBg }}>
                      <Activity className="w-4 h-4" style={{ color: severityColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "#1A2E44" }}>{e.title || e.event_type}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>{e.description || ""}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={e.severity === "critical" ? "red" : e.severity === "error" ? "red" : e.severity === "warning" ? "amber" : "teal"}>{e.severity || "info"}</Badge>
                      <span className="text-[10px]" style={{ color: "#94A3B8" }}>
                        {e.created_at ? new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Add New System User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>First Name *</label>
                  <input type="text" required value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="Jane" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Last Name</label>
                  <input type="text" value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                    placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Email Address *</label>
                <input type="email" required value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="jane.smith@ehms.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Password *</label>
                <input type="password" required value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="•••••••• (Min 8 chars)" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>System Role *</label>
                  <select value={newUser.role_name}
                    onChange={(e) => setNewUser({ ...newUser, role_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {(roles || []).map((r: any) => (
                      <option key={r.id} value={r.name}>
                        {r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Workspace Scope</label>
                  <select value={newUser.property_id}
                    onChange={(e) => setNewUser({ ...newUser, property_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Global (All Workspaces)</option>
                    {properties.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={createUser.isMutating}>
                  {createUser.isMutating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Creating</> : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Edit User: {editUser.first_name} {editUser.last_name}</h3>
              <button onClick={() => { setShowEditModal(false); setEditUser(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>First Name *</label>
                  <input type="text" required value={editUser.first_name}
                    onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Last Name</label>
                  <input type="text" value={editUser.last_name}
                    onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Email Address *</label>
                <input type="email" required value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>System Role *</label>
                  <select value={editUser.role_name}
                    onChange={(e) => setEditUser({ ...editUser, role_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {(roles || []).map((r: any) => (
                      <option key={r.id} value={r.name}>
                        {r.name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Workspace Scope</label>
                  <select value={editUser.property_id}
                    onChange={(e) => setEditUser({ ...editUser, property_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Global (All Workspaces)</option>
                    {properties.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div>
                  <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>Account Status</span>
                  <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                    {editUser.is_active ? "User can log in and access the system" : "User is blocked from accessing the system"}
                  </p>
                </div>
                <button type="button" onClick={() => setEditUser({ ...editUser, is_active: !editUser.is_active })}
                  className="p-1.5 rounded-lg transition-colors hover:bg-slate-200">
                  {editUser.is_active ? (
                    <ToggleRight className="w-6 h-6" style={{ color: "#2BAE8E" }} />
                  ) : (
                    <ToggleLeft className="w-6 h-6" style={{ color: "#94A3B8" }} />
                  )}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowEditModal(false); setEditUser(null); }}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={updateUser.isMutating}>
                  {updateUser.isMutating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 text-center">
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(229,62,62,0.1)" }}>
                <AlertCircle className="w-6 h-6" style={{ color: "#E53E3E" }} />
              </div>
              <h3 className="font-bold text-lg mb-1" style={{ color: "#1A3C5E" }}>Delete User?</h3>
              <p className="text-sm" style={{ color: "#64748B" }}>
                This action permanently removes this user from the system. This cannot be undone.
              </p>
            </div>
            <div className="px-6 pb-5 flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="primary" size="sm" style={{ background: "#E53E3E" }} onClick={() => handleDeleteUser(showDeleteConfirm)} disabled={deleteUser.isMutating}>
                {deleteUser.isMutating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Deleting</> : "Delete User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
