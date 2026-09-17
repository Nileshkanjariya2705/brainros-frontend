import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ExamTranslationManager } from '../components/ExamTranslationManager';
import { useAxiosGet } from '@/hooks/useAxios';

export const TranslationManagerPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [getReq] = useAxiosGet();
  const [examTitle, setExamTitle] = useState<string>('');

  useEffect(() => {
    if (examId) {
      getReq<any>(`/exams/${examId}`).then(({ data }) => {
        if (data && data.title) {
          setExamTitle(data.title);
        }
      });
    }
  }, [examId, getReq]);

  if (!examId) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center space-y-4">
        <Globe className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Exam ID is missing</h2>
        <p className="text-xs text-slate-500">
          Please select a valid scheduled exam to manage translations.
        </p>
        <Button onClick={() => navigate('/admin/exam-scheduling')}>
          Back to Scheduled Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Translation Manager</h1>
            <p className="text-xs text-slate-500">
              Exam: {examTitle || examId.slice(0, 8)} • Supported Languages & Background BullMQ
              Processing
            </p>
          </div>
        </div>
      </div>

      {/* Main Translation Manager Component */}
      <ExamTranslationManager
        examId={examId}
        examTitle={examTitle}
        onBack={() => navigate(-1)}
      />
    </div>
  );
};

export default TranslationManagerPage;
