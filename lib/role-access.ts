export const ROLE_ACCESS: Record<string, string[]> = {
  platform_super_admin: [
    "/dashboard", "/dashboard/admin", "/dashboard/admin/tenants",
    "/dashboard/admin/tickets", "/dashboard/admin/broadcasts",
    "/dashboard/admin/provisioning", "/dashboard/admin/subscriptions",
  ],
  super_admin: [
    "/dashboard", "/dashboard/admin", "/dashboard/front-desk", "/dashboard/rooms-inventory",
    "/dashboard/housekeeping", "/dashboard/maintenance", "/dashboard/finance",
    "/dashboard/hr", "/dashboard/hotels", "/dashboard/apartments",
    "/dashboard/rental", "/dashboard/workplace", "/dashboard/procurement",
    "/dashboard/inventory", "/dashboard/vendors", "/dashboard/settings",
    "/dashboard/revenue", "/dashboard/revenue/ai", "/dashboard/pricing", "/dashboard/loyalty", "/dashboard/laundry", "/dashboard/ota", "/dashboard/front-desk/checkin", "/dashboard/front-desk/checkout", "/dashboard/whatsapp", "/dashboard/multi-property",
    "/dashboard/restaurant", "/dashboard/tickets",
  ],
  executive: [
    "/dashboard", "/dashboard/admin", "/dashboard/front-desk", "/dashboard/rooms-inventory",
    "/dashboard/housekeeping", "/dashboard/maintenance", "/dashboard/finance",
    "/dashboard/hr", "/dashboard/hotels", "/dashboard/apartments",
    "/dashboard/rental", "/dashboard/workplace", "/dashboard/procurement",
    "/dashboard/inventory", "/dashboard/vendors", "/dashboard/settings",
    "/dashboard/revenue", "/dashboard/revenue/ai", "/dashboard/pricing", "/dashboard/loyalty", "/dashboard/laundry", "/dashboard/ota", "/dashboard/front-desk/checkin", "/dashboard/front-desk/checkout", "/dashboard/whatsapp", "/dashboard/multi-property",
    "/dashboard/restaurant", "/dashboard/tickets",
  ],
  property_manager: [
    "/dashboard", "/dashboard/hotels", "/dashboard/apartments", "/dashboard/rooms-inventory",
    "/dashboard/rental", "/dashboard/workplace", "/dashboard/admin",
    "/dashboard/procurement", "/dashboard/inventory", "/dashboard/vendors",
    "/dashboard/settings", "/dashboard/front-desk", "/dashboard/housekeeping",
    "/dashboard/maintenance", "/dashboard/finance", "/dashboard/hr",
    "/dashboard/revenue", "/dashboard/revenue/ai", "/dashboard/pricing", "/dashboard/loyalty", "/dashboard/laundry", "/dashboard/ota", "/dashboard/front-desk/checkin", "/dashboard/front-desk/checkout", "/dashboard/whatsapp",
    "/dashboard/restaurant", "/dashboard/tickets",
  ],
  finance_manager: ["/dashboard", "/dashboard/finance", "/dashboard/procurement", "/dashboard/rental", "/dashboard/inventory", "/dashboard/vendors", "/dashboard/tickets"],
  front_desk: ["/dashboard", "/dashboard/front-desk", "/dashboard/rooms-inventory", "/dashboard/laundry", "/dashboard/front-desk/checkin", "/dashboard/front-desk/checkout", "/dashboard/restaurant", "/dashboard/tickets"],
  housekeeping_supervisor: ["/dashboard", "/dashboard/housekeeping", "/dashboard/inventory", "/dashboard/rooms-inventory", "/dashboard/admin/users", "/dashboard/tickets"],
  housekeeping_staff: ["/dashboard", "/dashboard/housekeeping", "/dashboard/tickets"],
  maintenance_staff: ["/dashboard", "/dashboard/maintenance", "/dashboard/vendors", "/dashboard/tickets"],
  maintenance_supervisor: ["/dashboard", "/dashboard/maintenance", "/dashboard/procurement", "/dashboard/inventory", "/dashboard/vendors", "/dashboard/admin/users", "/dashboard/tickets"],
  hr_manager: ["/dashboard", "/dashboard/hr", "/dashboard/tickets"],
  hr_executive: ["/dashboard", "/dashboard/hr", "/dashboard/tickets"],
  employee_manager: ["/dashboard", "/dashboard/hr", "/dashboard/tickets"],
  finance_executive: ["/dashboard", "/dashboard/finance", "/dashboard/tickets"],
  security_staff: ["/dashboard", "/dashboard/workplace", "/dashboard/tickets"],
  vendor_user: ["/dashboard", "/dashboard/tickets"],
  workplace_facility_manager: ["/dashboard", "/dashboard/workplace", "/dashboard/tickets"],
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  executive: "Executive",
  property_manager: "Property Manager",
  front_desk: "Front Desk",
  housekeeping_supervisor: "HK Supervisor",
  housekeeping_staff: "HK Staff",
  maintenance_staff: "Maintenance Staff",
  maintenance_supervisor: "Maintenance Supervisor",
  hr_manager: "HR Manager",
  hr_executive: "HR Executive",
  employee_manager: "Manager",
  finance_manager: "Finance Manager",
  finance_executive: "Finance Executive",
  security_staff: "Security Staff",
  vendor_user: "Vendor",
  workplace_facility_manager: "Facility Manager",
  unknown: "User",
};

export const DEMO_ROLE_MAP: Record<string, string> = {
  "superadmin@ehms.demo": "super_admin",
  "raghu.superadmin@ehms.demo": "super_admin",
  "vishwa.superadmin@ehms.demo": "super_admin",
  "admin@ehms.demo": "property_manager",
  "frontdesk@ehms.demo": "front_desk",
  "housekeeping@ehms.demo": "housekeeping_staff",
  "maintenance@ehms.demo": "maintenance_staff",
  "executive@ehms.demo": "executive",
  "hr@ehms.demo": "hr_manager",
  "finance@ehms.demo": "finance_manager",
};


export function hasAccess(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowed = ROLE_ACCESS[role];
  if (!allowed) return false;
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
