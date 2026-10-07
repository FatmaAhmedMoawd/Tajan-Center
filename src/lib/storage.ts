import { CenterData } from '../types';
import { createSeedData } from './seed';
import { formatBytesAr } from './utils';

/**
 * مفتاح التخزين الموحد والثابت للنظام
 * ممنوع تغييره للحفاظ على بقاء البيانات واستقرارها
 */
export const STORAGE_KEY = 'center-system:v1';
export const HAS_EVER_HAD_DATA_KEY = 'center-system:hasEverHadData';
const LEGACY_STORAGE_KEYS = ['center-system:v8', 'center-system'];

export interface SaveResult {
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface StorageDiagnostics {
  isAvailable: boolean;
  storageKey: string;
  hasEverHadData: boolean;
  rawBytes: number;
  formattedSize: string;
  teacherCount: number;
  studentCount: number;
  paymentCount: number;
  unlockedMonthsCount: number;
  lastUpdated: string | null;
  totalKeysInStorage: number;
}

/**
 * فحص هل التخزين المحلي متاح ويعمل بدون قيود (مثل مشاكل الـ Private Mode أو امتلاء الذاكرة)
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const testKey = '__center_storage_test__';
    window.localStorage.setItem(testKey, '1');
    const read = window.localStorage.getItem(testKey);
    window.localStorage.removeItem(testKey);
    return read === '1';
  } catch {
    return false;
  }
}

/**
 * قراءة البيانات من localStorage
 * ١. لا تكتب أي شيء إذا كانت البيانات موجودة بالفعل.
 * ٢. تهاجر أي بيانات قديمة كانت مخزنة في مفاتيح سابقة إن وجدت.
 * ٣. لا تحمّل الداتا التجريبية إلا إذا كان التخزين فارغاً تماماً ولم يسبق تسجيل علامة hasEverHadData.
 */
export function loadDataFromStorage(): CenterData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);

    // التحقق من وجود بيانات قديمة للهجرة إن لم يكن المفتاح الرئيسي موجوداً
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = window.localStorage.getItem(legacyKey);
        if (legacyRaw) {
          try {
            const parsedLegacy = JSON.parse(legacyRaw);
            if (
              parsedLegacy &&
              Array.isArray(parsedLegacy.teachers) &&
              (parsedLegacy.teachers.length > 0 || parsedLegacy.students?.length > 0)
            ) {
              raw = legacyRaw;
              // ترحيل البيانات فوراً للمفتاح الجديد الثابت
              window.localStorage.setItem(STORAGE_KEY, legacyRaw);
              window.localStorage.setItem(HAS_EVER_HAD_DATA_KEY, 'true');
              break;
            }
          } catch {
            // تجاهل أي مفتاح قديم تالف
          }
        }
      }
    }

    // إذا وُجدت بيانات في التخزين، نقوم بفكها والتحقق من سلامتها
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CenterData>;
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.teachers) &&
        Array.isArray(parsed.students) &&
        Array.isArray(parsed.payments)
      ) {
        // تأكيد علامة وجود بيانات سابقة
        window.localStorage.setItem(HAS_EVER_HAD_DATA_KEY, 'true');

        return {
          version: 1,
          teachers: parsed.teachers,
          students: parsed.students,
          payments: parsed.payments,
          unlockedMonths:
            Array.isArray(parsed.unlockedMonths) && parsed.unlockedMonths.length > 0
              ? parsed.unlockedMonths
              : ['2026-08', '2026-09'],
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      } else {
        console.warn('بيانات التخزين المحلي غير مكتملة التركيب، سيتم الحفاظ عليها دون مسح.');
      }
    }

    // إذا كان التخزين فارغاً تماماً:
    const hasEverHadData = window.localStorage.getItem(HAS_EVER_HAD_DATA_KEY) === 'true';

    if (hasEverHadData) {
      // المستخدمة مسحت البيانات من قبل وتريد البدء من الصفر
      // ممنوع إعادة تحميل الداتا التجريبية!
      return createEmptyData();
    } else {
      // أول تشغيل للنظام على الإطلاق: تحميل الداتا التجريبية
      const seed = createSeedData();
      saveDataToStorage(seed, { isInitialSeed: true });
      window.localStorage.setItem(HAS_EVER_HAD_DATA_KEY, 'true');
      return seed;
    }
  } catch (err) {
    console.error('فشل في قراءة بيانات التخزين المحلي:', err);
    // في حالة الخطأ، نرجع بيانات فارغة لحماية التطبيق من الانهيار دون الكتابة في التخزين
    return createEmptyData();
  }
}

/**
 * حفظ البيانات في localStorage
 * - حماية مشددة من الكتابة الفاضية: ممنوع استبدال بيانات موجودة بحالة فارغة إلا بتأكيد صريح (forceEmpty: true).
 * - تسجيل علامة hasEverHadData فوراً بعد أول حفظ فعلي.
 */
export function saveDataToStorage(
  data: CenterData,
  options?: { forceEmpty?: boolean; isInitialSeed?: boolean }
): SaveResult {
  const timestamp = new Date();

  if (typeof window === 'undefined') {
    return {
      success: false,
      error: 'بيئة المتصفح غير متوفرة (SSR)',
      timestamp,
    };
  }

  try {
    // فحص الحماية من الكتابة الفاضية (Rule #2)
    if (!options?.forceEmpty) {
      const isCandidateEmpty =
        (!data.teachers || data.teachers.length === 0) &&
        (!data.students || data.students.length === 0);

      if (isCandidateEmpty) {
        // نتحقق مما إذا كان هناك بيانات مسجلة مسبقاً في التخزين
        const currentRaw = window.localStorage.getItem(STORAGE_KEY);
        if (currentRaw) {
          try {
            const currentParsed = JSON.parse(currentRaw) as Partial<CenterData>;
            const hasExistingContent =
              (currentParsed.teachers && currentParsed.teachers.length > 0) ||
              (currentParsed.students && currentParsed.students.length > 0);

            if (hasExistingContent) {
              console.warn(
                'تم إيقاف محاولة الكتابة: منع استبدال بيانات موجودة في التخزين بحالة فارغة!'
              );
              return {
                success: false,
                error: 'تم منع استبدال البيانات بحالة فارغة لحماية بياناتك من الضياع',
                timestamp,
              };
            }
          } catch {
            // فشل تحليل البيانات القديمة
          }
        }
      }
    }

    const payload: CenterData = {
      version: 1,
      teachers: data.teachers || [],
      students: data.students || [],
      payments: data.payments || [],
      unlockedMonths:
        Array.isArray(data.unlockedMonths) && data.unlockedMonths.length > 0
          ? data.unlockedMonths
          : ['2026-08', '2026-09'],
      updatedAt: timestamp.toISOString(),
    };

    const jsonString = JSON.stringify(payload);
    window.localStorage.setItem(STORAGE_KEY, jsonString);
    window.localStorage.setItem(HAS_EVER_HAD_DATA_KEY, 'true');

    return {
      success: true,
      timestamp,
    };
  } catch (err) {
    console.error('فشل حفظ البيانات في التخزين المحلي:', err);
    return {
      success: false,
      error: (err as Error)?.message || 'فشل الحفظ في ذاكرة المتصفح (قد تكون المساحة ممتلئة)',
      timestamp,
    };
  }
}

/**
 * تفريغ شامل للبيانات للبدء من الصفر
 * يضع بيانات فارغة ويضع علامة hasEverHadData = true حتى لا تعود الداتا التجريبية عند التحديث
 */
export function clearAllStorageData(): CenterData {
  const empty = createEmptyData();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      window.localStorage.setItem(HAS_EVER_HAD_DATA_KEY, 'true');
    } catch (err) {
      console.error('فشل تفريغ البيانات في التخزين المحلي:', err);
    }
  }
  return empty;
}

/**
 * إعادة تحميل الداتا التجريبية مع حفظها وتأكيدها في التخزين
 */
export function restoreSeedData(): CenterData {
  const seed = createSeedData();
  saveDataToStorage(seed, { isInitialSeed: true });
  return seed;
}

/**
 * تشخيص حالة التخزين المحلي وحجم البيانات المحفوظة (Rule #8)
 */
export function getStorageDiagnostics(): StorageDiagnostics {
  if (typeof window === 'undefined') {
    return {
      isAvailable: false,
      storageKey: STORAGE_KEY,
      hasEverHadData: false,
      rawBytes: 0,
      formattedSize: '0 بايت',
      teacherCount: 0,
      studentCount: 0,
      paymentCount: 0,
      unlockedMonthsCount: 0,
      lastUpdated: null,
      totalKeysInStorage: 0,
    };
  }

  const isAvailable = isLocalStorageAvailable();
  let rawBytes = 0;
  let teacherCount = 0;
  let studentCount = 0;
  let paymentCount = 0;
  let unlockedMonthsCount = 0;
  let lastUpdated: string | null = null;
  const hasEverHadData = window.localStorage.getItem(HAS_EVER_HAD_DATA_KEY) === 'true';

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      // قياس دقيق لحجم الـ JSON بالبايت
      rawBytes = new Blob([raw]).size;
      const parsed = JSON.parse(raw) as Partial<CenterData>;
      if (parsed) {
        teacherCount = Array.isArray(parsed.teachers) ? parsed.teachers.length : 0;
        studentCount = Array.isArray(parsed.students) ? parsed.students.length : 0;
        paymentCount = Array.isArray(parsed.payments) ? parsed.payments.length : 0;
        unlockedMonthsCount = Array.isArray(parsed.unlockedMonths)
          ? parsed.unlockedMonths.length
          : 0;
        lastUpdated = parsed.updatedAt || null;
      }
    }
  } catch (err) {
    console.error('خطأ أثناء تشخيص التخزين:', err);
  }

  return {
    isAvailable,
    storageKey: STORAGE_KEY,
    hasEverHadData,
    rawBytes,
    formattedSize: formatBytesAr(rawBytes),
    teacherCount,
    studentCount,
    paymentCount,
    unlockedMonthsCount,
    lastUpdated,
    totalKeysInStorage: window.localStorage.length,
  };
}

/**
 * تصدير البيانات إلى نص JSON
 */
export function exportDataJSON(data: CenterData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * تنزيل ملف نسخة احتياطية على جهاز المستخدمة
 */
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

/**
 * التحقق من صحة ملف النسخة الاحتياطية المستورد
 */
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
      version: 1,
      teachers: parsed.teachers,
      students: parsed.students,
      payments: parsed.payments,
      unlockedMonths:
        Array.isArray(parsed.unlockedMonths) && parsed.unlockedMonths.length > 0
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

/**
 * إنشاء كائن بيانات فارغ تماماً ونظيف
 */
export function createEmptyData(): CenterData {
  return {
    version: 1,
    teachers: [],
    students: [],
    payments: [],
    unlockedMonths: ['2026-08', '2026-09'],
    updatedAt: new Date().toISOString(),
  };
}
