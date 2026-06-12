import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import { ArrowLeft, FileUp, Loader2, Sparkles, Upload } from "lucide-react";
import { saveLoan } from "@/lib/store";
import type { Loan, LoanType } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/loans/add")({
  component: AddLoanPage,
});

const LOAN_TYPES: LoanType[] = ["Home", "Car", "Personal", "Education", "Credit Card", "Business", "Other"];

type Tab = "manual" | "upload";

function AddLoanPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div className="px-4 py-6 md:px-8 lg:px-10 lg:py-10 max-w-3xl mx-auto space-y-6">
      <Link
        to="/loans"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back to loans
      </Link>

      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Add a Loan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add manually or upload a sanction letter — we'll extract the details for you.
        </p>
      </header>

      <div className="inline-flex rounded-xl border border-border bg-surface p-1">
        <button
          onClick={() => setTab("manual")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
            tab === "manual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
          )}
        >
          Manual entry
        </button>
        <button
          onClick={() => setTab("upload")}
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5",
            tab === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
          )}
        >
          <Sparkles className="size-3.5" /> Upload sanction letter
        </button>
      </div>

      {tab === "manual" ? (
        <ManualForm onSaved={() => navigate({ to: "/loans" })} />
      ) : (
        <UploadFlow onExtracted={() => setTab("manual")} onSaved={() => navigate({ to: "/loans" })} />
      )}
    </div>
  );
}

interface FormState {
  name: string;
  lender: string;
  type: LoanType;
  sanctionAmount: string;
  currentOutstanding: string;
  interestRate: string;
  emiAmount: string;
  emiDay: string;
  startDate: string;
  remainingTenureMonths: string;
  processingFees: string;
  prepaymentCharges: string;
  notes: string;
}

const empty: FormState = {
  name: "",
  lender: "",
  type: "Personal",
  sanctionAmount: "",
  currentOutstanding: "",
  interestRate: "",
  emiAmount: "",
  emiDay: "5",
  startDate: new Date().toISOString().slice(0, 10),
  remainingTenureMonths: "",
  processingFees: "",
  prepaymentCharges: "",
  notes: "",
};

function ManualForm({
  initial,
  onSaved,
}: {
  initial?: Partial<FormState>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...empty, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.lender.trim()) errs.lender = "Required";
    const sanctionAmount = Number(form.sanctionAmount);
    const currentOutstanding = Number(form.currentOutstanding || form.sanctionAmount);
    const interestRate = Number(form.interestRate);
    const emiAmount = Number(form.emiAmount);
    const emiDay = Number(form.emiDay);
    const remainingTenureMonths = Number(form.remainingTenureMonths);
    if (!sanctionAmount || sanctionAmount <= 0) errs.sanctionAmount = "Enter a valid amount";
    if (!interestRate || interestRate <= 0 || interestRate > 60) errs.interestRate = "0–60%";
    if (!emiAmount || emiAmount <= 0) errs.emiAmount = "Required";
    if (!emiDay || emiDay < 1 || emiDay > 28) errs.emiDay = "1–28";
    if (!remainingTenureMonths || remainingTenureMonths < 1) errs.remainingTenureMonths = "Required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const loan: Loan = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      lender: form.lender.trim(),
      type: form.type,
      sanctionAmount,
      currentOutstanding,
      interestRate,
      emiAmount,
      emiDay,
      startDate: new Date(form.startDate).toISOString(),
      remainingTenureMonths,
      processingFees: form.processingFees ? Number(form.processingFees) : undefined,
      prepaymentCharges: form.prepaymentCharges ? Number(form.prepaymentCharges) : undefined,
      notes: form.notes.trim() || undefined,
      payments: [],
      createdAt: new Date().toISOString(),
    };
    saveLoan(loan);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6 lg:p-8 space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Loan name" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Home Loan"
            className="form-input"
          />
        </Field>
        <Field label="Lender" error={errors.lender}>
          <input
            value={form.lender}
            onChange={(e) => set("lender", e.target.value)}
            placeholder="HDFC Bank"
            className="form-input"
          />
        </Field>
        <Field label="Loan type">
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value as LoanType)}
            className="form-input"
          >
            {LOAN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Interest rate (% p.a.)" error={errors.interestRate}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.interestRate}
            onChange={(e) => set("interestRate", e.target.value)}
            placeholder="8.4"
            className="form-input"
          />
        </Field>
        <Field label="Sanction amount (₹)" error={errors.sanctionAmount}>
          <input
            type="number"
            inputMode="decimal"
            value={form.sanctionAmount}
            onChange={(e) => set("sanctionAmount", e.target.value)}
            placeholder="4200000"
            className="form-input"
          />
        </Field>
        <Field label="Current outstanding (₹)">
          <input
            type="number"
            inputMode="decimal"
            value={form.currentOutstanding}
            onChange={(e) => set("currentOutstanding", e.target.value)}
            placeholder="Defaults to sanction amount"
            className="form-input"
          />
        </Field>
        <Field label="EMI amount (₹)" error={errors.emiAmount}>
          <input
            type="number"
            inputMode="decimal"
            value={form.emiAmount}
            onChange={(e) => set("emiAmount", e.target.value)}
            placeholder="34200"
            className="form-input"
          />
        </Field>
        <Field label="EMI day of month" error={errors.emiDay}>
          <input
            type="number"
            min={1}
            max={28}
            value={form.emiDay}
            onChange={(e) => set("emiDay", e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Loan start date">
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Remaining tenure (months)" error={errors.remainingTenureMonths}>
          <input
            type="number"
            value={form.remainingTenureMonths}
            onChange={(e) => set("remainingTenureMonths", e.target.value)}
            placeholder="182"
            className="form-input"
          />
        </Field>
        <Field label="Processing fees (₹)">
          <input
            type="number"
            value={form.processingFees}
            onChange={(e) => set("processingFees", e.target.value)}
            placeholder="Optional"
            className="form-input"
          />
        </Field>
        <Field label="Prepayment charges (%)">
          <input
            type="number"
            step="0.1"
            value={form.prepaymentCharges}
            onChange={(e) => set("prepaymentCharges", e.target.value)}
            placeholder="Optional"
            className="form-input"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          className="form-input"
          placeholder="Anything you'd like to remember about this loan"
        />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        <Link to="/loans" className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-card hover:scale-[1.01] transition-transform"
        >
          Save loan
        </button>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--color-border);
          background-color: var(--color-background);
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .form-input:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-accent) 15%, transparent);
        }
      `}</style>
    </form>
  );
}

function UploadFlow({
  onExtracted,
  onSaved,
}: {
  onExtracted: () => void;
  onSaved: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Partial<FormState> | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function extract() {
    if (!file) return;
    setLoading(true);
    // Demo: fake an extraction. Real impl would call an OCR/AI service.
    setTimeout(() => {
      setExtracted({
        name: "Home Loan",
        lender: "HDFC Bank",
        type: "Home",
        sanctionAmount: "3500000",
        currentOutstanding: "3245000",
        interestRate: "8.7",
        emiAmount: "29800",
        emiDay: "10",
        remainingTenureMonths: "168",
        startDate: new Date().toISOString().slice(0, 10),
      });
      setConfidence(0.78);
      setLoading(false);
    }, 1400);
  }

  if (extracted) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 flex items-start gap-3">
          <Sparkles className="size-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-primary">
              We extracted the details — please confirm.
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Confidence {(confidence * 100).toFixed(0)}%.{" "}
              {confidence < 0.85
                ? "A few fields may need a quick check."
                : "Looks solid."}
            </p>
          </div>
        </div>
        <ManualForm initial={extracted} onSaved={onSaved} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 lg:p-8 space-y-5">
      <label
        htmlFor="sanction"
        className={cn(
          "block rounded-2xl border-2 border-dashed border-border p-10 text-center cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5",
          file && "border-accent/50 bg-accent/5",
        )}
      >
        <div className="mx-auto size-14 rounded-2xl bg-muted grid place-items-center mb-3">
          {file ? <FileUp className="size-6 text-accent" /> : <Upload className="size-6 text-muted-foreground" />}
        </div>
        <p className="font-semibold text-primary">
          {file ? file.name : "Drop your sanction letter here"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF or image, up to 20MB</p>
        <input
          id="sanction"
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={pick}
        />
      </label>

      <div className="flex justify-end gap-3">
        <button
          onClick={onExtracted}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
        >
          Skip & enter manually
        </button>
        <button
          onClick={extract}
          disabled={!file || loading}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-card transition-transform",
            (!file || loading) && "opacity-60 cursor-not-allowed",
          )}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Extracting…" : "Extract details"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        We do our best to read your sanction letter. If anything is unclear, you'll be able to fix it before saving.
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {error && <span className="text-[10px] font-semibold text-destructive">{error}</span>}
      </span>
      {children}
    </label>
  );
}
