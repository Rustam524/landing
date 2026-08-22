"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projectStatusTone } from "@/lib/utils/status-tone";
import { AddProjectDialog } from "./add-project-dialog";
import type { Project } from "@/lib/types/database";

type ProjectWithStats = Project & {
  clientName: string | null;
  stats: { total: number; done: number; overdue: number };
};

export function ProjectsClient({
  projects,
  clients,
  canCreate,
}: {
  projects: ProjectWithStats[];
  clients: { id: string; name: string }[];
  canCreate: boolean;
}) {
  const { dict } = useDictionary();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-ink">{dict.projects.title}</h1>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            {dict.projects.addProject}
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardBody className="text-center text-sm text-brand-text-muted">
            {dict.projects.empty}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progress =
              project.stats.total > 0
                ? Math.round((project.stats.done / project.stats.total) * 100)
                : 0;
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-brand-ink">{project.name}</div>
                      <Badge tone={projectStatusTone(project.status)}>
                        {dict.projectStatus[project.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-brand-text-muted">
                      {project.clientName ?? dict.projects.noClient}
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-brand-text-muted">
                        <span>{dict.projects.progress}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-muted">
                        <div
                          className="h-full rounded-full bg-brand-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {project.stats.overdue > 0 && (
                      <div className="mt-3 text-xs font-medium text-brand-accent">
                        {dict.projects.overdue}: {project.stats.overdue}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <AddProjectDialog open={open} onClose={() => setOpen(false)} clients={clients} />
    </div>
  );
}
