import React, { useEffect, useState } from 'react';
import { X, GitBranch, Calendar, User, Eye } from 'lucide-react';
import type { QuestionItem } from '../types/questionBank.types';
import { useGetQuestionVersionsAPI } from '../services/questionBank.service';
import Button from '@/components/ui/Button';

interface VersionHistoryModalProps {
  questionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVersion?: (versionId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  questionId,
  isOpen,
  onClose,
  onSelectVersion,
}) => {
  const [data, setData] = useState<{
    currentQuestionId: string;
    rootQuestion: QuestionItem;
    versions: QuestionItem[];
  } | null>(null);
  const { getQuestionVersionsAPI, isLoading } = useGetQuestionVersionsAPI();

  useEffect(() => {
    if (isOpen && questionId) {
      getQuestionVersionsAPI(questionId).then(({ data: resData }) => {
        if (resData) setData(resData);
      });
    }
  }, [isOpen, questionId, getQuestionVersionsAPI]);

  if (!isOpen || !questionId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <GitBranch size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Question Version Lineage</h2>
              <p className="text-[11px] text-slate-500">
                Historical versions preserved for exam attempts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : data?.versions && data.versions.length > 0 ? (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {data.versions.map((ver, idx) => {
                const isCurrent = ver.id === questionId;

                return (
                  <div key={ver.id || idx} className="relative text-xs">
                    <div
                      className={`absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center font-bold text-[10px] text-white ${
                        isCurrent ? 'bg-indigo-600 ring-2 ring-indigo-300' : 'bg-slate-400'
                      }`}
                    >
                      {ver.version}
                    </div>

                    <div
                      className={`rounded-2xl border p-4 transition-all ${
                        isCurrent
                          ? 'border-indigo-200 bg-indigo-50/50 shadow-sm'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Version {ver.version}</span>
                          {isCurrent && (
                            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              Viewing
                            </span>
                          )}
                          <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {ver.status}
                          </span>
                        </div>

                        {onSelectVersion && !isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              onSelectVersion(ver.id);
                              onClose();
                            }}
                            className="text-xs text-indigo-600 hover:bg-indigo-50 py-1 px-2.5"
                          >
                            <Eye size={12} className="mr-1" /> View
                          </Button>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        {ver.createdAt && (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(ver.createdAt).toLocaleDateString()}
                          </span>
                        )}
                        {ver.createdBy && (
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {(ver.createdBy as any).email || 'Admin'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No version history records found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
