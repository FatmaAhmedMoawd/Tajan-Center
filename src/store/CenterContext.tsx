'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  CenterData,
  PaymentRecord,
  PaymentStatus,
  Student,
  Teacher,
} from '../types';
import {
  createEmptyData,
  loadDataFromStorage,
  saveDataToStorage,
  clearAllStorageData,
  restoreSeedData,
  STORAGE_KEY,
} from '../lib/storage';
import {
  generateId,
  getDefaultAppMonth,
  getTodayDateString,
  getMonthOptions,
} from '../lib/utils';
import { getDefaultFeeForGrade } from '../lib/constants';

export type ActiveNavTab = 'overview' | 'teacher' | 'stats' | 'settings';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface CenterContextType {
  data: CenterData;
  isHydrated: boolean;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  activeTeacherId: string | null;
  setActiveTeacherId: (id: string | null) => void;
  openTeacherView: (teacherId: string) => void;

  // Save tracking and diagnostics
  lastSavedAt: Date | null;
  saveStatus: SaveStatus;
  saveError: string | null;
  forceSave: () => void;

  // Teacher actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  // Student actions
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Payment actions
  setPaymentStatus: (
    studentId: string,
    month: string,
    status: PaymentStatus,
    amount?: number,
    paidAt?: string
  ) => void;
  setPaymentDate: (
    studentId: string,
    month: string,
    paidAt: string
  ) => void;

  // Month unlocking & status
  unlockedMonths: string[];
  isMonthUnlocked: (month: string) => boolean;
  unlockMonth: (month: string) => void;
  getNextMonthToUnlock: () => { value: string; label: string } | null;

  // Global resets & import
  resetToEmpty: () => void;
  resetToSeed: () => void;
  importData: (newData: CenterData) => void;
}

const CenterContext = createContext<CenterContextType | null>(null);

export const CenterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // حالة البيانات تبدأ بكائن فارغ آمن حتى يكتمل التحميل
  const [data, setData] = useState<CenterData>(createEmptyData);
  // Rule #1: isHydrated تبدأ بـ false صراحةً، وممنوع الحفظ طالما هي false
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);

  // مرجع للبيانات الحالية للوصول إليها في أحداث visibilitychange و pagehide
  const dataRef = useRef<CenterData>(data);
  dataRef.current = data;

  // مؤشرات الحفظ في الترويسة
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // الشهر المحدد (يبدأ افتراضياً بشهر 9 - سبتمبر)
  const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultAppMonth);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('overview');
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);

  // ١. التحميل أولاً: اقرأ البيانات من localStorage قبل أي كتابة
  useEffect(() => {
    try {
      const loaded = loadDataFromStorage();
      const finalData = loaded || createEmptyData();

      setData(finalData);
      dataRef.current = finalData;
      setIsHydrated(true);
      isHydratedRef.current = true;

      if (finalData.updatedAt) {
        setLastSavedAt(new Date(finalData.updatedAt));
      } else {
        setLastSavedAt(new Date());
      }
      setSaveStatus('saved');
    } catch (err) {
      console.error('فشل في تحميل البيانات الأولية:', err);
      setIsHydrated(true);
      isHydratedRef.current = true;
      setSaveStatus('error');
      setSaveError('تعذر قراءة البيانات من المتصفح');
    }
  }, []);

  // دالة الحفظ المركزية والآمنة
  const persistData = useCallback((nextData: CenterData, forceEmpty = false) => {
    // ممنوع الحفظ طالما isHydrated تساوي false (Rule #1)
    if (!isHydratedRef.current) {
      console.warn('تم منع الحفظ: لا تزال عملية التحميل (hydration) جارية.');
      return;
    }

    setSaveStatus('saving');
    const result = saveDataToStorage(nextData, { forceEmpty });

    if (result.success) {
      setLastSavedAt(result.timestamp);
      setSaveStatus('saved');
      setSaveError(null);
    } else {
      setSaveStatus('error');
      setSaveError(result.error || 'فشل حفظ البيانات في المتصفح');
      console.error('فشل الحفظ:', result.error);
    }
  }, []);

  // دالة تحديث الحالة والحفظ فوراً مع منع الازدواجية
  const updateAndPersist = useCallback(
    (updater: (prev: CenterData) => CenterData, forceEmpty = false) => {
      if (!isHydratedRef.current) return;

      setData((prev) => {
        const next = updater(prev);
        dataRef.current = next;
        // الحفظ الفوري المباشر بعد التعديل (Rule #3)
        persistData(next, forceEmpty);
        return next;
      });
    },
    [persistData]
  );

  // Rule #3: الحفظ عند حدث visibilitychange و pagehide و beforeunload
  useEffect(() => {
    if (!isHydrated) return;

    const handleFlush = () => {
      if (isHydratedRef.current && dataRef.current) {
        saveDataToStorage(dataRef.current);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleFlush);
    window.addEventListener('beforeunload', handleFlush);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleFlush);
      window.removeEventListener('beforeunload', handleFlush);
    };
  }, [isHydrated]);

  // مزامنة التغييرات بين النوافذ والتابات المختلفة تلقائياً
  useEffect(() => {
    if (!isHydrated) return;

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && Array.isArray(parsed.teachers) && Array.isArray(parsed.students)) {
            setData(parsed);
            dataRef.current = parsed;
            if (parsed.updatedAt) {
              setLastSavedAt(new Date(parsed.updatedAt));
            }
          }
        } catch {
          // تجاهل الخطأ
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, [isHydrated]);

  // إتاحة حفظ يدوي للمستخدمة
  const forceSave = useCallback(() => {
    if (isHydratedRef.current && dataRef.current) {
      persistData(dataRef.current);
    }
  }, [persistData]);

  const openTeacherView = useCallback((teacherId: string) => {
    setActiveTeacherId(teacherId);
    setActiveTab('teacher');
  }, []);

  // عمليات المدرسين
  const addTeacher = useCallback(
    (newTeacherData: Omit<Teacher, 'id'>): Teacher => {
      const newTeacher: Teacher = {
        ...newTeacherData,
        id: `teacher-${generateId()}`,
      };
      updateAndPersist((prev) => ({
        ...prev,
        teachers: [newTeacher, ...prev.teachers],
      }));
      return newTeacher;
    },
    [updateAndPersist]
  );

  const updateTeacher = useCallback(
    (id: string, updates: Partial<Teacher>) => {
      updateAndPersist((prev) => ({
        ...prev,
        teachers: prev.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [updateAndPersist]
  );

  const deleteTeacher = useCallback(
    (id: string) => {
      updateAndPersist((prev) => {
        const remainingTeachers = prev.teachers.filter((t) => t.id !== id);
        const remainingStudents = prev.students.filter((s) => s.teacherId !== id);
        const removedStudentIds = new Set(
          prev.students.filter((s) => s.teacherId === id).map((s) => s.id)
        );
        const remainingPayments = prev.payments.filter(
          (p) => !removedStudentIds.has(p.studentId)
        );

        return {
          ...prev,
          teachers: remainingTeachers,
          students: remainingStudents,
          payments: remainingPayments,
        };
      });

      if (activeTeacherId === id) {
        setActiveTeacherId(null);
        setActiveTab('overview');
      }
    },
    [activeTeacherId, updateAndPersist]
  );

  // عمليات الطلاب
  const addStudent = useCallback(
    (newStudentData: Omit<Student, 'id' | 'createdAt'>): Student => {
      const newStudent: Student = {
        ...newStudentData,
        id: `std-${generateId()}`,
        monthlyFee: newStudentData.monthlyFee ?? getDefaultFeeForGrade(newStudentData.grade),
        createdAt: new Date().toISOString(),
      };
      updateAndPersist((prev) => ({
        ...prev,
        students: [newStudent, ...prev.students],
      }));
      return newStudent;
    },
    [updateAndPersist]
  );

  const updateStudent = useCallback(
    (id: string, updates: Partial<Student>) => {
      updateAndPersist((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    },
    [updateAndPersist]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      updateAndPersist((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id),
        payments: prev.payments.filter((p) => p.studentId !== id),
      }));
    },
    [updateAndPersist]
  );

  // عمليات المدفوعات السريعة
  const setPaymentStatus = useCallback(
    (
      studentId: string,
      month: string,
      status: PaymentStatus,
      amount?: number,
      paidAt?: string
    ) => {
      updateAndPersist((prev) => {
        const student = prev.students.find((s) => s.id === studentId);
        const teacher = student
          ? prev.teachers.find((t) => t.id === student.teacherId)
          : undefined;

        const defaultFee = student
          ? student.monthlyFee ?? getDefaultFeeForGrade(student.grade)
          : teacher?.monthlyFee ?? 80;

        const resolvedAmount =
          amount !== undefined
            ? amount
            : status === 'paid' || status === 'cash_to_teacher'
            ? defaultFee
            : 0;

        const existingIndex = prev.payments.findIndex(
          (p) => p.studentId === studentId && p.month === month
        );

        const isPaying = status === 'paid' || status === 'cash_to_teacher';
        const existingPaidAt = existingIndex >= 0 ? prev.payments[existingIndex].paidAt : undefined;
        const effectivePaidAt = isPaying
          ? paidAt || existingPaidAt || getTodayDateString()
          : undefined;

        let newPayments: PaymentRecord[];

        if (existingIndex >= 0) {
          newPayments = [...prev.payments];
          newPayments[existingIndex] = {
            studentId,
            month,
            status,
            amount: resolvedAmount,
            paidAt: effectivePaidAt,
          };
        } else {
          newPayments = [
            ...prev.payments,
            {
              studentId,
              month,
              status,
              amount: resolvedAmount,
              paidAt: effectivePaidAt,
            },
          ];
        }

        return {
          ...prev,
          payments: newPayments,
        };
      });
    },
    [updateAndPersist]
  );

  const setPaymentDate = useCallback(
    (studentId: string, month: string, paidAt: string) => {
      updateAndPersist((prev) => {
        const existingIndex = prev.payments.findIndex(
          (p) => p.studentId === studentId && p.month === month
        );

        if (existingIndex >= 0) {
          const newPayments = [...prev.payments];
          newPayments[existingIndex] = {
            ...newPayments[existingIndex],
            paidAt,
          };
          return {
            ...prev,
            payments: newPayments,
          };
        } else {
          const student = prev.students.find((s) => s.id === studentId);
          const defaultFee = student
            ? student.monthlyFee ?? getDefaultFeeForGrade(student.grade)
            : 80;

          return {
            ...prev,
            payments: [
              ...prev.payments,
              {
                studentId,
                month,
                status: 'paid',
                amount: defaultFee,
                paidAt,
              },
            ],
          };
        }
      });
    },
    [updateAndPersist]
  );

  // البدء من الصفر مع الحذف المؤكد
  const resetToEmpty = useCallback(() => {
    const empty = clearAllStorageData();
    dataRef.current = empty;
    setData(empty);
    setLastSavedAt(new Date());
    setSaveStatus('saved');
    setSaveError(null);
    setActiveTeacherId(null);
    setActiveTab('overview');
  }, []);

  // إعادة تحميل الداتا التجريبية
  const resetToSeed = useCallback(() => {
    const seed = restoreSeedData();
    dataRef.current = seed;
    setData(seed);
    setLastSavedAt(new Date());
    setSaveStatus('saved');
    setSaveError(null);
    setActiveTeacherId(null);
    setActiveTab('overview');
  }, []);

  // فتح وتفعيل الشهور
  const unlockedMonths =
    Array.isArray(data.unlockedMonths) && data.unlockedMonths.length > 0
      ? data.unlockedMonths
      : ['2026-08', '2026-09'];

  const isMonthUnlocked = useCallback(
    (month: string) => {
      return unlockedMonths.includes(month);
    },
    [unlockedMonths]
  );

  const getNextMonthToUnlock = useCallback(() => {
    const allMonths = getMonthOptions();
    for (const m of allMonths) {
      if (!unlockedMonths.includes(m.value)) {
        return m;
      }
    }
    return null;
  }, [unlockedMonths]);

  const unlockMonth = useCallback(
    (month: string) => {
      updateAndPersist((prev) => {
        const currentUnlocked =
          Array.isArray(prev.unlockedMonths) && prev.unlockedMonths.length > 0
            ? prev.unlockedMonths
            : ['2026-08', '2026-09'];

        if (currentUnlocked.includes(month)) return prev;

        const cleanPayments = prev.payments.filter((p) => p.month !== month);

        return {
          ...prev,
          unlockedMonths: [...currentUnlocked, month],
          payments: cleanPayments,
        };
      });
      setSelectedMonth(month);
    },
    [updateAndPersist]
  );

  const importData = useCallback(
    (newData: CenterData) => {
      persistData(newData, true);
      dataRef.current = newData;
      setData(newData);
    },
    [persistData]
  );

  return (
    <CenterContext.Provider
      value={{
        data,
        isHydrated,
        selectedMonth,
        setSelectedMonth,
        activeTab,
        setActiveTab,
        activeTeacherId,
        setActiveTeacherId,
        openTeacherView,
        lastSavedAt,
        saveStatus,
        saveError,
        forceSave,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addStudent,
        updateStudent,
        deleteStudent,
        setPaymentStatus,
        setPaymentDate,
        unlockedMonths,
        isMonthUnlocked,
        unlockMonth,
        getNextMonthToUnlock,
        resetToEmpty,
        resetToSeed,
        importData,
      }}
    >
      {children}
    </CenterContext.Provider>
  );
};

export function useCenter() {
  const context = useContext(CenterContext);
  if (!context) {
    throw new Error('useCenter must be used within a CenterProvider');
  }
  return context;
}
