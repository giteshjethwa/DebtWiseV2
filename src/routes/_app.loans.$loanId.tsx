import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Trash2,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  addExtraPayment,
  deleteLoan,
  getLoan,
  markEmiPaid,
  useStore,
} from "@/lib/store";
import {
  formatDate,
  formatINR,
  generateUpcomingPayments,
  interestPaidEstimate,
  loanProgress,
  loanTypeIcons,
  nextEmiDate,
  totalPaid,
} from "@/lib/loan-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/loans/$loanId")({
  component: LoanDetails,
});

function LoanDetails() {
  const { loanId } = Route.useParams();
  const navigate = useNavigate();
  const loan = useStore(() => getLoan(loanId));
  const [extra, setExtra] = useState("");

  if (!loan) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-base font-semibold text-primary">Loan not found.</p>
        <Link
          to="/loans"
          className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
        >
          ← Back to loans
        </Link>
      </div>
    );
  }

  const paid = totalPaid(loan);
  const interestPaid = interestPaidEstimate(loan);
  const principalPaid = loan.sanctionAmount - loan.currentOutstanding;
  const progress = loanProgress(loan);
  const upcoming = useMemo(() => generateUpcomingPayments(loan, 6), [loan]);

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 space-y-6 max-w-5xl mx-auto">
      <Link
        to="/loans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to loans
      </Link>

      {/* Hero */}
      <header className="rounded-3xl border border-border bg-surface p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-14 rounded-2xl bg-muted grid place-items-center text-2xl shrink-0">
              {loanTypeIcons[loan.type]}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary truncate">
                {loan.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {loan.lender} • {loan.type} • {loan.interestRate}% p.a.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markEmiPaid(loan.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="size-3.5" /> Mark EMI Paid
            </button>
            <button
              className="rounded-xl border border-border p-2 text-muted-foreground hover:text-primary hover:bg-muted"
              aria-label="Edit"
            >
              <Edit3 className="size-4" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${loan.name}?`)) {
                  deleteLoan(loan.id);
                  navigate({ to: "/loans" });
                }
              }}
              className="rounded-xl border border-border p-2 text-destructive hover:bg-destructive/5"
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Outstanding" value={formatINR(loan.currentOutstanding)} tone="primary" />
          <Stat label="Total Paid" value={formatINR(paid)} tone="muted" />
          <Stat label="Interest Paid" value={formatINR(interestPaid)} tone="muted" />
          <Stat label="Principal Paid" value={formatINR(principalPaid)} tone="success" />
        </div>

        <div className="mt-7">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Repayment progress</span>
            <span className="font-semibold text-primary">{progress.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Charts + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary">Outstanding over time</h3>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <TrendingUp className="size-3.5" /> Projected
            </span>
          </div>
          <PayoffChart
            outstanding={loan.currentOutstanding}
            emi={loan.emiAmount}
            rate={loan.interestRate}
          />
          <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-accent" /> Outstanding
            </div>
            <div className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-success" /> Principal paid
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div>
            <h3 className="font-bold text-primary inline-flex items-center gap-2">
              <Zap className="size-4 text-accent" /> Prepay & save
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add an extra payment toward the principal.
            </p>
          </div>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="₹ amount"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15"
          />
          <button
            onClick={() => {
              const amt = Number(extra);
              if (amt > 0) {
                addExtraPayment(loan.id, amt);
                setExtra("");
              }
            }}
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-accent-foreground shadow-card hover:scale-[1.01] transition-transform"
          >
            Apply payment
          </button>
          <div className="rounded-xl bg-muted p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-primary">Tip</p>
            Paying an extra <strong>{formatINR(loan.emiAmount)}</strong> once a year can shorten your tenure by months.
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-bold text-primary mb-4">Upcoming payments</h3>
          <ul className="space-y-2">
            {upcoming.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Wallet className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-primary">{formatDate(p.date)}</span>
                </div>
                <span className="text-sm font-semibold">{formatINR(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-bold text-primary mb-4">Payment history</h3>
          {loan.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {loan.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("size-2 rounded-full", p.note ? "bg-accent" : "bg-success")} />
                    <div>
                      <p className="text-sm font-medium text-primary">{formatDate(p.date)}</p>
                      {p.note && <p className="text-[11px] text-muted-foreground">{p.note}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{formatINR(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "muted" | "success" | "warning";
}) {
  return (
    <div className="rounded-xl bg-background border border-border/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-bold tracking-tight",
          tone === "primary" && "text-primary",
          tone === "muted" && "text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Lightweight SVG line chart projecting outstanding to zero. */
function PayoffChart({
  outstanding,
  emi,
  rate,
}: {
  outstanding: number;
  emi: number;
  rate: number;
}) {
  const monthly = rate / 100 / 12;
  const points: number[] = [];
  let bal = outstanding;
  for (let i = 0; i < 60 && bal > 0; i++) {
    points.push(bal);
    bal = bal + bal * monthly - emi;
    if (bal < 0) bal = 0;
  }
  points.push(0);

  const w = 600;
  const h = 180;
  const max = points[0] || 1;
  const stepX = w / Math.max(1, points.length - 1);

  const path = points
    .map((v, i) => {
      const x = i * stepX;
      const y = h - (v / max) * (h - 20) - 10;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const area =
    `M 0 ${h} ` +
    points
      .map((v, i) => {
        const x = i * stepX;
        const y = h - (v / max) * (h - 20) - 10;
        return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ") +
    ` L ${w} ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#grad)" />
      <path
        d={path}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
