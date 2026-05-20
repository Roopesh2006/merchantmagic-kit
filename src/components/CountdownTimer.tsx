import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface Props {
  expiresAt: string;
}

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, expired: ms === 0 };
}

const cell = (label: string, value: number) => (
  <div className="flex flex-col items-center justify-center rounded-lg bg-foreground px-3 py-2 text-background min-w-[58px]">
    <span className="text-2xl font-bold tabular-nums leading-none">
      {String(value).padStart(2, "0")}
    </span>
    <span className="mt-1 text-[10px] uppercase tracking-widest opacity-70">
      {label}
    </span>
  </div>
);

export function CountdownTimer({ expiresAt }: Props) {
  // Hydration safeguard: only render time on the client.
  const [mounted, setMounted] = useState(false);
  const target = new Date(expiresAt).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        Loading offer countdown…
      </div>
    );
  }

  if (t.expired) {
    return (
      <div className="rounded-lg border border-border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
        This flash offer has ended.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
        <Clock className="h-4 w-4 animate-pulse" />
        Flash sale ends in
      </div>
      <div className="flex items-center gap-2">
        {t.days > 0 && cell("days", t.days)}
        {cell("hrs", t.hours)}
        {cell("min", t.minutes)}
        {cell("sec", t.seconds)}
      </div>
    </div>
  );
}
