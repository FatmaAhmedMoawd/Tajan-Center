import React from 'react';
import { CenterProvider, useCenter } from './store/CenterContext';
import { Navbar } from './components/layout/Navbar';
import { OverviewView } from './components/dashboard/OverviewView';
import { TeacherDetailView } from './components/teacher/TeacherDetailView';
import { StatsView } from './components/stats/StatsView';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab, activeTeacherId } = useCenter();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {activeTab === 'overview' && (
        activeTeacherId ? <TeacherDetailView /> : <OverviewView />
      )}
      {activeTab === 'teacher' && <TeacherDetailView />}
      {activeTab === 'stats' && <StatsView />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

export default function App() {
  return (
    <CenterProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <div className="flex-1">
          <MainContent />
        </div>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>نظام إدارة السنتر والدروس الخصوصية · لوحة المديرة فاطمة</span>
            <span className="text-[11px] text-slate-400">جميع البيانات تُحفظ محلياً في متصفحكِ تلقائياً</span>
          </div>
        </footer>
      </div>
    </CenterProvider>
  );
}
