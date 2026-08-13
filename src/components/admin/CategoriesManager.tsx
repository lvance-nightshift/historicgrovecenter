"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMerchantCategory,
  renameMerchantCategory,
  deleteMerchantCategory,
} from "@/app/admin/actions";

export default function CategoriesManager({
  initial,
}: {
  initial: { id: number; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="mt-6 max-w-xl space-y-6">
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {initial.length === 0 && (
          <li className="px-4 py-4 text-sm text-muted">No categories yet.</li>
        )}
        {initial.map((c) => (
          <li key={c.id} className="flex items-center gap-3 px-4 py-3">
            {editId === c.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && editName.trim() && run(async () => {
                    await renameMerchantCategory(c.id, editName);
                    setEditId(null);
                  })}
                  autoFocus
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-grove"
                />
                <button
                  type="button"
                  disabled={pending || !editName.trim()}
                  onClick={() => run(async () => { await renameMerchantCategory(c.id, editName); setEditId(null); })}
                  className="text-sm font-medium text-grove hover:underline disabled:opacity-50"
                >
                  Save
                </button>
                <button type="button" onClick={() => setEditId(null)} className="text-sm text-muted hover:text-foreground">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-foreground">{c.name}</span>
                <button
                  type="button"
                  onClick={() => { setEditId(c.id); setEditName(c.name); }}
                  className="text-sm font-medium text-grove hover:underline"
                >
                  Rename
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`Delete "${c.name}"? It will be removed from any businesses using it.`))
                      run(() => deleteMerchantCategory(c.id));
                  }}
                  className="text-sm text-brick-dark hover:underline"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="flex items-end gap-2 rounded-xl border border-dashed border-border p-4">
        <label className="flex-1 text-sm">
          <span className="font-medium text-foreground">New category</span>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newName.trim() && run(async () => { await addMerchantCategory(newName); setNewName(""); })}
            placeholder="e.g. Pets, Fitness, Grocery"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-grove"
          />
        </label>
        <button
          type="button"
          disabled={pending || !newName.trim()}
          onClick={() => run(async () => { await addMerchantCategory(newName); setNewName(""); })}
          className="rounded-full bg-grove px-4 py-2 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
