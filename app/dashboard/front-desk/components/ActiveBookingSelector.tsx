"use client";

import useSWR from "swr";
import { Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ActiveBookingSelector({ value, onChange }: { value?: string, onChange: (bookingId: string, guestId: string) => void }) {
  const { data, isLoading } = useSWR("/api/dashboard/front-desk/active-bookings", fetcher);
  const bookings = data?.data || [];

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading active rooms...</div>;
  }

  return (
    <select 
      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20"
      value={value || ""}
      onChange={(e) => {
        const selected = bookings.find((b: any) => b.booking_id === e.target.value);
        if (selected) {
          onChange(selected.booking_id, selected.guest_id);
        } else {
          onChange("", "");
        }
      }}
      required
    >
      <option value="" disabled>Select a Room / Guest</option>
      {bookings.map((b: any) => (
        <option key={b.booking_id} value={b.booking_id}>
          Unit {b.unit_label} - {b.first_name} {b.last_name}
        </option>
      ))}
    </select>
  );
}
