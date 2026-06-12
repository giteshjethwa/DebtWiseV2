import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";
import {
  getLoans,
  getProfile,
  markEmiPaid,
  useStore,
} from "@/lib/store";
import {
  daysUntil,
  formatINR,
  loanProgress,
  loanTypeIcons,
  nextEmiDate,
  simulatePayoff,
  statusOfNextEMI,
} from "@/lib/loan-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const loans = useStore(() => getLoans());
  const profile = useStore(() => getProfile());

  const activeLoans = loans.filter((l) => !l.closed);

  const totals = useMemo(() => {
    const outstanding = activeLoans.reduce((s, l) => s + l.currentOutstanding, 0);
    const monthlyEmi = activeLoans.reduce((s, l) => s + l.emiAmount, 0);
    const upcomingThisMonth = activeLoans
      .filter((l) => nextEmiDate(l).getMonth() === new Date().getMonth())
      .reduce((s, l) => s + l.emiAmount, 0);
    const nextDue = activeLoans
      .map((l) => ({ loan: l, date: nextEmiDate(l) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    return { outstanding, monthlyEmi, upcomingThisMonth, nextDue };
  }, [activeLoans]);

  const alerts = useMemo(() => {
    return activeLoans
      .map((l) => ({ loan: l, status: statusOfNextEMI(l), date: nextEmiDate(l) }))
      .filter((a) => a.status === "overdue" || a.status === "due-soon")
      .sort((a, b) => (a.status === "overdue" ? -1 : 1));
  }, [activeLoans]);

  const sim = useMemo(
    () => simulatePayoff(activeLoans, "avalanche", 5000),
    [activeLoans],
  );
  const baseline = useMemo(
    () => simulatePayoff(activeLoans, "minimum", 0),
    [activeLoans],
  );

  if (loans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 space-y-8">
      {/* Greeting */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            {greeting()}, {profile?.name?.split(" ")[0] ?? "there"} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty max-w-[60ch]">
            {alerts.length > 0
              ? `You have ${alerts.length} payment${alerts.length > 1 ? "s" : ""} that need attention this week.`
              : `You are ${activeLoans.length} EMI${activeLoans.length === 1 ? "" : "s"} away from a calmer month.`}
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative grid place-items-center size-10 rounded-full bg-surface border border-border text-muted-foreground hover:text-primary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {alerts.length > 0 && (
              <span className="absolute top-2 right-2 size-2 rounded-full bg-warning ring-2 ring-background" />
            )}
          </Link>
          <Link
            to="/loans/add"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-card hover:scale-[1.01] transition-transform"
          >
            <Plus className="size-4" /> Add Loan
          </Link>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Outstanding"
          value={formatINR(totals.outstanding)}
          sub={`${activeLoans.length} active loan${activeLoans.length === 1 ? "" : "s"}`}
          subTone="muted"
          icon={<Wallet className="size-4" />}
          accent
        />
        <StatCard
          label="Monthly EMI"
          value={formatINR(totals.monthlyEmi)}
          sub={
            totals.nextDue
              ? `Next: ${totals.nextDue.date.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}`
              : "—"
          }
          subTone="muted"
        />
        <StatCard
          label="Due This Month"
          value={formatINR(totals.upcomingThisMonth)}
          sub={
            totals.nextDue
              ? `${daysUntil(totals.nextDue.date)} day(s) away`
              : "Nothing due"
          }
          subTone={
            totals.nextDue && daysUntil(totals.nextDue.date) <= 3 ? "warning" : "muted"
          }
        />
        <StatCard
          label="Interest Save Potential"
          value={formatINR(Math.max(0, baseline.totalInterest - sim.totalInterest), true)}
          sub={`If you pay ₹5,000 extra/mo`}
          subTone="accent"
          icon={<Sparkles className="size-4" />}
        />
      </section>

      {/* Alerts */}
      {alerts.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader title="Priority Alerts" />
          <div className="grid gap-3 md:grid-cols-2">
            {alerts.slice(0, 4).map(({ loan, status, date }) => {
              const overdue = status === "overdue";
              return (
                <div
                  key={loan.id}
                  className={cn(
                    "rounded-2xl border p-5 flex items-start gap-4",
                    overdue
                      ? "border-destructive/20 bg-destructive/5"
                      : "border-warning/30 bg-warning/5",
                  )}
                >
                  <div
                    className={cn(
                      "grid place-items-center size-10 rounded-xl text-lg",
                      overdue ? "bg-destructive/15" : "bg-warning/15",
                    )}
                  >
                    {loanTypeIcons[loan.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-primary truncate">{loan.name}</p>
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5",
                          overdue
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-warning text-warning-foreground",
                        )}
                      >
                        {overdue ? "Overdue" : `In ${Math.max(0, daysUntil(date))}d`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {loan.lender} • {formatINR(loan.emiAmount)} EMI
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => markEmiPaid(loan.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <CheckCircle2 className="size-3.5" /> Mark Paid
                      </button>
                      <Link
                        to="/loans/$loanId"
                        params={{ loanId: loan.id }}
                        className="text-xs font-medium text-muted-foreground hover:text-primary"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl bg-success/5 border border-success/20 p-6 flex items-center gap-4">
          <div className="grid place-items-center size-12 rounded-2xl bg-success/15 text-success text-xl">
            🌿
          </div>
          <div>
            <p className="font-semibold text-primary">You're all caught up.</p>
            <p className="text-sm text-muted-foreground">No EMIs due in the next 3 days.</p>
          </div>
        </div>
      )}

      {/* My Loans */}
      <section className="space-y-4">
        <SectionHeader
          title="My Active Loans"
          action={
            <Link to="/loans" className="text-sm font-semibold text-accent hover:underline">
              View all →
            </Link>
          }
        />
        <div className="grid gap-3">
          {activeLoans.slice(0, 4).map((loan) => {
            const progress = loanProgress(loan);
            const next = nextEmiDate(loan);
            const days = daysUntil(next);
            const status = statusOfNextEMI(loan);
            return (
              <Link
                key={loan.id}
                to="/loans/$loanId"
                params={{ loanId: loan.id }}
                className="group block rounded-2xl border border-border bg-surface p-5 hover:border-accent/30 hover:shadow-card-lg transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-11 rounded-xl bg-muted grid place-items-center text-lg shrink-0">
                      {loanTypeIcons[loan.type]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary truncate">{loan.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {loan.lender} • {loan.interestRate}% p.a.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">
                      {formatINR(loan.currentOutstanding)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Outstanding
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">
                      Repayment {progress.toFixed(0)}%
                    </span>
                    <span className="font-medium text-primary">
                      {formatINR(loan.emiAmount)} / mo
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progress > 75
                          ? "bg-success"
                          : progress > 30
                          ? "bg-accent"
                          : "bg-accent/70",
                      )}
                      style={{ width: `${Math.max(2, progress)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    Next EMI:{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        status === "overdue"
                          ? "text-destructive"
                          : status === "due-soon"
                          ? "text-warning"
                          : "text-primary",
                      )}
                    >
                      {status === "overdue"
                        ? `Overdue`
                        : `${next.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })} (${days}d)`}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Details <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Strategy Insight */}
      <section className="rounded-3xl bg-primary text-primary-foreground p-7 lg:p-9 relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 size-64 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-end">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
              <TrendingDown className="size-3" /> Smart strategy
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-balance">
              Save up to {formatINR(Math.max(0, baseline.totalInterest - sim.totalInterest), true)} in interest
            </h3>
            <p className="text-sm text-primary-foreground/70 text-pretty">
              By switching to the Avalanche method and putting ₹5,000 extra each month toward your highest-interest loan,
              you could close debt ~{Math.max(0, baseline.months - sim.months)} months earlier.
            </p>
          </div>
          <Link
            to="/strategy"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-foreground text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary-foreground/90 transition-colors"
          >
            Explore strategies <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="text-base font-bold tracking-tight text-primary">{title}</h2>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subTone = "muted",
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "muted" | "warning" | "accent" | "success" | "danger";
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  const subColor =
    subTone === "warning"
      ? "text-warning"
      : subTone === "accent"
      ? "text-accent"
      : subTone === "success"
      ? "text-success"
      : subTone === "danger"
      ? "text-destructive"
      : "text-muted-foreground";
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-2 transition-colors",
        accent
          ? "border-accent/20 bg-accent/[0.04]"
          : "border-border bg-surface",
      )}
    >
      <div className="flex items-center justify-between text-muted-foreground">
        <p className="text-[10px] font-semibold uppercase tracking-widest">{label}</p>
        {icon && (
          <span className={cn("grid place-items-center size-7 rounded-lg", accent ? "bg-accent/10 text-accent" : "bg-muted")}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", accent ? "text-accent" : "text-primary")}>
        {value}
      </p>
      {sub && <p className={cn("text-[11px] font-medium", subColor)}>{sub}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-20 grid place-items-center">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto size-16 rounded-2xl bg-accent/10 grid place-items-center text-3xl">
          📊
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          Add your first loan to start tracking repayments.
        </h2>
        <p className="text-sm text-muted-foreground">
          You'll see your total debt, monthly EMI, and smart strategies — all in one calm dashboard.
        </p>
        <Link
          to="/loans/add"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-card"
        >
          <Plus className="size-4" /> Add a loan
        </Link>
      </div>
    </div>
  );
}
