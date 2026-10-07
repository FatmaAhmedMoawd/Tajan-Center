import React, { useState } from 'react';
import { useCenter, ActiveNavTab } from '../../store/CenterContext';
import {
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { getMonthOptions } from '../../lib/utils';
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Zone 1: Brand title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => handleNavClick('overview')}
                className="text-right group focus:outline-hidden"
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:bg-indigo-700 transition-colors">
                    ت
                  </span>
                  <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    نظام إدارة السنتر
                  </span>
                </div>
              </button>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>لوحة تاجان</span>
              </span>
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('overview')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap min-h-[40px] ${
                  activeTab === 'overview' || activeTab === 'teacher'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>الرئيسية والمدرسين</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('stats')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap min-h-[40px] ${
                  activeTab === 'stats'
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>الإحصائيات والماليات</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all whitespace-nowrap min-h-[40px] ${
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
            <div className="flex items-center gap-2">
              {/* Unlock Next Month Button */}
              {nextMonthToUnlock && (
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(true)}
                  title={`فتح وتفعيل ${nextMonthToUnlock.label}`}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all shadow-2xs hover:shadow-xs min-h-[38px]"
                >
                  <Unlock className="w-3.5 h-3.5 text-indigo-600" />
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
                  className="appearance-none bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold py-2 pl-7 pr-3 rounded-xl border border-slate-200 cursor-pointer transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
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
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
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
