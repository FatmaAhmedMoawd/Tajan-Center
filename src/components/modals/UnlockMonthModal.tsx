import React from 'react';
import { useCenter } from '../../store/CenterContext';
import { formatMonthName, formatNumber } from '../../lib/utils';
import { Unlock, X, CheckCircle2, Users, AlertCircle, Sparkles } from 'lucide-react';

interface UnlockMonthModalProps {
  isOpen: boolean;
  targetMonth: { value: string; label: string } | null;
  onClose: () => void;
}

export const UnlockMonthModal: React.FC<UnlockMonthModalProps> = ({
  isOpen,
  targetMonth,
  onClose,
}) => {
  const { data, unlockMonth } = useCenter();

  if (!isOpen || !targetMonth) return null;

  const handleConfirmUnlock = () => {
    unlockMonth(targetMonth.value);
    onClose();
  };

  const studentCount = data.students.length;
  const teacherCount = data.teachers.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-l from-indigo-50/80 to-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                فتح وتفعيل شهر جديد
              </h3>
              <p className="text-xs text-indigo-700 font-semibold">
                {targetMonth.label}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">ماذا يحدث عند تفعيل {targetMonth.label}؟</p>
              <ul className="mt-1.5 space-y-1 list-disc list-inside text-amber-800">
                <li>يصبح الشهر نشطاً ومتاحاً في القائمة فوراً.</li>
                <li>
                  ينتقل إليه جميع المدرسين ({formatNumber(teacherCount)}) والطلاب ({formatNumber(studentCount)}) تلقائياً.
                </li>
                <li>
                  تكون حالة الدفع لجميع الطلاب في هذا الشهر الجديد <strong>فارغة تماماً (لم يدفع أي طالب بعد)</strong>.
                </li>
                <li>سجلات الأشهر السابقة (أغسطس وسبتمبر) تظل محفوظة ومؤمنة دون أي تغيير.</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>إجمالي الطلاب الجاهزين للانتقال:</span>
            </span>
            <span className="font-bold text-slate-900 tabular-nums">
              {formatNumber(studentCount)} طالب
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors min-h-[44px]"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirmUnlock}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <Unlock className="w-4 h-4" />
              <span>تأكيد تفعيل الشهر الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
