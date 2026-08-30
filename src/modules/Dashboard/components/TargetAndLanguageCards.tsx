import React from 'react';
import { Target, Globe } from 'lucide-react';
import type {
  ExamTargetItem,
  LanguagePreferenceItem,
} from '../services/superAdminDashboard.service';

interface TargetAndLanguageCardsProps {
  targetsData?: { targets: ExamTargetItem[]; totalStudents: number };
  languagesData?: { languages: LanguagePreferenceItem[]; totalStudents: number };
  isLoadingTargets?: boolean;
  isLoadingLanguages?: boolean;
}

export const TargetAndLanguageCards: React.FC<TargetAndLanguageCardsProps> = ({
  targetsData,
  languagesData,
  isLoadingTargets,
  isLoadingLanguages,
}) => {
  const targets = targetsData?.targets || [];
  const languages = languagesData?.languages || [];

  const targetColors = [
    { bg: 'from-rose-500 to-red-400', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    { bg: 'from-blue-500 to-indigo-400', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    { bg: 'from-amber-500 to-orange-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    {
      bg: 'from-purple-500 to-violet-400',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  const langColors = [
    { bg: 'from-teal-500 to-emerald-400', text: 'text-teal-700' },
    { bg: 'from-indigo-500 to-blue-400', text: 'text-indigo-700' },
    { bg: 'from-purple-500 to-pink-400', text: 'text-purple-700' },
    { bg: 'from-amber-500 to-yellow-400', text: 'text-amber-700' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── 1. Exam Target Analytics ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Exam Target Distribution</h3>
              <p className="text-[11px] text-slate-500">
                Aspiration segment breakdown across competitive exams.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
            {targetsData?.totalStudents ?? 0} Students
          </span>
        </div>

        {isLoadingTargets ? (
          <div className="space-y-3 py-4">
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : targets.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No exam target data available.
          </div>
        ) : (
          <div className="space-y-3">
            {targets.map((target, idx) => {
              const color = targetColors[idx % targetColors.length];
              return (
                <div
                  key={target.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{target.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {target.description || 'Target Stream'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        {target.count} Students
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${color.badge}`}
                      >
                        {target.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, target.percentage)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${color.bg} transition-all duration-300`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Language Preference Analytics ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Language Preference Analytics</h3>
              <p className="text-[11px] text-slate-500">
                Medium of examination preferences across regional languages.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
            {languagesData?.totalStudents ?? 0} Students
          </span>
        </div>

        {isLoadingLanguages ? (
          <div className="space-y-3 py-4">
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        ) : languages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No language data available.</div>
        ) : (
          <div className="space-y-3">
            {languages.map((lang, idx) => {
              const color = langColors[idx % langColors.length];
              return (
                <div
                  key={lang.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{lang.name}</span>
                      {lang.nativeName && (
                        <span className="text-[10px] text-slate-400 font-medium font-mono">
                          ({lang.nativeName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        {lang.count} Students
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        {lang.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(5, lang.percentage)}%` }}
                      className={`h-full rounded-full bg-gradient-to-r ${color.bg} transition-all duration-300`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
