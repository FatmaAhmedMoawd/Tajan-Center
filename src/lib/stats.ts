import { CenterData, PaymentRecord, Student } from '../types';
import { formatDayMonth, formatDateArabic } from './utils';
import { getDefaultFeeForGrade } from './constants';

export interface CalculatedStats {
  totalStudents: number;
  activeCount: number;
  withdrawnCount: number;
  droppedCount: number;
  exemptStudentsCount: number;

  paidCount: number;
  cashToTeacherCount: number;
  unpaidCount: number;
  exemptPaymentCount: number;

  collectedAmount: number;
  remainingAmount: number;
  totalPotentialAmount: number;
  collectionRate: number;
}

export function getStudentPaymentForMonth(
  studentId: string,
  month: string,
  payments: PaymentRecord[]
): PaymentRecord | undefined {
  return payments.find((p) => p.studentId === studentId && p.month === month);
}

export interface StatsFilter {
  teacherId?: string;
  grade?: string;
  month: string;
}

export function calculateStats(data: CenterData, filter: StatsFilter): CalculatedStats {
  let students = data.students;

  if (filter.teacherId) {
    students = students.filter((s) => s.teacherId === filter.teacherId);
  }
  if (filter.grade && filter.grade !== 'الكل') {
    students = students.filter((s) => s.grade === filter.grade);
  }

  let activeCount = 0;
  let withdrawnCount = 0;
  let droppedCount = 0;
  let exemptStudentsCount = 0;

  for (const student of students) {
    if (student.status === 'active') activeCount++;
    else if (student.status === 'withdrawn') withdrawnCount++;
    else if (student.status === 'dropped') droppedCount++;
    else if (student.status === 'exempt') exemptStudentsCount++;
  }

  let paidCount = 0;
  let cashToTeacherCount = 0;
  let unpaidCount = 0;
  let exemptPaymentCount = 0;

  let collectedAmount = 0;
  let remainingAmount = 0;

  for (const student of students) {
    // Grade-based fee (80 primary, 100 prep, or custom)
    const fee = student.monthlyFee ?? getDefaultFeeForGrade(student.grade);
    const payment = data.payments.find(
      (p) => p.studentId === student.id && p.month === filter.month
    );

    const paymentStatus = payment
      ? payment.status
      : student.status === 'exempt'
      ? 'exempt'
      : 'unpaid';

    if (paymentStatus === 'paid') {
      paidCount++;
      collectedAmount += payment?.amount ?? fee;
    } else if (paymentStatus === 'cash_to_teacher') {
      cashToTeacherCount++;
      collectedAmount += payment?.amount ?? fee;
    } else if (paymentStatus === 'exempt') {
      exemptPaymentCount++;
    } else {
      unpaidCount++;
      if (student.status === 'active') {
        remainingAmount += fee;
      }
    }
  }

  const totalPotentialAmount = collectedAmount + remainingAmount;
  const collectionRate =
    totalPotentialAmount > 0
      ? Math.round((collectedAmount / totalPotentialAmount) * 100)
      : 0;

  return {
    totalStudents: students.length,
    activeCount,
    withdrawnCount,
    droppedCount,
    exemptStudentsCount,
    paidCount,
    cashToTeacherCount,
    unpaidCount,
    exemptPaymentCount,
    collectedAmount,
    remainingAmount,
    totalPotentialAmount,
    collectionRate,
  };
}

export interface DailyCollectionStudentInfo {
  studentId: string;
  studentName: string;
  grade: string;
  parentPhone?: string;
  amount: number;
  status: PaymentRecord['status'];
  notes?: string;
}

export interface DailyCollectionItem {
  date: string; // YYYY-MM-DD
  dayMonth: string; // e.g. 01/10
  dayName: string; // e.g. الخميس
  totalAmount: number;
  studentsCount: number;
  students: DailyCollectionStudentInfo[];
}

/**
 * Calculates daily cash collections breakdown for a given month
 */
export function getDailyCollections(
  data: CenterData,
  filter: { teacherId?: string; grade?: string; month: string }
): DailyCollectionItem[] {
  let students = data.students;
  if (filter.teacherId) {
    students = students.filter((s) => s.teacherId === filter.teacherId);
  }
  if (filter.grade && filter.grade !== 'الكل') {
    students = students.filter((s) => s.grade === filter.grade);
  }

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const dailyMap = new Map<string, DailyCollectionItem>();

  for (const payment of data.payments) {
    if (payment.month !== filter.month) continue;
    if (payment.status !== 'paid' && payment.status !== 'cash_to_teacher') continue;

    const student = studentMap.get(payment.studentId);
    if (!student) continue;

    const dateStr = payment.paidAt || `${filter.month}-01`;
    const fee = payment.amount ?? student.monthlyFee ?? getDefaultFeeForGrade(student.grade);

    let existing = dailyMap.get(dateStr);
    if (!existing) {
      existing = {
        date: dateStr,
        dayMonth: formatDayMonth(dateStr),
        dayName: formatDateArabic(dateStr).split(' ')[0] || '',
        totalAmount: 0,
        studentsCount: 0,
        students: [],
      };
      dailyMap.set(dateStr, existing);
    }

    existing.totalAmount += fee;
    existing.studentsCount += 1;
    existing.students.push({
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      parentPhone: student.parentPhone,
      amount: fee,
      status: payment.status,
      notes: student.notes,
    });
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
