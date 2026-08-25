import React, { useState, useEffect } from 'react';
import { X, Star, Globe, Save } from 'lucide-react';
import {
  useGetLanguagesAPI,
  useGetExamLanguagesAPI,
  useSetExamLanguagesAPI,
} from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type { SupportedLanguage } from '@/modules/RegionalLanguage/types/regionalLanguage.types';
import Button from '@/components/ui/Button';

interface ExamLanguageConfigModalProps {
  examId: string;
  examTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const ExamLanguageConfigModal: React.FC<ExamLanguageConfigModalProps> = ({
  examId,
  examTitle,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [allLanguages, setAllLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>([]);
  const [defaultLanguageId, setDefaultLanguageId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { getLanguagesAPI } = useGetLanguagesAPI();
  const { getExamLanguagesAPI } = useGetExamLanguagesAPI();
  const { setExamLanguagesAPI, isLoading: isSaving } = useSetExamLanguagesAPI();

  useEffect(() => {
    if (!isOpen || !examId) return;

    Promise.all([getLanguagesAPI(false), getExamLanguagesAPI(examId)]).then(([allRes, examRes]) => {
      if (allRes.data) setAllLanguages(allRes.data);

      if (examRes.data && examRes.data.length > 0) {
        const ids = examRes.data.map((l) => l.languageId);
        setSelectedLanguageIds(ids);
        const def = examRes.data.find((l) => l.isDefault)?.languageId || ids[0];
        setDefaultLanguageId(def);
      } else if (allRes.data && allRes.data.length > 0) {
        // Default to all active languages with English as default
        setSelectedLanguageIds(allRes.data.map((l) => l.id));
        setDefaultLanguageId(allRes.data[0].id);
      }
    });
  }, [isOpen, examId, getLanguagesAPI, getExamLanguagesAPI]);

  if (!isOpen) return null;

  const handleToggleLanguage = (langId: string) => {
    setSelectedLanguageIds((prev) => {
      const exists = prev.includes(langId);
      if (exists) {
        if (prev.length <= 1) {
          setErrorMsg('At least one language must remain enabled.');
          return prev;
        }
        const updated = prev.filter((id) => id !== langId);
        if (defaultLanguageId === langId) {
          setDefaultLanguageId(updated[0]);
        }
        return updated;
      } else {
        return [...prev, langId];
      }
    });
  };

  const handleSetDefault = (langId: string) => {
    if (!selectedLanguageIds.includes(langId)) {
      setSelectedLanguageIds((prev) => [...prev, langId]);
    }
    setDefaultLanguageId(langId);
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = selectedLanguageIds.map((id, idx) => ({
      languageId: id,
      isDefault: id === defaultLanguageId,
      displayOrder: idx,
    }));

    const { error } = await setExamLanguagesAPI(examId, payload);

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to save configuration');
      return;
    }

    setSuccessMsg('Exam regional languages updated successfully!');
    setTimeout(() => {
      onSaved?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Exam Language Configuration
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {examTitle || `Exam ID: ${examId.slice(0, 8)}...`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-900">
            <p className="font-semibold">
              Select languages available for students to switch between during this exam.
            </p>
            <p className="text-[11px] text-indigo-700 mt-1">
              Click the star icon to set the default start language.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {successMsg}
            </div>
          )}

          {/* Languages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {allLanguages.map((lang) => {
              const isEnabled = selectedLanguageIds.includes(lang.id);
              const isDefault = defaultLanguageId === lang.id;

              return (
                <div
                  key={lang.id}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    isEnabled
                      ? 'border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-300'
                      : 'border-slate-200 bg-slate-50/40 opacity-70'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleLanguage(lang.id)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {lang.nativeName || lang.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                          ({lang.code})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{lang.name}</span>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleSetDefault(lang.id)}
                    className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                      isDefault
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                        : 'bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-300'
                    }`}
                    title={isDefault ? 'Default Language' : 'Click to make Default'}
                  >
                    <Star size={13} fill={isDefault ? 'currentColor' : 'none'} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
          >
            <Save size={15} />
            <span>Save Languages</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
