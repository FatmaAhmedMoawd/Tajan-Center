export type SubscriptionStatus = 'active' | 'withdrawn' | 'dropped' | 'exempt';

export type PaymentStatus = 'paid' | 'cash_to_teacher' | 'unpaid' | 'exempt';

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  color: string;
  monthlyFee: number;
  phone?: string;
  notes?: string;
}

export interface Student {
  id: string;
  teacherId: string;
  grade: string; // One of the 6 designated grades
  name: string;
  parentPhone?: string; // Only parent phone
  status: SubscriptionStatus;
  monthlyFee?: number; // 80 EGP for primary, 100 EGP for prep (customizable)
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  studentId: string;
  month: string; // YYYY-MM e.g. '2026-08', '2026-09', '2026-10'
  status: PaymentStatus;
  amount?: number;
  paidAt?: string; // YYYY-MM-DD
}

export interface CenterData {
  version: number;
  teachers: Teacher[];
  students: Student[];
  payments: PaymentRecord[];
  unlockedMonths?: string[];
  updatedAt: string;
}
