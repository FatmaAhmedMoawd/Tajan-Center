import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  CenterData,
  PaymentRecord,
  PaymentStatus,
  Student,
  Teacher,
} from '../types';
import {
  createEmptyData,
  getInitialData,
  saveData,
} from '../lib/storage';
import { createSeedData } from '../lib/seed';
import { generateId, getDefaultAppMonth, getTodayDateString, getMonthOptions } from '../lib/utils';
import { getDefaultFeeForGrade } from '../lib/constants';

export type ActiveNavTab = 'overview' | 'teacher' | 'stats' | 'settings';

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
  const [data, setData] = useState<CenterData>(getInitialData);
  const [isHydrated, setIsHydrated] = useState(false);
  // Default opening month is strictly September (شهر 9) as requested
  const [selectedMonth, setSelectedMonth] = useState<string>(getDefaultAppMonth);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('overview');
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
    const loaded = getInitialData();
    setData(loaded);
  }, []);

  const updateStateAndPersist = useCallback((updater: (prev: CenterData) => CenterData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const openTeacherView = useCallback((teacherId: string) => {
    setActiveTeacherId(teacherId);
    setActiveTab('teacher');
  }, []);

  // Teacher actions
  const addTeacher = useCallback(
    (newTeacherData: Omit<Teacher, 'id'>): Teacher => {
      const newTeacher: Teacher = {
        ...newTeacherData,
        id: `teacher-${generateId()}`,
      };
      updateStateAndPersist((prev) => ({
        ...prev,
        teachers: [newTeacher, ...prev.teachers],
      }));
      return newTeacher;
    },
    [updateStateAndPersist]
  );

  const updateTeacher = useCallback(
    (id: string, updates: Partial<Teacher>) => {
      updateStateAndPersist((prev) => ({
        ...prev,
        teachers: prev.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [updateStateAndPersist]
  );

  const deleteTeacher = useCallback(
    (id: string) => {
      updateStateAndPersist((prev) => {
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
    [activeTeacherId, updateStateAndPersist]
  );

  // Student actions
  const addStudent = useCallback(
    (newStudentData: Omit<Student, 'id' | 'createdAt'>): Student => {
      const newStudent: Student = {
        ...newStudentData,
        id: `std-${generateId()}`,
        monthlyFee: newStudentData.monthlyFee ?? getDefaultFeeForGrade(newStudentData.grade),
        createdAt: new Date().toISOString(),
      };
      updateStateAndPersist((prev) => ({
        ...prev,
        students: [newStudent, ...prev.students],
      }));
      return newStudent;
    },
    [updateStateAndPersist]
  );

  const updateStudent = useCallback(
    (id: string, updates: Partial<Student>) => {
      updateStateAndPersist((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      }));
    },
    [updateStateAndPersist]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      updateStateAndPersist((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== id),
        payments: prev.payments.filter((p) => p.studentId !== id),
      }));
    },
    [updateStateAndPersist]
  );

  // Quick Payment status setter with automatic payment date
  const setPaymentStatus = useCallback(
    (
      studentId: string,
      month: string,
      status: PaymentStatus,
      amount?: number,
      paidAt?: string
    ) => {
      updateStateAndPersist((prev) => {
        const student = prev.students.find((s) => s.id === studentId);
        const teacher = student
          ? prev.teachers.find((t) => t.id === student.teacherId)
          : undefined;

        // Auto-calculate fee based on student's fee or grade rule
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
    [updateStateAndPersist]
  );

  // Dedicated Payment date editor
  const setPaymentDate = useCallback(
    (studentId: string, month: string, paidAt: string) => {
      updateStateAndPersist((prev) => {
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
    [updateStateAndPersist]
  );

  // Reset to empty state (البدء من الصفر)
  const resetToEmpty = useCallback(() => {
    const empty = createEmptyData();
    saveData(empty);
    setData(empty);
    setActiveTeacherId(null);
    setActiveTab('overview');
  }, []);

  // Reset to seed data
  const resetToSeed = useCallback(() => {
    const seed = createSeedData();
    saveData(seed);
    setData(seed);
    setActiveTeacherId(null);
    setActiveTab('overview');
  }, []);

  // Month unlocking methods
  const unlockedMonths = Array.isArray(data.unlockedMonths) && data.unlockedMonths.length > 0
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
      updateStateAndPersist((prev) => {
        const currentUnlocked =
          Array.isArray(prev.unlockedMonths) && prev.unlockedMonths.length > 0
            ? prev.unlockedMonths
            : ['2026-08', '2026-09'];

        if (currentUnlocked.includes(month)) return prev;

        // Clean out any stale payment records for this month so all students start as 'unpaid'
        const cleanPayments = prev.payments.filter((p) => p.month !== month);

        return {
          ...prev,
          unlockedMonths: [...currentUnlocked, month],
          payments: cleanPayments,
        };
      });
      setSelectedMonth(month);
    },
    [updateStateAndPersist]
  );

  const importData = useCallback((newData: CenterData) => {
    saveData(newData);
    setData(newData);
  }, []);

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
