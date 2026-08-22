"use client";

import { useState, useTransition } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { addProjectMember, removeProjectMember } from "../actions";

type Member = { user_id: string; profile: { id: string; full_name: string; role: string } | null };

export function TeamSection({
  projectId,
  members,
  allEmployees,
  canManage,
}: {
  projectId: string;
  members: Member[];
  allEmployees: { id: string; full_name: string; role: string }[];
  canManage: boolean;
}) {
  const { dict } = useDictionary();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");

  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates = allEmployees.filter((e) => !memberIds.has(e.id));

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {members.map((m) => (
          <li
            key={m.user_id}
            className="flex items-center justify-between rounded-lg border border-brand-border px-3 py-2 text-sm"
          >
            <div>
              <div className="font-medium text-brand-ink">{m.profile?.full_name ?? "—"}</div>
              {m.profile?.role && (
                <div className="text-xs text-brand-text-muted">
                  {dict.roles[m.profile.role as keyof typeof dict.roles]}
                </div>
              )}
            </div>
            {canManage && (
              <button
                disabled={pending}
                onClick={() => startTransition(() => removeProjectMember(projectId, m.user_id))}
                className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-muted hover:text-brand-accent"
                aria-label={dict.projects.removeMember}
              >
                <UserMinus size={16} />
              </button>
            )}
          </li>
        ))}
        {members.length === 0 && (
          <li className="text-sm text-brand-text-muted">{dict.common.noData}</li>
        )}
      </ul>

      {canManage && candidates.length > 0 && (
        <div className="flex gap-2">
          <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">{dict.projects.addMember}</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selected || pending}
            onClick={() => {
              if (!selected) return;
              startTransition(() => addProjectMember(projectId, selected));
              setSelected("");
            }}
          >
            <UserPlus size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
