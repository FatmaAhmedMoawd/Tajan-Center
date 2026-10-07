import React from 'react';
import { useCenter } from '../../store/CenterContext';
import { calculateStats } from '../../lib/stats';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { Users, CheckCircle2, Clock, Wallet, Banknote, Percent } from 'lucide-react';

export const OverviewCards: React.FC = () => {
  const { data, selectedMonth } = useCenter();

  const stats = calculateStats(data, { month: selectedMonth });

  const totalPaidStudents = stats.paidCount + stats.cashToTeacherCount;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Students */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">إجمالي الطلاب</span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">
          {formatNumber(stats.totalStudents)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>{formatNumber(stats.activeCount)} نشط</span>
          <span>·</span>
          <span>{formatNumber(stats.exemptStudentsCount)} معفي</span>
        </div>
      </div>

      {/* 2. Paid This Month */}
      <div className="bg-white rounded-2xl p-4 border border-emerald-200/90 shadow-xs hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-emerald-800">سددوا هذا الشهر</span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-700 tabular-nums">
          {formatNumber(totalPaidStudents)}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600">
          <span>{formatNumber(stats.paidCount)} سنتر</span>
          <span>·</span>
          <span>{formatNumber(stats.cashToTeacherCount)} كاش مستر</span>
        </div>
      </div>

      {/* 3. Unpaid This Month */}
      <div className="bg-white rounded-2xl p-4 border border-rose-200/90 shadow-xs hover:border-rose-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-rose-800">لم يسددوا بعد</span>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-600 tabular-nums">
          {formatNumber(stats.unpaidCount)}
        </div>
        <div className="mt-1 text-[11px] text-rose-500">
          {stats.activeCount > 0
            ? `${Math.round((stats.unpaidCount / stats.activeCount) * 100)}% من النشطين`
            : '0%'}
        </div>
      </div>

      {/* 4. Collected Amount */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">المبلغ المُحصّل</span>
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900 tabular-nums truncate">
          {formatCurrency(stats.collectedAmount)}
        </div>
        <div className="mt-1 text-[11px] text-teal-600 font-medium">
          تم تحصيل {stats.collectionRate}% من المستهدف
        </div>
      </div>

      {/* 5. Remaining Amount */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">المبلغ المتبقي</span>
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl font-bold text-amber-700 tabular-nums truncate">
          {formatCurrency(stats.remainingAmount)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          مستحق على المتأخرين
        </div>
      </div>

      {/* 6. Overall Collection Rate */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">نسبة التحصيل</span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-indigo-700 tabular-nums">
          %{stats.collectionRate}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">
          إجمالي المستهدف: {formatCurrency(stats.totalPotentialAmount)}
        </div>
      </div>
    </div>
  );
};
