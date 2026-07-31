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
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(var(--color-primary-dark-rgb),0.1)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-navy)]">Assign Housekeeping Task</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Create a new task for the team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-light)] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.1)", color: "var(--color-danger)" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form id="create-task-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Target Room / Unit</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-text-muted)]" />
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] bg-[var(--color-light)] appearance-none"
                  disabled={loadingRooms}
                >
                  <option value="">Select a room...</option>
                  {rooms?.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.unit_label} - {r.unit_type} ({r.status.replace("_", " ")})</option>
                  ))}
                </select>
                {loadingRooms && <Loader2 className="w-4 h-4 absolute right-3 top-2.5 text-[var(--color-text-muted)] animate-spin" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Task Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-light)]"
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
                <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-light)]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Assign To (Live Staff Availability Check)</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-light)]"
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
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">Special Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="E.g., Extra towels, allergic to feathers..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] bg-[var(--color-light)] resize-none"
              />
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] flex justify-end gap-3 bg-[var(--color-light)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] bg-white border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-light)] transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-navy)] rounded-lg hover:bg-[var(--color-text)] transition-colors flex items-center gap-2"
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
