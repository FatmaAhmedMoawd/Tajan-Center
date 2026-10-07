import { CenterData } from '../types';
import { createSeedData } from './seed';

export const STORAGE_KEY = 'center-system:v8';

export function getInitialData(): CenterData {
  if (typeof window === 'undefined') {
    return createSeedData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      saveData(seed);
      return seed;
    }

    const parsed = JSON.parse(raw) as Partial<CenterData>;
    if (
      parsed &&
      Array.isArray(parsed.teachers) &&
      Array.isArray(parsed.students) &&
      Array.isArray(parsed.payments)
    ) {
      return {
        version: parsed.version || 8,
        teachers: parsed.teachers,
        students: parsed.students,
        payments: parsed.payments,
        unlockedMonths: Array.isArray(parsed.unlockedMonths) && parsed.unlockedMonths.length > 0
          ? parsed.unlockedMonths
          : ['2026-08', '2026-09'],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    } else {
      console.warn('Storage data corrupted, falling back to seed data');
      const seed = createSeedData();
      saveData(seed);
      return seed;
    }
  } catch (err) {
    console.error('Failed to load data from localStorage:', err);
    const seed = createSeedData();
    return seed;
  }
}

export function saveData(data: CenterData): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CenterData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('Failed to save data to localStorage:', err);
  }
}

export function exportDataJSON(data: CenterData): string {
  return JSON.stringify(data, null, 2);
}

export function downloadBackupFile(data: CenterData): void {
  const json = exportDataJSON(data);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `center-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateAndParseImport(jsonString: string): {
  success: boolean;
  data?: CenterData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'الملف لا يحتوي على كائن بيانات صالح' };
    }

    if (!Array.isArray(parsed.teachers)) {
      return { success: false, error: 'الملف يفتقد قائمة المدرسين (teachers)' };
    }
    if (!Array.isArray(parsed.students)) {
      return { success: false, error: 'الملف يفتقد قائمة الطلاب (students)' };
    }
    if (!Array.isArray(parsed.payments)) {
      return { success: false, error: 'الملف يفتقد سجلات المدفوعات (payments)' };
    }

    const validatedData: CenterData = {
      version: 8,
      teachers: parsed.teachers,
      students: parsed.students,
      payments: parsed.payments,
      unlockedMonths: Array.isArray(parsed.unlockedMonths) && parsed.unlockedMonths.length > 0
        ? parsed.unlockedMonths
        : ['2026-08', '2026-09'],
      updatedAt: new Date().toISOString(),
    };

    return { success: true, data: validatedData };
  } catch (err) {
    return {
      success: false,
      error: `فشل قراءة ملف JSON: ${(err as Error).message}`,
    };
  }
}

export function createEmptyData(): CenterData {
  return {
    version: 8,
    teachers: [],
    students: [],
    payments: [],
    unlockedMonths: ['2026-08', '2026-09'],
    updatedAt: new Date().toISOString(),
  };
}
