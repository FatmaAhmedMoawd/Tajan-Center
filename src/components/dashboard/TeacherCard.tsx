import React, { useState } from 'react';
import { Teacher } from '../../types';
import { useCenter } from '../../store/CenterContext';
import { calculateStats } from '../../lib/stats';
import { formatCurrency, formatNumber, formatMonthName } from '../../lib/utils';
import {
  exportTeacherFullMonthlyReport,
  exportTeacherPaidExcel,
  exportTeacherUnpaidExcel,
} from '../../lib/excel';
import { ChevronLeft, Users, Banknote, Phone, FileSpreadsheet, Download } from 'lucide-react';

interface TeacherCardProps {
  teacher: Teacher;
  onEdit: (teacher: Teacher) => void;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, onEdit }) => {
  const { data, selectedMonth, openTeacherView } = useCenter();
  const [showExcelMenu, setShowExcelMenu] = useState(false);

  const teacherStudents = data.students.filter((s) => s.teacherId === teacher.id);

  const stats = calculateStats(data, {
    teacherId: teacher.id,
    month: selectedMonth,
  });

  const totalPaid = stats.paidCount + stats.cashToTeacherCount;
  const payPercentage =
    stats.activeCount > 0 ? Math.min(100, Math.round((totalPaid / stats.activeCount) * 100)) : 0;

  const handleExportFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportTeacherFullMonthlyReport(teacher, data.students, data.payments, selectedMonth);
    setShowExcelMenu(false);
  };

  const handleExportPaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportTeacherPaidExcel(teacher, data.students, data.payments, selectedMonth);
    setShowExcelMenu(false);
  };

  const handleExportUnpaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    exportTeacherUnpaidExcel(teacher, data.students, data.payments, selectedMonth);
    setShowExcelMenu(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col group relative">
      {/* Top Color Accent Line */}
      <div className="h-2 w-full" style={{ backgroundColor: teacher.color }} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: teacher.color }}
                />
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {teacher.name}
                </h3>
              </div>
              <p className="mt-1 text-xs font-semibold text-slate-600 mr-5">
                {teacher.subject}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(teacher);
                }}
                className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                تعديل
              </button>
            </div>
          </div>

          {/* Teacher Phone */}
          {teacher.phone && (
            <div className="mt-2.5 mr-5 flex items-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr" className="font-mono text-[11px]">{teacher.phone}</span>
            </div>
          )}

          {/* Counts & Fee */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-xl">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-900 tabular-nums">{formatNumber(teacherStudents.length)}</strong> طالب
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 p-2 rounded-xl">
              <Banknote className="w-4 h-4 text-teal-500 shrink-0" />
              <span>
                اشتراك: <strong className="text-slate-900 tabular-nums">{formatCurrency(teacher.monthlyFee || 180)}</strong>
              </span>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">
                سداد {formatMonthName(selectedMonth).split(' ')[0]}:{' '}
                <strong className="text-slate-800 tabular-nums">{formatNumber(totalPaid)}</strong> / {formatNumber(stats.activeCount)}
              </span>
              <span className="font-semibold tabular-nums text-slate-700">
                %{payPercentage}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 rounded-r-full transition-all duration-300"
                style={{ width: `${payPercentage}%` }}
                title={`تم السداد: ${totalPaid}`}
              />
              <div
                className="h-full bg-rose-400 rounded-l-full transition-all duration-300"
                style={{ width: `${100 - payPercentage}%` }}
                title={`لم يسدد: ${stats.unpaidCount}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>مُحصّل: <strong className="text-teal-700 tabular-nums">{formatCurrency(stats.collectedAmount)}</strong></span>
              <span>متبقي: <strong className="text-amber-700 tabular-nums">{formatCurrency(stats.remainingAmount)}</strong></span>
            </div>
          </div>

          {/* Excel Export Strip */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>إكسيل ({formatMonthName(selectedMonth).split(' ')[0]}):</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExportFull}
                title="تنزيل شيتين: مسددين وغير مسددين"
                className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>شامل</span>
              </button>
              <button
                type="button"
                onClick={handleExportPaid}
                title="تنزيل الطلاب الذين سددوا فقط"
                className="px-2 py-1 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
              >
                دفعوا ({formatNumber(totalPaid)})
              </button>
              <button
                type="button"
                onClick={handleExportUnpaid}
                title="تنزيل الطلاب الذين لم يسددوا فقط"
                className="px-2 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                لم يدفعوا ({formatNumber(stats.unpaidCount)})
              </button>
            </div>
          </div>
        </div>

        {/* Enter Teacher Page */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => openTeacherView(teacher.id)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl text-white shadow-xs transition-all min-h-[44px] hover:opacity-95"
            style={{ backgroundColor: teacher.color }}
          >
            <span>فتح صفوف وطلاب المدرس</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
