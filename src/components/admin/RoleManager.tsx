"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addRoleAssignment,
  removeRoleAssignment,
} from "@/app/admin/actions";
import type { RoleScope } from "@/lib/auth/authorize";

type Assignment = {
  id: number;
  roleKey: string;
  roleLabel: string;
  scope: RoleScope;
  scopeId: number | null;
  scopeLabel: string | null;
};
type Ref = { id: number; label: string };

const select =
  "mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-grove";

export default function RoleManager({
  personId,
  assignments,
  roles,
  companies,
  events,
}: {
  personId: number;
  assignments: Assignment[];
  roles: { id: number; key: string; label: string }[];
  companies: { id: number; name: string }[];
  events: { id: number; title: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [roleId, setRoleId] = useState<number>(roles[0]?.id ?? 0);
  const [scope, setScope] = useState<RoleScope>("global");
  const [scopeId, setScopeId] = useState<number | null>(null);

  const companyRefs: Ref[] = companies.map((c) => ({ id: c.id, label: c.name }));
  const eventRefs: Ref[] = events.map((e) => ({ id: e.id, label: e.title }));
  const scopeOptions = scope === "company" ? companyRefs : eventRefs;

  function add() {
    if (!roleId) return;
    if (scope !== "global" && !scopeId) return;
    startTransition(async () => {
      await addRoleAssignment({ personId, roleId, scope, scopeId });
      router.refresh();
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      await removeRoleAssignment(id, personId);
      router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {assignments.length === 0 ? (
        <p className="text-sm text-muted">No roles yet.</p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-foreground">{a.roleLabel}</span>
                <span className="ml-2 text-xs text-muted">
                  {a.scope === "global" ? "site-wide" : `${a.scope}: ${a.scopeLabel}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(a.id)}
                disabled={pending}
                className="text-xs text-brick-dark hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add role */}
      <div className="mt-4 rounded-lg border border-dashed border-border p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block text-xs">
            <span className="font-medium text-foreground">Role</span>
            <select
              className={select}
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium text-foreground">Scope</span>
            <select
              className={select}
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as RoleScope);
                setScopeId(null);
              }}
            >
              <option value="global">Site-wide</option>
              <option value="company">Company</option>
              <option value="event">Event</option>
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium text-foreground">
              {scope === "global" ? "—" : scope === "company" ? "Company" : "Event"}
            </span>
            <select
              className={select}
              disabled={scope === "global"}
              value={scopeId ?? ""}
              onChange={(e) => setScopeId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">
                {scope === "global" ? "n/a" : "Choose…"}
              </option>
              {scope !== "global" &&
                scopeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={pending || (scope !== "global" && !scopeId)}
          className="mt-3 rounded-full bg-grove px-4 py-1.5 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-60"
        >
          Grant role
        </button>
      </div>
    </div>
  );
}
