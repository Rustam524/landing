"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { setEmployeeStatus } from "./actions";
import { AddEmployeeDialog } from "./add-employee-dialog";
import { accountStatusTone } from "@/lib/utils/status-tone";
import type { Profile } from "@/lib/types/database";

export function EmployeesClient({
  employees,
  projectCounts,
  isDirector,
  currentUserId,
}: {
  employees: Profile[];
  projectCounts: Record<string, number>;
  isDirector: boolean;
  currentUserId: string;
}) {
  const { dict } = useDictionary();
  const [dialogOpen, setDialogOpen] = useState(false);
  // Remounts the dialog each time it opens, so useActionState's result and
  // the "copied" flag from a previous employee don't leak into the next one.
  const [dialogKey, setDialogKey] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-ink">{dict.employees.title}</h1>
        {isDirector && (
          <Button
            onClick={() => {
              setDialogKey((k) => k + 1);
              setDialogOpen(true);
            }}
          >
            <Plus size={16} />
            {dict.employees.addEmployee}
          </Button>
        )}
      </div>

      <Card>
        {employees.length === 0 ? (
          <CardBody className="text-center text-sm text-brand-text-muted">
            {dict.employees.empty}
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-xs text-brand-text-muted">
                  <th className="px-5 py-3 font-medium">{dict.employees.table.name}</th>
                  <th className="px-5 py-3 font-medium">{dict.employees.table.role}</th>
                  <th className="px-5 py-3 font-medium">{dict.employees.table.status}</th>
                  <th className="px-5 py-3 font-medium">{dict.employees.table.projects}</th>
                  {isDirector && <th className="px-5 py-3 font-medium">{dict.common.actions}</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <EmployeeRow
                    key={employee.id}
                    employee={employee}
                    projectCount={projectCounts[employee.id] ?? 0}
                    isDirector={isDirector}
                    isSelf={employee.id === currentUserId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddEmployeeDialog key={dialogKey} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}

function EmployeeRow({
  employee,
  projectCount,
  isDirector,
  isSelf,
}: {
  employee: Profile;
  projectCount: number;
  isDirector: boolean;
  isSelf: boolean;
}) {
  const { dict } = useDictionary();
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-b border-brand-border last:border-0">
      <td className="px-5 py-3">
        <div className="font-medium text-brand-ink">{employee.full_name}</div>
        {employee.position && (
          <div className="text-xs text-brand-text-muted">{employee.position}</div>
        )}
      </td>
      <td className="px-5 py-3 text-brand-text-muted">{dict.roles[employee.role]}</td>
      <td className="px-5 py-3">
        <Badge tone={accountStatusTone(employee.status)}>
          {dict.accountStatus[employee.status]}
        </Badge>
      </td>
      <td className="px-5 py-3 text-brand-text-muted">{projectCount}</td>
      {isDirector && (
        <td className="px-5 py-3">
          {!isSelf && (
            <Button
              variant={employee.status === "active" ? "danger" : "secondary"}
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  setEmployeeStatus(
                    employee.id,
                    employee.status === "active" ? "blocked" : "active",
                  ),
                )
              }
            >
              {employee.status === "active" ? dict.employees.block : dict.employees.restore}
            </Button>
          )}
        </td>
      )}
    </tr>
  );
}
