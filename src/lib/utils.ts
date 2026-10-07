/**
 * Helper utility functions for Egyptian Center Management System
 */

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ج.م';
  }
  return `${new Intl.NumberFormat('ar-EG').format(amount)} ج.م`;
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('ar-EG').format(num);
}

/**
 * Returns September (شهر 9) as the default opening month as explicitly requested
 */
export function getDefaultAppMonth(): string {
  const current = new Date();
  const year = current.getFullYear();
  return `${year}-09`;
}

export function getCurrentMonth(): string {
  return getDefaultAppMonth();
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM-DD to DD/MM (e.g. 2026-10-01 -> 01/10 or 1/10)
 */
export function formatDayMonth(dateStr?: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr || '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    return `${day}/${month}`;
  }
  return dateStr;
}

const MONTH_NAMES_AR: Record<string, string> = {
  '01': 'يناير (شهر ١)',
  '02': 'فبراير (شهر ٢)',
  '03': 'مارس (شهر ٣)',
  '04': 'أبريل (شهر ٤)',
  '05': 'مايو (شهر ٥)',
  '06': 'يونيو (شهر ٦)',
  '07': 'يوليو (شهر ٧)',
  '08': 'أغسطس (شهر ٨)',
  '09': 'سبتمبر (شهر ٩)',
  '10': 'أكتوبر (شهر ١٠)',
  '11': 'نوفمبر (شهر ١١)',
  '12': 'ديسمبر (شهر ١٢)',
};

export function formatMonthName(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split('-');
  const name = MONTH_NAMES_AR[monthNumStr] || monthNumStr;
  return `${name} ${yearStr}`;
}

export function formatDateArabic(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Returns academic year months starting strictly from August (شهر 8) as requested
 */
export function getMonthOptions(): { value: string; label: string }[] {
  const current = new Date();
  const currentYear = current.getFullYear();

  const academicMonths = [
    { value: `${currentYear}-08`, label: `أغسطس (شهر ٨) ${currentYear}` },
    { value: `${currentYear}-09`, label: `سبتمبر (شهر ٩) ${currentYear}` },
    { value: `${currentYear}-10`, label: `أكتوبر (شهر ١٠) ${currentYear}` },
    { value: `${currentYear}-11`, label: `نوفمبر (شهر ١١) ${currentYear}` },
    { value: `${currentYear}-12`, label: `ديسمبر (شهر ١٢) ${currentYear}` },
    { value: `${currentYear + 1}-01`, label: `يناير (شهر ١) ${currentYear + 1}` },
    { value: `${currentYear + 1}-02`, label: `فبراير (شهر ٢) ${currentYear + 1}` },
    { value: `${currentYear + 1}-03`, label: `مارس (شهر ٣) ${currentYear + 1}` },
    { value: `${currentYear + 1}-04`, label: `أبريل (شهر ٤) ${currentYear + 1}` },
    { value: `${currentYear + 1}-05`, label: `مايو (شهر ٥) ${currentYear + 1}` },
    { value: `${currentYear + 1}-06`, label: `يونيو (شهر ٦) ${currentYear + 1}` },
    { value: `${currentYear + 1}-07`, label: `يوليو (شهر ٧) ${currentYear + 1}` },
  ];

  return academicMonths;
}

export function formatTimeAr(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatBytesAr(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  if (bytes < 1024) return `${bytes} بايت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} كيلوبايت`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} ميجابايت`;
}
