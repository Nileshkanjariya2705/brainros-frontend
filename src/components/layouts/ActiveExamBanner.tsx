import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface ActiveExamInfo {
  attemptId: string;
  examId: string;
  examTitle: string;
  serverEndTime?: string;
  startedAt?: string;
}

export const ActiveExamBanner: React.FC = () => {
  const navigate = useNavigate();
  const [activeExam, setActiveExam] = useState<ActiveExamInfo | null>(null);

  useEffect(() => {
    const checkActiveExam = () => {
      try {
        const stored = localStorage.getItem('brainros_active_exam');
        if (!stored) {
          setActiveExam(null);
          return;
        }
        const parsed: ActiveExamInfo = JSON.parse(stored);
        if (parsed.serverEndTime) {
          const endMs = new Date(parsed.serverEndTime).getTime();
          if (Date.now() > endMs) {
            localStorage.removeItem('brainros_active_exam');
            setActiveExam(null);
            return;
          }
        }
        setActiveExam(parsed);
      } catch {
        setActiveExam(null);
      }
    };

    checkActiveExam();
    const interval = setInterval(checkActiveExam, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!activeExam) return null;

  return (
    <div className="relative z-30 flex items-center justify-between border-b border-amber-300 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-4 py-2.5 text-white shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/20">
          <Clock size={16} className="animate-pulse text-white" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs font-black tracking-wide uppercase">
            Active Examination in Progress:
          </span>
          <span className="text-xs font-bold text-amber-100 truncate max-w-[200px] sm:max-w-md">
            {activeExam.examTitle || 'Examination'}
          </span>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={() =>
          navigate(`/exam/${activeExam.examId}/attempt/${activeExam.attemptId}`)
        }
        className="shrink-0 bg-white text-amber-900 hover:bg-amber-50 font-black text-xs px-3.5 py-1.5 shadow-xs flex items-center gap-1.5"
      >
        <span>Return to Exam</span>
        <ExternalLink size={13} />
      </Button>
    </div>
  );
};
