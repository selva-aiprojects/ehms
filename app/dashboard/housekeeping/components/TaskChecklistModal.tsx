import { useState, useEffect } from "react";
import { X, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface TaskChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any | null;
  onResolve: (taskId: string) => Promise<void>;
}

const CHECKLIST_TEMPLATES: Record<string, string[]> = {
  deep_clean: [
    "Strip all linens and spray mattress",
    "Clean and sanitize entire bathroom (shower, toilet, sink)",
    "Dust all surfaces including high shelves and vents",
    "Vacuum and mop all floors",
    "Clean interior windows and mirrors",
    "Restock all amenities (soap, shampoo, towels)",
    "Empty and sanitize all trash bins",
    "Check all electronics (TV, lights, AC)"
  ],
  stayover_tidy: [
    "Make bed (replace linens if requested)",
    "Empty trash bins",
    "Replace used towels",
    "Wipe down bathroom counter and sink",
    "Vacuum high-traffic areas",
    "Restock coffee/tea station"
  ],
  turnaround: [
    "Strip bed and remake with fresh linens",
    "Full bathroom sanitation",
    "Dust surfaces and wipe nightstands",
    "Vacuum entire room",
    "Restock amenities and minibar",
    "Empty trash and recycling"
  ],
  inspection: [
    "Check room temperature and smell",
    "Verify no dust on surfaces",
    "Check bathroom for water spots/hairs",
    "Test TV, remote, and lights",
    "Ensure amenities are perfectly aligned",
    "Verify minibar stock matches system"
  ],
  evening_turndown: [
    "Turn down bed sheets",
    "Place turndown amenities (chocolates/water)",
    "Close curtains and dim lights",
    "Empty trash",
    "Replace used towels"
  ],
  vip_arrival: [
    "Perform standard inspection checklist",
    "Place VIP welcome amenity (fruit/wine)",
    "Personalize welcome note",
    "Ensure premium toiletries are stocked",
    "Test all smart room controls",
    "Double check specific guest preferences"
  ]
};

export default function TaskChecklistModal({ isOpen, onClose, task, onResolve }: TaskChecklistModalProps) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taskType = task?.task_type || "deep_clean";
  const items = CHECKLIST_TEMPLATES[taskType] || CHECKLIST_TEMPLATES["deep_clean"];

  useEffect(() => {
    if (isOpen) {
      setCheckedItems(new Set());
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const isAllChecked = checkedItems.size === items.length;

  const toggleCheck = (index: number) => {
    const next = new Set(checkedItems);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCheckedItems(next);
  };

  async function handleResolve() {
    if (!isAllChecked) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onResolve(task.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to resolve task");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(42,157,143,0.1)" }}>
              <CheckCircle className="w-4 h-4" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <h2 className="font-semibold text-[#1A3C5E]">Quality Assurance Checklist</h2>
              <p className="text-xs text-[#64748B]">Room {task.unit?.unit_label || "Unknown"} • {taskType.replace("_", " ")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#64748B] hover:bg-[#F5F7FA] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto bg-[#F8FAFC]">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.1)", color: "#E53E3E" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between text-xs font-medium mb-2">
              <span style={{ color: "#1A3C5E" }}>Progress</span>
              <span style={{ color: isAllChecked ? "#2BAE8E" : "#64748B" }}>
                {checkedItems.size} / {items.length} completed
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
              <div 
                className="h-full transition-all duration-300 ease-out" 
                style={{ 
                  width: `${(checkedItems.size / items.length) * 100}%`,
                  background: isAllChecked ? "#2BAE8E" : "#1A3C5E" 
                }} 
              />
            </div>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => {
              const checked = checkedItems.has(index);
              return (
                <label 
                  key={index} 
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked ? "bg-white border-[#2BAE8E]/30" : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div className="pt-0.5">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-[#2BAE8E] cursor-pointer"
                      checked={checked}
                      onChange={() => toggleCheck(index)}
                    />
                  </div>
                  <span className={`text-sm ${checked ? "text-[#64748B] line-through" : "text-[#1A2E44]"}`}>
                    {item}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-[#E2E8F0] flex justify-between items-center bg-white">
          <div className="text-xs text-[#64748B]">
            All items must be checked before resolving.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#64748B] bg-white border border-[#E2E8F0] rounded-lg hover:bg-[#F5F7FA] transition-colors"
              disabled={isSubmitting}
            >
              Close
            </button>
            <button
              onClick={handleResolve}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                isAllChecked && !isSubmitting ? "bg-[#2BAE8E] hover:bg-[#23997C]" : "bg-[#CBD5E1] cursor-not-allowed"
              }`}
              disabled={!isAllChecked || isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Resolving...</>
              ) : (
                "Complete Task"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
