import React, { useState, useMemo } from 'react';
import { useCenter } from '../../store/CenterContext';
import { calculateStats } from '../../lib/stats';
import {
  formatCurrency,
  formatNumber,
  formatMonthName,
  getMonthOptions,
} from '../../lib/utils';
import { GRADES } from '../../lib/constants';
import {
  BarChart3,
  Users,
  Wallet,
  CalendarCheck,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const StatsView: React.FC = () => {
  const { data, selectedMonth, setSelectedMonth } = useCenter();

  // Scope level
  const [scopeType, setScopeType] = useState<'center' | 'teacher' | 'grade'>('center');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    data.teachers[0]?.id || ''
  );
  const [selectedGrade, setSelectedGrade] = useState<string>(GRADES[0]);

  const monthOptions = getMonthOptions();

  // Calculated stats based on scope
  const stats = useMemo(() => {
    return calculateStats(data, {
      teacherId:
        scopeType === 'teacher'
          ? selectedTeacherId
          : undefined,
      grade:
        scopeType === 'grade'
          ? selectedGrade
          : undefined,
      month: selectedMonth,
    });
  }, [
    data,
    scopeType,
    selectedTeacherId,
    selectedGrade,
    selectedMonth,
  ]);

  // Payment donut data
  const paymentChartData = useMemo(() => {
    return [
      { name: 'دفع بالسنتر', value: stats.paidCount, color: '#10b981' },
      { name: 'كاش للمستر', value: stats.cashToTeacherCount, color: '#0d9488' },
      { name: 'لم يدفع', value: stats.unpaidCount, color: '#f43f5e' },
      { name: 'معفي', value: stats.exemptPaymentCount, color: '#94a3b8' },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Teacher comparative bar chart data
  const teacherComparisonData = useMemo(() => {
    return data.teachers.map((teacher) => {
      const teacherStat = calculateStats(data, {
        teacherId: teacher.id,
        month: selectedMonth,
      });
      return {
        name: teacher.name.replace('أستاذ ', '').slice(0, 12),
        fullName: teacher.name,
        students: teacherStat.totalStudents,
        collected: teacherStat.collectedAmount,
        remaining: teacherStat.remainingAmount,
        collectionRate: teacherStat.collectionRate,
        color: teacher.color,
      };
    });
  }, [data, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Scope and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">لوحة الإحصائيات الشاملة</h1>
              <p className="text-xs text-slate-500">
                تقارير وتحليلات المدفوعات والغياب ابتداءً من شهر أغسطس وحتى الآن
              </p>
            </div>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">الشهر:</span>
            <select
              aria-label="اختر الشهر الدراسي للإحصائيات"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scope Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 ml-2">نطاق الإحصاء:</span>
          <button
            type="button"
            onClick={() => setScopeType('center')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              scopeType === 'center'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            السنتر بالكامل
          </button>
          <button
            type="button"
            onClick={() => setScopeType('teacher')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              scopeType === 'teacher'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            حسب المدرس
          </button>
          <button
            type="button"
            onClick={() => setScopeType('grade')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              scopeType === 'grade'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            حسب السنة الدراسية
          </button>
        </div>

        {/* Secondary Selector depending on Scope */}
        {scopeType === 'teacher' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">اختاري المدرس:</span>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              {data.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.subject})
                </option>
              ))}
            </select>
          </div>
        )}

        {scopeType === 'grade' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs font-medium text-slate-600">اختاري السنة الدراسية:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Stats Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">إجمالي الطلاب المسجلين</span>
            <Users className="w-4 h-4 text-slate-400" />
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

        {/* Collected Amount */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-semibold">المبلغ المُحصّل</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums truncate">
            {formatCurrency(stats.collectedAmount)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            نسبة التحصيل: %{stats.collectionRate}
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 mb-1">
            <span className="text-xs font-semibold">المبلغ المتبقي</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 tabular-nums truncate">
            {formatCurrency(stats.remainingAmount)}
          </div>
          <div className="mt-1 text-[11px] text-rose-600">
            {formatNumber(stats.unpaidCount)} طالب لم يسددوا
          </div>
        </div>

        {/* Total Potential Amount & Collection */}
        <div className="bg-white rounded-2xl p-4 border border-indigo-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-800 mb-1">
            <span className="text-xs font-semibold">إجمالي المستهدف المالي</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-800 tabular-nums truncate">
            {formatCurrency(stats.totalPotentialAmount)}
          </div>
          <div className="mt-1 text-[11px] text-indigo-600 font-medium">
            تم تحصيل %{stats.collectionRate} حتى الآن
          </div>
        </div>
      </div>

      {/* Detailed Status Counts Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
          <span className="text-[11px] text-emerald-800 block">دفع بالسنتر</span>
          <span className="text-xl font-bold text-emerald-700 tabular-nums">
            {formatNumber(stats.paidCount)}
          </span>
        </div>
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 text-center">
          <span className="text-[11px] text-teal-800 block">دفع كاش للمستر</span>
          <span className="text-xl font-bold text-teal-700 tabular-nums">
            {formatNumber(stats.cashToTeacherCount)}
          </span>
        </div>
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-center">
          <span className="text-[11px] text-rose-800 block">لم يدفع بعد</span>
          <span className="text-xl font-bold text-rose-700 tabular-nums">
            {formatNumber(stats.unpaidCount)}
          </span>
        </div>
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-center">
          <span className="text-[11px] text-blue-800 block">معفي من المصاريف</span>
          <span className="text-xl font-bold text-blue-700 tabular-nums">
            {formatNumber(stats.exemptStudentsCount)}
          </span>
        </div>
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-center">
          <span className="text-[11px] text-amber-800 block">سحب اشتراكه</span>
          <span className="text-xl font-bold text-amber-700 tabular-nums">
            {formatNumber(stats.withdrawnCount)}
          </span>
        </div>
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-700 block">منقطع</span>
          <span className="text-xl font-bold text-slate-700 tabular-nums">
            {formatNumber(stats.droppedCount)}
          </span>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Breakdown Donut */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            توزيع مدفوعات شهر ({formatMonthName(selectedMonth)})
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            نسبة الطلاب المسددين مقابل غير المسددين والمعفيين
          </p>

          <div className="h-64 w-full flex items-center justify-center">
            {paymentChartData.length === 0 ? (
              <span className="text-xs text-slate-400">لا توجد بيانات كافية للرسم</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${formatNumber(Number(value))} طالب`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2 border-t border-slate-100">
            {paymentChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600">
                  {item.name}: <strong className="tabular-nums">{item.value}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Teacher Comparison Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            مقارنة المبالغ المحصلة حسب المدرسين
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            المبلغ المحصل بالجنيه المصري لكل مدرس لشهر {formatMonthName(selectedMonth)}
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherComparisonData}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'المبلغ المُحصّل']}
                  labelFormatter={(idx: any) => {
                    const found = teacherComparisonData.find((t) => t.name === idx);
                    return found?.fullName || idx;
                  }}
                />
                <Bar
                  dataKey="collected"
                  name="المبلغ المحصل"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
            يتم تحديث المبالغ تلقائياً فور تغيير حالة الدفع لأي طالب
          </div>
        </div>
      </div>


    </div>
  );
};
