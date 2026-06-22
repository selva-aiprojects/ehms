import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard/stats", fetcher, { refreshInterval: 30000 });
  return {
    stats: data as {
      totalBookings: number;
      checkedIn: number;
      totalGuests: number;
      totalRevenue: number;
      occupancyRate: number;
      chartData: { month: string; revenue: number }[];
    } | undefined,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useHotelStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard/hotels", fetcher, { refreshInterval: 30000 });
  return {
    stats: data?.data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useApartmentStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard/apartments", fetcher, { refreshInterval: 30000 });
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

export function useVendors() {
  const { data, error, isLoading, mutate } = useSWR(`/api/maintenance/vendors`, fetcher);
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

export function useEmployees(search?: string, departmentId?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (departmentId) params.set("department_id", departmentId);
  const { data, error, isLoading, mutate } = useSWR(`/api/hr/employees?${params}`, fetcher);
  return { employees: data?.data, isLoading, isError: !!error, mutate };
}

export function useProperties(verticalType?: string) {
  const params = verticalType ? `?vertical_type=${verticalType}` : "";
  const { data, error, isLoading, mutate } = useSWR(`/api/properties${params}`, fetcher);
  return { properties: data?.data, isLoading, isError: !!error, mutate };
}

export function useLeases(filters?: { status?: string; renewal_due?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.renewal_due) params.set("renewal_due", "true");
  const { data, error, isLoading, mutate } = useSWR(`/api/leases?${params}`, fetcher);
  return { leases: data?.data, isLoading, isError: !!error, mutate };
}

export function useAdminUsers(filters?: { role?: string; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/users?${params}`, fetcher);
  return { users: data?.data, isLoading, isError: !!error, mutate };
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

export function useWorkplaceBookings(filters?: { status?: string; booking_type?: string; date?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.booking_type) params.set("booking_type", filters.booking_type);
  if (filters?.date) params.set("date", filters.date);
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

export function useHKInspections(unitId?: string, status?: string) {
  const params = new URLSearchParams();
  if (unitId) params.set("unit_id", unitId);
  if (status) params.set("status", status);
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

export function useMaintenanceStats() {
  const { data, error, isLoading, mutate } = useSWR("/api/maintenance/stats", fetcher, { refreshInterval: 30000 });
  return { maintStats: data, isLoading, isError: !!error, mutate };
}
