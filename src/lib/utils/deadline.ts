import type { TaskStatus } from "@/lib/types/database";

/**
 * Whether a task counts as overdue: deadline has passed and it isn't in a
 * terminal status (TZ §5.2 — "просроченной считается незавершённая задача").
 * Kept outside component bodies since it reads the current time.
 */
export function isTaskOverdue(deadline: string | null, status: TaskStatus) {
  return Boolean(
    deadline && new Date(deadline).getTime() < Date.now() && status !== "done" && status !== "cancelled",
  );
}

/** End-of-today and the "next 7 days" cutoff, for grouping a task list by due date. */
export function getUpcomingWindow() {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);
  return { endOfToday, in7Days };
}
