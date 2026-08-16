import type {
  CredentialRecord,
  Employee,
  Facility,
  Page,
  Shift,
  Worker,
} from "./types";

const baseUrl = process.env.MERIDIAN_API_URL;
const apiKey = process.env.MERIDIAN_API_KEY;

if (!baseUrl || !apiKey) {
  // Do not throw at module import time so `next build` can run in environments
  // where runtime secrets are injected later.
}

export class MeridianError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MeridianError";
    this.status = status;
  }
}

async function meridianFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  if (!baseUrl || !apiKey) {
    throw new MeridianError("Meridian server configuration is missing.", 500);
  }

  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? `Meridian request failed (${response.status}).`;
    throw new MeridianError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const meridian = {
  employees(params?: { page?: number; pageSize?: number; q?: string; employmentStatus?: string }) {
    return meridianFetch<Page<Employee>>("/hr/employees", params);
  },

  employee(employeeId: string) {
    return meridianFetch<Employee>(`/hr/employees/${encodeURIComponent(employeeId)}`);
  },

  facilities(params?: { page?: number; pageSize?: number }) {
    return meridianFetch<Page<Facility>>("/scheduling/facilities", params);
  },

  facility(facilityId: string) {
    return meridianFetch<Facility>(`/scheduling/facilities/${encodeURIComponent(facilityId)}`);
  },

  workers(params?: { page?: number; pageSize?: number; q?: string }) {
    return meridianFetch<Page<Worker>>("/scheduling/workers", params);
  },

  worker(workerId: string) {
    return meridianFetch<Worker>(`/scheduling/workers/${encodeURIComponent(workerId)}`);
  },

  shifts(params?: {
    page?: number;
    pageSize?: number;
    facilityId?: string;
    workerId?: string;
    role?: string;
    status?: string;
    from?: string;
    to?: string;
  }) {
    return meridianFetch<Page<Shift>>("/scheduling/shifts", params);
  },

  shift(shiftId: string) {
    return meridianFetch<Shift>(`/scheduling/shifts/${encodeURIComponent(shiftId)}`);
  },

  credentials(params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    credentialType?: string;
    status?: string;
  }) {
    return meridianFetch<Page<CredentialRecord>>("/credentialing/records", params);
  },
};