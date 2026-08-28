import React, { useState, useEffect, useRef } from 'react';
import { Languages, ChevronDown, Check, Sparkles, Loader2 } from 'lucide-react';
import {
  useGetLanguagesAPI,
  useSwitchAttemptLanguageAPI,
} from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type { SupportedLanguage } from '@/modules/RegionalLanguage/types/regionalLanguage.types';
import { SUPPORTED_EXAM_LANGUAGES } from '@/constants/languages.constant';

interface ExamLanguageSwitcherProps {
  examId?: string;
  attemptId: string;
  currentLanguageId?: string;
  onLanguageChanged: (newLangIdOrCode: string) => Promise<void> | void;
}

export const ExamLanguageSwitcher: React.FC<ExamLanguageSwitcherProps> = ({
  attemptId,
  currentLanguageId,
  onLanguageChanged,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [activeLanguageId, setActiveLanguageId] = useState<string>(currentLanguageId || 'en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getLanguagesAPI, isLoading: isLoadingLanguages } = useGetLanguagesAPI();
  const { switchAttemptLanguageAPI, isLoading: isSwitching } = useSwitchAttemptLanguageAPI();

  // Load languages (prefers database records, falls back to 9 mandatory constants)
  useEffect(() => {
    getLanguagesAPI().then(({ data }) => {
      if (data && data.length > 0) {
        setLanguages(data);
      } else {
        // Fallback to the 9 mandatory languages configuration
        setLanguages(
          SUPPORTED_EXAM_LANGUAGES.map((sl) => ({
            id: sl.code,
            code: sl.code,
            name: sl.name,
            nativeName: sl.nativeName,
            isActive: true,
            displayOrder: sl.displayOrder,
          })),
        );
      }
    });
  }, [getLanguagesAPI]);

  useEffect(() => {
    if (currentLanguageId) {
      setActiveLanguageId(currentLanguageId);
    }
  }, [currentLanguageId]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    const langKey = lang.id || lang.code;
    if (langKey === activeLanguageId || isSwitching) return;

    setIsOpen(false);
    const prevLang = activeLanguageId;
    setActiveLanguageId(langKey);

    const { data, error } = await switchAttemptLanguageAPI(attemptId, langKey);

    if (error || !data) {
      // Revert if API failed
      setActiveLanguageId(prevLang);
      return;
    }

    // Inform parent (ExamInterfacePage) to switch in-flight translation instantly
    await onLanguageChanged(langKey);
  };

  const currentLang = languages.find(
    (l) => l.id === activeLanguageId || l.code?.toLowerCase() === activeLanguageId?.toLowerCase(),
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isSwitching || isLoadingLanguages}
        className="group flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-indigo-500/80 hover:bg-slate-800 transition-all shadow-sm focus:outline-none"
        title="Switch exam language (preserves all chosen answers)"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
          {isSwitching ? <Loader2 size={13} className="animate-spin" /> : <Languages size={13} />}
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">
            Language
          </span>
          <span className="text-xs font-bold text-white leading-tight">
            {currentLang ? `${currentLang.nativeName || currentLang.name}` : 'English'}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 group-hover:text-indigo-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Language Selection Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-700 bg-slate-900/95 p-1.5 text-white shadow-2xl backdrop-blur-xl ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-slate-800 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-400 uppercase tracking-wider">
              <Sparkles size={12} />
              <span>Switch Exam Language</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Instantly change display language. Your answers & timer stay 100% safe.
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {languages.length > 0 ? (
              languages.map((lang) => {
                const isSelected =
                  lang.id === activeLanguageId ||
                  lang.code?.toLowerCase() === activeLanguageId?.toLowerCase();

                return (
                  <button
                    key={lang.id || lang.code}
                    type="button"
                    onClick={() => handleSelectLanguage(lang)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left ${
                      isSelected
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-xs">
                        {lang.nativeName || lang.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {lang.name} ({lang.code?.toUpperCase()})
                      </span>
                    </div>

                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                All 9 Regional Languages Available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
