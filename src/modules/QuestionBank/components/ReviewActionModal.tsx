import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, Archive, Play } from 'lucide-react';
import type { QuestionItem } from '../types/questionBank.types';
import { QuestionStatus } from '../types/questionBank.types';
import Button from '@/components/ui/Button';

interface ReviewActionModalProps {
  question: QuestionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStartReview: (id: string, comment?: string) => Promise<boolean>;
  onApprove: (id: string, comment?: string) => Promise<boolean>;
  onReject: (id: string, reason: string) => Promise<boolean>;
  onArchive: (id: string, reason?: string) => Promise<boolean>;
}

export const ReviewActionModal: React.FC<ReviewActionModalProps> = ({
  question,
  isOpen,
  onClose,
  onStartReview,
  onApprove,
  onReject,
  onArchive,
}) => {
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'START_REVIEW' | 'ARCHIVE'>(
    'APPROVE',
  );
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let success = false;
      if (actionType === 'START_REVIEW') {
        success = await onStartReview(question.id, comment);
      } else if (actionType === 'APPROVE') {
        success = await onApprove(question.id, comment);
      } else if (actionType === 'REJECT') {
        if (!rejectReason.trim()) {
          setError('Please provide a specific reason for rejection.');
          setIsLoading(false);
          return;
        }
        success = await onReject(question.id, rejectReason.trim());
      } else if (actionType === 'ARCHIVE') {
        success = await onArchive(question.id, comment);
      }

      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Action failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-200">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Review & Workflow Action</h2>
              <p className="text-[11px] text-slate-500">Current Status: {question.status}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Action Selector Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            {question.status === QuestionStatus.SUBMITTED && (
              <button
                type="button"
                onClick={() => setActionType('START_REVIEW')}
                className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                  actionType === 'START_REVIEW'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Play size={15} className="text-blue-600" />
                <span>Start Review</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActionType('APPROVE')}
              className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                actionType === 'APPROVE'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 size={15} className="text-emerald-600" />
              <span>Approve Question</span>
            </button>

            <button
              type="button"
              onClick={() => setActionType('REJECT')}
              className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                actionType === 'REJECT'
                  ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20 shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertCircle size={15} className="text-rose-600" />
              <span>Reject (Needs Edit)</span>
            </button>

            <button
              type="button"
              onClick={() => setActionType('ARCHIVE')}
              className={`flex items-center gap-2 rounded-2xl border p-3 text-left text-xs font-bold transition-all ${
                actionType === 'ARCHIVE'
                  ? 'border-slate-600 bg-slate-100 text-slate-900 ring-2 ring-slate-500/20 shadow-sm'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Archive size={15} className="text-slate-600" />
              <span>Archive Question</span>
            </button>
          </div>

          {/* Action-specific inputs */}
          {actionType === 'REJECT' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-900 block">
                Rejection Reason (Required for educator revision):
              </label>
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Option B has a typographical error in the formula, please correct."
                className="w-full rounded-2xl border border-rose-300 bg-rose-50/30 p-3 text-xs text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 placeholder:text-rose-300"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Approval / Audit Note (Optional):
              </label>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Verified against NEET 2026 syllabus"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className={`text-white ${
                actionType === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : actionType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Confirm {actionType.replace('_', ' ')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
