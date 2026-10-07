import React, { useState, useEffect } from 'react';
import { Student, SubscriptionStatus } from '../../types';
import { useCenter } from '../../store/CenterContext';
import { X, User, Phone, GraduationCap, AlertCircle, Banknote } from 'lucide-react';
import { SUBSCRIPTION_STATUS_MAP, GRADES, getDefaultFeeForGrade } from '../../lib/constants';

interface StudentModalProps {
  isOpen: boolean;
  studentToEdit?: Student | null;
  defaultTeacherId?: string;
  defaultGrade?: string;
  onClose: () => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  studentToEdit,
  defaultTeacherId,
  defaultGrade,
  onClose,
}) => {
  const { data, addStudent, updateStudent } = useCenter();

  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [grade, setGrade] = useState<string>(GRADES[0]);
  const [monthlyFee, setMonthlyFee] = useState<number>(80);
  const [parentPhone, setParentPhone] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setName(studentToEdit.name);
      setTeacherId(studentToEdit.teacherId);
      setGrade(studentToEdit.grade);
      setMonthlyFee(studentToEdit.monthlyFee ?? getDefaultFeeForGrade(studentToEdit.grade));
      setParentPhone(studentToEdit.parentPhone || '');
      setStatus(studentToEdit.status);
      setNotes(studentToEdit.notes || '');
      setError('');
    } else {
      const initialTeacher =
        defaultTeacherId || (data.teachers.length > 0 ? data.teachers[0].id : '');
      const initialGrade = defaultGrade && GRADES.includes(defaultGrade as any)
        ? defaultGrade
        : GRADES[0];

      setName('');
      setTeacherId(initialTeacher);
      setGrade(initialGrade);
      setMonthlyFee(getDefaultFeeForGrade(initialGrade));
      setParentPhone('');
      setStatus('active');
      setNotes('');
      setError('');
    }
  }, [studentToEdit, defaultTeacherId, defaultGrade, data.teachers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('يرجى كتابة اسم الطالب ثلاثي أو ثنائي على الأقل');
      return;
    }

    if (!teacherId) {
      setError('يرجى اختيار المدرس التابع له الطالب');
      return;
    }

    if (!grade) {
      setError('يرجى اختيار السنة الدراسية');
      return;
    }

    const finalFee = Number(monthlyFee) > 0 ? Number(monthlyFee) : getDefaultFeeForGrade(grade);

    if (studentToEdit) {
      updateStudent(studentToEdit.id, {
        name: name.trim(),
        teacherId,
        grade,
        parentPhone: parentPhone.trim() || undefined,
        status,
        monthlyFee: finalFee,
        notes: notes.trim() || undefined,
      });
    } else {
      addStudent({
        name: name.trim(),
        teacherId,
        grade,
        parentPhone: parentPhone.trim() || undefined,
        status,
        monthlyFee: finalFee,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {studentToEdit ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
              </h2>
              <p className="text-xs text-slate-500">
                {studentToEdit
                  ? 'تحديث الاسم والسنة وتليفون ولي الأمر'
                  : 'تسجيل طالب في قائمة المدرس والسنة الدراسية'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Student Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              اسم الطالب <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: يوسف إبراهيم محمد"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
          </div>

          {/* 2. Teacher and Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                المدرس <span className="text-rose-500">*</span>
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
              >
                {data.teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>السنة الدراسية</span> <span className="text-rose-500">*</span>
              </label>
              <select
                value={grade}
                onChange={(e) => {
                  const newGrade = e.target.value;
                  setGrade(newGrade);
                  setMonthlyFee(getDefaultFeeForGrade(newGrade));
                }}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-bold"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g} ({getDefaultFeeForGrade(g)} ج.م)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Monthly Fee (Auto 80 primary, 100 prep, customizable) */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>قيمة الاشتراك الشهري للطالب</span> <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300/80">
                تلقائي: {getDefaultFeeForGrade(grade)} ج.م ({grade.includes('إعدادي') ? 'إعدادي' : 'ابتدائي'})
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={5}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-bold tabular-nums"
              />
              <span className="absolute left-3.5 top-2 text-xs text-slate-500 font-semibold pointer-events-none">
                جنيه مصري
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              يتحدد تلقائياً ٨٠ ج.م للابتدائي (٣، ٤، ٥، ٦)، و ١٠٠ ج.م للإعدادي (١، ٢)، ويمكنكِ تعديل المبلغ يدوياً في أي وقت.
            </p>
          </div>

          {/* 3. Parent Phone Only */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>تليفون ولي الأمر</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                dir="ltr"
                className="w-full text-left pl-3.5 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-mono"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 4. Subscription Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              حالة اشتراك الطالب
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['active', 'withdrawn', 'dropped', 'exempt'] as SubscriptionStatus[]).map(
                (stKey) => {
                  const meta = SUBSCRIPTION_STATUS_MAP[stKey];
                  const isSelected = status === stKey;
                  return (
                    <button
                      type="button"
                      key={stKey}
                      onClick={() => setStatus(stKey)}
                      className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                        isSelected
                          ? `${meta.bgClass} ${meta.textClass} border-indigo-400 ring-2 ring-indigo-200 shadow-xs font-bold`
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 5. Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ملاحظات إضافية
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: خصم إخوة، توصيات خاصة..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[44px]"
            >
              {studentToEdit ? 'حفظ التعديلات' : 'إضافة الطالب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
