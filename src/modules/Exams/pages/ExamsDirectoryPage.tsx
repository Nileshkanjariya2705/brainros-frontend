import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Play,
  Star,
  Users,
  Languages,
  Check,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { DUMMY_EXAMS } from '../constants/dummyExams.constant';

export const ExamsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  const targetCategories = ['ALL', 'JEE', 'NEET', 'CET', 'FOUNDATION'];
  const difficultyFilters = ['ALL', 'Standard NTA', 'Moderate', 'Advanced', 'Mastery'];

  const filteredExams = useMemo(() => {
    return DUMMY_EXAMS.filter((ex) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTarget =
        selectedTarget === 'ALL' || ex.target.toUpperCase() === selectedTarget.toUpperCase();

      const matchesDifficulty =
        selectedDifficulty === 'ALL' || ex.difficulty === selectedDifficulty;

      return matchesSearch && matchesTarget && matchesDifficulty;
    });
  }, [searchQuery, selectedTarget, selectedDifficulty]);

  const handleStartExam = (_examId: string) => {
    if (!isAuthenticated) {
      navigate(
        `${PUBLIC_NAVIGATION.login}?redirect=${encodeURIComponent(PRIVATE_NAVIGATION.availableExams)}`,
      );
    } else {
      navigate(PRIVATE_NAVIGATION.availableExams);
    }
  };

  const getTargetBadgeStyle = (target: string) => {
    switch (target) {
      case 'JEE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'NEET':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FOUNDATION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'JEE, NEET & CET Online Exams & Mock Test Series',
      url: 'https://www.brainros.com/exams',
      description:
        'Explore supported entrance exams: JEE, NEET, and State CET with accurate subject blueprints, global subject structures, and active online mock tests.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.brainros.com/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Exams & Solutions',
          item: 'https://www.brainros.com/exams',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="JEE, NEET & CET Online Exams & Mock Test Series | Brainros"
        description="Browse online practice test series and competitive entrance exams for JEE, NEET, and CET. Practice with authentic NTA-pattern question papers and instant score breakdowns."
        canonicalPath="/exams"
        jsonLd={jsonLd}
      />

      {/* Header Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50/50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center justify-center text-xs font-semibold text-slate-400 mb-6 space-x-2"
          >
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-indigo-600 font-bold">Exams</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs mb-6">
            <Sparkles size={14} className="text-indigo-600" />
            <span>NTA Standard Pattern • JEE • NEET • CET Mock Catalog</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Competitive Exam Solutions &amp;{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Test Series
            </span>
          </h1>

          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Practice with authentic NTA-standard mock exam templates featuring multi-language AI translation, accurate negative marking rules, and instant percentile analytics.
          </p>

          {/* Quick Metrics */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>100% NTA &amp; State Syllabus Aligned</span>
            </div>
            <div className="flex items-center gap-2">
              <Languages size={16} className="text-indigo-600" />
              <span>9 Regional Languages Supported</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-600" />
              <span>75,000+ Enrolled Aspirants</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXAM TYPES & SUBJECT BLUEPRINTS ───────────────────────── */}
      <section className="py-12 sm:py-16 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Authentic Subject Structures
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Supported Entrance Exam Blueprints
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Subjects remain standardized and global (Physics, Chemistry, Mathematics, Biology), while blueprints enforce section rules and scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* JEE */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/40 via-white to-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider bg-indigo-100/80 px-2.5 py-1 rounded-md">
                    Engineering
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">300 Marks</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2">JEE Main &amp; Advanced</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  National testing pattern for admission to IITs, NITs, and premier engineering institutions.
                </p>

                <div className="border-t border-indigo-100 pt-3 mb-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Subject Structure:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                      <span><strong>Physics:</strong> Section A (MCQs) + Section B (Numerical)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                      <span><strong>Chemistry:</strong> Physical, Inorganic &amp; Organic</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                      <span><strong>Mathematics:</strong> Calculus, Algebra &amp; Geometry</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Marking: +4 / -1 Scheme</span>
                <Link to="/exams/jee" className="text-indigo-600 font-bold hover:underline flex items-center gap-1">
                  View JEE Hub &rarr;
                </Link>
              </div>
            </div>

            {/* NEET */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/40 via-white to-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider bg-emerald-100/80 px-2.5 py-1 rounded-md">
                    Medical
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">720 Marks</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2">NEET UG Medical</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  National eligibility cum entrance test for MBBS, BDS, and AYUSH admissions across India.
                </p>

                <div className="border-t border-emerald-100 pt-3 mb-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Subject Structure:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span><strong>Physics:</strong> 45 questions (Section A &amp; B)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span><strong>Chemistry:</strong> 45 questions (Section A &amp; B)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span><strong>Biology:</strong> 90 questions (Botany + Zoology)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Marking: +4 / -1 Scheme</span>
                <Link to="/exams/neet" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                  View NEET Hub &rarr;
                </Link>
              </div>
            </div>

            {/* CET */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/40 via-white to-white p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider bg-blue-100/80 px-2.5 py-1 rounded-md">
                    State Engineering &amp; Pharma
                  </span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">200 Marks</span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2">State CET (PCM / PCB)</h3>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  State-level common entrance test for engineering, pharmacy, and agriculture admissions.
                </p>

                <div className="border-t border-blue-100 pt-3 mb-4">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Subject Structure:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                      <span><strong>Physics:</strong> 50 questions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                      <span><strong>Chemistry:</strong> 50 questions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                      <span><strong>Math / Biology:</strong> Stream specific</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Marking: No negative marking</span>
                <Link to="/exams/cet" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                  View CET Hub &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTIVE TEST SERIES BROWSER ────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Mock Test Catalog
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Featured Practice Exam Templates
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Explore curated full-length tests and subject sprints matching official examination standards.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, target, or subject..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Target Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-2">
                <Filter size={13} />
                <span>Target:</span>
              </span>
              {targetCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedTarget(cat)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                    selectedTarget === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Tier:</span>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {difficultyFilters.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff === 'ALL' ? 'All Difficulties' : diff}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exam Cards Grid */}
          {filteredExams.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto my-8">
              <BookOpen className="mx-auto text-slate-400 mb-3" size={36} />
              <h4 className="text-sm font-bold text-slate-800">No matching mock tests found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting a different target category or adjusting your search keyword.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTarget('ALL');
                  setSelectedDifficulty('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between relative group"
                >
                  <div>
                    {/* Top Row Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold border ${getTargetBadgeStyle(
                            exam.target,
                          )}`}
                        >
                          {exam.targetBadge}
                        </span>
                        <span className="rounded-lg bg-amber-50 border border-amber-200/60 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {exam.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Star size={12} fill="currentColor" />
                        <span>{exam.rating}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors mb-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {exam.description}
                    </p>

                    {/* Subjects Pill Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {exam.subjects.map((sub, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-semibold"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    {/* Exam Specs Grid */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Duration
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {exam.durationMinutes} Mins
                        </span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Total Marks
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {exam.totalMarks} Marks
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Questions
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {exam.totalQuestions} Qs
                        </span>
                      </div>
                    </div>

                    {/* Key Features List */}
                    <div className="space-y-1.5 mb-5 text-[11px] text-slate-600">
                      {exam.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <span>{exam.enrolledCount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartExam(exam.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <Play size={12} />
                        <span>Launch Exam</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ExamsDirectoryPage;
