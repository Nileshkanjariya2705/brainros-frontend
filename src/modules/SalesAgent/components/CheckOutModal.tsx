import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { toast } from '@/utils/toast';

interface CheckOutModalProps {
  visit: SalesVisit;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const OUTCOME_OPTIONS = [
  { value: 'INTERESTED', label: 'Positive Interest / Follow-up Needed', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  { value: 'DEMO_REQUESTED', label: 'Demo Requested for Faculty / Management', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
  { value: 'PROPOSAL_REQUESTED', label: 'Formal Quotation / Proposal Requested', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  { value: 'ONBOARDED', label: 'Deal Closed / Onboarded Successfully', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  { value: 'FOLLOW_UP_NEEDED', label: 'Decision Pending / Additional Review', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  { value: 'NOT_INTERESTED', label: 'Not Interested / Contract with Competitor', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
];

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  visit,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<string>('INTERESTED');
  const [summary, setSummary] = useState('');
  const [keyDiscussionPoints, setKeyDiscussionPoints] = useState('');
  const [estimatedStudentCount, setEstimatedStudentCount] = useState<number | ''>(500);
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Fetch fallback coordinates from check-in or 0
      const lat = visit.checkInLat || 0;
      const lng = visit.checkInLng || 0;

      await SalesVisitService.checkOut(visit.id, {
        latitude: lat,
        longitude: lng,
        outcome,
        summary: summary.trim() || undefined,
        keyDiscussionPoints: keyDiscussionPoints.trim() || undefined,
        nextFollowUpDate: nextFollowUpDate || undefined,
        estimatedStudentCount: typeof estimatedStudentCount === 'number' ? estimatedStudentCount : undefined,
      });

      toast.success('Field visit completed and outcome recorded!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to complete visit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Complete Visit & Log Outcome</h3>
              <p className="text-xs text-emerald-100">{visit.institutionName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Outcome Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Visit Outcome
            </label>
            <div className="grid grid-cols-1 gap-2">
              {OUTCOME_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                    outcome === opt.value
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="outcome"
                      value={opt.value}
                      checked={outcome === opt.value}
                      onChange={(e) => setOutcome(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{opt.label}</span>
                  </div>
                  {outcome === opt.value && <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />}
                </label>
              ))}
            </div>
          </div>

          {/* Estimated Student Capacity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Estimated Students / Deal Capacity
            </label>
            <input
              type="number"
              min={0}
              value={estimatedStudentCount}
              onChange={(e) => setEstimatedStudentCount(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 500"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Meeting Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Meeting Summary & Notes
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Discussed online examination platform features, question paper generation, and student rank engine..."
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
            />
          </div>

          {/* Key Discussion Points */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Key Discussion Points
            </label>
            <textarea
              rows={2}
              value={keyDiscussionPoints}
              onChange={(e) => setKeyDiscussionPoints(e.target.value)}
              placeholder="Pricing structure, exam dates, integration timeline..."
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
            />
          </div>

          {/* Next Follow-Up Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Next Follow-Up Date
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Complete Visit'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
