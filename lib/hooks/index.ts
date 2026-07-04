import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useStats(propertyId?: string) {
  const url = propertyId ? `/api/dashboard/stats?property_id=${propertyId}` : "/api/dashboard/stats";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { refreshInterval: 30000 });
  return {
    stats: data as {
      totalBookings: number;
      checkedIn: number;
      totalGuests: number;
      totalRevenue: number;
      totalPayables: number;
      avgRating: number;
      occupancyRate: number;
      chartData: { month: string; revenue: number }[];
    } | undefined,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useHotelStats(propertyId?: string) {
  const url = propertyId ? `/api/dashboard/hotels?property_id=${propertyId}` : "/api/dashboard/hotels";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { refreshInterval: 30000 });
  return {
    stats: data?.data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useApartmentStats(propertyId?: string) {
  const url = propertyId ? `/api/dashboard/apartments?property_id=${propertyId}` : "/api/dashboard/apartments";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { refreshInterval: 30000 });
  return {
    stats: data?.data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useReservations(filters?: {
  status?: string;
  property_id?: string;
  date?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.page) params.set("page", String(filters.page));

  const { data, error, isLoading, mutate } = useSWR(
    `/api/reservations?${params}`,
    fetcher
  );
  return { reservations: data?.data, count: data?.count, isLoading, isError: !!error, mutate };
}

export function useRoomMatrix(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/front-desk/matrix${params}`, fetcher);
  return { rooms: data?.data, isLoading, isError: !!error, mutate };
}

export function useGuests(search?: string, page = 1) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  const { data, error, isLoading, mutate } = useSWR(`/api/guests?${params}`, fetcher);
  return { guests: data?.data, count: data?.count, isLoading, isError: !!error, mutate };
}

export function useHousekeeping(filters?: { property_id?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  const { data, error, isLoading, mutate } = useSWR(`/api/housekeeping?${params}`, fetcher, { refreshInterval: 15000 });
  return { tasks: data?.data, isLoading, isError: !!error, mutate };
}

export function useMaintenance(filters?: { property_id?: string; status?: string; priority?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance?${params}`, fetcher);
  return { tickets: data?.data, isLoading, isError: !!error, mutate };
}

export function usePreventiveSchedules(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/preventive${params}`, fetcher);
  return { schedules: data?.data, isLoading, isError: !!error, mutate };
}

export function useAMCContracts(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/amc${params}`, fetcher);
  return { amcs: data?.data, isLoading, isError: !!error, mutate };
}

export function usePartsInventory(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/inventory${params}`, fetcher);
  return { inventory: data?.data, isLoading, isError: !!error, mutate };
}

export function useVendors(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/vendors${params}`, fetcher);
  return { vendors: data?.data, isLoading, isError: !!error, mutate };
}

export function useFeedbackTriage(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/feedback-triage${params}`, fetcher, { refreshInterval: 30000 });
  return { feedback: data?.data, isLoading, isError: !!error, mutate };
}

export function useFinance(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/finance${params}`, fetcher);
  return { finance: data, isLoading, isError: !!error, mutate };
}

export function useEmployees(search?: string, departmentId?: string, propertyId?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (departmentId) params.set("department_id", departmentId);
  if (propertyId) params.set("property_id", propertyId);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/employees?${params}`, fetcher);
  return { employees: data?.data, isLoading, isError: !!error, mutate };
}

export function useProperties(verticalType?: string, includeInactive?: boolean) {
  const params = new URLSearchParams();
  if (verticalType) params.set("vertical_type", verticalType);
  if (includeInactive) params.set("include_inactive", "true");
  const { data, error, isLoading, mutate } = useSWR(`/api/properties?${params}`, fetcher);
  return { properties: data?.data, isLoading, isError: !!error, mutate };
}

export function useProperty(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/properties/${id}` : null, fetcher);
  return { property: data?.data, isLoading, isError: !!error, mutate };
}

export function useLeases(filters?: { status?: string; renewal_due?: boolean; property_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.renewal_due) params.set("renewal_due", "true");
  if (filters?.property_id) params.set("property_id", filters.property_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/leases?${params}`, fetcher);
  return { leases: data?.data, isLoading, isError: !!error, mutate };
}

export function useLease(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/leases/${id}` : null, fetcher);
  return { lease: data?.data, isLoading, isError: !!error, mutate };
}

export function useRentInvoices(filters?: { lease_id?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.lease_id) params.set("lease_id", filters.lease_id);
  if (filters?.status) params.set("status", filters.status);
  const { data, error, isLoading, mutate } = useSWR(`/api/rent-invoices?${params}`, fetcher);
  return { invoices: data?.data, isLoading, isError: !!error, mutate };
}

export function useRentInvoice(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/rent-invoices/${id}` : null, fetcher);
  return { invoice: data?.data, isLoading, isError: !!error, mutate };
}

export function useDeposits(leaseId?: string) {
  const params = leaseId ? `?lease_id=${leaseId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/deposits${params}`, fetcher);
  return { deposits: data?.data, isLoading, isError: !!error, mutate };
}

export function useAdminUsers(filters?: { role?: string; status?: string; search?: string; property_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/users?${params}`, fetcher);
  return { users: data?.data, requesterPropertyId: data?.requester_property_id, isLoading, isError: !!error, mutate };
}

export function useAuditLogs(limit = 50, entityType?: string) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (entityType) params.set("entity_type", entityType);
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/audit-logs?${params}`, fetcher);
  return { logs: data?.data, isLoading, isError: !!error, mutate };
}

export function useComplianceRecords(propertyId?: string, status?: string) {
  const params = new URLSearchParams();
  if (propertyId) params.set("property_id", propertyId);
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/compliance?${params}`, fetcher);
  return { records: data?.data, isLoading, isError: !!error, mutate };
}

export function useMemberships(filters?: { status?: string; property_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/workplace/memberships?${params}`, fetcher);
  return { memberships: data?.data, isLoading, isError: !!error, mutate };
}

export function useWorkplaceBookings(filters?: { status?: string; booking_type?: string; date?: string; property_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.booking_type) params.set("booking_type", filters.booking_type);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/workplace/bookings?${params}`, fetcher);
  return { bookings: data?.data, isLoading, isError: !!error, mutate };
}

export function useVisitors(propertyId?: string, limit = 50) {
  const params = new URLSearchParams();
  if (propertyId) params.set("property_id", propertyId);
  params.set("limit", String(limit));
  const { data, error, isLoading, mutate } = useSWR(`/api/visitors?${params}`, fetcher);
  return { visitors: data?.data, isLoading, isError: !!error, mutate };
}

export function useFnBOrders() {
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/f-and-b/orders`, fetcher, { refreshInterval: 15000 });
  return { orders: data?.data, isLoading, isError: !!error, mutate };
}

export function useFnBMenu() {
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/f-and-b/menu`, fetcher);
  return { menu: data?.data, isLoading, isError: !!error, mutate };
}

export function useTimesheets(filters?: { employee_id?: string; date_from?: string; date_to?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.employee_id) params.set("employee_id", filters.employee_id);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.status) params.set("status", filters.status);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/timesheets?${params}`, fetcher);
  return { timesheets: data?.data, isLoading, isError: !!error, mutate };
}

export function useLeaveRequests(filters?: { employee_id?: string; status?: string; from_date?: string; to_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.employee_id) params.set("employee_id", filters.employee_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.from_date) params.set("from_date", filters.from_date);
  if (filters?.to_date) params.set("to_date", filters.to_date);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/leaves?${params}`, fetcher);
  return { leaves: data?.data, isLoading, isError: !!error, mutate };
}

export function useLeaveBalances(employeeId?: string) {
  const { data, error, isLoading, mutate } = useSWR(employeeId ? `/api/hr/leaves/balances?employee_id=${employeeId}` : null, fetcher);
  return { balances: data?.data, isLoading, isError: !!error, mutate };
}

export function usePayrollRuns(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/payroll${params}`, fetcher);
  return { payrollRuns: data?.data, isLoading, isError: !!error, mutate };
}

export function usePayrollRun(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/hr/payroll/${id}` : null, fetcher);
  return { payrollRun: data?.data, isLoading, isError: !!error, mutate };
}

export function useCompliance() {
  const { data, error, isLoading, mutate } = useSWR("/api/hr/compliance", fetcher);
  return { compliance: data?.data, isLoading, isError: !!error, mutate };
}

export function useShifts() {
  const { data, error, isLoading, mutate } = useSWR("/api/hr/shifts", fetcher);
  return { shifts: data?.data, isLoading, isError: !!error, mutate };
}

export function useDepartments() {
  const { data, error, isLoading, mutate } = useSWR("/api/hr/departments", fetcher);
  return { departments: data?.data, isLoading, isError: !!error, mutate };
}

export function useSystemSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/settings', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 60000 
  });
  return { settings: data?.data, isLoading, isError: !!error, mutate };
}

// ── HR Masters ──
export function useHolidays(year?: string) {
  const params = year ? `?year=${year}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/holidays${params}`, fetcher);
  return { holidays: data?.data, isLoading, isError: !!error, mutate };
}

export function useOvertimePolicies() {
  const { data, error, isLoading, mutate } = useSWR("/api/hr/overtime-policies", fetcher);
  return { overtimePolicies: data?.data, isLoading, isError: !!error, mutate };
}

export function useAttendancePolicies() {
  const { data, error, isLoading, mutate } = useSWR("/api/hr/attendance-policies", fetcher);
  return { attendancePolicies: data?.data, isLoading, isError: !!error, mutate };
}

export function useDocumentTypes() {
  const { data, error, isLoading, mutate } = useSWR("/api/hr/document-types", fetcher);
  return { documentTypes: data?.data, isLoading, isError: !!error, mutate };
}

export function usePolicyDocuments(category?: string) {
  const params = category ? `?category=${category}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/policy-documents${params}`, fetcher);
  return { policyDocuments: data?.data, isLoading, isError: !!error, mutate };
}

// ── Appraisal ──
export function useAppraisalCycles(status?: string) {
  const params = status ? `?status=${status}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/appraisal-cycles${params}`, fetcher);
  return { appraisalCycles: data?.data, isLoading, isError: !!error, mutate };
}

export function useAppraisalReviews(cycleId?: string, employeeId?: string) {
  const params = new URLSearchParams();
  if (cycleId) params.set("cycle_id", cycleId);
  if (employeeId) params.set("employee_id", employeeId);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/appraisal-reviews?${params}`, fetcher);
  return { appraisalReviews: data?.data, isLoading, isError: !!error, mutate };
}

export function useAppraisalGoals(cycleId?: string, employeeId?: string) {
  const params = new URLSearchParams();
  if (cycleId) params.set("cycle_id", cycleId);
  if (employeeId) params.set("employee_id", employeeId);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/appraisal-goals?${params}`, fetcher);
  return { appraisalGoals: data?.data, isLoading, isError: !!error, mutate };
}

// ── Increments & Promotions ──
export function useIncrements(employeeId?: string, status?: string) {
  const params = new URLSearchParams();
  if (employeeId) params.set("employee_id", employeeId);
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/increments?${params}`, fetcher);
  return { increments: data?.data, isLoading, isError: !!error, mutate };
}

export function usePromotions(employeeId?: string, status?: string) {
  const params = new URLSearchParams();
  if (employeeId) params.set("employee_id", employeeId);
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/promotions?${params}`, fetcher);
  return { promotions: data?.data, isLoading, isError: !!error, mutate };
}

// ── App Masters ──
export function useTaxSlabs(taxType?: string) {
  const params = taxType ? `?tax_type=${taxType}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/masters/tax-slabs${params}`, fetcher);
  return { taxSlabs: data?.data, isLoading, isError: !!error, mutate };
}

export function usePaymentModes() {
  const { data, error, isLoading, mutate } = useSWR("/api/masters/payment-modes", fetcher);
  return { paymentModes: data?.data, isLoading, isError: !!error, mutate };
}

export function useBookingSources() {
  const { data, error, isLoading, mutate } = useSWR("/api/masters/booking-sources", fetcher);
  return { bookingSources: data?.data, isLoading, isError: !!error, mutate };
}

export function useRatePlans() {
  const { data, error, isLoading, mutate } = useSWR("/api/masters/rate-plans", fetcher);
  return { ratePlans: data?.data, isLoading, isError: !!error, mutate };
}

export function useIdProofTypes() {
  const { data, error, isLoading, mutate } = useSWR("/api/masters/id-proof-types", fetcher);
  return { idProofTypes: data?.data, isLoading, isError: !!error, mutate };
}

export function useAssetCategories() {
  const { data, error, isLoading, mutate } = useSWR("/api/masters/asset-categories", fetcher);
  return { assetCategories: data?.data, isLoading, isError: !!error, mutate };
}

export function useUOM() {
  const { data, error, isLoading, mutate } = useSWR("/api/masters/uom", fetcher);
  return { uom: data?.data, isLoading, isError: !!error, mutate };
}

export function useLocations(type: "countries" | "states" | "cities", parentId?: string) {
  const params = new URLSearchParams();
  params.set("type", type);
  if (parentId) params.set(parentId.includes("country") ? "country_id" : "state_id", parentId);
  const { data, error, isLoading, mutate } = useSWR(`/api/masters/locations?${params}`, fetcher);
  return { locations: data?.data, isLoading, isError: !!error, mutate };
}

// ── Housekeeping Workflow ──
export function useLinenBatches(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/housekeeping/linen/batches${params}`, fetcher);
  return { linenBatches: data?.data, isLoading, isError: !!error, mutate };
}

export function useLinenItems(propertyId?: string, status?: string) {
  const params = new URLSearchParams();
  if (propertyId) params.set("property_id", propertyId);
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/housekeeping/linen/items?${params}`, fetcher);
  return { linenItems: data?.data, isLoading, isError: !!error, mutate };
}

export function useLinenTransactions(propertyId?: string, batchId?: string) {
  const params = new URLSearchParams();
  if (propertyId) params.set("property_id", propertyId);
  if (batchId) params.set("batch_id", batchId);
  const { data, error, isLoading, mutate } = useSWR(`/api/housekeeping/linen/transactions?${params}`, fetcher);
  return { linenTransactions: data?.data, isLoading, isError: !!error, mutate };
}

export function useHKChecklists(taskId?: string) {
  const params = taskId ? `?task_id=${taskId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/housekeeping/checklists${params}`, fetcher);
  return { checklists: data?.data, isLoading, isError: !!error, mutate };
}

export function useHKInspections(unitId?: string, status?: string, propertyId?: string) {
  const params = new URLSearchParams();
  if (unitId) params.set("unit_id", unitId);
  if (status) params.set("status", status);
  if (propertyId) params.set("property_id", propertyId);
  const { data, error, isLoading, mutate } = useSWR(`/api/housekeeping/inspections?${params}`, fetcher);
  return { inspections: data?.data, isLoading, isError: !!error, mutate };
}

export function useHKStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/housekeeping/stats", fetcher, { refreshInterval: 30000 });
  return { hkStats: data, isLoading, isError: !!error, mutate };
}

// ── Maintenance Workflow ──
export function useMaintenanceAssets(propertyId?: string, status?: string) {
  const params = new URLSearchParams();
  if (propertyId) params.set("property_id", propertyId);
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/assets?${params}`, fetcher);
  return { assets: data?.data, isLoading, isError: !!error, mutate };
}

export function useMaintenanceTicketParts(ticketId?: string) {
  const params = ticketId ? `?ticket_id=${ticketId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/ticket-parts${params}`, fetcher);
  return { ticketParts: data?.data, isLoading, isError: !!error, mutate };
}

export function useMaintenanceTimeEntries(ticketId?: string, technicianId?: string) {
  const params = new URLSearchParams();
  if (ticketId) params.set("ticket_id", ticketId);
  if (technicianId) params.set("technician_id", technicianId);
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/time-entries?${params}`, fetcher);
  return { timeEntries: data?.data, isLoading, isError: !!error, mutate };
}

export function useMaintenanceApprovals(ticketId?: string) {
  const params = ticketId ? `?ticket_id=${ticketId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/approvals${params}`, fetcher);
  return { approvals: data?.data, isLoading, isError: !!error, mutate };
}

export function useMaintenanceStats(propertyId?: string) {
  const url = propertyId ? `/api/maintenance/stats?property_id=${propertyId}` : "/api/maintenance/stats";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { refreshInterval: 30000 });
  return { maintStats: data, isLoading, isError: !!error, mutate };
}

// ── Admin Module ──
export function useAdminUser(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/admin/users/${id}` : null, fetcher);
  return { user: data?.data, isLoading, isError: !!error, mutate };
}

export function useAdminRoles() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/roles", fetcher);
  return { roles: data?.data, isLoading, isError: !!error, mutate };
}

export function useAdminSessions() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/sessions", fetcher, { refreshInterval: 30000 });
  return { sessions: data?.data, total: data?.total, isLoading, isError: !!error, mutate };
}

export function useAdminBackups() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/backup", fetcher);
  return { backups: data?.data, isLoading, isError: !!error, mutate };
}

export function useAdminAuditEvents(filters?: { event_type?: string; severity?: string; days?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.event_type) params.set("event_type", filters.event_type);
  if (filters?.severity) params.set("severity", filters.severity);
  if (filters?.days) params.set("days", String(filters.days));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/audit-events?${params}`, fetcher, { refreshInterval: 15000 });
  return { auditEvents: data?.data, isLoading, isError: !!error, mutate };
}

// ── Accounts Module ──
export function useAccounts(filters?: { property_id?: string; account_type?: string; active?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.account_type) params.set("account_type", filters.account_type);
  if (filters?.active === false) params.set("active", "false");
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/accounts?${params}`, fetcher);
  return { accounts: data?.data, isLoading, isError: !!error, mutate };
}

export function useAccount(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/finance/accounts/${id}` : null, fetcher);
  return { account: data?.data, isLoading, isError: !!error, mutate };
}

export function useJournalEntries(filters?: { property_id?: string; from_date?: string; to_date?: string; status?: string; journal_type?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.from_date) params.set("from_date", filters.from_date);
  if (filters?.to_date) params.set("to_date", filters.to_date);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.journal_type) params.set("journal_type", filters.journal_type);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/journal-entries?${params}`, fetcher);
  return { journalEntries: data?.data, isLoading, isError: !!error, mutate };
}

export function useJournalEntry(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/finance/journal-entries/${id}` : null, fetcher);
  return { journalEntry: data?.data, isLoading, isError: !!error, mutate };
}

export function useLedger(filters: { account_id: string; property_id?: string; from_date?: string; to_date?: string }) {
  const params = new URLSearchParams({ account_id: filters.account_id });
  if (filters.property_id) params.set("property_id", filters.property_id);
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/ledger?${params}`, fetcher);
  return { ledger: data?.data, isLoading, isError: !!error, mutate };
}

export function useVendorBills(filters?: { property_id?: string; status?: string; vendor_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.vendor_id) params.set("vendor_id", filters.vendor_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/vendor-bills?${params}`, fetcher);
  return { vendorBills: data?.data, isLoading, isError: !!error, mutate };
}

export function useVendorBill(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/finance/vendor-bills/${id}` : null, fetcher);
  return { vendorBill: data?.data, isLoading, isError: !!error, mutate };
}

export function useBillPayments(filters?: { property_id?: string; bill_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.bill_id) params.set("bill_id", filters.bill_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/bill-payments?${params}`, fetcher);
  return { billPayments: data?.data, isLoading, isError: !!error, mutate };
}

export function useBudget(filters?: { property_id?: string; fiscal_year_id?: string; budget_head_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.fiscal_year_id) params.set("fiscal_year_id", filters.fiscal_year_id);
  if (filters?.budget_head_id) params.set("budget_head_id", filters.budget_head_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/budget?${params}`, fetcher);
  return { budgetEntries: data?.data, isLoading, isError: !!error, mutate };
}

export function useBudgetHeads(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/budget/heads${params}`, fetcher);
  return { budgetHeads: data?.data, isLoading, isError: !!error, mutate };
}

export function useFixedAssets(filters?: { property_id?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/fixed-assets?${params}`, fetcher);
  return { fixedAssets: data?.data, isLoading, isError: !!error, mutate };
}

export function useFixedAsset(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/finance/fixed-assets/${id}` : null, fetcher);
  return { fixedAsset: data?.data, isLoading, isError: !!error, mutate };
}

export function useDepreciationSchedule(filters?: { asset_id?: string; is_posted?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.asset_id) params.set("asset_id", filters.asset_id);
  if (filters?.is_posted !== undefined) params.set("is_posted", String(filters.is_posted));
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/depreciation?${params}`, fetcher);
  return { depreciation: data?.data, isLoading, isError: !!error, mutate };
}

export function useTaxFilings(filters?: { property_id?: string; tax_type?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.tax_type) params.set("tax_type", filters.tax_type);
  if (filters?.status) params.set("status", filters.status);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/tax-filings?${params}`, fetcher);
  return { taxFilings: data?.data, isLoading, isError: !!error, mutate };
}

export function useCostCenters(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/cost-centers${params}`, fetcher);
  return { costCenters: data?.data, isLoading, isError: !!error, mutate };
}

export function useFiscalYears(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/fiscal-years${params}`, fetcher);
  return { fiscalYears: data?.data, isLoading, isError: !!error, mutate };
}

export function useTrialBalance(filters?: { property_id?: string; as_at_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.as_at_date) params.set("as_at_date", filters.as_at_date);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/reports/trial-balance?${params}`, fetcher);
  return { trialBalance: data?.data, isLoading, isError: !!error, mutate };
}

export function useProfitLoss(filters?: { property_id?: string; from_date?: string; to_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.from_date) params.set("from_date", filters.from_date);
  if (filters?.to_date) params.set("to_date", filters.to_date);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/reports/profit-loss?${params}`, fetcher);
  return { profitLoss: data?.data, isLoading, isError: !!error, mutate };
}

export function useBalanceSheet(filters?: { property_id?: string; as_at_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.as_at_date) params.set("as_at_date", filters.as_at_date);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/reports/balance-sheet?${params}`, fetcher);
  return { balanceSheet: data?.data, isLoading, isError: !!error, mutate };
}

// ── Front Desk Hooks ──
export function useActiveBookings(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/front-desk/active-bookings${params}`, fetcher, { refreshInterval: 15000 });
  return { activeBookings: data?.data, isLoading, isError: !!error, mutate };
}

export function useGuestRequests(filters?: { property_id?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/front-desk/requests?${params}`, fetcher, { refreshInterval: 15000 });
  return { requests: data?.data, isLoading, isError: !!error, mutate };
}

export function useFrontDeskBilling() {
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/front-desk/billing`, fetcher);
  return { billing: data?.data, isLoading, isError: !!error, mutate };
}

export function useCheckinChecklist() {
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/front-desk/checkin`, fetcher);
  return { checklist: data?.data, isLoading, isError: !!error, mutate };
}

export function useFrontDeskStats() {
  const { data, error, isLoading, mutate } = useSWR(`/api/dashboard/front-desk/stats`, fetcher, { refreshInterval: 30000 });
  return { fdStats: data, isLoading, isError: !!error, mutate };
}

// ── Vendors Hooks ──
export function useVendorsList(filters?: { property_id?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(`/api/vendors?${params}`, fetcher);
  return { vendors: data?.data, isLoading, isError: !!error, mutate };
}

export function useVendor(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/vendors/${id}` : null, fetcher);
  return { vendor: data?.data, isLoading, isError: !!error, mutate };
}

export function useVendorServices(vendorId?: string) {
  const { data, error, isLoading, mutate } = useSWR(vendorId ? `/api/vendors/services?vendor_id=${vendorId}` : null, fetcher);
  return { services: data?.data, isLoading, isError: !!error, mutate };
}

export function useVendorOrders(vendorId?: string, status?: string) {
  const params = new URLSearchParams();
  if (vendorId) params.set("vendor_id", vendorId);
  if (status) params.set("status", status);
  const { data, error, isLoading, mutate } = useSWR(`/api/vendors/orders?${params}`, fetcher);
  return { orders: data?.data, isLoading, isError: !!error, mutate };
}

// ── Procurement Hooks ──
export function usePurchaseOrders(filters?: { vendor_id?: string; property_id?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.vendor_id) params.set("vendor_id", filters.vendor_id);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(`/api/procurement/purchase-orders?${params}`, fetcher);
  return { purchaseOrders: data?.data, isLoading, isError: !!error, mutate };
}

export function usePurchaseOrder(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/procurement/purchase-orders/${id}` : null, fetcher);
  return { purchaseOrder: data?.data, isLoading, isError: !!error, mutate };
}

export function useGrnList(filters?: { po_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.po_id) params.set("po_id", filters.po_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/procurement/grn?${params}`, fetcher);
  return { grns: data?.data, isLoading, isError: !!error, mutate };
}

export function useGrn(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/procurement/grn/${id}` : null, fetcher);
  return { grn: data?.data, isLoading, isError: !!error, mutate };
}

export function useProcurementStats(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/procurement/stats${params}`, fetcher, { refreshInterval: 30000 });
  return { procurementStats: data?.data, isLoading, isError: !!error, mutate };
}

// ── Inventory Hooks ──
export function useInventoryCategories(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/inventory/categories${params}`, fetcher);
  return { categories: data?.data, isLoading, isError: !!error, mutate };
}

export function useInventoryItems(filters?: { property_id?: string; category_id?: string; low_stock?: boolean; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.category_id) params.set("category_id", filters.category_id);
  if (filters?.low_stock) params.set("low_stock", "true");
  if (filters?.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(`/api/inventory/items?${params}`, fetcher, { refreshInterval: 15000 });
  return { inventoryItems: data?.data, isLoading, isError: !!error, mutate };
}

export function useInventoryItem(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/inventory/items/${id}` : null, fetcher);
  return { inventoryItem: data?.data, isLoading, isError: !!error, mutate };
}

export function useInventoryTransactions(filters?: { item_id?: string; property_id?: string; transaction_type?: string; from_date?: string; to_date?: string }) {
  const params = new URLSearchParams();
  if (filters?.item_id) params.set("item_id", filters.item_id);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  if (filters?.transaction_type) params.set("transaction_type", filters.transaction_type);
  if (filters?.from_date) params.set("from_date", filters.from_date);
  if (filters?.to_date) params.set("to_date", filters.to_date);
  const { data, error, isLoading, mutate } = useSWR(`/api/inventory/transactions?${params}`, fetcher);
  return { transactions: data?.data, isLoading, isError: !!error, mutate };
}

export function useWarehouses(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/inventory/warehouses${params}`, fetcher);
  return { warehouses: data?.data, isLoading, isError: !!error, mutate };
}

export function useInventoryStats(propertyId?: string) {
  const params = propertyId ? `?property_id=${propertyId}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/inventory/stats${params}`, fetcher, { refreshInterval: 30000 });
  return { invStats: data?.data, isLoading, isError: !!error, mutate };
}

// ── Ticketing / Support Tickets ──
export function useAdminTickets(filters?: { status?: string; priority?: string; tenant_code?: string; category?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.tenant_code) params.set("tenant_code", filters.tenant_code);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/tickets?${params}`, fetcher, { refreshInterval: 15000 });
  return { tickets: data?.tickets, isLoading, isError: !!error, mutate };
}

export function useAdminTicket(id?: string) {
  const { data, error, isLoading, mutate } = useSWR(id ? `/api/admin/tickets/${id}` : null, fetcher);
  return { ticket: data?.ticket, isLoading, isError: !!error, mutate };
}

export function usePropertyFeatures(propertyId?: string) {
  const { property, isLoading } = useProperty(propertyId);
  const features = property?.config?.features || {};
  return {
    features: features as Record<string, { enabled: boolean; label: string }>,
    isFeatureEnabled: (key: string) => !!features[key]?.enabled,
    isLoading,
  };
}

export function useReconciliations(filters?: { status?: string; property_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.property_id) params.set("property_id", filters.property_id);
  const { data, error, isLoading, mutate } = useSWR(`/api/finance/reconciliation?${params}`, fetcher);
  return { reconciliations: data?.data, isLoading, isError: !!error, mutate };
}

export function useAdminOverview(propertyId?: string) {
  const url = propertyId ? `/api/dashboard/admin-overview?property_id=${propertyId}` : "/api/dashboard/admin-overview";
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, { refreshInterval: 30000 });
  return {
    overview: data as {
      employeesAvailable: number;
      issues: { category: string; count: number }[];
      rooms: { status: string; count: number }[];
      feedbacks: {
        today: number; thisWeek: number; thisMonth: number;
        thisYear: number; overall: number;
        avgRating: number; monthAvgRating: number; yearAvgRating: number;
        recent: Record<string, unknown>[];
      } | null;
      revenue: {
        today: number; week: number; month: number;
        year: number; total: number;
        recent: Record<string, unknown>[];
      } | null;
      financial: {
        todaySpending: number; weekSpending: number; monthSpending: number;
        yearSpending: number; expectedExpenses: number;
        expectedReceivables: number; availableMoney: number;
        recentBills: Record<string, unknown>[];
      } | null;
      drillDown: {
        vendorBills: Record<string, unknown>[];
        hkTasks: Record<string, unknown>[];
        maintTickets: Record<string, unknown>[];
        guestRequests: Record<string, unknown>[];
      };
    } | undefined,
    isLoading,
    isError: !!error,
    mutate,
  };
}
