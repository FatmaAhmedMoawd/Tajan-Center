import React, { useState, useRef, useEffect } from 'react';
import { useCenter } from '../../store/CenterContext';
import {
  downloadBackupFile,
  validateAndParseImport,
  getStorageDiagnostics,
  StorageDiagnostics,
  isLocalStorageAvailable,
} from '../../lib/storage';
import { formatTimeAr } from '../../lib/utils';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  UserPlus,
  Activity,
  HardDrive,
  Users,
  GraduationCap,
  CreditCard,
  KeyRound,
  RefreshCw,
  CalendarClock,
} from 'lucide-react';
import { ConfirmModal } from '../modals/ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    data,
    resetToSeed,
    resetToEmpty,
    importData,
    forceSave,
    lastSavedAt,
    saveStatus,
  } = useCenter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isResetSeedConfirmOpen, setIsResetSeedConfirmOpen] = useState(false);
  const [isWipeAllConfirmOpen, setIsWipeAllConfirmOpen] = useState(false);

  // حالة تشخيص التخزين (Rule #8)
  const [diagnostics, setDiagnostics] = useState<StorageDiagnostics>(getStorageDiagnostics);
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const refreshDiagnostics = () => {
    setDiagnostics(getStorageDiagnostics());
  };

  useEffect(() => {
    refreshDiagnostics();
  }, [data, lastSavedAt]);

  const handleTestStorage = () => {
    setIsTestingStorage(true);
    setTestResult(null);

    setTimeout(() => {
      const isWorking = isLocalStorageAvailable();
      const currentDiag = getStorageDiagnostics();
      setDiagnostics(currentDiag);
      setIsTestingStorage(false);

      if (isWorking) {
        setTestResult(
          `تم اختبار التخزين بنجاح! الذاكرة المحلية (localStorage) جاهزة وتعمل بكفاءة، وجميع بيانات ${currentDiag.teacherCount} مدرس و ${currentDiag.studentCount} طالب محفوظة بسلام.`
        );
      } else {
        setTestResult('تنبيه: التخزين المحلي غير متاح أو معطل في متصفحكِ.');
      }
    }, 400);
  };

  const handleExport = () => {
    try {
      downloadBackupFile(data);
      setNotification({
        type: 'success',
        message: 'تم تنزيل ملف النسخة الاحتياطية (JSON) بنجاح على جهازكِ.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'حدث خطأ أثناء تنزيل ملف النسخة الاحتياطية.',
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseImport(content);

      if (res.success && res.data) {
        importData(res.data);
        refreshDiagnostics();
        setNotification({
          type: 'success',
          message: `تم استيراد البيانات بنجاح! تم تحميل ${res.data.teachers.length} مدرس و ${res.data.students.length} طالب.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'الملف الذي اخترتِه غير صالح.',
        });
      }
    };
    reader.onerror = () => {
      setNotification({
        type: 'error',
        message: 'تعذر قراءة الملف من جهازكِ.',
      });
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmResetSeed = () => {
    resetToSeed();
    setIsResetSeedConfirmOpen(false);
    refreshDiagnostics();
    setNotification({
      type: 'success',
      message: 'تمت استعادة البيانات الافتراضية (أستاذ سيد خالد وطلابه وسجلات السداد) بنجاح!',
    });
  };

  const handleConfirmWipeAll = () => {
    resetToEmpty();
    setIsWipeAllConfirmOpen(false);
    refreshDiagnostics();
    setNotification({
      type: 'success',
      message: 'تم تفريغ كافة البيانات بنجاح! يمكنكِ الآن البدء بتسجيل المدرسين والطلاب الحقيقيين.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">إعدادات النظام والنسخ الاحتياطي</h1>
            <p className="text-xs text-slate-500">
              تشخيص حفظ البيانات، التصدير والاستيراد، والتبديل بين الداتا التجريبية والبدء من الصفر
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* قسم التشخيص (Rule #8) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                تشخيص الذاكرة والتخزين المحلي (localStorage)
              </h2>
              <p className="text-xs text-slate-500">
                فحص فوري لصحة حفظ بيانات المدرسين والطلاب في متصفحكِ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={forceSave}
              title="إعادة حفظ الحالة الحالية في التخزين فوراً"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>تأكيد الحفظ</span>
            </button>

            <button
              type="button"
              onClick={handleTestStorage}
              disabled={isTestingStorage}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isTestingStorage ? 'animate-spin text-indigo-600' : ''}`}
              />
              <span>{isTestingStorage ? 'جارٍ الفحص...' : 'فحص التخزين الآن'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic KPI Grid */}
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Storage Status */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>حالة التخزين</span>
                <HardDrive className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    diagnostics.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-sm font-bold text-slate-900">
                  {diagnostics.isAvailable ? 'شغال ومتاح بنجاح' : 'معطل'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">localStorage مفعّل</span>
            </div>

            {/* 2. Storage Size */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>حجم البيانات</span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-sm font-bold text-slate-900 font-mono">
                {diagnostics.formattedSize}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {diagnostics.rawBytes} بايت مخزنة
              </span>
            </div>

            {/* 3. Teachers Count */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>المدرسين المحفوظين</span>
                <GraduationCap className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-sm font-bold text-indigo-700">
                {diagnostics.teacherCount} مدرس
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">في كادر السنتر</span>
            </div>

            {/* 4. Students Count */}
            <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>الطلاب المحفوظين</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-sm font-bold text-emerald-700">
                {diagnostics.studentCount} طالب
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                مع {diagnostics.paymentCount} سجل سداد
              </span>
            </div>
          </div>

          {/* Details Row */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 text-[11px] block">مفتاح التخزين الموحد:</span>
                <code className="text-slate-800 font-mono font-bold text-xs">
                  {diagnostics.storageKey}
                </code>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <CalendarClock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px] block">آخر حفظ فعلي:</span>
                <span className="text-slate-800 font-bold text-xs">
                  {formatTimeAr(lastSavedAt) || 'الآن'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-slate-400 text-[11px] block">حماية البدء من الصفر:</span>
                <span className="text-slate-800 font-semibold text-xs">
                  {diagnostics.hasEverHadData
                    ? 'نشطة (تمنع عودة الداتا التجريبية)'
                    : 'أول تشغيل للنظام'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}
        </div>
      </section>

      {/* Prominent Quick Action: Start from Scratch */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-300/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <span>البدء من الصفر (تسجيل بيانات السنتر الحقيقية)</span>
          </div>
          <p className="text-xs text-amber-800 mt-1 max-w-xl leading-relaxed">
            امسحي المدرسين والطلاب التجريبيين وابدئي شيتاتك النظيفة بإدخال مدرسيكِ وطلابكِ الفعليين بنفسكِ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWipeAllConfirmOpen(true)}
          className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs whitespace-nowrap min-h-[44px] transition-colors cursor-pointer"
        >
          ابدأي من الصفر الآن
        </button>
      </div>

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">تصدير نسخة احتياطية (JSON)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              احفظي كل ملفات المدرسين والطلاب وسجلات الدفع والغياب في ملف واحد على جهازك. يُنصح بتنزيل نسخة نهاية كل أسبوع.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل ملف النسخة الاحتياطية</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">استيراد نسخة سابقة</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              إذا فتحتِ من متصفح أو جهاز آخر، يمكنكِ رفع ملف النسخة الاحتياطية واسترجاع كل شيء فوراً.
            </p>
          </div>

          <div className="mt-5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors min-h-[44px] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>اختيار ملف JSON للاستيراد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Data Reset Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              إعادة تحميل البيانات النموذجية (أستاذ سيد خالد)
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            يُعيد تحميل بيانات أستاذ سيد خالد مع طلاب وسجلات تجريبية للمراحل الابتدائية والإعدادية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsResetSeedConfirmOpen(true)}
          className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl whitespace-nowrap min-h-[40px] transition-colors cursor-pointer"
        >
          تحميل الداتا النموذجية
        </button>
      </div>

      {/* Advisory Note */}
      <div className="bg-slate-100 rounded-2xl border border-slate-200 p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-700 leading-relaxed">
          <span className="font-bold block text-slate-900">قواعد وضمانات الحفظ:</span>
          <p>
            • يتم الحفظ تلقائياً في المفتاح الثابت <code className="font-mono font-bold text-indigo-700">center-system:v1</code> عند أي إضافة أو تعديل أو حذف.
          </p>
          <p>
            • النظام مزود بحماية تمنع استبدال البيانات بحالة فارغة في حال إغلاق أو إعادة تحميل الصفحة.
          </p>
          <p>
            • يتم حفظ البيانات فوراً عند التنقل بين النوافذ أو إغلاق التاب (<code className="font-mono text-[11px]">visibilitychange & pagehide</code>).
          </p>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={isResetSeedConfirmOpen}
        title="تأكيد تحميل البيانات التجريبية"
        message="هل أنتِ متأكدة؟ سيؤدي هذا الإجراء لاستبدال البيانات الحالية بالبيانات التجريبية الافتراضية (أستاذ سيد خالد وطلابه)."
        confirmLabel="نعم، حمّل البيانات التجريبية"
        cancelLabel="إلغاء"
        isDestructive={false}
        onConfirm={handleConfirmResetSeed}
        onCancel={() => setIsResetSeedConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isWipeAllConfirmOpen}
        title="تأكيد البدء من الصفر ومسح كل البيانات"
        message="تنبيه: سيتم مسح كافة المدرسين والطلاب وسجلات الحضور والمدفوعات لتبدئي سنتركِ ببيانات فارغة وجديدة تماماً. هل أنتِ متأكدة؟"
        confirmLabel="نعم، امسح كل شيء وابدأ من الصفر"
        cancelLabel="تراجع"
        isDestructive={true}
        onConfirm={handleConfirmWipeAll}
        onCancel={() => setIsWipeAllConfirmOpen(false)}
      />
    </div>
  );
};
