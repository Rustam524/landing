import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { taskStatusTone } from "@/lib/utils/status-tone";
import { isTaskOverdue, getUpcomingWindow } from "@/lib/utils/deadline";
import type { TaskStatus } from "@/lib/types/database";

export default async function HomePage() {
  const session = await getCurrentProfile();
  if (!session) return null;
  const dict = getDictionary(session.profile.language);
  const supabase = await createClient();

  if (session.profile.role === "director" || session.profile.role === "manager") {
    const [{ data: projects }, { data: tasks }, { count: employeeCount }] = await Promise.all([
      supabase.from("projects").select("id, name, status"),
      supabase.from("tasks").select("id, project_id, status, deadline"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

    const activeProjects = (projects ?? []).filter((p) => p.status === "active").length;
    const overdueTasks = (tasks ?? []).filter((t) => isTaskOverdue(t.deadline, t.status));
    const projectNames = new Map((projects ?? []).map((p) => [p.id, p.name]));

    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-brand-ink">{dict.home.directorGreeting}</h1>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label={dict.home.activeProjects} value={activeProjects} />
          <StatCard label={dict.home.overdueTasks} value={overdueTasks.length} accent={overdueTasks.length > 0} />
          <StatCard label={dict.home.totalEmployees} value={employeeCount ?? 0} />
        </div>

        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-brand-ink">{dict.home.overdueTasks}</h2>
            {overdueTasks.length === 0 ? (
              <p className="text-sm text-brand-text-muted">{dict.home.noOverdue}</p>
            ) : (
              <ul className="space-y-2">
                {overdueTasks.slice(0, 8).map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-brand-muted"
                    >
                      <span className="text-brand-ink">
                        {task.project_id ? projectNames.get(task.project_id) : dict.tasks.noProject}
                      </span>
                      <Badge tone={taskStatusTone(task.status)}>{dict.taskStatus[task.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    );
  }

  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("id, title, status, deadline, project:projects(name)")
    .eq("assignee_id", session.userId)
    .order("deadline", { ascending: true, nullsFirst: false });

  const tasks = (rawTasks ?? []) as unknown as {
    id: string;
    title: string;
    status: TaskStatus;
    deadline: string | null;
    project: { name: string } | null;
  }[];

  const { endOfToday, in7Days } = getUpcomingWindow();

  const activeTasks = (tasks ?? []).filter((t) => !["done", "cancelled"].includes(t.status));
  const todayTasks = activeTasks.filter((t) => t.deadline && new Date(t.deadline) <= endOfToday);
  const upcoming = activeTasks.filter(
    (t) => t.deadline && new Date(t.deadline) > endOfToday && new Date(t.deadline) <= in7Days,
  );

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-brand-ink">{dict.home.employeeGreeting}</h1>

      <Card>
        <CardBody>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink">{dict.home.myTasksToday}</h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-brand-text-muted">{dict.home.noTasksToday}</p>
          ) : (
            <TaskMiniList tasks={todayTasks} dict={dict} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 text-sm font-semibold text-brand-ink">{dict.home.upcomingDeadlines}</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-brand-text-muted">{dict.common.noData}</p>
          ) : (
            <TaskMiniList tasks={upcoming} dict={dict} />
          )}
        </CardBody>
      </Card>

      <Link href="/tasks" className="text-sm font-medium text-brand-primary hover:underline">
        {dict.home.viewAll}
      </Link>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardBody>
        <div className={accent ? "text-2xl font-semibold text-brand-accent" : "text-2xl font-semibold text-brand-ink"}>
          {value}
        </div>
        <div className="mt-1 text-xs text-brand-text-muted">{label}</div>
      </CardBody>
    </Card>
  );
}

function TaskMiniList({
  tasks,
  dict,
}: {
  tasks: { id: string; title: string; status: TaskStatus; deadline: string | null; project: { name: string } | null }[];
  dict: ReturnType<typeof getDictionary>;
}) {
  return (
    <ul className="space-y-2">
      {tasks.slice(0, 8).map((task) => (
        <li key={task.id}>
          <Link
            href={`/tasks/${task.id}`}
            className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-brand-muted"
          >
            <span className="text-brand-ink">{task.title}</span>
            <Badge tone={taskStatusTone(task.status)}>{dict.taskStatus[task.status]}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
