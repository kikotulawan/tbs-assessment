import { meridian } from "@/lib/meridian/client";
import { getAllPages } from "@/lib/meridian/pagination";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function buildMeridianContext(question: string) {
  const lower = question.toLowerCase();
  const context: Record<string, unknown> = {
    requestedAt: new Date().toISOString(),
    dateToday: todayUtc(),
  };

  // Direct identifiers are handled first to avoid unnecessarily broad queries.
  const employeeId = question.match(/\bE-\d+\b/i)?.[0];
  const workerId = question.match(/\bW-\d+\b/i)?.[0];
  const shiftId = question.match(/\bS-\d+\b/i)?.[0];

  if (employeeId) {
    context.employee = await meridian.employee(employeeId);
    context.credentials = await getAllPages((page) =>
      meridian.credentials({ employeeId, page, pageSize: 20 })
    );
  }

  if (workerId) {
    context.worker = await meridian.worker(workerId);
    context.workerShifts = await getAllPages((page) =>
      meridian.shifts({ workerId, page, pageSize: 20 })
    );
  }

  if (shiftId) {
    const shift = await meridian.shift(shiftId);
    context.shift = shift;
    context.facility = await meridian.facility(shift.facilityId);

    if (shift.workerId) {
      const worker = await meridian.worker(shift.workerId);
      context.assignedWorker = worker;

      if (worker.workEmail) {
        const employees = await getAllPages((page) =>
          meridian.employees({ q: worker.workEmail, page, pageSize: 20 })
        );
        context.matchedEmployees = employees;
        if (employees[0]?.employeeId) {
          context.assignedWorkerCredentials = await getAllPages((page) =>
            meridian.credentials({
              employeeId: employees[0].employeeId,
              page,
              pageSize: 20,
            })
          );
        }
      }
    }
  }

  // Name/email searches: ask the HR and scheduling systems independently.
  if (!employeeId && !workerId && !shiftId && (lower.includes("employee") || lower.includes("credential") || lower.includes("employed") || lower.includes("phone") || lower.includes("address"))) {
    context.hrEmployees = await meridian.employees({ q: question, page: 1, pageSize: 20 });
  }

  // Facility/shift questions are best answered with bounded date filters.
  const asksShifts = lower.includes("shift") || lower.includes("working") || lower.includes("schedule");
  const asksFacilities = lower.includes("facility") || lower.includes("facilities") || lower.includes("oakview");

  if (asksFacilities) {
    context.facilities = await getAllPages((page) => meridian.facilities({ page, pageSize: 20 }));
  }

  if (asksShifts) {
    const from = todayUtc();
    const to = lower.includes("next 5 days") ? addDays(from, 5)
      : lower.includes("next 7 days") ? addDays(from, 7)
      : addDays(from, 7);

    context.shifts = await getAllPages((page) =>
      meridian.shifts({ page, pageSize: 20, from, to })
    );
  }

  // Broad staffing questions need worker data to reconcile W- IDs with HR.
  if (asksShifts || lower.includes("worker") || lower.includes("who is working")) {
    context.workers = await getAllPages((page) => meridian.workers({ page, pageSize: 20 }));
  }

  // Facility credential requirements are useful for eligibility questions.
  if (lower.includes("eligible") || lower.includes("credential") || lower.includes("tb")) {
    context.facilities = context.facilities ??
      await getAllPages((page) => meridian.facilities({ page, pageSize: 20 }));
    context.shiftCredentialing = await getAllPages((page) =>
      meridian.credentials({ page, pageSize: 20 })
    );
  }

  return context;
}