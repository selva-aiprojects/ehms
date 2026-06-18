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
