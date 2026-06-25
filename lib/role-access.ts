export const ROLE_ACCESS: Record<string, string[]> = {
  platform_super_admin: [
    "/dashboard", "/dashboard/admin", "/dashboard/admin/tenants",
  ],
  super_admin: [
    "/dashboard", "/dashboard/admin", "/dashboard/front-desk",
    "/dashboard/housekeeping", "/dashboard/maintenance", "/dashboard/finance",
    "/dashboard/hr", "/dashboard/hotels", "/dashboard/apartments",
    "/dashboard/rental", "/dashboard/workplace",
  ],
  executive: [
    "/dashboard", "/dashboard/admin", "/dashboard/front-desk",
    "/dashboard/housekeeping", "/dashboard/maintenance", "/dashboard/finance",
    "/dashboard/hr", "/dashboard/hotels", "/dashboard/apartments",
    "/dashboard/rental", "/dashboard/workplace",
  ],
  property_manager: [
    "/dashboard", "/dashboard/hotels", "/dashboard/apartments",
    "/dashboard/rental", "/dashboard/workplace", "/dashboard/admin",
  ],
  front_desk: ["/dashboard", "/dashboard/front-desk"],
  housekeeping_supervisor: ["/dashboard", "/dashboard/housekeeping"],
  housekeeping_staff: ["/dashboard", "/dashboard/housekeeping"],
  maintenance_staff: ["/dashboard", "/dashboard/maintenance"],
  maintenance_supervisor: ["/dashboard", "/dashboard/maintenance"],
  hr_manager: ["/dashboard", "/dashboard/hr"],
  hr_executive: ["/dashboard", "/dashboard/hr"],
  employee_manager: ["/dashboard", "/dashboard/hr"],
  finance_manager: ["/dashboard", "/dashboard/finance"],
  finance_executive: ["/dashboard", "/dashboard/finance"],
  security_staff: ["/dashboard", "/dashboard/workplace"],
  vendor_user: ["/dashboard"],
  workplace_facility_manager: ["/dashboard", "/dashboard/workplace"],
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
