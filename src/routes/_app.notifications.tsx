import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, BellRing, Clock, CheckCircle2 } from "lucide-react";
import { getLoans, getProfile, updateProfile, useStore } from "@/lib/store";
import {
  daysUntil,
  formatINR,
  nextEmiDate,
  loanTypeIcons,
  statusOfNextEMI,
} from "@/lib/loan-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const loans = useStore(() => getLoans()).filter((l) => !l.closed);
  const profile = useStore(() => getProfile());

  const items = useMemo(() => {
    return loans
      .map((l) => {
        const date = nextEmiDate(l);
        const status = statusOfNextEMI(l);
        const days = daysUntil(date);
        return { loan: l, date, status, days };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [loans]);

  const overdue = items.filter((i) => i.status === "overdue");
  const soon = items.filter((i) => i.status === "due-soon");
  const upcoming = items.filter((i) => i.status === "upcoming");

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Reminders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay ahead. Never miss an EMI again.
          </p>
        </div>
      </header>

      {/* Preferences */}
      {profile && (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-bold text-primary mb-1">Notification preferences</h2>
          <p className="text-sm text-muted-foreground mb-5">Choose how you'd like us to remind you.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { k: "push", label: "Push notifications" },
                { k: "email", label: "Email" },
                { k: "sms", label: "SMS" },
              ] as const
            ).map(({ k, label }) => {
              const on = profile.notifications[k];
              return (
                <button
                  key={k}
                  onClick={() =>
                    updateProfile({
                      notifications: { ...profile.notifications, [k]: !on },
                    })
                  }
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                    on
                      ? "border-accent/30 bg-accent/5 text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <span className="text-sm font-semibold">{label}</span>
                  <span
                    className={cn(
                      "inline-flex h-5 w-9 rounded-full p-0.5 transition-colors",
                      on ? "bg-accent" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "h-4 w-4 rounded-full bg-white shadow-card transition-transform",
                        on && "translate-x-4",
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5">
            <p className="text-xs font-medium text-muted-foreground mb-2">Remind me before due date</p>
            <div className="flex flex-wrap gap-2">
              {[7, 3, 1, 0].map((d) => {
                const on = profile.reminderDays.includes(d);
                return (
                  <button
                    key={d}
                    onClick={() =>
                      updateProfile({
                        reminderDays: on
                          ? profile.reminderDays.filter((x) => x !== d)
                          : [...profile.reminderDays, d].sort((a, b) => b - a),
                      })
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-primary",
                    )}
                  >
                    {d === 0 ? "On due date" : `${d} day${d === 1 ? "" : "s"} before`}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Buckets */}
      <NotificationGroup
        title="Overdue"
        icon={<AlertTriangle className="size-4 text-destructive" />}
        items={overdue}
        empty="Nothing overdue — great work!"
        tone="danger"
      />
      <NotificationGroup
        title="Due soon"
        icon={<BellRing className="size-4 text-warning" />}
        items={soon}
        empty="No payments in the next 3 days."
        tone="warning"
      />
      <NotificationGroup
        title="Upcoming"
        icon={<Clock className="size-4 text-muted-foreground" />}
        items={upcoming}
        empty="No upcoming reminders."
        tone="muted"
      />
    </div>
  );
}

function NotificationGroup({
  title,
  icon,
  items,
  empty,
  tone,
}: {
  title: string;
  icon: React.ReactNode;
  items: ReturnType<typeof useItemArray>;
  empty: string;
  tone: "danger" | "warning" | "muted";
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold tracking-tight text-primary inline-flex items-center gap-2">
        {icon} {title}
        <span className="text-[10px] font-semibold text-muted-foreground">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="size-4 text-success" /> {empty}
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map(({ loan, date, days, status }) => (
            <Link
              key={loan.id}
              to="/loans/$loanId"
              params={{ loanId: loan.id }}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 hover:border-accent/30 transition-colors",
                tone === "danger" && "border-destructive/20 bg-destructive/5",
                tone === "warning" && "border-warning/30 bg-warning/5",
                tone === "muted" && "border-border bg-surface",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-muted grid place-items-center text-lg">
                  {loanTypeIcons[loan.type]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{loan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.lender} • {formatINR(loan.emiAmount)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    status === "overdue"
                      ? "text-destructive"
                      : status === "due-soon"
                      ? "text-warning"
                      : "text-muted-foreground",
                  )}
                >
                  {status === "overdue"
                    ? `${Math.abs(days)}d overdue`
                    : days === 0
                    ? "Due today"
                    : `In ${days}d`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

// Type helper so the grouping function gets a clean inferred type.
function useItemArray() {
  return [] as Array<{
    loan: ReturnType<typeof getLoans>[number];
    date: Date;
    days: number;
    status: ReturnType<typeof statusOfNextEMI>;
  }>;
}
