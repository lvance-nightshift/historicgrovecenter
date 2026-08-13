"use client";

import { DAYS, type DayKey, type WeekHours } from "@/lib/hours";

const timeInput =
  "rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-grove focus:ring-2 focus:ring-grove/20";

export default function HoursEditor({
  value,
  onChange,
}: {
  value: WeekHours;
  onChange: (next: WeekHours) => void;
}) {
  function setDay(key: DayKey, next: WeekHours[DayKey] | undefined) {
    const copy: WeekHours = { ...value };
    if (next === undefined) delete copy[key];
    else copy[key] = next;
    onChange(copy);
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {DAYS.map(({ key, label, short }) => {
        const d = value[key];
        // Open-variant (with times) or null when closed/unset.
        const oh = d && d.closed !== true ? d : null;
        return (
          <div key={key} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
            <span className="w-10 font-medium text-foreground" title={label}>
              {short}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={oh != null}
                onChange={(e) =>
                  setDay(key, e.target.checked ? { closed: false, open: "09:00", close: "17:00" } : { closed: true })
                }
              />
              Open
            </label>
            {oh ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={oh.open}
                  onChange={(e) => setDay(key, { closed: false, open: e.target.value, close: oh.close })}
                  className={timeInput}
                />
                <span className="text-muted">to</span>
                <input
                  type="time"
                  value={oh.close}
                  onChange={(e) => setDay(key, { closed: false, open: oh.open, close: e.target.value })}
                  className={timeInput}
                />
              </div>
            ) : (
              <span className="text-muted">Closed</span>
            )}
            {d != null && (
              <button
                type="button"
                onClick={() => setDay(key, undefined)}
                className="ml-auto text-xs text-muted hover:text-brick-dark"
                title="Clear this day"
              >
                clear
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
