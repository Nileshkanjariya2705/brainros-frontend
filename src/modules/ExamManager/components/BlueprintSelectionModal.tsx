import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  LoaderCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGetBlueprintsAPI } from '../services/examManager.service';
import type { BlueprintItem } from '../types/examManager.types';

interface BlueprintSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlueprint: (blueprint: BlueprintItem) => void;
}

export const BlueprintSelectionModal: React.FC<BlueprintSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectBlueprint,
}) => {
  const [blueprints, setBlueprints] = useState<BlueprintItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const { getBlueprintsAPI, isLoading } = useGetBlueprintsAPI();

  useEffect(() => {
    if (isOpen) {
      getBlueprintsAPI().then(({ data }) => {
        if (data && data.length > 0) {
          setBlueprints(data);
          setSelectedId(data[0].id);
        }
      });
    }
  }, [isOpen, getBlueprintsAPI]);

  if (!isOpen) return null;

  const handleContinue = () => {
    const found = blueprints.find((b) => b.id === selectedId);
    if (found) {
      onSelectBlueprint(found);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-white/10">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Upload Question Paper</h2>
              <p className="text-xs text-indigo-200">
                Choose predefined Exam Type / Blueprint to enforce structure validation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800">
              Choose Exam Type / Blueprint
            </h3>
            <p className="text-xs text-slate-500">
              Select an active curriculum blueprint. Uploaded question counts and subject distributions will be strictly validated against this blueprint's rules.
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center space-y-2">
              <LoaderCircle size={32} className="animate-spin text-indigo-600 mx-auto" />
              <p className="font-bold text-slate-600">Loading active blueprints...</p>
            </div>
          ) : blueprints.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
              <FileSpreadsheet size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">No active blueprints found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blueprints.map((bp) => {
                const isSelected = selectedId === bp.id;
                return (
                  <div
                    key={bp.id}
                    onClick={() => setSelectedId(bp.id)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all flex items-start justify-between gap-4 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="selectedBlueprint"
                          checked={isSelected}
                          onChange={() => setSelectedId(bp.id)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900">{bp.name}</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                            {bp.totalQuestions} Questions
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock size={11} /> {bp.durationMinutes} mins
                          </span>
                        </div>

                        {bp.description && (
                          <p className="text-[11px] text-slate-500">{bp.description}</p>
                        )}

                        {/* Subject distribution pills */}
                        {bp.subjectDistribution && bp.subjectDistribution.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {bp.subjectDistribution.map((rule, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[10px] shadow-2xs"
                              >
                                {rule.subject}: <b>{rule.questionCount}</b>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="text-indigo-600 shrink-0 pt-0.5">
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Predefined blueprints loaded from backend master data</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleContinue}
              disabled={!selectedId || isLoading}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlueprintSelectionModal;
