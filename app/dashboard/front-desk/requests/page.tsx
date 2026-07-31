"use client";

import { useState } from "react";
import { Wrench, Search, Clock, CheckCircle2, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import useSWR from "swr";
import { Plus, X } from "lucide-react";
import ActiveBookingSelector from "../components/ActiveBookingSelector";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RequestsPage() {
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ booking_id: "", request_type: "housekeeping", description: "", assigned_to_dept: "housekeeping" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR("/api/dashboard/front-desk/requests", fetcher, { refreshInterval: 30000 });
  const requests = data?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Fetch property_id from the active booking
      const bookingRes = await fetch(`/api/reservations/${formData.booking_id}`);
      const bookingData = await bookingRes.json();
      const propertyId = bookingData.data?.property_id;

      const res = await fetch("/api/dashboard/front-desk/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: formData.booking_id,
          requestType: formData.request_type,
          description: formData.description,
          assignedToDept: formData.assigned_to_dept,
          propertyId: propertyId
        })
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ booking_id: "", request_type: "housekeeping", description: "", assigned_to_dept: "housekeeping" });
        mutate();
      } else {
        console.error("Failed to submit request");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = requests.filter((r: any) => filter === "all" || r.status === filter);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--color-navy)" }}>
            <Wrench className="w-6 h-6 text-[var(--color-primary)]" /> Guest Requests & Complaints
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-sm">Monitor all incoming requests and their assignment status.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
            style={{ borderColor: "var(--color-border)" }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white">
          <div className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-[var(--color-text-muted)]">Pending Action</span>
              <div className="p-2 bg-amber-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--color-navy)]">
                {requests.filter((r: any) => r.status === 'pending').length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Requests Log" subtitle={`${filtered.length} tickets`} />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" /></div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[var(--color-light)] text-[var(--color-text-muted)] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Request</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[color:var(--color-light)]/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[var(--color-navy)] capitalize">{r.request_type.replace('_', ' ')}</div>
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-xs truncate" title={r.description}>{r.description}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(r.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[var(--color-text)]">{r.unit_label ? `Unit ${r.unit_label}` : "N/A"}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="capitalize text-[var(--color-text-muted)]">{r.assigned_to_dept || "Unassigned"}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={r.status === 'resolved' ? 'teal' : r.status === 'pending' ? 'amber' : 'navy'} className="capitalize">
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-[var(--color-primary)] hover:text-[color:var(--color-primary)]/80 font-medium inline-flex items-center">
                        Update <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Slide-out Form Panel */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-navy)]">Log Guest Request</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Select Guest / Room</label>
                  <ActiveBookingSelector 
                    value={formData.booking_id} 
                    onChange={(bId, _) => setFormData({...formData, booking_id: bId})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Request Type</label>
                  <select 
                    required
                    value={formData.request_type}
                    onChange={(e) => setFormData({...formData, request_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                  >
                    <option value="housekeeping">Housekeeping (Cleaning/Towels)</option>
                    <option value="maintenance">Maintenance (Repairs/Issues)</option>
                    <option value="room_service">Room Service / F&B</option>
                    <option value="front_desk">Front Desk (Taxi/Wake-up call)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Assigned Department</label>
                  <select 
                    required
                    value={formData.assigned_to_dept}
                    onChange={(e) => setFormData({...formData, assigned_to_dept: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
                  >
                    <option value="housekeeping">Housekeeping</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="f_and_b">F&B</option>
                    <option value="front_desk">Front Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-navy)] mb-1">Description</label>
                  <textarea 
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the guest's request..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20 resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !formData.booking_id}
                    className="w-full bg-[var(--color-navy)] hover:bg-[var(--color-dark-navy)] text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
