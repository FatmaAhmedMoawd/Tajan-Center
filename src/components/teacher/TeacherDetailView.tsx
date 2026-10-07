import React, { useState, useMemo } from 'react';
import { useCenter } from '../../store/CenterContext';
import { PaymentStatus, Student } from '../../types';
import {
  calculateStats,
  getStudentPaymentForMonth,
} from '../../lib/stats';
import {
  formatCurrency,
  formatNumber,
  formatMonthName,
  formatDayMonth,
  getMonthOptions,
  getTodayDateString,
} from '../../lib/utils';
import {
  PAYMENT_STATUS_MAP,
  SUBSCRIPTION_STATUS_MAP,
  GRADES,
  getDefaultFeeForGrade,
} from '../../lib/constants';
import {
  exportTeacherFullMonthlyReport,
  exportTeacherPaidExcel,
  exportTeacherUnpaidExcel,
} from '../../lib/excel';
import {
  ArrowRight,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Users,
  Banknote,
  Filter,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Unlock,
} from 'lucide-react';
import { StudentModal } from '../modals/StudentModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { UnlockMonthModal } from '../modals/UnlockMonthModal';

export const TeacherDetailView: React.FC = () => {
  const {
    data,
    activeTeacherId,
    setActiveTeacherId,
    selectedMonth,
    setSelectedMonth,
    setPaymentStatus,
    setPaymentDate,
    deleteStudent,
    isMonthUnlocked,
    getNextMonthToUnlock,
  } = useCenter();

  const teacher = data.teachers.find((t) => t.id === activeTeacherId);

  // Modals state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  const nextMonthToUnlock = getNextMonthToUnlock();

  // Filters state
  const [selectedGrade, setSelectedGrade] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');

  // Flash update animation
  const [updatedStudentId, setUpdatedStudentId] = useState<string | null>(null);

  // Teacher specific statistics
  const teacherStats = useMemo(() => {
    if (!teacher) return null;
    return calculateStats(data, {
      teacherId: teacher.id,
      grade: selectedGrade !== 'الكل' ? selectedGrade : undefined,
      month: selectedMonth,
    });
  }, [data, teacher, selectedGrade, selectedMonth]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    if (!teacher) return [];
    return data.students.filter((student) => {
      if (student.teacherId !== teacher.id) return false;

      // Grade filter
      if (selectedGrade !== 'الكل' && student.grade !== selectedGrade) {
        return false;
      }

      // Subscription status filter
      if (
        subscriptionFilter !== 'all' &&
        student.status !== subscriptionFilter
      ) {
        return false;
      }

      const payment = getStudentPaymentForMonth(
        student.id,
        selectedMonth,
        data.payments
      );
      const effectiveStatus = payment
        ? payment.status
        : student.status === 'exempt'
        ? 'exempt'
        : 'unpaid';

      // Payment status filter for selected month
      if (paymentFilter !== 'all' && effectiveStatus !== paymentFilter) {
        return false;
      }



      // Search Query (name or parent phone)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesParentPhone = student.parentPhone?.includes(query);
        if (!matchesName && !matchesParentPhone) {
          return false;
        }
      }

      return true;
    });
  }, [
    teacher,
    data.students,
    data.payments,
    selectedGrade,
    subscriptionFilter,
    paymentFilter,
    selectedMonth,
    searchQuery,
  ]);

  const monthOptions = getMonthOptions();

  if (!teacher) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm text-slate-600 mb-4">لم يتم العثور على المدرس المطلوب.</p>
        <button
          onClick={() => setActiveTeacherId(null)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Handle payment status change with auto-recorded payment date
  const handlePaymentChange = (student: Student, newStatus: PaymentStatus) => {
    const fee = student.monthlyFee ?? getDefaultFeeForGrade(student.grade);
    // Auto-defaults to today's date if transitioning to paid/cash
    setPaymentStatus(student.id, selectedMonth, newStatus, fee);

    setUpdatedStudentId(student.id);
    setTimeout(() => {
      setUpdatedStudentId((prev) => (prev === student.id ? null : prev));
    }, 1200);
  };

  // Handle direct payment date editing
  const handlePaymentDateChange = (studentId: string, newDate: string) => {
    setPaymentDate(studentId, selectedMonth, newDate);
    setUpdatedStudentId(studentId);
    setTimeout(() => {
      setUpdatedStudentId((prev) => (prev === studentId ? null : prev));
    }, 1200);
  };

  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleDeleteStudentConfirm = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
    }
  };

  // Excel Handlers
  const handleExportFullReport = () => {
    exportTeacherFullMonthlyReport(teacher, data.students, data.payments, selectedMonth);
  };

  const handleExportPaidReport = () => {
    exportTeacherPaidExcel(teacher, data.students, data.payments, selectedMonth);
  };

  const handleExportUnpaidReport = () => {
    exportTeacherUnpaidExcel(teacher, data.students, data.payments, selectedMonth);
  };

  const totalPaidCount = teacherStats ? teacherStats.paidCount + teacherStats.cashToTeacherCount : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 overflow-hidden relative">
        <div
          className="absolute top-0 right-0 left-0 h-2"
          style={{ backgroundColor: teacher.color }}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTeacherId(null)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>لوحة السنتر</span>
              </button>
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: teacher.color }}
              />
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-semibold text-slate-700">
                إدارة طلاب وحسابات المدرس
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{teacher.name}</h1>
              <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                {teacher.subject}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                اشتراك شهري: {formatCurrency(teacher.monthlyFee || 80)}
              </span>
            </div>

            {teacher.phone && (
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr" className="font-mono">{teacher.phone}</span>
                {teacher.notes && (
                  <>
                    <span>·</span>
                    <span>{teacher.notes}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions & Month Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {nextMonthToUnlock && (
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(true)}
                title={`فتح وتفعيل ${nextMonthToUnlock.label}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-2xs hover:shadow-xs min-h-[38px]"
              >
                <Unlock className="w-3.5 h-3.5 text-indigo-600" />
                <span>تفعيل شهر {nextMonthToUnlock.label.split(' ')[0]}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">الشهر النشط:</span>
              <select
                aria-label="اختر الشهر الدراسي"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {monthOptions.map((opt) => {
                  const unlocked = isMonthUnlocked(opt.value);
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={!unlocked}
                      className={unlocked ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'}
                    >
                      {unlocked ? opt.label : `🔒 ${opt.label} [مقفل]`}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddStudent}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طالب جديد</span>
            </button>
          </div>
        </div>

        {/* Teacher Monthly Financials & Excel Action Bar */}
        {teacherStats && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            {/* KPI Cards for the Teacher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                <span className="text-slate-500 block mb-0.5">إجمالي الطلاب</span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatNumber(teacherStats.totalStudents)} طالب
                </span>
                <span className="text-[11px] text-slate-500 block">
                  ({formatNumber(teacherStats.activeCount)} نشط)
                </span>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80">
                <div className="flex items-center justify-between text-emerald-800 mb-0.5">
                  <span className="font-semibold">سددوا {formatMonthName(selectedMonth).split(' ')[0]}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-lg font-bold text-emerald-700 tabular-nums">
                  {formatNumber(totalPaidCount)} طالب
                </span>
                <span className="text-[11px] text-emerald-600 font-medium block">
                  المحصل: {formatCurrency(teacherStats.collectedAmount)}
                </span>
              </div>

              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/80">
                <div className="flex items-center justify-between text-rose-800 mb-0.5">
                  <span className="font-semibold">لم يسددوا بعد</span>
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <span className="text-lg font-bold text-rose-700 tabular-nums">
                  {formatNumber(teacherStats.unpaidCount)} طالب
                </span>
                <span className="text-[11px] text-rose-600 font-medium block">
                  المتبقي: {formatCurrency(teacherStats.remainingAmount)}
                </span>
              </div>

              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/80 flex flex-col justify-between">
                <span className="text-indigo-800 font-semibold block mb-0.5">نسبة تحصيل الشهر</span>
                <span className="text-lg font-bold text-indigo-700 tabular-nums">
                  %{teacherStats.collectionRate}
                </span>
                <span className="text-[11px] text-indigo-600 block">
                  المستهدف: {formatCurrency(teacherStats.totalPotentialAmount)}
                </span>
              </div>
            </div>

            {/* Excel Download Section (The 3 requested Excel buttons) */}
            <div className="p-3 bg-gradient-to-l from-emerald-50/80 via-teal-50/50 to-slate-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    تصدير كشوفات الإكسيل (Excel) لشهر {formatMonthName(selectedMonth)}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    تقارير مقسمة ومرتبة بالسنوات الدراسية شاملة تواريخ الدفع الدقيقة
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Button 1: Complete Month Report (Two Sheets) */}
                <button
                  type="button"
                  onClick={handleExportFullReport}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors min-h-[38px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل تقرير الشهر كامل (شيتين Excel)</span>
                </button>

                {/* Button 2: Paid Students */}
                <button
                  type="button"
                  onClick={handleExportPaidReport}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-800 bg-teal-100 hover:bg-teal-200/80 border border-teal-300 rounded-xl transition-colors min-h-[38px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الذين دفعوا ({formatNumber(totalPaidCount)})</span>
                </button>

                {/* Button 3: Unpaid Students */}
                <button
                  type="button"
                  onClick={handleExportUnpaidReport}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200/80 border border-rose-300 rounded-xl transition-colors min-h-[38px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل الذين لم يدفعوا ({formatNumber(teacherStats.unpaidCount)})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grade Tabs (السنوات الدراسية الستة) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        <button
          type="button"
          onClick={() => setSelectedGrade('الكل')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
            selectedGrade === 'الكل'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          كل السنوات الدراسية ({data.students.filter((s) => s.teacherId === teacher.id).length})
        </button>

        {GRADES.map((grade) => {
          const count = data.students.filter(
            (s) => s.teacherId === teacher.id && s.grade === grade
          ).length;
          return (
            <button
              type="button"
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedGrade === grade
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {grade} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو تليفون ولي الأمر..."
              className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              aria-label="تصفية حسب حالة الدفع"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            >
              <option value="all">حالة الدفع: الكل</option>
              <option value="paid">دفع (بالسنتر)</option>
              <option value="cash_to_teacher">دفع كاش للمستر</option>
              <option value="unpaid">لم يدفع</option>
              <option value="exempt">معفي من الدفع</option>
            </select>
          </div>

          {/* Subscription Status Filter */}
          <div>
            <select
              aria-label="تصفية حسب حالة الاشتراك"
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
            >
              <option value="all">حالة الاشتراك: الكل</option>
              <option value="active">نشط</option>
              <option value="withdrawn">سحب اشتراكه</option>
              <option value="dropped">منقطع</option>
              <option value="exempt">معفي</option>
            </select>
          </div>
        </div>

        {/* Filters reset and active day filter badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span>
              عرض <strong className="text-slate-900 tabular-nums">{filteredStudents.length}</strong> من إجمالي{' '}
              <span className="tabular-nums">
                {data.students.filter((s) => s.teacherId === teacher.id).length}
              </span>{' '}
              طالب
            </span>

          </div>

          {(searchQuery ||
            paymentFilter !== 'all' ||
            subscriptionFilter !== 'all' ||
            selectedGrade !== 'الكل') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPaymentFilter('all');
                setSubscriptionFilter('all');
                setSelectedGrade('الكل');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
            >
              إلغاء كل الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Main Student Table / Mobile Cards */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا يوجد طلاب يطابقون الاختيار</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            جرّب تغيير فلاتر البحث أو الدفع، أو أضف طالباً جديداً لهذا المدرس.
          </p>
          <button
            type="button"
            onClick={handleOpenAddStudent}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            إضافة طالب جديد الآن
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">اسم الطالب</th>
                    <th className="py-3 px-3">السنة الدراسية</th>
                    <th className="py-3 px-3">تليفون ولي الأمر</th>
                    <th className="py-3 px-3 text-center">حالة الاشتراك</th>
                    <th className="py-3 px-4 text-center">
                      دفع ({formatMonthName(selectedMonth).split(' ')[0]}) وتاريخ التحصيل
                    </th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const payment = getStudentPaymentForMonth(
                      student.id,
                      selectedMonth,
                      data.payments
                    );
                    const currentPaymentStatus: PaymentStatus = payment
                      ? payment.status
                      : student.status === 'exempt'
                      ? 'exempt'
                      : 'unpaid';

                    const isPaid = currentPaymentStatus === 'paid' || currentPaymentStatus === 'cash_to_teacher';
                    const subMeta = SUBSCRIPTION_STATUS_MAP[student.status];
                    const isRecentlyUpdated = updatedStudentId === student.id;

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isRecentlyUpdated ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        {/* Student Name */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {student.name}
                          </div>
                          {student.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {student.notes}
                            </div>
                          )}
                        </td>

                        {/* Grade & Monthly Fee */}
                        <td className="py-3.5 px-3">
                          <div className="flex flex-col gap-0.5 items-start">
                            <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                              {student.grade}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                              {formatCurrency(student.monthlyFee ?? getDefaultFeeForGrade(student.grade))}
                            </span>
                          </div>
                        </td>

                        {/* Parent Phone */}
                        <td className="py-3.5 px-3">
                          {student.parentPhone ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a
                                href={`tel:${student.parentPhone}`}
                                dir="ltr"
                                className="font-mono hover:text-indigo-600 transition-colors font-medium"
                              >
                                {student.parentPhone}
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Subscription Status Badge */}
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${subMeta.badgeClass}`}
                          >
                            {subMeta.label}
                          </span>
                        </td>

                        {/* Payment Status Dropdown + Automatic & Editable Payment Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Fast Dropdown */}
                            <div className="relative">
                              <select
                                aria-label={`تغيير حالة دفع الطالب ${student.name}`}
                                value={currentPaymentStatus}
                                onChange={(e) =>
                                  handlePaymentChange(
                                    student,
                                    e.target.value as PaymentStatus
                                  )
                                }
                                className={`appearance-none text-xs font-bold py-1.5 pl-6 pr-2.5 rounded-xl border cursor-pointer transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 ${
                                  currentPaymentStatus === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : currentPaymentStatus === 'cash_to_teacher'
                                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                                    : currentPaymentStatus === 'unpaid'
                                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                <option value="paid">✓ دفع (بالسنتر)</option>
                                <option value="cash_to_teacher">✓ دفع كاش للمستر</option>
                                <option value="unpaid">✕ لم يدفع</option>
                                <option value="exempt">— معفي</option>
                              </select>
                              <span className="absolute left-2 top-2 pointer-events-none text-[10px] text-slate-400">
                                ▼
                              </span>
                            </div>

                            {/* Payment Date Display & Inline Editor */}
                            {isPaid && (
                              <div className="flex items-center gap-1 bg-emerald-100/70 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-bold">
                                <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span>تم الدفع:</span>
                                <input
                                  type="date"
                                  value={payment?.paidAt || getTodayDateString()}
                                  onChange={(e) =>
                                    handlePaymentDateChange(student.id, e.target.value)
                                  }
                                  title="اضغطي لتعديل تاريخ السداد"
                                  className="font-mono text-emerald-950 bg-white/70 hover:bg-white rounded px-1 py-0.5 border border-emerald-300/80 cursor-pointer text-[11px]"
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStudent(student)}
                              title="تعديل بيانات الطالب"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(student)}
                              title="حذف الطالب"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student) => {
              const payment = getStudentPaymentForMonth(
                student.id,
                selectedMonth,
                data.payments
              );
              const currentPaymentStatus: PaymentStatus = payment
                ? payment.status
                : student.status === 'exempt'
                ? 'exempt'
                : 'unpaid';

              const isPaid = currentPaymentStatus === 'paid' || currentPaymentStatus === 'cash_to_teacher';
              const subMeta = SUBSCRIPTION_STATUS_MAP[student.status];

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{student.name}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {student.grade}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md tabular-nums">
                          {formatCurrency(student.monthlyFee ?? getDefaultFeeForGrade(student.grade))}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${subMeta.badgeClass}`}
                    >
                      {subMeta.label}
                    </span>
                  </div>

                  {/* Parent Phone */}
                  {student.parentPhone && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>تليفون ولي الأمر:</span>
                      <a href={`tel:${student.parentPhone}`} dir="ltr" className="font-mono font-medium">
                        {student.parentPhone}
                      </a>
                    </div>
                  )}

                  {/* Payment controls & Date editor on mobile */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        حالة الدفع لشهر ({formatMonthName(selectedMonth).split(' ')[0]}):
                      </label>
                      <select
                        aria-label={`تغيير حالة دفع الطالب ${student.name} للموبايل`}
                        value={currentPaymentStatus}
                        onChange={(e) =>
                          handlePaymentChange(
                            student,
                            e.target.value as PaymentStatus
                          )
                        }
                        className="w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
                      >
                        <option value="paid">✓ دفع (بالسنتر)</option>
                        <option value="cash_to_teacher">✓ دفع كاش للمستر</option>
                        <option value="unpaid">✕ لم يدفع</option>
                        <option value="exempt">— معفي</option>
                      </select>
                    </div>

                    {isPaid && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                        <span className="font-bold text-emerald-800">تاريخ الدفع:</span>
                        <input
                          type="date"
                          value={payment?.paidAt || getTodayDateString()}
                          onChange={(e) =>
                            handlePaymentDateChange(student.id, e.target.value)
                          }
                          className="font-mono text-emerald-950 bg-white rounded px-2 py-1 border border-emerald-300 text-xs font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(student)}
                      className="px-3 py-1.5 text-xs text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentToDelete(student)}
                      className="px-3 py-1.5 text-xs text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        studentToEdit={studentToEdit}
        defaultTeacherId={teacher.id}
        defaultGrade={selectedGrade !== 'الكل' ? selectedGrade : undefined}
        onClose={() => {
          setIsStudentModalOpen(false);
          setStudentToEdit(null);
        }}
      />

      <ConfirmModal
        isOpen={!!studentToDelete}
        title="تأكيد حذف الطالب"
        message={`هل أنتِ متأكدة من رغبتكِ في حذف الطالب "${studentToDelete?.name}" نهائياً من السنتر؟ سيتم مسح سجلات مدفوعاته المرتبطة به.`}
        confirmLabel="نعم، احذف الطالب"
        cancelLabel="تراجع"
        isDestructive={true}
        onConfirm={handleDeleteStudentConfirm}
        onCancel={() => setStudentToDelete(null)}
      />

      <UnlockMonthModal
        isOpen={isUnlockModalOpen}
        targetMonth={nextMonthToUnlock}
        onClose={() => setIsUnlockModalOpen(false)}
      />
    </div>
  );
};
