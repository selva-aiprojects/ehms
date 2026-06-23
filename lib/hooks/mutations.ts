"use client";

import useSWRMutation from "swr/mutation";
import { useSWRConfig } from "swr";

async function jsonFetcher(url: string, { arg }: { arg: Record<string, unknown> }) {
  const method = arg._method === "DELETE" ? "DELETE" : arg._method === "PUT" ? "PUT" : "POST";
  const fetchUrl = typeof arg._url === "string" ? arg._url : url;
  const { _url, _method, ...bodyData } = arg;
  const body = method === "DELETE" ? undefined : JSON.stringify(bodyData);
  const res = await fetch(fetchUrl, { method, headers: { "Content-Type": "application/json" }, body });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export function useCheckIn() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/reservations/", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/reservations")); mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats")); },
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/reservations/${id}`, _method: "PUT", status: "checked_in" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

export function useCheckOut() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/reservations/", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/reservations")); mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats")); },
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/reservations/${id}`, _method: "PUT", status: "checked_out" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

export function useCreateReservation() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/reservations", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/reservations")); mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats")); },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateGuest() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/guests", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/guests")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateHousekeepingTask() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/housekeeping/", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/housekeeping")); mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats")); },
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/housekeeping/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

export function useCreateHousekeepingTask() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/housekeeping", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/housekeeping")); mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats")); },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateMaintenanceTicket() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/maintenance", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/maintenance")); mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats")); },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateLease() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/leases", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/leases"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/properties"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/stats"));
    },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Accounts Module Mutations ──
export function useCreateAccount() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/accounts", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && (k.startsWith("/api/finance/accounts") || k.startsWith("/api/finance/reports"))),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateAccount() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/accounts", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && (k.startsWith("/api/finance/accounts") || k.startsWith("/api/finance/reports"))),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/finance/accounts/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateJournalEntry() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/journal-entries", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && (k.startsWith("/api/finance/journal-entries") || k.startsWith("/api/finance/ledger") || k.startsWith("/api/finance/reports"))),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function usePostJournalEntry() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/journal-entries", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && (k.startsWith("/api/finance/journal-entries") || k.startsWith("/api/finance/ledger") || k.startsWith("/api/finance/reports"))),
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/finance/journal-entries/${id}`, _method: "PUT", _action: "post" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateVendorBill() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/vendor-bills", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/vendor-bills")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useApproveVendorBill() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/vendor-bills", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/vendor-bills")),
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/finance/vendor-bills/${id}`, _method: "PUT", _action: "approve" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateBillPayment() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/bill-payments", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/finance/bill-payments")); mutate((k) => typeof k === "string" && k.startsWith("/api/finance/vendor-bills")); },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateFixedAsset() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/fixed-assets", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/fixed-assets")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useRecordDepreciation() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/depreciation", jsonFetcher, {
    onSuccess: () => { mutate((k) => typeof k === "string" && k.startsWith("/api/finance/depreciation")); mutate((k) => typeof k === "string" && k.startsWith("/api/finance/fixed-assets")); },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateTaxFiling() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/tax-filings", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/tax-filings")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useFileTaxReturn() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/tax-filings", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/tax-filings")),
  });
  return {
    trigger: async (id: string, filedBy: string) => mutation.trigger({ _url: `/api/finance/tax-filings/${id}`, _method: "PUT", _action: "file", filed_by: filedBy } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateBudgetHead() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/budget/heads", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/budget")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateBudgetEntry() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/budget", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/budget")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateFiscalYear() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/fiscal-years", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/fiscal-years")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateCostCenter() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/cost-centers", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/cost-centers")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Admin User Mutations ──
export function useCreateAdminUser() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/users", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/admin/users")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateAdminUser() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/users", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/admin/users")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/admin/users/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useDeleteAdminUser() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/users", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/admin/users")),
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/admin/users/${id}`, _method: "DELETE" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

// ── Property Mutations ──
export function useCreateProperty() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/properties", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/properties")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateProperty() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/properties", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/properties")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/properties/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

// ── Vendors Mutations ──
export function useCreateVendor() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/vendors", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/vendors")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateVendor() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/vendors", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/vendors")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/vendors/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

// ── Inventory Mutations ──
export function useCreateInventoryItem() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/inventory/items", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/inventory")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateInventoryTransaction() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/inventory/transactions", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/inventory")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateInventoryCategory() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/inventory/categories", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/inventory")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateWarehouse() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/inventory/warehouses", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/inventory")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}
