export type LoanType =
  | "Home"
  | "Car"
  | "Personal"
  | "Education"
  | "Credit Card"
  | "Business"
  | "Other";

export type EMIStatus = "paid" | "upcoming" | "overdue";

export interface EMIPayment {
  id: string;
  date: string; // ISO date when EMI was due
  paidDate?: string; // ISO date when actually paid
  amount: number;
  status: EMIStatus;
  note?: string;
}

export interface Loan {
  id: string;
  name: string;
  lender: string;
  type: LoanType;
  sanctionAmount: number;
  currentOutstanding: number;
  interestRate: number; // % per annum
  emiAmount: number;
  emiDay: number; // day of month 1-28
  startDate: string; // ISO
  remainingTenureMonths: number;
  processingFees?: number;
  prepaymentCharges?: number;
  notes?: string;
  payments: EMIPayment[];
  closed?: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  reminderDays: number[]; // e.g. [7,3,1,0]
}
