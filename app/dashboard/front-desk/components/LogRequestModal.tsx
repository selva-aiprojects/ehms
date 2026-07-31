"use client";

import { useState } from "react";
import { X, Wrench, Sparkles, Loader2, MessageSquare } from "lucide-react";
import Button from "@/components/ui/button";
import { useCreateHousekeepingTask, useCreateMaintenanceTicket } from "@/lib/hooks/mutations";
import { toast } from "react-hot-toast";

interface LogRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  unitLabel?: string;
}

export default function LogRequestModal({ isOpen, onClose, roomId, unitLabel }: LogRequestModalProps) {
  const [type, setType] = useState<"housekeeping" | "maintenance">("housekeeping");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  
  const createHk = useCreateHousekeepingTask();
  const createMx = useCreateMaintenanceTicket();
  
  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    try {
      if (type === "housekeeping") {
        await createHk.trigger({
          unit_id: roomId,
          task_type: "cleaning",
          priority,
          notes: description
        });
        toast.success("Housekeeping task created");
      } else {
        await createMx.trigger({
          unit_id: roomId,
          issue_type: "repair",
          priority,
          description: description
        });
        toast.success("Maintenance ticket created");
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to create request");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-navy)]">Log Request</h2>
            {unitLabel && <p className="text-sm text-[var(--color-text-muted)]">Room {unitLabel}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium mb-2 text-[var(--color-text)]">Request Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setType("housekeeping")}
                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg border-2 transition-colors ${type === "housekeeping" ? "border-[var(--color-primary)] bg-[color:var(--color-primary)]/5 text-[var(--color-primary)]" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-gray-50"}`}
              >
                <Sparkles className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Housekeeping</span>
              </button>
              <button
                onClick={() => setType("maintenance")}
                className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg border-2 transition-colors ${type === "maintenance" ? "border-[var(--color-danger)] bg-[color:var(--color-danger)]/5 text-[var(--color-danger)]" : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-gray-50"}`}
              >
                <Wrench className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Maintenance</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">Description</label>
            <textarea
              rows={3}
              className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] border-[var(--color-border)]"
              placeholder="E.g. Extra towels requested, AC not cooling..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-[var(--color-text)]">Priority</label>
            <select
              className="w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] border-[var(--color-border)] text-[var(--color-text)]"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low - When possible</option>
              <option value="normal">Normal - Next available</option>
              <option value="high">High - Urgent attention</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-end gap-3 bg-[var(--color-light)] border-t border-[var(--color-border)]">
          <Button variant="outline" onClick={onClose} disabled={createHk.isMutating || createMx.isMutating}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createHk.isMutating || createMx.isMutating}
            style={{ background: "var(--color-navy)", color: "white" }}
          >
            {(createHk.isMutating || createMx.isMutating) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
}
