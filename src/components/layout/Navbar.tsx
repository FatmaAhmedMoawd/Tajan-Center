import React, { useState } from 'react';
import { useCenter, ActiveNavTab } from '../../store/CenterContext';
import {
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  Sparkles,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getMonthOptions, formatTimeAr } from '../../lib/utils';
import { UnlockMonthModal } from '../modals/UnlockMonthModal';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedMonth,
    setSelectedMonth,
    setActiveTeacherId,
    isMonthUnlocked,
    getNextMonthToUnlock,
    lastSavedAt,
    saveStatus,
    saveError,
    forceSave,
    isHydrated,
  } = useCenter();

  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  const monthOptions = getMonthOptions();
  const nextMonthToUnlock = getNextMonthToUnlock();

  const handleNavClick = (tab: ActiveNavTab) => {
    if (tab === 'overview') {
      setActiveTeacherId(null);
    }
    setActiveTab(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Zone 1: Brand title & Save indicator */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={() => handleNavClick('overview')}
                className="text-right group focus:outline-hidden"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:bg-indigo-700 transition-colors">
                    ت
                  </span>
                  <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                    نظام إدارة السنتر
                  </span>
                </div>
              </button>

              <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>لوحة تاجان</span>
              </span>

              {/* مؤشر الحفظ في الترويسة (Rule #7) */}
              <div className="flex items-center">
                {!isHydrated ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                    <span>جارٍ التحميل...</span>
                  </div>
                ) : saveError ? (
                  <div
                    title={saveError}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="max-w-[140px] truncate sm:max-w-none">فشل الحفظ!</span>
                  </div>
                ) : saveStatus === 'saving' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <span className="hidden sm:inline">جارٍ الحفظ...</span>
                  </div>
                ) : lastSavedAt ? (
                  <button
                    type="button"
                    onClick={forceSave}
                    title="البيانات محفوظة محلياً في المتصفح. اضغطي للتأكيد الفوري."
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100/80 transition-colors cursor-pointer group"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden md:inline">آخر حفظ:</span>
                    <span className="font-mono font-bold text-emerald-900">
                      {formatTimeAr(lastSavedAt)}
                    </span>
                    <RefreshCw className="w-2.5 h-2.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('overview')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap min-h-[40px] ${
                  activeTab === 'overview' || activeTab === 'teacher'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">الرئيسية والمدرسين</span>
                <span className="sm:hidden">الرئيسية</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('stats')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap min-h-[40px] ${
                  activeTab === 'stats'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>الإحصائيات</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap min-h-[40px] ${
                  activeTab === 'settings'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span>الإعدادات</span>
              </button>
            </nav>

            {/* Zone 3: Actions & Active Month Selector with Unlock Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Unlock Next Month Button */}
              {nextMonthToUnlock && (
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(true)}
                  title={`فتح وتفعيل ${nextMonthToUnlock.label}`}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-2xs hover:shadow-xs min-h-[38px]"
                >
                  <Unlock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="hidden lg:inline">تفعيل شهر:</span>
                  <span>{nextMonthToUnlock.label.split(' ')[0]}</span>
                </button>
              )}

              {/* Month Selector Dropdown */}
              <div className="relative">
                <select
                  aria-label="اختر الشهر الدراسي"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold py-2 pl-7 pr-2.5 rounded-xl border border-slate-200 cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  {monthOptions.map((opt) => {
                    const unlocked = isMonthUnlocked(opt.value);
                    return (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={!unlocked}
                        className={
                          unlocked ? 'text-slate-900 font-semibold' : 'text-slate-400 font-normal'
                        }
                      >
                        {unlocked ? opt.label : `🔒 ${opt.label} [مقفل]`}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* تنبيه أحمر بالعربي لو الحفظ فشل (Rule #7) */}
        {saveError && (
          <div className="bg-rose-600 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between shadow-inner">
            <div className="max-w-7xl mx-auto px-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-white animate-bounce" />
              <span>
                تنبيه هام: تعذر حفظ بيانات السنتر في ذاكرة المتصفح ({saveError}). قد لا تبقى التعديلات
                محفوظة عند إغلاق الصفحة.
              </span>
            </div>
            <button
              type="button"
              onClick={forceSave}
              className="bg-white text-rose-700 px-3 py-1 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors shrink-0"
            >
              إعادة محاولة الحفظ
            </button>
          </div>
        )}
      </header>

      {/* Unlock Month Modal */}
      <UnlockMonthModal
        isOpen={isUnlockModalOpen}
        targetMonth={nextMonthToUnlock}
        onClose={() => setIsUnlockModalOpen(false)}
      />
    </>
  );
};
