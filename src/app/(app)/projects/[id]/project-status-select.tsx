"use client";

import { useTransition } from "react";
import { updateProjectStatus } from "../actions";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Select } from "@/components/ui/input";
import { PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types/database";

export function ProjectStatusSelect({
  projectId,
  status,
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const { dict } = useDictionary();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      className="w-auto"
      value={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(() => updateProjectStatus(projectId, e.target.value as ProjectStatus))
      }
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {dict.projectStatus[s]}
        </option>
      ))}
    </Select>
  );
}
