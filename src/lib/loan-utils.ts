import type { Loan, LoanType, EMIPayment } from "./types";

export function formatINR(n: number, compact = false): string {
  if (!isFinite(n)) return "₹0";
  if (compact) {
    if (Math.abs(n) >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
    if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
    if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function nextEmiDate(loan: Loan, from: Date = new Date()): Date {
  const day = Math.min(Math.max(loan.emiDay, 1), 28);
  const candidate = new Date(from.getFullYear(), from.getMonth(), day);
  if (candidate < from) candidate.setMonth(candidate.getMonth() + 1);
  return candidate;
}

export function daysUntil(date: Date, from: Date = new Date()): number {
  const ms = date.getTime() - from.setHours(0, 0, 0, 0);
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function loanProgress(loan: Loan): number {
  if (loan.sanctionAmount <= 0) return 0;
  const paid = loan.sanctionAmount - loan.currentOutstanding;
  return Math.max(0, Math.min(100, (paid / loan.sanctionAmount) * 100));
}

export function totalPaid(loan: Loan): number {
  return loan.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
}

export function interestPaidEstimate(loan: Loan): number {
  // rough heuristic: total paid minus principal reduced
  const principalPaid = loan.sanctionAmount - loan.currentOutstanding;
  const tp = totalPaid(loan);
  return Math.max(0, tp - principalPaid);
}

export const loanTypeIcons: Record<LoanType, string> = {
  Home: "🏠",
  Car: "🚗",
  Personal: "👤",
  Education: "🎓",
  "Credit Card": "💳",
  Business: "💼",
  Other: "📄",
};

export function statusOfNextEMI(loan: Loan): "overdue" | "due-soon" | "upcoming" | "none" {
  if (loan.closed) return "none";
  // overdue: last scheduled emi this month unpaid
  const today = new Date();
  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), loan.emiDay);
  const monthKey = `${dueThisMonth.getFullYear()}-${dueThisMonth.getMonth() + 1}`;
  const paidThisMonth = loan.payments.some(
    (p) => p.status === "paid" && new Date(p.date).toISOString().slice(0, 7) === monthKey.padStart(7, "0"),
  );
  if (today > dueThisMonth && !paidThisMonth) return "overdue";
  const next = nextEmiDate(loan);
  const d = daysUntil(next);
  if (d <= 3) return "due-soon";
  return "upcoming";
}

export function generateUpcomingPayments(loan: Loan, count = 6): EMIPayment[] {
  const out: EMIPayment[] = [];
  let date = nextEmiDate(loan);
  for (let i = 0; i < count; i++) {
    out.push({
      id: `up-${i}-${date.toISOString()}`,
      date: date.toISOString(),
      amount: loan.emiAmount,
      status: "upcoming",
    });
    date = new Date(date.getFullYear(), date.getMonth() + 1, loan.emiDay);
  }
  return out;
}

/** Simulate snowball / avalanche payoff timelines. Returns months to clear & total interest. */
export function simulatePayoff(
  loans: Loan[],
  strategy: "snowball" | "avalanche" | "minimum",
  extraMonthly = 0,
): { months: number; totalInterest: number; order: string[] } {
  // Clone state
  const state = loans
    .filter((l) => !l.closed && l.currentOutstanding > 0)
    .map((l) => ({
      id: l.id,
      name: l.name,
      balance: l.currentOutstanding,
      rate: l.interestRate / 100 / 12,
      minEmi: l.emiAmount,
    }));
  if (state.length === 0) return { months: 0, totalInterest: 0, order: [] };

  const order: string[] = [];
  let months = 0;
  let totalInterest = 0;
  const MAX = 600;

  while (state.some((s) => s.balance > 0.01) && months < MAX) {
    months++;
    let extra = extraMonthly;
    // priority order
    const live = state.filter((s) => s.balance > 0.01);
    const sorted = [...live].sort((a, b) => {
      if (strategy === "snowball") return a.balance - b.balance;
      if (strategy === "avalanche") return b.rate - a.rate;
      return 0;
    });

    // accrue interest & pay minimums
    for (const s of state) {
      if (s.balance <= 0) continue;
      const interest = s.balance * s.rate;
      totalInterest += interest;
      s.balance += interest;
      const pay = Math.min(s.minEmi, s.balance);
      s.balance -= pay;
    }

    // apply extra to top priority that still has balance
    for (const target of sorted) {
      const s = state.find((x) => x.id === target.id)!;
      if (s.balance <= 0) continue;
      const pay = Math.min(extra, s.balance);
      s.balance -= pay;
      extra -= pay;
      if (extra <= 0) break;
    }

    for (const s of state) {
      if (s.balance <= 0.01 && !order.includes(s.id)) order.push(s.id);
    }
  }

  return { months, totalInterest: Math.round(totalInterest), order };
}
