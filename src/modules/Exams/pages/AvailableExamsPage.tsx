// ** Packages **
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText, Target, Award, BookOpen, ArrowRight, Search, Zap } from 'lucide-react';
import cn from 'classnames';

// ** Services **
import { useGetAvailableExamsAPI, useStartAttemptAPI } from '../services';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';
import { useAxiosGet } from '@/hooks/useAxios';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

// ** Types **
import type { Exam } from '@/types/exam.types';

const AvailableExamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [get] = useAxiosGet();

  // APIs
  const { getAvailableExamsAPI, isLoading } = useGetAvailableExamsAPI();
  const { startAttemptAPI, isLoading: isStarting } = useStartAttemptAPI();

  // State
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [examTargets, setExamTargets] = useState<{ id: string; name: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);

  // Load options on mount
  useEffect(() => {
    (async () => {
      const res = await get<{
        classes: { id: string; name: string }[];
        languages: { id: string; name: string }[];
        examTargets: { id: string; name: string }[];
      }>('/auth/options');
      if (res.data) {
        setExamTargets(res.data.examTargets || []);
        setLanguages(res.data.languages || []);

        // Auto-select user's exam target and language
        if (user?.studentProfile?.examTarget) {
          const target = (res.data.examTargets || []).find(
            (t) => t.name === user.studentProfile?.examTarget,
          );
          if (target) setSelectedTarget(target.id);
        }
        if (user?.studentProfile?.preferredLanguage) {
          const lang = (res.data.languages || []).find(
            (l) => l.name === user.studentProfile?.preferredLanguage,
          );
          if (lang) setSelectedLanguage(lang.id);
        }
      }
    })();
  }, [get, user]);

  // Load exams when target changes
  useEffect(() => {
    if (!selectedTarget) return;
    (async () => {
      const res = await getAvailableExamsAPI(selectedTarget);
      if (res.data) setExams(res.data);
    })();
  }, [selectedTarget, getAvailableExamsAPI]);

  // Filter exams by search
  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Start exam attempt
  const handleStartExam = async (examId: string) => {
    if (!selectedLanguage) {
      alert('Please select a language preference first.');
      return;
    }
    setStartingExamId(examId);
    const res = await startAttemptAPI(examId, selectedLanguage);
    setStartingExamId(null);

    if (res.data) {
      const attemptId = res.data.attemptId;
      navigate(`/exam/${examId}/attempt/${attemptId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-60 w-60 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute left-1/2 bottom-0 h-40 w-40 -translate-x-1/2 translate-y-12 rounded-full bg-purple-400/20 blur-2xl"></div>

        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-2">
            <Zap size={14} />
            <span>Live Mock Tests Available</span>
          </div>
          <h1 className="text-3xl font-extrabold">Available Exams</h1>
          <p className="mt-2 text-sm text-indigo-200 max-w-xl">
            Choose your exam below and start practicing. All tests are timed and scored
            automatically with detailed analysis.
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300"
              size={18}
            />
            <input
              type="text"
              placeholder="Search exams…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder-indigo-200 border border-white/20 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Exam Target Chips */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {examTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all',
                  selectedTarget === target.id
                    ? 'bg-white text-indigo-700 shadow-lg'
                    : 'bg-white/15 text-white hover:bg-white/25 border border-white/10',
                )}
              >
                {target.name}
              </button>
            ))}
          </div>

          {/* Language Selector */}
          <select
            value={selectedLanguage || ''}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-xl bg-white/15 px-4 py-2.5 text-xs font-medium text-white border border-white/20 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="" className="text-gray-900">
              Select Language
            </option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id} className="text-gray-900">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams Grid */}
      {isLoading ? (
        <Loader label="Loading available exams…" />
      ) : !selectedTarget ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Target className="mx-auto text-indigo-400 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-700">Select Your Exam Target</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose a target exam above to see available tests
          </p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto text-slate-400 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-700">No Exams Available</h3>
          <p className="mt-1 text-sm text-slate-500">
            No active exams for this target right now. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {/* Card Header Gradient Strip */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100">
                      <FileText size={12} />
                      {exam.examTarget?.name || 'General'}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{exam.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="mt-5 flex items-center gap-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-1.5">
                    <FileText size={14} className="text-indigo-500" />
                    <span>{exam.totalQuestions} Questions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span>{exam.totalMarks} Marks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-emerald-500" />
                    <span>{exam.durationMinutes} Mins</span>
                  </div>
                </div>

                {/* Scoring Info */}
                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="text-emerald-600 font-semibold">
                    +{exam.defaultMarksPerQuestion} correct
                  </span>
                  <span className="text-rose-500 font-semibold">
                    −{exam.defaultNegativeMarks} wrong
                  </span>
                </div>

                {/* Start Button */}
                <div className="mt-5">
                  <Button
                    variant="primary"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 font-bold text-sm shadow-md shadow-indigo-200/60 group-hover:shadow-lg group-hover:shadow-indigo-300/40 transition-all"
                    onClick={() => handleStartExam(exam.id)}
                    disabled={isStarting && startingExamId === exam.id}
                  >
                    {isStarting && startingExamId === exam.id ? (
                      'Starting Exam…'
                    ) : (
                      <>
                        Start Test
                        <ArrowRight
                          size={16}
                          className="ml-2 group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableExamsPage;
