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
