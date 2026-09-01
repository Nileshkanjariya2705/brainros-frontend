import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Globe,
  Layers,
  Send,
  History,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ExamTranslationManager from '@/modules/RegionalLanguage/components/ExamTranslationManager';
import { useSubmitExamAPI } from '../services/examScheduling.service';
import { useAxiosGet } from '@/hooks/useAxios';
import { toast } from '@/utils/toast';

interface MockTestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: any | null;
  onUpdate: () => void;
  initialTab?: 'OVERVIEW' | 'QUESTIONS' | 'TRANSLATIONS' | 'APPROVAL';
}

export const MockTestDetailsModal: React.FC<MockTestDetailsModalProps> = ({
  isOpen,
  onClose,
  exam,
  onUpdate,
  initialTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUESTIONS' | 'TRANSLATIONS' | 'APPROVAL'>(initialTab);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const { submitExamAPI, isLoading: isSubmitting } = useSubmitExamAPI();
  const [getReq] = useAxiosGet();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && exam && activeTab === 'QUESTIONS') {
      setLoadingQuestions(true);
      getReq<any>(`/exams/${exam.id}`).then(({ data }) => {
        setLoadingQuestions(false);
        const payload = (data as any)?.data || data;
        if (payload?.examQuestions) {
          setQuestions(payload.examQuestions);
        }
      });
    }
  }, [isOpen, exam, activeTab, getReq]);

  if (!isOpen || !exam) return null;

  const handleSubmitForApproval = async () => {
    if (!window.confirm(`Submit "${exam.title}" for Super Admin review and approval?`)) {
      return;
    }

    const { error } = await submitExamAPI(exam.id, {
      comment: 'Mock test created and submitted for approval by Admin.',
    });

    if (error) {
      const err = typeof error === 'string' ? error : (error as any).message || 'Failed to submit';
      toast.error(err);
      return;
    }

    toast.success('Mock test submitted for approval successfully!');
    onUpdate();
    onClose();
  };

  const stName = exam.status?.name || exam.status || 'DRAFT';
  const isSubjectMock = exam.type === 'SUBJECT_MOCK' || (exam.subject && exam.subject.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-white/10">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/30 text-indigo-300 font-black text-[10px] uppercase">
                  {isSubjectMock ? 'Subject Mock' : 'Full Mock Test'}
                </span>
                <span className="text-xs text-slate-400">ID: {exam.id.substring(0, 8)}</span>
              </div>
              <h2 className="text-lg font-black tracking-tight">{exam.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50 text-xs font-bold overflow-x-auto shrink-0">
          {[
            { id: 'OVERVIEW', label: 'Overview & Metadata', icon: FileText },
            { id: 'QUESTIONS', label: 'Questions Pool', icon: Layers },
            { id: 'TRANSLATIONS', label: 'Regional Translations', icon: Globe },
            { id: 'APPROVAL', label: 'Approval & Governance', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                  <span className="text-sm font-black text-indigo-600">{stName}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Questions</span>
                  <span className="text-sm font-black text-slate-900">{exam.totalQuestions || 50}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration</span>
                  <span className="text-sm font-black text-slate-900">{exam.durationMinutes || 60}m</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl border border-slate-200 bg-white space-y-3">
                <h4 className="font-extrabold text-slate-800">Exam Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold">Subject(s):</span>
                    <span className="text-slate-800 font-bold">
                      {exam.subjectsSummary || exam.subject?.name || 'All Subjects'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Target Curriculum:</span>
                    <span className="text-slate-800 font-bold">
                      {exam.examTarget?.name || 'General Mock'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Created At:</span>
                    <span className="text-slate-800 font-bold">
                      {exam.createdAt ? new Date(exam.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">Created By:</span>
                    <span className="text-slate-800 font-bold">
                      {exam.createdBy?.name || exam.createdBy?.email || 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS */}
          {activeTab === 'QUESTIONS' && (
            <div className="space-y-4">
              {loadingQuestions ? (
                <div className="py-12 text-center text-slate-400">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-600">Question pool is bound to this immutable ExamVersion snapshot.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((eq: any, idx: number) => {
                    const q = eq.question || eq;
                    return (
                      <div key={eq.id || idx} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-indigo-700">Q#{idx + 1}</span>
                          <span className="text-slate-400">{q.type || 'SINGLE_CORRECT'}</span>
                        </div>
                        <p className="font-semibold text-slate-800">{q.translations?.[0]?.questionText || q.passage || 'Question statement'}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSLATIONS */}
          {activeTab === 'TRANSLATIONS' && (
            <div className="rounded-3xl border border-slate-200 overflow-hidden bg-white p-2">
              <ExamTranslationManager
                examId={exam.id}
                examTitle={exam.title}
                onBack={() => setActiveTab('OVERVIEW')}
              />
            </div>
          )}

          {/* TAB 4: APPROVAL */}
          {activeTab === 'APPROVAL' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-900 text-sm">Governance & Approval Status</h4>
                <p className="text-xs text-slate-500">
                  Mock Tests require Super Admin approval before becoming accessible to students in the testing portal.
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Current Status: {stName}</span>
                  {stName === 'DRAFT' && (
                    <Button
                      variant="primary"
                      onClick={handleSubmitForApproval}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      <Send size={14} />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit for Super Admin Approval'}</span>
                    </Button>
                  )}
                  {stName === 'SUBMITTED' && (
                    <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-800 font-bold">
                      Pending Super Admin Approval Queue
                    </span>
                  )}
                  {stName === 'APPROVED' && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Certified & Live for Students
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MockTestDetailsModal;
