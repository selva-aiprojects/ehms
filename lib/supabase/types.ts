// Auto-generated TypeScript types matching the eHMS PostgreSQL schema
// Run `npx supabase gen types typescript --project-id <id>` to regenerate

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type VerticalType = "hotel" | "service_apartment" | "rental_apartment" | "workplace";
export type UnitType = "room" | "suite" | "apartment" | "desk" | "seat" | "meeting_room" | "cabin";
export type BookingModel = "nightly" | "lease" | "membership" | "hourly";
export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
export type RoomStatus = "vacant" | "occupied" | "dirty" | "cleaning" | "inspection" | "maintenance" | "reserved";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
export type LeaseStatus = "drafted" | "signed" | "active" | "renewal_due" | "renewed" | "terminated";

export interface Database {
  public: {
    Tables: {
      enterprises: {
        Row: { id: string; name: string; code: string; logo_url: string | null; currency: string; timezone: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["enterprises"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["enterprises"]["Insert"]>;
      };
      properties: {
        Row: { id: string; region_id: string; name: string; code: string; vertical_type: VerticalType; booking_model: BookingModel; address: string | null; phone: string | null; email: string | null; star_rating: number | null; is_active: boolean; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["properties"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      units: {
        Row: { id: string; floor_id: string; unit_type: UnitType; unit_label: string; layout_type: string | null; sq_ft: number | null; max_occupancy: number; base_rate: number | null; status: RoomStatus; is_active: boolean; attributes: Json; created_at: string; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["units"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
      };
      bookings: {
        Row: { id: string; property_id: string; unit_id: string | null; guest_id: string | null; booking_model: BookingModel; status: BookingStatus; source: string; check_in: string; check_out: string; adults: number; children: number; total_amount: number | null; paid_amount: number; balance_amount: number | null; currency: string; special_requests: string | null; checked_in_at: string | null; checked_out_at: string | null; created_at: string; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "balance_amount" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      guest_profiles: {
        Row: { id: string; user_id: string | null; first_name: string; last_name: string | null; email: string | null; phone: string | null; id_type: string | null; id_number: string | null; id_verified: boolean; nationality: string | null; date_of_birth: string | null; tags: string[] | null; loyalty_points: number; total_stays: number; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["guest_profiles"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["guest_profiles"]["Insert"]>;
      };
      housekeeping_tasks: {
        Row: { id: string; unit_id: string; property_id: string; assigned_to: string | null; assigned_by: string | null; task_type: string; priority: TicketPriority; status: TicketStatus; scheduled_at: string | null; started_at: string | null; completed_at: string | null; notes: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["housekeeping_tasks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["housekeeping_tasks"]["Insert"]>;
      };
      maintenance_tickets: {
        Row: { id: string; property_id: string; unit_id: string | null; asset_id: string | null; reported_by: string | null; assigned_to: string | null; title: string; description: string | null; priority: TicketPriority; status: TicketStatus; category: string | null; estimated_cost: number | null; actual_cost: number | null; resolved_at: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["maintenance_tickets"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["maintenance_tickets"]["Insert"]>;
      };
      invoices: {
        Row: { id: string; property_id: string; booking_id: string | null; guest_id: string | null; invoice_number: string; invoice_date: string; due_date: string; status: InvoiceStatus; subtotal: number | null; tax_total: number | null; grand_total: number | null; balance_due: number | null; paid_total: number; currency: string; notes: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "balance_due" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      payments: {
        Row: { id: string; invoice_id: string | null; booking_id: string | null; property_id: string; payment_method: string; gateway_ref: string | null; amount: number; currency: string; payment_date: string; status: string; reconciliation_status: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["payments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      employees: {
        Row: { id: string; user_id: string | null; employee_code: string; department_id: string | null; designation: string | null; employment_type: string; doj: string | null; base_salary: number | null; is_active: boolean; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["employees"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["employees"]["Insert"]>;
      };
      departments: {
        Row: { id: string; property_id: string | null; name: string; code: string | null; manager_id: string | null };
        Insert: Omit<Database["public"]["Tables"]["departments"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["departments"]["Insert"]>;
      };
      attendance_records: {
        Row: { id: string; employee_id: string; property_id: string | null; clock_in: string; clock_out: string | null; status: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["attendance_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["attendance_records"]["Insert"]>;
      };
      users: {
        Row: { id: string; email: string; phone: string | null; first_name: string; last_name: string | null; avatar_url: string | null; is_active: boolean; mfa_enabled: boolean; last_login_at: string | null; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      vertical_type: VerticalType;
      booking_status: BookingStatus;
      room_status: RoomStatus;
      ticket_status: TicketStatus;
      invoice_status: InvoiceStatus;
    };
  };
}
