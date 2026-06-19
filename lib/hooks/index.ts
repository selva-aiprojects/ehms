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
