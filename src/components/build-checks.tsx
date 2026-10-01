import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { Check } from "@/lib/compat";

const STYLES = {
  ok: { icon: CircleCheck, className: "text-ok" },
  warn: { icon: CircleAlert, className: "text-warn" },
  error: { icon: CircleX, className: "text-err" },
} as const;

export function BuildChecks({ checks }: { checks: Check[] }) {
  if (!checks.length) {
    return <p className="text-sm text-muted">Add a few parts and compatibility checks show up here.</p>;
  }
  return (
    <ul className="space-y-3">
      {checks.map((c) => {
        const { icon: Icon, className } = STYLES[c.level];
        return (
          <li key={c.title} className="flex gap-2.5 text-sm">
            <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
            <div>
              <p className="font-medium">{c.title}</p>
              <p className="text-muted">{c.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function StatusPill({ checks }: { checks: Check[] }) {
  const errors = checks.filter((c) => c.level === "error").length;
  const warns = checks.filter((c) => c.level === "warn").length;
  if (errors)
    return <span className="chip border-err/30 bg-err-soft text-err">{errors} issue{errors > 1 && "s"}</span>;
  if (warns)
    return <span className="chip border-warn/30 bg-warn-soft text-warn">{warns} warning{warns > 1 && "s"}</span>;
  return <span className="chip border-ok/30 bg-ok-soft text-ok">compatible</span>;
}
