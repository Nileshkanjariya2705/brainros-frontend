import React, { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Maximize2,
  Wifi,
  ChevronLeft,
} from 'lucide-react';
import cn from 'classnames';
import {
  useGetAvailableExamLanguagesAPI,
  type ExamAvailableLanguagesResponse,
} from '../services';
import {
  useGetSecurityPreflightAPI,
  type SecurityPreflightResponse,
} from '../services/security.service';
import Button from '@/components/ui/Button';

interface ExamStartLanguageModalProps {
  isOpen: boolean;
  examId: string;
  examTitle?: string;
  onClose: () => void;
  onConfirmStart: (languageId: string) => Promise<void>;
  isStarting: boolean;
  startError?: string | null;
}

export const ExamStartLanguageModal: React.FC<ExamStartLanguageModalProps> = ({
  isOpen,
  examId,
  examTitle,
  onClose,
  onConfirmStart,
  isStarting,
  startError,
}) => {
  const { getAvailableExamLanguagesAPI, isLoading: isLoadingLangs } =
    useGetAvailableExamLanguagesAPI();
  const { getSecurityPreflightAPI } = useGetSecurityPreflightAPI();

  const [step, setStep] = useState<'LANGUAGE' | 'PREFLIGHT'>('LANGUAGE');
  const [langData, setLangData] =
    useState<ExamAvailableLanguagesResponse | null>(null);
  const [preflightData, setPreflightData] =
    useState<SecurityPreflightResponse | null>(null);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!examId || !isOpen) return;
    setFetchError(null);
    setStep('LANGUAGE');
    setHasAgreedToPolicy(false);

    const [langRes, preflightRes] = await Promise.all([
      getAvailableExamLanguagesAPI(examId),
      getSecurityPreflightAPI(examId),
    ]);

    if (langRes.data) {
      setLangData(langRes.data);
      const langs = langRes.data.languages || [];
      if (langs.length > 0) {
        const preferred = langs.find((l) => l.isPreferred);
        const defaultLang = langs.find((l) => l.isDefault);
        const initialId =
          preferred?.id ||
          langRes.data.studentPreferredLanguageId ||
          defaultLang?.id ||
          langRes.data.defaultLanguageId ||
          langs[0].id;
        setSelectedLanguageId(initialId);
      }
    } else {
      setFetchError('Failed to load available examination languages.');
    }

    if (preflightRes.data) {
      setPreflightData(preflightRes.data);
    }
  }, [examId, isOpen, getAvailableExamLanguagesAPI, getSecurityPreflightAPI]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen) return null;

  const languages = langData?.languages || [];
  const profile = preflightData?.profile;

  const handleNextToPreflight = () => {
    if (!selectedLanguageId) return;
    setStep('PREFLIGHT');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50/50">
              {step === 'LANGUAGE' ? <Globe size={22} /> : <ShieldCheck size={22} />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {step === 'LANGUAGE' ? 'Choose Exam Language' : 'Exam Security Verification'}
              </h2>
              <p className="text-xs text-slate-500 line-clamp-1">
                {examTitle || 'Select your presentation language'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isStarting}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: LANGUAGE SELECTION */}
        {step === 'LANGUAGE' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="text-indigo-600 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Your examination will start in your chosen language. You can also toggle translations dynamically during the test without losing answers.
              </p>
            </div>

            {fetchError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{fetchError}</span>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
                  Retry Loading
                </Button>
              </div>
            )}

            {isLoadingLangs ? (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="animate-spin text-indigo-600 mx-auto" size={32} />
                <p className="text-xs font-bold text-slate-500">Validating languages...</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {languages.map((lang) => {
                  const isSelected = selectedLanguageId === lang.id;
                  return (
                    <label
                      key={lang.id}
                      onClick={() => setSelectedLanguageId(lang.id)}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-150 select-none',
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-sm shadow-indigo-100 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white',
                          )}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              {lang.nativeName || lang.name}
                            </span>
                            {lang.nativeName && lang.nativeName !== lang.name && (
                              <span className="text-xs font-medium text-slate-500">
                                ({lang.name})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                            Code: {lang.code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {lang.isPreferred && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                            <Sparkles size={10} /> Preferred
                          </span>
                        )}
                        {lang.isDefault && (
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            Default
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={onClose} className="text-xs font-bold px-4">
                Cancel
              </Button>
              <Button
                onClick={handleNextToPreflight}
                disabled={!selectedLanguageId || isLoadingLangs}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-6 py-2.5 shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <span>Continue to Security Check</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: SECURITY PREFLIGHT & POLICY ACCEPTANCE */}
        {step === 'PREFLIGHT' && (
          <div className="space-y-4 animate-in fade-in">
            {/* System Capability Checks */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-950 block">Browser Check</span>
                  <span className="text-[10px] text-emerald-700">Supported Client</span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2">
                <Maximize2 size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-950 block">Fullscreen</span>
                  <span className="text-[10px] text-emerald-700">Capability Verified</span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2">
                <Wifi size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-950 block">Connectivity</span>
                  <span className="text-[10px] text-emerald-700">Online & Sync Ready</span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-2">
                <Lock size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-950 block">Security Policy</span>
                  <span className="text-[10px] text-emerald-700">{profile?.level || 'STANDARD'} Tier</span>
                </div>
              </div>
            </div>

            {/* Instruction Bulletins */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs text-slate-700">
              <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-indigo-600" />
                Examination Integrity Rules
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-slate-600 text-[11px] leading-relaxed">
                {(preflightData?.instructions || [
                  'Stay in fullscreen mode throughout the examination.',
                  'Do not switch tabs, minimize windows, or use background shortcuts.',
                  'Copying, cutting, or pasting question content is strictly monitored.',
                  'Ensure unauthorized devices (phones, smartwatches) are kept away.',
                ]).map((ins, idx) => (
                  <li key={idx}>{ins}</li>
                ))}
              </ul>
            </div>

            {/* Policy Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-2xl border border-indigo-200 bg-indigo-50/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAgreedToPolicy}
                onChange={(e) => setHasAgreedToPolicy(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-indigo-950 leading-tight">
                I understand and agree to adhere strictly to the examination security instructions and honor code.
              </span>
            </label>

            {startError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{startError}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => setStep('LANGUAGE')}
                disabled={isStarting}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>

              <Button
                onClick={() => onConfirmStart(selectedLanguageId)}
                isLoading={isStarting}
                disabled={!hasAgreedToPolicy || isStarting}
                className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-black text-xs px-6 py-2.5 shadow-lg shadow-indigo-200 flex items-center gap-2"
              >
                <span>Launch Exam & Start Timer</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
