// ** Packages **
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Award,
  Search,
  Languages,
  CheckCircle2,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Globe,
  Play,
  Filter,
  BarChart3,
} from 'lucide-react';

// ** Services & Hooks **
import { useGetPublicExamsAPI } from '@/modules/Exams/services';
import { useAuth } from '@/hooks/useAuth';

// ** Constants **
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { SUPPORTED_EXAM_LANGUAGES } from '@/constants/languages.constant';

// ** Types **
import type { Exam } from '@/types/exam.types';

// ** Components **
import PublicNavbar from '@/components/layout/PublicNavbar';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getPublicExamsAPI, isLoading } = useGetPublicExamsAPI();

  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');

  // Load public exams list
  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicExamsAPI({ limit: 50 });
        const payload: any = res.data;
        if (Array.isArray(payload)) {
          setExams(payload);
        } else if (Array.isArray(payload?.data)) {
          setExams(payload.data);
        } else if (Array.isArray(payload?.exams)) {
          setExams(payload.exams);
        }
      } catch (err) {
        console.error('Failed to load public exams:', err);
      }
    })();
  }, [getPublicExamsAPI]);

  // Extract unique exam target categories
  const targetCategories = useMemo(() => {
    const targets = new Set<string>();
    exams.forEach((ex) => {
      if (ex.examTarget?.name) targets.add(ex.examTarget.name);
    });
    return ['ALL', ...Array.from(targets)];
  }, [exams]);

  // Filtered exams based on search query and category
  const filteredExams = useMemo(() => {
    return exams.filter((ex) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.examTarget?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTarget =
        selectedTarget === 'ALL' ||
        ex.examTarget?.name?.toUpperCase() === selectedTarget.toUpperCase();

      return matchesSearch && matchesTarget;
    });
  }, [exams, searchQuery, selectedTarget]);

  // Handle Start Test Click
  const handleStartTestClick = (_examId: string) => {
    if (!isAuthenticated) {
      // Redirect unauthenticated visitor to login
      navigate(
        `${PUBLIC_NAVIGATION.login}?redirect=${encodeURIComponent(PRIVATE_NAVIGATION.availableExams)}`,
      );
    } else {
      // Direct authenticated student to available exams list
      navigate(PRIVATE_NAVIGATION.availableExams);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-200 selection:text-indigo-900">
      {/* ══ TOP NAVIGATION NAVBAR ═══════════════════════════════════ */}
      <PublicNavbar />

      {/* ══ HERO BANNER SECTION ═════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-purple-600/15 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-6 backdrop-blur-md">
            <Sparkles size={13} className="text-indigo-400 animate-spin-slow" />
            <span>Official NTA Pattern Mock Test Series 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
            India's Most Authoritative <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Multilingual Test Series Platform
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Practice national and state-level competitive exams with real examination software
            simulation, instant multilingual language switching across 9 regional Indian languages,
            and deep AI rank predictions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-black/5 p-4 backdrop-blur-sm">
              <span className="block text-2xl font-black text-slate-900">9</span>
              <span className="text-xs text-slate-500 font-medium">Regional Languages</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-black/5 p-4 backdrop-blur-sm">
              <span className="block text-2xl font-black text-indigo-400">100%</span>
              <span className="text-xs text-slate-500 font-medium">NTA Standard GUI</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-black/5 p-4 backdrop-blur-sm">
              <span className="block text-2xl font-black text-purple-400">99.8%</span>
              <span className="text-xs text-slate-500 font-medium">AI Rank Precision</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-black/5 p-4 backdrop-blur-sm">
              <span className="block text-2xl font-black text-emerald-400">0 ms</span>
              <span className="text-xs text-slate-500 font-medium">In-Flight Lang Switch</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TEST SERIES CART & CATALOG SECTION ══════════════════════ */}
      <section id="test-series" className="py-12 border-t border-slate-200 bg-slate-50/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
                <BookOpen size={14} />
                <span>Active Examination Catalog</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Explore Available Test Series
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select any mock test to view blueprint specifications and launch your examination.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                size={15}
              />
              <input
                type="text"
                placeholder="Search mock series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-black/5 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 mr-2">
              <Filter size={13} />
              <span>Target Exam:</span>
            </span>
            {targetCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedTarget(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  selectedTarget === cat
                    ? 'bg-indigo-600 text-slate-900 shadow-md shadow-indigo-500/30'
                    : 'border border-slate-200 bg-black/5 text-slate-600 hover:bg-black/10 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ══ TEST SERIES CARDS GRID ("Cart / Card" Showcase) ═════════ */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="h-64 rounded-2xl border border-slate-200 bg-black/5 animate-pulse p-6 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-5 w-24 bg-black/10 rounded-md" />
                    <div className="h-6 w-3/4 bg-black/10 rounded-md" />
                    <div className="h-4 w-full bg-black/10 rounded-md" />
                  </div>
                  <div className="h-10 w-full bg-black/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-black/5 p-12 text-center max-w-md mx-auto my-8">
              <BookOpen size={40} className="mx-auto text-slate-500 mb-3" />
              <h3 className="text-base font-bold text-slate-900">No Test Series Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try clearing search filters or check back shortly for upcoming scheduled mocks.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTarget('ALL');
                }}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-indigo-500"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const targetName = exam.examTarget?.name || 'General';
                return (
                  <div
                    key={exam.id}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xl hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all flex flex-col justify-between"
                  >
                    {/* Top Badges */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 text-[11px] font-bold text-indigo-300">
                          <Award size={12} />
                          {targetName}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 size={11} />
                          Active Mock
                        </span>
                      </div>

                      {/* Exam Title & Details */}
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-300 transition-colors line-clamp-2">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>
                      )}

                      {/* Test Specs Grid */}
                      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-black/5 p-3 text-center border border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-500 block font-medium">
                            Questions
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {exam.totalQuestions} Qs
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-medium">
                            Duration
                          </span>
                          <span className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
                            <Clock size={12} className="text-amber-400" />
                            {exam.durationMinutes}m
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block font-medium">
                            Total Marks
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {exam.totalMarks} M
                          </span>
                        </div>
                      </div>

                      {/* Multilingual Support Pill */}
                      <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-slate-600 bg-purple-500/10 border border-purple-500/20 rounded-lg px-2.5 py-1.5">
                        <Languages size={13} className="text-purple-400 shrink-0" />
                        <span className="truncate">Available in 9 Regional Languages</span>
                      </div>
                    </div>

                    {/* Card Action Button */}
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleStartTestClick(exam.id)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-lg shadow-indigo-500/25 transition-all group-hover:scale-[1.02] active:scale-95"
                      >
                        <Play size={14} className="fill-white" />
                        <span>Start Test</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══ SUPPORTED 9 REGIONAL LANGUAGES SHOWCASE ═════════════════ */}
      <section id="languages" className="py-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300 mb-3">
              <Globe size={13} />
              <span>Multilingual Exam Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Instant Question Switching in 9 Languages
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Every mock question and option is available in standard Indian regional languages.
              Switch language at any second during the live exam without losing selected answers or
              timer state.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
            {SUPPORTED_EXAM_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className="rounded-2xl border border-slate-200 bg-black/5 p-3.5 text-center hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group"
              >
                <span className="block text-base font-bold text-slate-900 group-hover:text-indigo-300">
                  {lang.nativeName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {lang.name}
                </span>
                <span className="inline-block mt-1 text-[9px] uppercase font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                  {lang.code}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PLATFORM FEATURES GRID ══════════════════════════════════ */}
      <section id="features" className="py-16 border-t border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Why Candidates Choose Brainros
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Engineered to match official exam servers with strict authoritative timing and
              granular performance analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Authoritative Server Timing</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Countdown clocks synchronized with server authority. Offline auto-save and tab
                switches are securely logged without exam loss.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Deep Diagnostic Analysis</h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Instant post-exam breakdown by subject, chapter accuracy, time-spent fatigue,
                uncalculated guesses, and negative mark leaks.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="h-10 w-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                AI Rank & Percentile Prediction
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Empirical historical normalization against real past cutoff datasets gives you your
                predicted all-India percentile.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════ */}
      <footer className="border-t border-slate-200 bg-slate-100 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BrainCircuit size={18} className="text-indigo-400" />
            <span className="font-bold text-slate-600">BRAINROS MOCK LMS</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to={PUBLIC_NAVIGATION.login} className="hover:text-slate-600 transition-colors">
              Student Login
            </Link>
            <Link
              to={PUBLIC_NAVIGATION.register}
              className="hover:text-slate-600 transition-colors"
            >
              Register
            </Link>
            <a href="#test-series" className="hover:text-slate-600 transition-colors">
              Test Series
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
