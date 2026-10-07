import * as XLSX from 'xlsx';
import { PaymentRecord, Student, Teacher } from '../types';
import { GRADES, PAYMENT_STATUS_MAP, SUBSCRIPTION_STATUS_MAP, getDefaultFeeForGrade } from './constants';

// Grade order lookup index for clean sorting
const GRADE_ORDER_MAP: Record<string, number> = {};
GRADES.forEach((g, idx) => {
  GRADE_ORDER_MAP[g] = idx;
});

function sortStudentsByGradeAndName(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    const gradeA = GRADE_ORDER_MAP[a.grade] ?? 99;
    const gradeB = GRADE_ORDER_MAP[b.grade] ?? 99;
    if (gradeA !== gradeB) {
      return gradeA - gradeB;
    }
    return a.name.localeCompare(b.name, 'ar');
  });
}

function formatStudentRow(
  student: Student,
  teacher: Teacher,
  payment: PaymentRecord | undefined,
  index: number
) {
  const currentPaymentStatus = payment
    ? payment.status
    : student.status === 'exempt'
    ? 'exempt'
    : 'unpaid';

  const defaultFee = student.monthlyFee ?? getDefaultFeeForGrade(student.grade);
  const fee = payment?.amount ?? defaultFee;
  const paymentLabel = PAYMENT_STATUS_MAP[currentPaymentStatus]?.label || currentPaymentStatus;
  const subLabel = SUBSCRIPTION_STATUS_MAP[student.status]?.label || student.status;

  return {
    'م': index + 1,
    'اسم الطالب': student.name,
    'السنة الدراسية': student.grade,
    'تليفون ولي الأمر': student.parentPhone || '—',
    'حالة الاشتراك': subLabel,
    'سعر الاشتراك (ج.م)': fee,
    'حالة الدفع': paymentLabel,
    'تاريخ السداد': payment?.paidAt || '—',
    'ملاحظات': student.notes || '—',
  };
}

/**
 * Download Excel containing only Paid students (دفع + دفع كاش للمستر)
 */
export function exportTeacherPaidExcel(
  teacher: Teacher,
  allStudents: Student[],
  payments: PaymentRecord[],
  month: string
): void {
  const teacherStudents = allStudents.filter((s) => s.teacherId === teacher.id);
  const paidStudents = teacherStudents.filter((student) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    const status = payment ? payment.status : student.status === 'exempt' ? 'exempt' : 'unpaid';
    return status === 'paid' || status === 'cash_to_teacher';
  });

  const sorted = sortStudentsByGradeAndName(paidStudents);
  const rows = sorted.map((student, idx) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    return formatStudentRow(student, teacher, payment, idx);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 26 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب الذين سددوا');

  const cleanTeacherName = teacher.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
  XLSX.writeFile(workbook, `الذين_سددوا_${cleanTeacherName}_${month}.xlsx`);
}

/**
 * Download Excel containing only Unpaid students (لم يدفع)
 */
export function exportTeacherUnpaidExcel(
  teacher: Teacher,
  allStudents: Student[],
  payments: PaymentRecord[],
  month: string
): void {
  const teacherStudents = allStudents.filter((s) => s.teacherId === teacher.id);
  const unpaidStudents = teacherStudents.filter((student) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    const status = payment ? payment.status : student.status === 'exempt' ? 'exempt' : 'unpaid';
    return status === 'unpaid';
  });

  const sorted = sortStudentsByGradeAndName(unpaidStudents);
  const rows = sorted.map((student, idx) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    return formatStudentRow(student, teacher, payment, idx);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 }, { wch: 26 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب الذين لم يدفعوا');

  const cleanTeacherName = teacher.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
  XLSX.writeFile(workbook, `الذين_لم_يدفعوا_${cleanTeacherName}_${month}.xlsx`);
}

/**
 * Download complete monthly report with TWO sheets:
 * Sheet 1: الطلاب الذين سددوا
 * Sheet 2: الطلاب الذين لم يسددوا بعد
 */
export function exportTeacherFullMonthlyReport(
  teacher: Teacher,
  allStudents: Student[],
  payments: PaymentRecord[],
  month: string
): void {
  const teacherStudents = allStudents.filter((s) => s.teacherId === teacher.id);

  const paidStudents = teacherStudents.filter((student) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    const status = payment ? payment.status : student.status === 'exempt' ? 'exempt' : 'unpaid';
    return status === 'paid' || status === 'cash_to_teacher';
  });

  const unpaidStudents = teacherStudents.filter((student) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    const status = payment ? payment.status : student.status === 'exempt' ? 'exempt' : 'unpaid';
    return status === 'unpaid';
  });

  const sortedPaid = sortStudentsByGradeAndName(paidStudents);
  const sortedUnpaid = sortStudentsByGradeAndName(unpaidStudents);

  const paidRows = sortedPaid.map((student, idx) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    return formatStudentRow(student, teacher, payment, idx);
  });

  const unpaidRows = sortedUnpaid.map((student, idx) => {
    const payment = payments.find((p) => p.studentId === student.id && p.month === month);
    return formatStudentRow(student, teacher, payment, idx);
  });

  const colWidths = [
    { wch: 5 }, { wch: 26 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 25 },
  ];

  const wsPaid = XLSX.utils.json_to_sheet(paidRows);
  wsPaid['!cols'] = colWidths;

  const wsUnpaid = XLSX.utils.json_to_sheet(unpaidRows);
  wsUnpaid['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsPaid, 'الطلاب الذين سددوا');
  XLSX.utils.book_append_sheet(workbook, wsUnpaid, 'الطلاب الذين لم يسددوا');

  const cleanTeacherName = teacher.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
  XLSX.writeFile(workbook, `تقرير_سداد_شامل_${cleanTeacherName}_${month}.xlsx`);
}

