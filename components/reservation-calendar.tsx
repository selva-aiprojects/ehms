"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Filter, ZoomIn, ZoomOut, Calendar as CalendarIcon } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface Unit {
  id: string;
  unit_label: string;
  unit_type: string;
  status: string;
  base_rate: number;
  floor_id: string;
  floor_name: string;
  floor_number: number;
  building_id: string;
  building_name: string;
}

interface Booking {
  id: string;
  status: string;
  source: string;
  check_in: string;
  check_out: string;
  total_amount: number;
  adults: number;
  children: number;
  special_requests: string;
  unit_id: string;
  guest_id: string;
  guest_name: string;
  guest_phone: string;
  unit_label: string;
}

interface CalendarProps {
  units: Unit[];
  bookings: Booking[];
  dates: string[];
  onBookingMove?: (bookingId: string, newUnitId: string) => void;
  onDateClick?: (unitId: string, date: string) => void;
  onBookingClick?: (booking: Booking) => void;
}

/* ─── Constants ─────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  confirmed:  { bg: "var(--color-info-soft)", border: "var(--color-info)", text: "var(--color-info-dark)", label: "Confirmed" },
  checked_in: { bg: "var(--color-success-soft)", border: "var(--color-success)", text: "var(--color-success-dark)", label: "Checked In" },
  pending:    { bg: "var(--color-warning-soft)", border: "var(--color-warning)", text: "var(--color-warning-dark)", label: "Pending" },
  cancelled:  { bg: "var(--color-danger-soft)", border: "var(--color-danger)", text: "var(--color-danger-dark)", label: "Cancelled" },
  reserved:   { bg: "#E0E7FF", border: "#6366F1", text: "#3730A3", label: "Reserved" },
};

const UNIT_STATUS_COLORS: Record<string, string> = {
  vacant: "var(--color-success)",
  occupied: "var(--color-info)",
  dirty: "var(--color-warning)",
  cleaning: "#8B5CF6",
  inspection: "#EC4899",
  maintenance: "var(--color-danger)",
  reserved: "#6366F1",
};

const CELL_WIDTH_DAY = 40;
const CELL_WIDTH_WEEK = 120;
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 56;
const LABEL_WIDTH = 180;

/* ─── Helper Functions ──────────────────────────────────── */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a);
  const db = parseLocalDate(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

function isWeekend(dateStr: string): boolean {
  const d = parseLocalDate(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/* ─── Sub-components ────────────────────────────────────── */
function UnitLabel({ unit }: { unit: Unit }) {
  const statusColor = UNIT_STATUS_COLORS[unit.status] || "var(--color-text-faint)";
  return (
    <div
      className="flex items-center gap-2 px-3 border-b border-r"
      style={{
        height: ROW_HEIGHT,
        minWidth: LABEL_WIDTH,
        maxWidth: LABEL_WIDTH,
        borderColor: "var(--color-border)",
        background: "var(--color-light)",
      }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: statusColor }}
      />
      <span className="text-xs font-medium truncate" style={{ color: "var(--color-navy)" }}>
        {unit.unit_label}
      </span>
      <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--color-text-faint)" }}>
        {unit.floor_name}
      </span>
    </div>
  );
}

function DateHeaderCell({ date, cellWidth }: { date: string; cellWidth: number }) {
  const d = parseLocalDate(date);
  const dayNum = d.getDate();
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const today = isToday(date);
  const weekend = isWeekend(date);

  return (
    <div
      className="flex flex-col items-center justify-center border-r shrink-0"
      style={{
        width: cellWidth,
        height: HEADER_HEIGHT,
        borderColor: "var(--color-border)",
        background: today ? "var(--color-info-soft)" : weekend ? "var(--color-light)" : "var(--color-white)",
      }}
    >
      <span
        className="text-[10px] font-medium"
        style={{ color: today ? "var(--color-info)" : "var(--color-text-faint)" }}
      >
        {dayName}
      </span>
      <span
        className={`text-xs font-bold ${today ? "rounded-full px-1.5 py-0.5" : ""}`}
        style={{
          color: today ? "var(--color-white)" : weekend ? "var(--color-text-muted)" : "var(--color-navy)",
          background: today ? "var(--color-info)" : "transparent",
        }}
      >
        {dayNum}
      </span>
    </div>
  );
}

function BookingBar({
  booking,
  startDate,
  cellWidth,
  onClick,
}: {
  booking: Booking;
  startDate: string;
  cellWidth: number;
  onClick: () => void;
}) {
  const colors = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
  const startOffset = Math.max(0, daysBetween(startDate, booking.check_in.split("T")[0]));
  const duration = Math.max(1, daysBetween(booking.check_in.split("T")[0], booking.check_out.split("T")[0]));
  const left = startOffset * cellWidth;
  const width = duration * cellWidth - 2;

  return (
    <div
      className="absolute top-1 rounded-md cursor-pointer flex items-center px-1.5 overflow-hidden transition-shadow hover:shadow-md"
      style={{
        left: left + 1,
        width: Math.max(width, cellWidth - 2),
        height: ROW_HEIGHT - 8,
        background: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        color: colors.text,
        zIndex: 10,
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("booking_id", booking.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`${booking.guest_name} — ${booking.check_in.split("T")[0]} to ${booking.check_out.split("T")[0]} (${booking.status})`}
    >
      <span className="text-[11px] font-semibold truncate leading-tight">
        {booking.guest_name}
      </span>
      {width > 100 && (
        <span className="text-[9px] ml-1 opacity-70 truncate">
          {formatCurrency(booking.total_amount)}
        </span>
      )}
    </div>
  );
}

function EmptyCell({
  unitId,
  date,
  cellWidth,
  onDrop,
  onClick,
}: {
  unitId: string;
  date: string;
  cellWidth: number;
  onDrop: (bookingId: string, unitId: string) => void;
  onClick: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const today = isToday(date);

  return (
    <div
      className="border-r border-b shrink-0 relative"
      style={{
        width: cellWidth,
        height: ROW_HEIGHT,
        borderColor: "var(--color-border)",
        background: dragOver
          ? "rgba(var(--color-primary-rgb),0.10)"
          : today
          ? "var(--color-light)"
          : "var(--color-white)",
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const bookingId = e.dataTransfer.getData("booking_id");
        if (bookingId) onDrop(bookingId, unitId);
      }}
      onClick={onClick}
    >
      {today && (
        <div className="absolute inset-y-0 left-0 w-px" style={{ background: "var(--color-info)", opacity: 0.3 }} />
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────── */
export default function ReservationCalendar({
  units,
  bookings,
  dates,
  onBookingMove,
  onDateClick,
  onBookingClick,
}: CalendarProps) {
  const [zoom, setZoom] = useState<"day" | "week">("day");
  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const cellWidth = zoom === "day" ? CELL_WIDTH_DAY : CELL_WIDTH_WEEK;

  // Group units by building + floor
  const groupedUnits = useMemo(() => {
    let filtered = units;
    if (filterBuilding !== "all") filtered = filtered.filter((u) => u.building_id === filterBuilding);
    if (filterFloor !== "all") filtered = filtered.filter((u) => u.floor_id === filterFloor);

    const groups = new Map<string, { id: string; label: string; units: Unit[] }>();

    for (const unit of filtered) {
      // Display names are not unique; use persisted IDs for grouping and React keys.
      const groupId = `${unit.building_id}:${unit.floor_id}`;
      const group = groups.get(groupId) ?? {
        id: groupId,
        label: `${unit.building_name} — ${unit.floor_name}`,
        units: [],
      };
      group.units.push(unit);
      groups.set(groupId, group);
    }
    return Array.from(groups.values());
  }, [units, filterBuilding, filterFloor]);

  // Unique buildings and floors for filters
  const buildings = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => map.set(u.building_id, u.building_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [units]);

  const floors = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((u) => map.set(u.floor_id, u.floor_name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [units]);

  // Build a map: unit_id -> bookings[]
  const bookingsByUnit = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!map.has(b.unit_id)) map.set(b.unit_id, []);
      map.get(b.unit_id)!.push(b);
    }
    return map;
  }, [bookings]);

  const handleDrop = useCallback(
    (bookingId: string, newUnitId: string) => {
      onBookingMove?.(bookingId, newUnitId);
    },
    [onBookingMove]
  );

  const totalDays = dates.length;
  const calendarWidth = totalDays * cellWidth;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <CalendarIcon className="w-4 h-4" style={{ color: "var(--color-navy)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-navy)" }}>
          Reservation Calendar
        </h3>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => {
              if (scrollRef.current) {
                const todayIdx = dates.findIndex((d) => isToday(d));
                if (todayIdx >= 0) scrollRef.current.scrollLeft = todayIdx * cellWidth;
              }
            }}
            className="px-2 py-1 text-xs rounded-md border cursor-pointer hover:bg-[var(--color-light)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
          >
            Today
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setZoom("day")}
            className={`p-1 rounded cursor-pointer ${zoom === "day" ? "bg-[rgba(var(--color-info-rgb),0.12)]" : "hover:bg-[var(--color-light)]"}`}
            title="Day view"
          >
            <ZoomIn className="w-3.5 h-3.5" style={{ color: zoom === "day" ? "var(--color-info)" : "var(--color-text-muted)" }} />
          </button>
          <button
            onClick={() => setZoom("week")}
            className={`p-1 rounded cursor-pointer ${zoom === "week" ? "bg-[rgba(var(--color-info-rgb),0.12)]" : "hover:bg-[var(--color-light)]"}`}
            title="Week view"
          >
            <ZoomOut className="w-3.5 h-3.5" style={{ color: zoom === "week" ? "var(--color-info)" : "var(--color-text-muted)" }} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="w-3.5 h-3.5" style={{ color: "var(--color-text-faint)" }} />
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="text-xs border rounded-md px-2 py-1"
            style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
          >
            <option value="all">All Buildings</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="text-xs border rounded-md px-2 py-1"
            style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
          >
            <option value="all">All Floors</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-4">
          {Object.entries(STATUS_COLORS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-3 h-2 rounded-sm" style={{ background: val.border }} />
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{val.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Calendar Grid ───────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
        <div className="flex" style={{ minWidth: LABEL_WIDTH + calendarWidth }}>
          {/* Left: Unit Labels */}
          <div className="sticky left-0 z-20" style={{ minWidth: LABEL_WIDTH }}>
            {/* Date header placeholder */}
            <div
              className="border-b border-r sticky top-0 z-30 flex items-center px-3"
              style={{
                height: HEADER_HEIGHT,
                background: "var(--color-light)",
                borderColor: "var(--color-border)",
                minWidth: LABEL_WIDTH,
              }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-faint)" }}>
                Room / Unit
              </span>
            </div>
            {/* Unit rows */}
            {groupedUnits.map((group) => (
              <div key={group.id}>
                {/* Floor header */}
                <div
                  className="flex items-center px-3 border-b border-r"
                  style={{
                    height: 28,
                    background: "var(--color-light)",
                    borderColor: "var(--color-border)",
                    minWidth: LABEL_WIDTH,
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    {group.label}
                  </span>
                </div>
                {group.units.map((unit) => (
                  <UnitLabel key={unit.id} unit={unit} />
                ))}
              </div>
            ))}
          </div>

          {/* Right: Date Columns */}
          <div className="flex-1">
            {/* Date header row */}
            <div
              className="flex sticky top-0 z-10"
              style={{ minWidth: calendarWidth }}
            >
              {dates.map((date) => (
                <DateHeaderCell key={date} date={date} cellWidth={cellWidth} />
              ))}
            </div>

            {/* Booking rows */}
            {groupedUnits.map((group) => (
              <div key={group.id}>
                {/* Floor spacer */}
                <div
                  className="border-b border-r"
                  style={{
                    height: 28,
                    borderColor: "var(--color-border)",
                    background: "var(--color-light)",
                  }}
                />
                {group.units.map((unit) => {
                  const unitBookings = bookingsByUnit.get(unit.id) || [];
                  return (
                    <div key={unit.id} className="relative" style={{ height: ROW_HEIGHT }}>
                      {/* Empty cells */}
                      <div className="flex">
                        {dates.map((date) => (
                          <EmptyCell
                            key={date}
                            unitId={unit.id}
                            date={date}
                            cellWidth={cellWidth}
                            onDrop={handleDrop}
                            onClick={() => onDateClick?.(unit.id, date)}
                          />
                        ))}
                      </div>
                      {/* Booking bars overlay */}
                      {unitBookings.map((booking) => (
                        <BookingBar
                          key={booking.id}
                          booking={booking}
                          startDate={dates[0]}
                          cellWidth={cellWidth}
                          onClick={() => onBookingClick?.(booking)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer Stats ────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 border-t text-[11px]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
        <span>{groupedUnits.reduce((acc, g) => acc + g.units.length, 0)} rooms</span>
        <span>{bookings.length} bookings</span>
        <span>{dates.length} days displayed</span>
        <span className="ml-auto">Drag bookings to move between rooms</span>
      </div>
    </div>
  );
}
