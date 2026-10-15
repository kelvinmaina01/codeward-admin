import { useState } from "react";
import { Calendar01Icon } from "hugeicons-react";
import { RANGES, type RangeKey, type RangeSel } from "../lib/trends";
import { cn } from "../lib/utils";

interface Props {
  value: RangeSel;
  onChange: (r: RangeSel) => void;
  compact?: boolean;
}

export default function RangeFilter({ value, onChange, compact }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [from, setFrom] = useState(value.from ?? "");
  const [to, setTo] = useState(value.to ?? "");

  const pick = (key: RangeKey) => {
    if (key === "custom") {
      setCustomOpen((v) => !v);
      return;
    }
    setCustomOpen(false);
    onChange({ key });
  };

  const applyCustom = () => {
    if (!from || !to || from >= to) return;
    setCustomOpen(false);
    onChange({ key: "custom", from, to });
  };

  return (
    <div className="relative">
      <div className={cn("flex items-center gap-1 rounded-full bg-muted/60 p-1", compact && "p-0.5 gap-0.5")}>
        {RANGES.map((r) => {
          const active = value.key === r.key;
          return (
            <button
              key={r.key}
              title={r.hint}
              onClick={() => pick(r.key)}
              className={cn(
                compact ? "h-6 px-2 text-[11px]" : "h-7 px-2.5 text-xs",
                "rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap",
                active
                  ? "bg-card text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.key === "custom" ? (
                <span className="flex items-center gap-1">
                  <Calendar01Icon className="h-3.5 w-3.5" />
                  {!compact && "Custom"}
                </span>
              ) : (
                r.label
              )}
            </button>
          );
        })}
      </div>

      {customOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-xl border bg-card p-3 shadow-xl">
          <p className="mb-2 text-xs font-semibold">Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-muted-foreground">
              From
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:border-primary/40"
              />
            </label>
            <label className="text-[11px] text-muted-foreground">
              To
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs text-foreground outline-none focus:border-primary/40"
              />
            </label>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">Max 400 days.</p>
          <button
            onClick={applyCustom}
            disabled={!from || !to || from >= to}
            className="mt-2 h-8 w-full rounded-md bg-foreground text-xs font-semibold text-background disabled:opacity-40 cursor-pointer"
          >
            Apply{from && to ? ` (${from} → ${to})` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
