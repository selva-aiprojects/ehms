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

export function useUpdateLease() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/leases", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/leases"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/properties"));
    },
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/leases/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateRentInvoice() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/rent-invoices", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/rent-invoices")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateRentInvoice() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/rent-invoices", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && (k.startsWith("/api/rent-invoices") || k.startsWith("/api/leases"))),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/rent-invoices/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateDepositTransaction() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/deposits", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/deposits")),
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

export function useUpdatePropertyConfig() {
  const { mutate } = useSWRConfig();
  return {
    trigger: async (id: string, config: Record<string, unknown>) => {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to update config" }));
        throw new Error(err.error || "Failed to update config");
      }
      mutate((k) => typeof k === "string" && k.startsWith("/api/properties"));
      return res.json();
    },
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

// ── Procurement Mutations ──
export function useCreatePurchaseOrder() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/procurement/purchase-orders", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/procurement")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdatePurchaseOrder() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/procurement/purchase-orders", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/procurement")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/procurement/purchase-orders/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateGrn() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/procurement/grn", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/procurement")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
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

export function useCreateMembership() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/workplace/memberships", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/workplace/memberships")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useVisitorCheckIn() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/visitors", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/visitors")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useVisitorCheckOut() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/visitors", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/visitors")),
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/visitors/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateReconciliation() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/reconciliation", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/reconciliation")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateReconciliation() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/finance/reconciliation", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/finance/reconciliation")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/finance/reconciliation/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

// ── Admin Ticket Mutations ──
export function useCreateAdminTicket() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/tickets", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/admin/tickets")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateAdminTicket() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/tickets", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/admin/tickets")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/admin/tickets/${id}`, _method: "PATCH" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreateAdminTicketMessage() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/tickets", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/admin/tickets")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/admin/tickets/${id}/messages`, _method: "POST" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

// ── Phase 1: Move Booking (Calendar Drag-and-Drop) ─────────
export function useMoveBooking() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/reservations/move", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/reservations"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard"));
    },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Phase 1: Loyalty ───────────────────────────────────────
export function useCreateLoyaltyTier() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/loyalty/tiers", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/loyalty")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useAdjustLoyaltyPoints() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/loyalty/transactions", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/loyalty")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Phase 1: Dynamic Pricing ───────────────────────────────
export function useCreatePricingRule() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/pricing/rules", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/pricing")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdatePricingRule() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/pricing/rules", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/pricing")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/pricing/rules/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useCreatePricingSeason() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/pricing/seasons", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/pricing")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Phase 1: Laundry ───────────────────────────────────────
export function useCreateLaundryOrder() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/laundry", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/laundry"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard"));
    },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateLaundryOrder() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/laundry", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/laundry")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/laundry/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

// ── Phase 2: OTA Channel Manager ───────────────────────────
export function useCreateOtaMapping() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/ota/mappings", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/ota")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useTriggerOtaSync() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/ota/sync", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/ota")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useProcessOtaBooking() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/ota/bookings", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/ota"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/reservations"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard"));
    },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateSettlement() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/ota/settlements", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/ota")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Restaurant POS Mutations ──
export function useUpdateTableStatus() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/restaurant/tables", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/tables"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/kds"));
    },
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/restaurant/tables/${id}`, _method: "PATCH" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

export function useCreateTableReservation() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/restaurant/reservations", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/reservations"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/tables"));
    },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateSplitBill() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/restaurant/split-bills", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/split-bills")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateKdsTicket() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/restaurant/kds", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/kds"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/tables"));
    },
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/restaurant/kds/${id}`, _method: "PATCH" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

export function useCreateKdsTicket() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/restaurant/kds", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/restaurant/kds")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useUpdateMenuItem() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/dashboard/f-and-b/menu", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/f-and-b/menu")),
  });
  return {
    trigger: async (id: string, body: Record<string, unknown>) => mutation.trigger({ ...body, _url: `/api/dashboard/f-and-b/menu/${id}`, _method: "PUT" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

export function useDeleteMenuItem() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/dashboard/f-and-b/menu", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/dashboard/f-and-b/menu")),
  });
  return {
    trigger: async (id: string) => mutation.trigger({ _url: `/api/dashboard/f-and-b/menu/${id}`, _method: "DELETE" } as any),
    isMutating: mutation.isMutating,
    error: mutation.error,
  };
}

// ── Phase 4: Revenue AI ─────────────────────────────────────
export function useApplyAiRecommendation() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/revenue-ai/recommendations", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/revenue-ai"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/pricing"));
    },
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useGenerateForecast() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/revenue-ai/forecast", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/revenue-ai")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateCompetitorRate() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/revenue-ai/competitors", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/revenue-ai")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

export function useCreateAiRule() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/revenue-ai/rules", jsonFetcher, {
    onSuccess: () => mutate((k) => typeof k === "string" && k.startsWith("/api/revenue-ai")),
  });
  return { trigger: mutation.trigger, isMutating: mutation.isMutating, error: mutation.error };
}

// ── Platform Subscriptions & Billing Mutations ──
export function useGenerateSubscriptionInvoice() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/subscriptions", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/admin/subscriptions"));
    },
  });
  return {
    trigger: async (tenant_id: string) => mutation.trigger({ action: "generate_invoice", tenant_id } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useRecordSubscriptionPayment() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/subscriptions", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/admin/subscriptions"));
    },
  });
  return {
    trigger: async (body: { invoice_id: string; amount: number; payment_mode?: string; reference?: string }) =>
      mutation.trigger({ action: "record_payment", ...body } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useUpdateSubscription() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/subscriptions", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/admin/subscriptions"));
      mutate((k) => typeof k === "string" && k.startsWith("/api/admin/tenants"));
    },
  });
  return {
    trigger: async (body: { tenant_id: string; tier?: string; status?: string; price?: number | null; billing_period?: string; plan_id?: string | null }) =>
      mutation.trigger({ action: "update_subscription", ...body } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}

export function useUpsertSubscriptionPlan() {
  const { mutate } = useSWRConfig();
  const mutation = useSWRMutation("/api/admin/subscriptions", jsonFetcher, {
    onSuccess: () => {
      mutate((k) => typeof k === "string" && k.startsWith("/api/admin/subscriptions"));
    },
  });
  return {
    trigger: async (body: {
      id?: string; code: string; name: string; description?: string;
      tier: string; price?: number | null; billing_period?: string; is_active?: boolean;
    }) => mutation.trigger({ action: "upsert_plan", ...body } as any),
    isMutating: mutation.isMutating, error: mutation.error,
  };
}
