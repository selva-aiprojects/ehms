"use client";

import { useState, useEffect, useCallback } from "react";
import { GanttChart, Loader2 } from "lucide-react";
import { useReservationCalendar } from "@/lib/hooks";
import { useMoveBooking } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";
import ReservationCalendar from "@/components/reservation-calendar";

export default function CalendarPage() {
  const { selectedPropertyId } = useJourney();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [days, setDays] = useState(30);

  const { units, bookings, dates, isLoading, mutate } = useReservationCalendar({
    property_id: selectedPropertyId || undefined,
    start_date: startDate,
    days,
  });

  const { trigger: moveBooking, isMutating: isMoving } = useMoveBooking();

  const handleBookingMove = useCallback(
    async (bookingId: string, newUnitId: string) => {
      await moveBooking({ booking_id: bookingId, new_unit_id: newUnitId });
      mutate();
    },
    [moveBooking, mutate]
  );

  const handleDateClick = useCallback((unitId: string, date: string) => {
    // TODO: Open quick-create booking modal with pre-filled unit + date
    console.log("Date clicked:", unitId, date);
  }, []);

  const handleBookingClick = useCallback((booking: any) => {
    // TODO: Open booking detail modal
    console.log("Booking clicked:", booking);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
        <span className="ml-2 text-sm" style={{ color: "#64748B" }}>Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.10)" }}>
            <GanttChart className="w-5 h-5" style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Reservation Calendar</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>
              Drag bookings to move between rooms. Click empty cells to create new bookings.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "#64748B" }}>From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs border rounded-lg px-3 py-1.5"
              style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "#64748B" }}>Days:</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="text-xs border rounded-lg px-3 py-1.5"
              style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ height: "calc(100% - 70px)" }}>
        <ReservationCalendar
          units={units}
          bookings={bookings}
          dates={dates}
          onBookingMove={handleBookingMove}
          onDateClick={handleDateClick}
          onBookingClick={handleBookingClick}
        />
      </div>
    </div>
  );
}
