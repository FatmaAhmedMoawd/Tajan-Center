import { PaymentStatus, SubscriptionStatus } from '../types';

export const GRADES = [
  'ثالثة ابتدائي',
  'رابعة ابتدائي',
  'خامسة ابتدائي',
  'سادسة ابتدائي',
  'أولى إعدادي',
  'ثانية إعدادي',
] as const;

export type GradeType = (typeof GRADES)[number];

/**
 * التسعير التلقائي للاشتراك حسب السنة الدراسية:
 * المرحلة الابتدائية (3، 4، 5، 6 ابتدائي) = 80 جنيه
 * المرحلة الإعدادية (1، 2 إعدادي) = 100 جنيه
 */
export function getDefaultFeeForGrade(grade: string): number {
  if (
    grade === 'ثالثة ابتدائي' ||
    grade === 'رابعة ابتدائي' ||
    grade === 'خامسة ابتدائي' ||
    grade === 'سادسة ابتدائي'
  ) {
    return 80;
  }
  if (grade === 'أولى إعدادي' || grade === 'ثانية إعدادي') {
    return 100;
  }
  return 80;
}

export const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
] as const;

export interface StatusMeta {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
}

export const SUBSCRIPTION_STATUS_MAP: Record<SubscriptionStatus, StatusMeta> = {
  active: {
    label: 'نشط',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  withdrawn: {
    label: 'سحب اشتراكه',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  dropped: {
    label: 'منقطع',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
  },
  exempt: {
    label: 'معفي',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
};

export const PAYMENT_STATUS_MAP: Record<PaymentStatus, StatusMeta> = {
  paid: {
    label: 'دفع (بالسنتر)',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-300',
  },
  cash_to_teacher: {
    label: 'دفع كاش للمستر',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-300',
    badgeClass: 'bg-teal-50 text-teal-700 border border-teal-300',
  },
  unpaid: {
    label: 'لم يدفع',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-300',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-300',
  },
  exempt: {
    label: 'معفي',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-600',
    borderClass: 'border-slate-300',
    badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300',
  },
};

export interface TeacherColorPreset {
  name: string;
  hex: string;
  bgLight: string;
  border: string;
  badge: string;
  text: string;
}

export const TEACHER_COLOR_PRESETS: TeacherColorPreset[] = [
  {
    name: 'أخضر زمردي',
    hex: '#059669',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-600',
  },
  {
    name: 'أزرق ملكي',
    hex: '#2563eb',
    bgLight: 'bg-blue-50',
    border: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-800',
    text: 'text-blue-600',
  },
  {
    name: 'برتقالي كهرماني',
    hex: '#d97706',
    bgLight: 'bg-amber-50',
    border: 'border-amber-500',
    badge: 'bg-amber-100 text-amber-800',
    text: 'text-amber-600',
  },
  {
    name: 'ياقوتي أحمر',
    hex: '#e11d48',
    bgLight: 'bg-rose-50',
    border: 'border-rose-500',
    badge: 'bg-rose-100 text-rose-800',
    text: 'text-rose-600',
  },
  {
    name: 'بنفسجي أرجواني',
    hex: '#7c3aed',
    bgLight: 'bg-purple-50',
    border: 'border-purple-500',
    badge: 'bg-purple-100 text-purple-800',
    text: 'text-purple-600',
  },
  {
    name: 'سماوي داكن',
    hex: '#0891b2',
    bgLight: 'bg-cyan-50',
    border: 'border-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800',
    text: 'text-cyan-600',
  },
];
