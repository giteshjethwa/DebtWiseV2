import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, TrendingDown, Zap } from "lucide-react";
import { getLoans, useStore } from "@/lib/store";
import { formatINR, simulatePayoff } from "@/lib/loan-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/strategy")({
  component: StrategyPage,
});

type Strategy = "snowball" | "avalanche";

function StrategyPage() {
  const loans = useStore(() => getLoans()).filter((l) => !l.closed);
  const [strategy, setStrategy] = useState<Strategy>("avalanche");
  const [extra, setExtra] = useState(5000);

  const baseline = useMemo(() => simulatePayoff(loans, "minimum", 0), [loans]);
  const withStrategy = useMemo(
    () => simulatePayoff(loans, strategy, extra),
    [loans, strategy, extra],
  );
  const other = strategy === "avalanche" ? "snowball" : "avalanche";
  const otherSim = useMemo(
    () => simulatePayoff(loans, other, extra),
    [loans, other, extra],
  );

  const interestSaved = Math.max(0, baseline.totalInterest - withStrategy.totalInterest);
  const monthsSaved = Math.max(0, baseline.months - withStrategy.months);

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 space-y-8 max-w-5xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
          Debt-Free Strategy
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-[60ch]">
          See how much you can save by paying a little extra each month. Pick the method that fits your mind, not just your math.
        </p>
      </header>

      {loans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-base font-semibold text-primary">Add loans to see strategies.</p>
        </div>
      ) : (
        <>
          {/* Strategy picker */}
          <div className="grid gap-4 md:grid-cols-2">
            <StrategyCard
              active={strategy === "snowball"}
              onClick={() => setStrategy("snowball")}
              title="Snowball"
              subtitle="Smallest balance first"
              description="Quick psychological wins. Each loan you close gives momentum to attack the next."
              icon="❄️"
            />
            <StrategyCard
              active={strategy === "avalanche"}
              onClick={() => setStrategy("avalanche")}
              title="Avalanche"
              subtitle="Highest interest first"
              description="Mathematically optimal — saves the most money on interest over time."
              icon="🏔️"
            />
          </div>

          {/* Simulator */}
          <section className="rounded-3xl bg-primary text-primary-foreground p-7 lg:p-9">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
                  <Sparkles className="size-3" /> Simulation
                </div>
                <h3 className="text-2xl font-bold tracking-tight">
                  Add ₹{extra.toLocaleString("en-IN")} extra every month
                </h3>
                <p className="text-sm text-primary-foreground/70 max-w-md">
                  Drag the slider to see how an extra payment reshapes your timeline.
                </p>
              </div>
              <div className="w-full md:w-80 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={500}
                  value={extra}
                  onChange={(e) => setExtra(Number(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[10px] text-primary-foreground/60">
                  <span>₹0</span>
                  <span>₹50,000</span>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <Metric label="Interest saved" value={formatINR(interestSaved, true)} tone="accent" />
              <Metric label="Months saved" value={`${monthsSaved} mo`} tone="muted" />
              <Metric
                label="Debt-free in"
                value={`${withStrategy.months} mo`}
                tone="muted"
                sub={`vs ${baseline.months} mo baseline`}
              />
            </div>
          </section>

          {/* Comparison */}
          <section className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
            <h3 className="font-bold text-primary mb-1">Snowball vs Avalanche</h3>
            <p className="text-sm text-muted-foreground mb-6">
              With ₹{extra.toLocaleString("en-IN")} extra per month.
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <CompareCard
                label="Snowball"
                months={strategy === "snowball" ? withStrategy.months : otherSim.months}
                interest={
                  strategy === "snowball" ? withStrategy.totalInterest : otherSim.totalInterest
                }
                highlight={strategy === "snowball"}
              />
              <CompareCard
                label="Avalanche"
                months={strategy === "avalanche" ? withStrategy.months : otherSim.months}
                interest={
                  strategy === "avalanche" ? withStrategy.totalInterest : otherSim.totalInterest
                }
                highlight={strategy === "avalanche"}
              />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              <strong className="text-primary">Recommended for you:</strong>{" "}
              {Math.abs(withStrategy.totalInterest - otherSim.totalInterest) < 5000
                ? "Either method works — pick the one that motivates you most."
                : withStrategy.totalInterest < otherSim.totalInterest
                ? `${strategy === "avalanche" ? "Avalanche" : "Snowball"} (${strategy === "avalanche" ? "saves more interest" : "frees up cashflow faster"}).`
                : `${other === "avalanche" ? "Avalanche" : "Snowball"} would save more in this scenario.`}
            </p>
          </section>

          {/* Repayment order */}
          <section className="rounded-2xl border border-border bg-surface p-6 lg:p-8">
            <h3 className="font-bold text-primary mb-4 inline-flex items-center gap-2">
              <Zap className="size-4 text-accent" /> Suggested repayment order
            </h3>
            <ol className="space-y-2">
              {withStrategy.order.map((id, i) => {
                const l = loans.find((x) => x.id === id);
                if (!l) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid place-items-center size-7 rounded-lg bg-accent/10 text-accent text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-primary">{l.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {l.lender} • {l.interestRate}% • {formatINR(l.currentOutstanding)}
                        </p>
                      </div>
                    </div>
                    <TrendingDown className="size-4 text-muted-foreground" />
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

function StrategyCard({
  active,
  onClick,
  title,
  subtitle,
  description,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border p-6 transition-all",
        active
          ? "border-accent bg-accent/5 ring-3 ring-accent/15"
          : "border-border bg-surface hover:border-accent/30",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="size-12 rounded-2xl bg-muted grid place-items-center text-2xl">
          {icon}
        </div>
        {active && (
          <span className="rounded-full bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5">
            Selected
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-primary">{title}</h3>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{subtitle}</p>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
    </button>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "accent" | "muted";
}) {
  return (
    <div className="rounded-2xl bg-primary-foreground/5 ring-1 ring-primary-foreground/10 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/60">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tracking-tight",
          tone === "accent" ? "text-accent" : "text-primary-foreground",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-primary-foreground/50 mt-1">{sub}</p>}
    </div>
  );
}

function CompareCard({
  label,
  months,
  interest,
  highlight,
}: {
  label: string;
  months: number;
  interest: number;
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 border transition-all",
        highlight ? "border-accent bg-accent/5" : "border-border bg-background",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Months</p>
          <p className="text-xl font-bold text-primary">{months}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total interest</p>
          <p className="text-xl font-bold text-primary">{formatINR(interest, true)}</p>
        </div>
      </div>
    </div>
  );
}
