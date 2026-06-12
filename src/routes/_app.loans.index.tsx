import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { getLoans, markEmiPaid, deleteLoan, useStore } from "@/lib/store";
import {
  daysUntil,
  formatINR,
  loanProgress,
  loanTypeIcons,
  nextEmiDate,
  statusOfNextEMI,
} from "@/lib/loan-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/loans/")({
  component: LoansPage,
});

type Filter = "all" | "active" | "overdue" | "closed";

function LoansPage() {
  const loans = useStore(() => getLoans());
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    return loans.filter((l) => {
      if (filter === "active" && l.closed) return false;
      if (filter === "closed" && !l.closed) return false;
      if (filter === "overdue" && statusOfNextEMI(l) !== "overdue") return false;
      const q = query.trim().toLowerCase();
      if (q && !`${l.name} ${l.lender} ${l.type}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [loans, filter, query]);

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">My Loans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All your debts, in one calm view.
          </p>
        </div>
        <Link
          to="/loans/add"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-card"
        >
          <Plus className="size-4" /> Add Loan
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search loans, lenders…"
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/15"
          />
        </div>
        <div className="inline-flex rounded-xl border border-border bg-surface p-1">
          {(["active", "overdue", "closed", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-base font-semibold text-primary">No loans match your filters.</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different filter or add a new loan.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((loan) => {
            const progress = loanProgress(loan);
            const next = nextEmiDate(loan);
            const days = daysUntil(next);
            const status = statusOfNextEMI(loan);
            return (
              <div
                key={loan.id}
                className="group rounded-2xl border border-border bg-surface p-5 hover:border-accent/30 hover:shadow-card-lg transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Link
                    to="/loans/$loanId"
                    params={{ loanId: loan.id }}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="size-12 rounded-xl bg-muted grid place-items-center text-xl shrink-0">
                      {loanTypeIcons[loan.type]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-primary truncate">{loan.name}</h3>
                        {loan.closed && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-success/15 text-success px-2 py-0.5">
                            Closed
                          </span>
                        )}
                        {!loan.closed && status === "overdue" && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-destructive text-destructive-foreground px-2 py-0.5">
                            Overdue
                          </span>
                        )}
                        {!loan.closed && status === "due-soon" && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-warning text-warning-foreground px-2 py-0.5">
                            Due in {days}d
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {loan.lender} • {loan.type} • {loan.interestRate}% p.a.
                      </p>
                    </div>
                  </Link>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatINR(loan.currentOutstanding)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      of {formatINR(loan.sanctionAmount, true)}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">
                      Progress {progress.toFixed(0)}%
                    </span>
                    <span className="font-medium text-primary">
                      {formatINR(loan.emiAmount)} EMI • {loan.remainingTenureMonths} mo left
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        progress > 75 ? "bg-success" : "bg-accent",
                      )}
                      style={{ width: `${Math.max(2, progress)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs flex-wrap gap-2">
                  <span className="text-muted-foreground">
                    Next EMI:{" "}
                    <span className="font-semibold text-primary">
                      {next.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    {!loan.closed && (
                      <button
                        onClick={() => markEmiPaid(loan.id)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}
                    <Link
                      to="/loans/$loanId"
                      params={{ loanId: loan.id }}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-muted transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${loan.name}?`)) deleteLoan(loan.id);
                      }}
                      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
