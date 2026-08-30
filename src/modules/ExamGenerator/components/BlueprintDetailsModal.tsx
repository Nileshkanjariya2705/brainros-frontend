import React from 'react';
import { X, Lock, Play, Sliders } from 'lucide-react';
import type { ExamBlueprintItem } from '../types/examGenerator.types';
import Button from '@/components/ui/Button';

interface BlueprintDetailsModalProps {
  blueprint: ExamBlueprintItem | null;
  isOpen: boolean;
  onClose: () => void;
  onValidateAndGenerate?: (blueprint: ExamBlueprintItem) => void;
}

export const BlueprintDetailsModal: React.FC<BlueprintDetailsModalProps> = ({
  blueprint,
  isOpen,
  onClose,
  onValidateAndGenerate,
}) => {
  if (!isOpen || !blueprint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 font-extrabold text-sm">
              v{blueprint.version}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {blueprint.name}
                </h2>
                {blueprint.isSystem && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    <Lock size={10} />
                    System Template
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Target: {blueprint.totalQuestions} Questions | {blueprint.rules?.length || 0} Rule
                Specifications
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

        {/* Modal Body: Rules List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-600" />
              Configured Rule Distributions
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
              {blueprint.rules?.length || 0} Active Rules
            </span>
          </div>

          {blueprint.rules && blueprint.rules.length > 0 ? (
            <div className="space-y-2.5">
              {blueprint.rules.map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs shadow-xs"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white border border-slate-200 font-mono font-bold text-slate-600 text-[11px]">
                      #{idx + 1}
                    </span>

                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-extrabold text-indigo-700 border border-indigo-100">
                      {rule.subject?.name || 'Any Subject'}
                    </span>

                    {rule.chapter && (
                      <span className="rounded-lg bg-slate-200/70 px-2 py-0.5 font-semibold text-slate-700">
                        {rule.chapter.name}
                      </span>
                    )}

                    {rule.difficultyLevel && (
                      <span
                        className={`rounded-lg px-2 py-0.5 font-bold text-[11px] ${
                          rule.difficultyLevel === 'EASY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rule.difficultyLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rule.difficultyLevel}
                      </span>
                    )}

                    {rule.type && (
                      <span className="rounded-lg bg-purple-50 px-2 py-0.5 font-bold text-purple-700 text-[11px]">
                        {rule.type}
                      </span>
                    )}
                  </div>

                  <span className="font-mono font-black text-indigo-900 text-sm bg-white px-3 py-1 rounded-xl border border-slate-200 shrink-0">
                    {rule.selectionCount
                      ? `${rule.selectionCount} Qs`
                      : `${rule.selectionPercentage}%`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              No specific rules defined for this blueprint.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {onValidateAndGenerate && (
            <Button
              onClick={() => {
                onClose();
                onValidateAndGenerate(blueprint);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
            >
              <Play size={14} fill="currentColor" />
              <span>Validate & Generate</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
