"use client";

import { useState } from "react";
import { Star, MessageSquare, TrendingUp, ChevronRight, Loader2, Plus, X } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import useSWR from "swr";
import ActiveBookingSelector from "../components/ActiveBookingSelector";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function FeedbacksPage() {
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({ booking_id: "", guest_id: "", department: "Overall", rating: 5, comments: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/dashboard/front-desk/feedbacks${departmentFilter !== 'all' ? `?department=${departmentFilter}` : ''}`, 
    fetcher
  );
  const feedbacks = data?.data || [];

  const averageRating = feedbacks.length > 0 
    ? (feedbacks.reduce((acc: number, f: any) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : "0.0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/front-desk/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ booking_id: "", guest_id: "", department: "Overall", rating: 5, comments: "" });
        mutate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <Star className="w-6 h-6 text-[#2BAE8E]" /> Guest Feedbacks
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Monitor guest satisfaction across all service departments.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20"
            style={{ borderColor: "#E2E8F0" }}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            <option value="Front Desk">Front Desk</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="F&B">F&B</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Overall">Overall Stay</option>
          </select>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[#2BAE8E] hover:bg-[#239B7E] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Log Feedback
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-[#1A3C5E] to-[#2BAE8E] text-white">
          <div className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium opacity-90">Average Rating</span>
              <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="w-5 h-5 text-white" /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold">{averageRating}</div>
              <div className="text-sm opacity-80 flex items-center"><Star className="w-4 h-4 fill-current mr-1" /> / 5.0</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent Feedback" subtitle={`${feedbacks.length} reviews`} />
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#64748B]" /></div>
        ) : !feedbacks || feedbacks.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">No feedbacks recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F5F7FA] text-[#64748B] uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Guest / Unit</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {feedbacks.map((f: any) => (
                  <tr key={f.id} className="hover:bg-[#F5F7FA]/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#1A3C5E]">
                        {f.first_name ? `${f.first_name} ${f.last_name}` : "Anonymous"}
                      </div>
                      {f.unit_label && <div className="text-xs text-[#64748B] mt-0.5">Unit {f.unit_label}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < f.rating ? "fill-current" : "text-gray-300"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium text-[#1A2E44]">{f.department}</span>
                    </td>
                    <td className="px-4 py-4 min-w-[300px]">
                      <div className="text-[#64748B] flex gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <p className="italic">"{f.comments || "No comments provided."}"</p>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(f.created_at).toLocaleString()}
                      </div>
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
              <h2 className="text-lg font-semibold text-[#1A3C5E]">Log New Feedback</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Select Guest / Room</label>
                  <ActiveBookingSelector 
                    value={formData.booking_id} 
                    onChange={(bId, gId) => setFormData({...formData, booking_id: bId, guest_id: gId})} 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Department</label>
                  <select 
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20"
                  >
                    <option value="Front Desk">Front Desk</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="F&B">F&B</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Overall">Overall Stay</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Rating (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star className={`w-8 h-8 ${star <= formData.rating ? "fill-amber-500 text-amber-500" : "text-gray-300"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Comments</label>
                  <textarea 
                    rows={4}
                    value={formData.comments}
                    onChange={(e) => setFormData({...formData, comments: e.target.value})}
                    placeholder="Guest feedback..."
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20 resize-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#1A3C5E] hover:bg-[#132d47] text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Feedback"}
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
