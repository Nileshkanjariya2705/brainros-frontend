import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Sparkles, Zap, RefreshCw, Sliders } from 'lucide-react';
import {
  useValidateBlueprintAPI,
  useGenerateExamVersionAPI,
} from '../services/examGenerator.service';
import type {
  BlueprintValidationResponse,
  GeneratedVersionResponse,
} from '../types/examGenerator.types';
import Button from '@/components/ui/Button';

interface BlueprintValidationModalProps {
  blueprintId: string;
  blueprintName: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerateSuccess?: (version: GeneratedVersionResponse) => void;
}

export const BlueprintValidationModal: React.FC<BlueprintValidationModalProps> = ({
  blueprintId,
  blueprintName,
  isOpen,
  onClose,
  onGenerateSuccess,
}) => {
  const [data, setData] = useState<BlueprintValidationResponse | null>(null);
  const [customSeed, setCustomSeed] = useState('');
  const [showSeedInput, setShowSeedInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { validateBlueprintAPI, isLoading: isValidating } = useValidateBlueprintAPI();
  const { generateExamVersionAPI, isLoading: isGenerating } = useGenerateExamVersionAPI();

  const handleValidate = useCallback(async () => {
    setErrorMsg(null);
    const { data: res, error } = await validateBlueprintAPI(blueprintId);
    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Validation failed');
    } else if (res) {
      setData(res);
    }
  }, [blueprintId, validateBlueprintAPI]);

  useEffect(() => {
    if (isOpen && blueprintId) {
      handleValidate();
    }
  }, [isOpen, blueprintId, handleValidate]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setErrorMsg(null);
    const { data: genRes, error } = await generateExamVersionAPI(blueprintId, {
      generationSeed: customSeed.trim() || undefined,
    });

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Generation failed');
      return;
    }

    if (genRes) {
      onGenerateSuccess?.(genRes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Blueprint Pool Validation & Preview
              </h2>
              <p className="text-xs text-slate-500 font-mono">{blueprintName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isValidating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-bold text-slate-500">
                Checking Question Bank availability...
              </p>
            </div>
          ) : data ? (
            <>
              {/* Overall Status Banner */}
              <div
                className={`flex items-center justify-between rounded-2xl border p-4 ${
                  data.valid
                    ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                    : 'border-amber-200 bg-amber-50/70 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {data.valid ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={24} className="text-amber-600" />
                  )}
                  <div>
                    <h4 className="text-sm font-extrabold">
                      {data.valid
                        ? 'Question Pool Satisfied (100% Eligible)'
                        : 'Insufficient Questions for Blueprint'}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      {data.valid
                        ? `All ${data.totalQuestions} questions can be selected and randomized.`
                        : 'Some rules require more approved questions than currently available.'}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  className="bg-white/80 shrink-0 text-xs"
                >
                  <RefreshCw size={13} className="mr-1" /> Re-check
                </Button>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Required Questions
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-1 block font-mono">
                    {data.totalQuestions}
                  </span>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3.5">
                  <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
                    Total Eligible in Pool
                  </span>
                  <span className="text-xl font-black text-indigo-900 mt-1 block font-mono">
                    {data.questionPool.eligibleTotal}
                  </span>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3.5 col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Zero Drift Guarantee
                  </span>
                  <span className="text-xs font-semibold text-emerald-900 mt-1.5 block">
                    Immutable Snapshot Ready
                  </span>
                </div>
              </div>

              {/* Subject Distribution */}
              {Object.keys(data.subjectDistribution || {}).length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Subject Distribution
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.subjectDistribution).map(([subj, count]) => (
                      <div
                        key={subj}
                        className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800"
                      >
                        <span>{subj}</span>
                        <span className="rounded-lg bg-white px-2 py-0.5 font-bold font-mono text-indigo-600 shadow-sm">
                          {count} Qs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Distribution */}
              {Object.keys(data.difficultyDistribution || {}).length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Difficulty Allocation
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.difficultyDistribution).map(([diff, count]) => (
                      <div
                        key={diff}
                        className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold border ${
                          diff === 'EASY'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : diff === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span>{diff}</span>
                        <span className="rounded-lg bg-white px-2 py-0.5 font-mono shadow-sm">
                          {count} Qs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rule-by-rule Availability Breakdown */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Rule Availability Breakdown
                </label>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  {data.ruleBreakdown.map((r) => (
                    <div
                      key={r.ruleIndex}
                      className="flex items-center justify-between p-3 text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 font-mono text-[10px] font-bold text-slate-600">
                          #{r.ruleIndex}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {r.difficultyLevel ? `[${r.difficultyLevel}] ` : ''}
                          {r.type ? `[${r.type}] ` : ''}
                          Requirement
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-600">
                          Required: <strong>{r.required}</strong> | Pool:{' '}
                          <strong
                            className={
                              r.available >= r.required ? 'text-emerald-600' : 'text-rose-600'
                            }
                          >
                            {r.available}
                          </strong>
                        </span>

                        {r.isSatisfied ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generation Seed Option */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSeedInput(!showSeedInput)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Sliders size={13} />
                  <span>
                    {showSeedInput ? 'Hide Randomization Seed' : 'Configure Custom Seed (Optional)'}
                  </span>
                </button>

                {showSeedInput && (
                  <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Deterministic PRNG Seed
                    </label>
                    <input
                      type="text"
                      value={customSeed}
                      onChange={(e) => setCustomSeed(e.target.value)}
                      placeholder="e.g. neet_seed_2026_live (leave empty for auto-generated crypto seed)"
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button
            onClick={handleGenerate}
            disabled={!data?.valid || isGenerating}
            isLoading={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 disabled:opacity-50"
          >
            <Zap size={16} />
            <span>Generate Immutable Exam Version</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
