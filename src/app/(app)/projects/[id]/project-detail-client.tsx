"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectStatusSelect } from "./project-status-select";
import { TeamSection } from "./team-section";
import { TaskCard } from "../../tasks/task-card";
import { AddTaskDialog } from "../../tasks/add-task-dialog";
import type { ProjectWithClient } from "../types";
import type { TaskWithRelations } from "../../tasks/types";

export function ProjectDetailClient({
  project,
  members,
  tasks,
  allEmployees,
  canManage,
}: {
  project: ProjectWithClient;
  members: { user_id: string; profile: { id: string; full_name: string; role: string } | null }[];
  tasks: TaskWithRelations[];
  allEmployees: { id: string; full_name: string; role: string }[];
  canManage: boolean;
}) {
  const { dict } = useDictionary();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const projectOptionList = [{ id: project.id, name: project.name }];

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-brand-ink"
      >
        <ArrowLeft size={16} />
        {dict.common.back}
      </Link>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-brand-ink">{project.name}</h1>
              <p className="mt-1 text-sm text-brand-text-muted">
                {project.client?.name ?? dict.projects.noClient}
              </p>
            </div>
            {canManage ? (
              <ProjectStatusSelect projectId={project.id} status={project.status} />
            ) : (
              <span className="text-sm text-brand-text-muted">{dict.projectStatus[project.status]}</span>
            )}
          </div>

          {project.description && (
            <p className="whitespace-pre-wrap text-sm text-brand-ink">{project.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            {project.start_date && (
              <div>
                <div className="text-xs text-brand-text-muted">{dict.projects.startDate}</div>
                <div className="text-brand-ink">{project.start_date}</div>
              </div>
            )}
            {project.end_date && (
              <div>
                <div className="text-xs text-brand-text-muted">{dict.projects.endDate}</div>
                <div className="text-brand-ink">{project.end_date}</div>
              </div>
            )}
            {project.social_links && (
              <div>
                <div className="text-xs text-brand-text-muted">{dict.projects.socialLinks}</div>
                <div className="text-brand-ink">{project.social_links}</div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.projects.teamTab}</CardTitle>
        </CardHeader>
        <CardBody>
          <TeamSection
            projectId={project.id}
            members={members}
            allEmployees={allEmployees}
            canManage={canManage}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.projects.tasksTab}</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => setTaskDialogOpen(true)}>
              <Plus size={16} />
              {dict.tasks.addTask}
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {tasks.length === 0 ? (
            <p className="text-sm text-brand-text-muted">{dict.tasks.empty}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <AddTaskDialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        projects={projectOptionList}
        employees={allEmployees}
        defaultProjectId={project.id}
      />
    </div>
  );
}
