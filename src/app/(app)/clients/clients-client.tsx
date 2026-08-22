"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useDictionary } from "@/lib/i18n/dictionary-provider";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddClientDialog } from "./add-client-dialog";
import type { Client } from "@/lib/types/database";

export function ClientsClient({
  clients,
  projectCounts,
  canCreate,
}: {
  clients: Client[];
  projectCounts: Record<string, number>;
  canCreate: boolean;
}) {
  const { dict } = useDictionary();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-ink">{dict.clients.title}</h1>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            {dict.clients.addClient}
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardBody className="text-center text-sm text-brand-text-muted">
            {dict.clients.empty}
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardBody>
                <div className="font-medium text-brand-ink">{client.name}</div>
                {client.contact_info && (
                  <div className="mt-1 text-sm text-brand-text-muted">{client.contact_info}</div>
                )}
                <div className="mt-3 text-xs text-brand-text-muted">
                  {dict.clients.projectsCount}: {projectCounts[client.id] ?? 0}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <AddClientDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
