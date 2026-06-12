import { useSyncExternalStore } from "react";
import type { Loan, UserProfile, EMIPayment } from "./types";

const LOANS_KEY = "debtwise.loans";
const USER_KEY = "debtwise.user";
const SESSION_KEY = "debtwise.session";

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function isClient() {
  return typeof window !== "undefined";
}

// Cache snapshots per key so useSyncExternalStore sees stable references between emits.
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  if (cache.has(key)) return cache.get(key) as T;
  try {
    const v = localStorage.getItem(key);
    const parsed = v ? (JSON.parse(v) as T) : fallback;
    cache.set(key, parsed);
    return parsed;
  } catch {
    cache.set(key, fallback);
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isClient()) return;
  localStorage.setItem(key, JSON.stringify(value));
  cache.set(key, value);
  emit();
}

// ---------- Session / Auth (mock) ----------
export interface Session {
  email: string;
  name: string;
}

export function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

export function signIn(email: string, name?: string) {
  const session: Session = { email, name: name ?? email.split("@")[0] };
  write(SESSION_KEY, session);
  // ensure profile exists
  if (!read<UserProfile | null>(USER_KEY, null)) {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: session.name,
      email: session.email,
      currency: "INR",
      notifications: { email: true, sms: false, push: true },
      reminderDays: [7, 3, 1, 0],
    };
    write(USER_KEY, profile);
  }
  // seed demo loans on first sign-in if none
  if (read<Loan[]>(LOANS_KEY, []).length === 0) {
    write(LOANS_KEY, seedLoans());
  }
}

export function signOut() {
  if (!isClient()) return;
  localStorage.removeItem(SESSION_KEY);
  emit();
}

// ---------- Profile ----------
export function getProfile(): UserProfile | null {
  return read<UserProfile | null>(USER_KEY, null);
}

export function updateProfile(patch: Partial<UserProfile>) {
  const cur = getProfile();
  if (!cur) return;
  write(USER_KEY, { ...cur, ...patch });
}

// ---------- Loans ----------
export function getLoans(): Loan[] {
  return read<Loan[]>(LOANS_KEY, []);
}

export function getLoan(id: string): Loan | undefined {
  return getLoans().find((l) => l.id === id);
}

export function saveLoan(loan: Loan) {
  const loans = [...getLoans()];
  const idx = loans.findIndex((l) => l.id === loan.id);
  if (idx >= 0) loans[idx] = loan;
  else loans.push(loan);
  write(LOANS_KEY, loans);
}

export function deleteLoan(id: string) {
  write(
    LOANS_KEY,
    getLoans().filter((l) => l.id !== id),
  );
}

export function markEmiPaid(loanId: string, amount?: number) {
  const loans = getLoans().map((l) => {
    if (l.id !== loanId) return l;
    const amt = amount ?? l.emiAmount;
    const paid: EMIPayment = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      paidDate: new Date().toISOString(),
      amount: amt,
      status: "paid",
    };
    const currentOutstanding = Math.max(0, l.currentOutstanding - amt * 0.8);
    const remainingTenureMonths = Math.max(0, l.remainingTenureMonths - 1);
    return {
      ...l,
      payments: [paid, ...l.payments],
      currentOutstanding,
      remainingTenureMonths,
      closed: currentOutstanding <= 0 || remainingTenureMonths <= 0,
    };
  });
  write(LOANS_KEY, loans);
}

export function addExtraPayment(loanId: string, amount: number) {
  const loans = getLoans().map((l) => {
    if (l.id !== loanId) return l;
    const paid: EMIPayment = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      paidDate: new Date().toISOString(),
      amount,
      status: "paid",
      note: "Extra payment",
    };
    const currentOutstanding = Math.max(0, l.currentOutstanding - amount);
    return {
      ...l,
      payments: [paid, ...l.payments],
      currentOutstanding,
      closed: currentOutstanding <= 0,
    };
  });
  write(LOANS_KEY, loans);
}

// ---------- React hook ----------
function subscribe(cb: Listener) {
  listeners.add(cb);
  if (isClient()) {
    const handler = () => cb();
    window.addEventListener("storage", handler);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", handler);
    };
  }
  return () => listeners.delete(cb);
}

export function useStore<T>(selector: () => T): T {
  return useSyncExternalStore(
    subscribe,
    selector,
    selector, // server snapshot — fine since localStorage returns fallback on server
  );
}

// ---------- Seed demo data ----------
function seedLoans(): Loan[] {
  const now = new Date();
  const iso = (offsetMonths: number) =>
    new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1).toISOString();

  const home: Loan = {
    id: crypto.randomUUID(),
    name: "Home Loan",
    lender: "HDFC Bank",
    type: "Home",
    sanctionAmount: 4200000,
    currentOutstanding: 3820400,
    interestRate: 8.4,
    emiAmount: 34200,
    emiDay: 15,
    startDate: iso(-18),
    remainingTenureMonths: 182,
    payments: [
      {
        id: crypto.randomUUID(),
        date: iso(-1),
        paidDate: iso(-1),
        amount: 34200,
        status: "paid",
      },
      {
        id: crypto.randomUUID(),
        date: iso(-2),
        paidDate: iso(-2),
        amount: 34200,
        status: "paid",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const edu: Loan = {
    id: crypto.randomUUID(),
    name: "Education Loan",
    lender: "SBI",
    type: "Education",
    sanctionAmount: 1280000,
    currentOutstanding: 464600,
    interestRate: 9.2,
    emiAmount: 12400,
    emiDay: 2,
    startDate: iso(-40),
    remainingTenureMonths: 38,
    payments: [
      {
        id: crypto.randomUUID(),
        date: iso(-1),
        paidDate: iso(-1),
        amount: 12400,
        status: "paid",
      },
    ],
    createdAt: new Date().toISOString(),
  };

  const car: Loan = {
    id: crypto.randomUUID(),
    name: "Car Loan",
    lender: "ICICI Bank",
    type: "Car",
    sanctionAmount: 800000,
    currentOutstanding: 412000,
    interestRate: 10.2,
    emiAmount: 11200,
    emiDay: 5,
    startDate: iso(-24),
    remainingTenureMonths: 40,
    payments: [],
    createdAt: new Date().toISOString(),
  };

  const personal: Loan = {
    id: crypto.randomUUID(),
    name: "Personal Loan",
    lender: "Axis Bank",
    type: "Personal",
    sanctionAmount: 300000,
    currentOutstanding: 228500,
    interestRate: 14.5,
    emiAmount: 12500,
    emiDay: 25,
    startDate: iso(-6),
    remainingTenureMonths: 22,
    payments: [],
    createdAt: new Date().toISOString(),
  };

  return [home, edu, car, personal];
}
