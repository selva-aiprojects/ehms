import { useState, useEffect } from "react";
import { X, Loader2, Sparkles, AlertCircle, Search } from "lucide-react";
import { useRoomMatrix, useAdminUsers, useStaffAvailability } from "@/lib/hooks";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  defaultUnitId?: string;
  defaultPropertyId?: string;
}

export default function CreateTaskModal({ isOpen, onClose, onSubmit, defaultUnitId, defaultPropertyId }: CreateTaskModalProps) {
  const [unitId, setUnitId] = useState(defaultUnitId || "");
  const [assignedTo, setAssignedTo] = useState("");
  const [taskType, setTaskType] = useState("deep_clean");
  const [priority, setPriority] = useState("medium");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { rooms, isLoading: loadingRooms } = useRoomMatrix(defaultPropertyId);
  const { users, isLoading: loadingUsers } = useAdminUsers({ role: "housekeeping" });
  const { staffAvailability } = useStaffAvailability({ property_id: defaultPropertyId });

  useEffect(() => {
    if (isOpen) {
      setUnitId(defaultUnitId || "");
      setAssignedTo("");
      setTaskType("deep_clean");
      setPriority("medium");
      setNotes("");
      setError(null);
    }
  }, [isOpen, defaultUnitId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitId) {
      setError("Please select a room/unit.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const room = rooms?.find((r: any) => r.id === unitId);
      await onSubmit({
        unit_id: unitId,
        property_id: room?.property_id || defaultPropertyId || "p-1", // fallback if not found
        assigned_to: assignedTo || null,
        task_type: taskType,
        priority,
        notes,
        scheduled_at: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(42,157,143,0.1)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <h2 className="font-semibold text-[#1A3C5E]">Assign Housekeeping Task</h2>
              <p className="text-xs text-[#64748B]">Create a new task for the team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:bg-[#F5F7FA] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.1)", color: "#E53E3E" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2E44] mb-1.5">Target Room / Unit</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#64748B]" />
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2BAE8E] focus:ring-1 focus:ring-[#2BAE8E] bg-[#F5F7FA] appearance-none"
                  disabled={loadingRooms}
                >
                  <option value="">Select a room...</option>
                  {rooms?.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.unit_label} - {r.unit_type} ({r.status.replace("_", " ")})</option>
                  ))}
                </select>
                {loadingRooms && <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-[#64748B] animate-spin" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A2E44] mb-1.5">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2BAE8E] bg-[#F5F7FA]"
                >
                  <option value="deep_clean">Deep Clean</option>
                  <option value="stayover_tidy">Stayover Tidy</option>
                  <option value="turnaround">Turnaround (Checkout)</option>
                  <option value="inspection">Inspection</option>
                  <option value="evening_turndown">Evening Turndown</option>
                  <option value="vip_arrival">VIP Arrival Setup</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2E44] mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2BAE8E] bg-[#F5F7FA]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2E44] mb-1.5">Assign To (Live Staff Availability Check)</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2BAE8E] bg-[#F5F7FA]"
                disabled={loadingUsers}
              >
                <option value="">Unassigned (Any available staff)</option>
                {users?.map((u: any) => {
                  const avail = staffAvailability?.find((s: any) => s.user?.id === u.id);
                  const badgeText = avail?.availability_badge?.text ? ` · ${avail.availability_badge.text}` : "";
                  return (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}{badgeText} ({u.email})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2E44] mb-1.5">Special Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="E.g., Extra towels, allergic to feathers..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#2BAE8E] bg-[#F5F7FA] resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[#E2E8F0] flex justify-end gap-3 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F5F7FA] transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            className="px-4 py-2 text-sm font-medium text-white bg-[#1A3C5E] rounded-lg hover:bg-[#1A2E44] transition-colors flex items-center gap-2"
            disabled={isSubmitting || loadingRooms}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching...</>
            ) : (
              "Create & Dispatch Task"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
