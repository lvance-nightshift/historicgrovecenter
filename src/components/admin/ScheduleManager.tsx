"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSchedule, removeSchedule } from "@/app/admin/site/actions";

type Schedule = {
  id: number;
  label: string | null;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  priority: number;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const fmt = (m: number, d: number) => `${MONTHS[m - 1]} ${d}`;

const select =
  "rounded border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-grove";

export default function ScheduleManager({
  themeId,
  schedules,
}: {
  themeId: number;
  schedules: Schedule[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [sm, setSm] = useState(9);
  const [sd, setSd] = useState(21);
  const [em, setEm] = useState(12);
  const [ed, setEd] = useState(20);
  const [priority, setPriority] = useState(0);

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="mt-4">
      {schedules.length === 0 ? (
        <p className="text-sm text-muted">No schedule — this theme only shows when set as default or forced.</p>
      ) : (
        <ul className="space-y-2">
          {schedules.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-foreground">
                  {fmt(s.startMonth, s.startDay)} – {fmt(s.endMonth, s.endDay)}
                </span>
                {s.label && <span className="ml-2 text-xs text-muted">{s.label}</span>}
                <span className="ml-2 text-xs text-muted">priority {s.priority}</span>
              </span>
              <button
                type="button"
                onClick={() => run(() => removeSchedule(s.id))}
                disabled={pending}
                className="text-xs text-brick-dark hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add schedule */}
      <div className="mt-4 rounded-lg border border-dashed border-border p-4">
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label>
            <span className="font-medium text-foreground">From</span>
            <div className="mt-1 flex gap-1">
              <select className={select} value={sm} onChange={(e) => setSm(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select className={select} value={sd} onChange={(e) => setSd(Number(e.target.value))}>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </label>
          <label>
            <span className="font-medium text-foreground">To</span>
            <div className="mt-1 flex gap-1">
              <select className={select} value={em} onChange={(e) => setEm(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select className={select} value={ed} onChange={(e) => setEd(Number(e.target.value))}>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </label>
          <label>
            <span className="font-medium text-foreground">Priority</span>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 0)}
              className={`${select} mt-1 block w-16`}
            />
          </label>
          <label className="flex-1">
            <span className="font-medium text-foreground">Label (optional)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Autumn"
              className={`${select} mt-1 block w-full`}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              run(async () => {
                await addSchedule({ themeId, label, startMonth: sm, startDay: sd, endMonth: em, endDay: ed, priority });
                setLabel("");
              })
            }
            disabled={pending}
            className="rounded-full bg-grove px-4 py-1.5 text-sm font-semibold text-background hover:bg-grove-dark disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
