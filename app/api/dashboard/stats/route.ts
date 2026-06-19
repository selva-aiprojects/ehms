import { NextResponse } from "next/server";
import { db } from "@/lib/supabase/db";

export async function GET() {
  try {
    const supabase = await db();

    const today = new Date().toISOString().split("T")[0];

    // Run all aggregates in parallel
    const [
      { count: totalBookings },
      { count: checkedIn },
      { count: totalGuests },
      { data: revenueData },
      { data: occupancyData },
      { data: monthlyRevenue },
    ] = await Promise.all([
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "checked_in"),
      supabase.from("guest_profiles").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount").eq("status", "completed"),
      supabase.from("units").select("status"),
      supabase.from("payments")
        .select("amount, payment_date")
        .eq("status", "completed")
        .gte("payment_date", new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString()),
    ]);

    const totalRevenue = (revenueData || []).reduce((s, p) => s + (p.amount || 0), 0);
    const totalUnits = (occupancyData || []).length;
    const occupiedUnits = (occupancyData || []).filter(u => u.status === "occupied").length;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Build monthly revenue chart data (last 12 months)
    const monthMap: Record<string, number> = {};
    (monthlyRevenue || []).forEach(p => {
      const month = p.payment_date?.slice(0, 7) || "";
      monthMap[month] = (monthMap[month] || 0) + (p.amount || 0);
    });
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = d.toISOString().slice(0, 7);
      return { month: d.toLocaleString("default", { month: "short" }), revenue: monthMap[key] || 0 };
    });

    return NextResponse.json({
      totalBookings: totalBookings || 0,
      checkedIn: checkedIn || 0,
      totalGuests: totalGuests || 0,
      totalRevenue,
      occupancyRate,
      chartData,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
