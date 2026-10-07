import React, { useState } from 'react';
import { useCenter } from '../../store/CenterContext';
import { OverviewCards } from './OverviewCards';
import { TeacherCard } from './TeacherCard';
import { Teacher } from '../../types';
import { TeacherModal } from '../modals/TeacherModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { formatMonthName } from '../../lib/utils';
import {
  Plus,
  GraduationCap,
  Sparkles,
  Trash2,
  RotateCcw,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { data, selectedMonth, resetToEmpty, resetToSeed } = useCenter();

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);

  const handleOpenAddTeacher = () => {
    setTeacherToEdit(null);
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setTeacherToEdit(teacher);
    setIsTeacherModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>لوحة تاجان</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              أهلاً بكِ في لوحة تاجان 👋
            </h1>
            <p className="text-sm text-indigo-100/90 max-w-xl leading-relaxed">
              متابعة حسابات المدرسين والصفوف الدراسية ومتابعة تحصيل الاشتراكات لشهر{' '}
              <strong className="text-white underline decoration-amber-400">
                {formatMonthName(selectedMonth)}
              </strong>
              ، ابتداءً من شهر أغسطس الماضي وحتى الآن.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAddTeacher}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-xs transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>إضافة مدرس جديد</span>
            </button>

            {data.teachers.length > 0 ? (
              <button
                type="button"
                onClick={() => setIsWipeConfirmOpen(true)}
                title="تفريغ السيستم للبدء ببياناتكِ الحقيقية"
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-amber-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ابدأي من الصفر</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSeedConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-emerald-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl border border-white/10 transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تحميل الداتا التجريبية</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Center Overview KPI Cards */}
      <section aria-label="أرقام السنتر الإجمالية">
        <OverviewCards />
      </section>



      {/* Teachers Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              كادر المدرسين ({data.teachers.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            اضغطي على أي مدرس لفتح صفوفه وطلابه وتسجيل الدفع
          </span>
        </div>

        {data.teachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              السنتر جاهز وفارغ الآن لإدخال بياناتكِ الحقيقية
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              أضيفي أول مدرس لتحددي مادته وسعر اشتراكه الشهري، ثم ابدئي بتسجيل الطلاب في سنواتهم الدراسية مباشرة.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddTeacher}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
              >
                إضافة أول مدرس الآن
              </button>
              <button
                type="button"
                onClick={() => setIsSeedConfirmOpen(true)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                أو استرجعي الداتا التجريبية
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                onEdit={handleOpenEditTeacher}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <TeacherModal
        isOpen={isTeacherModalOpen}
        teacherToEdit={teacherToEdit}
        onClose={() => {
          setIsTeacherModalOpen(false);
          setTeacherToEdit(null);
        }}
      />

      <ConfirmModal
        isOpen={isWipeConfirmOpen}
        title="تأكيد تفريغ السنتر للبدء من الصفر"
        message="هل ترغبين في مسح البيانات التجريبية لتسجيل بيانات المدرسين والطلاب الحقيقيين بنفسكِ؟"
        confirmLabel="نعم، ابدأ من الصفر"
        cancelLabel="إلغاء"
        isDestructive={true}
        onConfirm={() => {
          resetToEmpty();
          setIsWipeConfirmOpen(false);
        }}
        onCancel={() => setIsWipeConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isSeedConfirmOpen}
        title="استعادة البيانات التجريبية"
        message="هل ترغبين في إعادة تحميل المدرسين الـ ٥ وطلابهم التجريبيين؟"
        confirmLabel="نعم، حمّل البيانات التجريبية"
        cancelLabel="إلغاء"
        isDestructive={false}
        onConfirm={() => {
          resetToSeed();
          setIsSeedConfirmOpen(false);
        }}
        onCancel={() => setIsSeedConfirmOpen(false)}
      />

    </div>
  );
};
