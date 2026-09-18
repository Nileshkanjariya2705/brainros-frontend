import React from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Award,
  ArrowRight,
  Play,
  Layers,
  Star,
  CheckCircle2,
  Check,
  Users,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { DUMMY_EXAMS } from '../constants/dummyExams.constant';

export const PublicExamTargetPage: React.FC = () => {
  const { targetOrSlug } = useParams<{ targetOrSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const inferredFromPath = location.pathname.split('/').filter(Boolean).pop();
  const rawTarget = targetOrSlug || inferredFromPath || 'NEET';
  const targetName = rawTarget.toUpperCase();

  const getTargetTitle = (target: string) => {
    switch (target) {
      case 'NEET':
        return 'NEET Online Exams & Mock Practice Tests | Brainros';
      case 'JEE':
        return 'JEE Main & Advanced Online Practice Exams | Brainros';
      case 'CET':
        return 'CET Entrance Practice Tests & Exam Preparation | Brainros';
      default:
        return `${target} Online Examination & Mock Practice Tests | Brainros`;
    }
  };

  const getTargetDescription = (target: string) => {
    switch (target) {
      case 'NEET':
        return 'Prepare for NTA NEET UG entrance exam with online mock papers in Physics, Chemistry, and Biology. Get instant AI score reports and chapter accuracy diagnostics.';
      case 'JEE':
        return 'Master IIT JEE Main & Advanced entrance examination with online practice tests in Physics, Chemistry, and Mathematics. AI speed-accuracy analysis included.';
      case 'CET':
        return 'Comprehensive CET entrance mock tests and subject assessments with automated evaluation and multi-language paper generation.';
      default:
        return `Prepare for ${target} entrance examinations on Brainros with automated practice tests, AI score evaluation, and performance diagnostics.`;
    }
  };

  // Accurate Subject mapping per target
  const getSubjectsForTarget = (target: string) => {
    switch (target) {
      case 'JEE':
        return [
          { name: 'Physics', desc: 'Mechanics, Electrodynamics, Optics & Modern Physics' },
          { name: 'Chemistry', desc: 'Physical, Inorganic & Organic Chemistry' },
          { name: 'Mathematics', desc: 'Algebra, Calculus, Coordinate Geometry & Trigonometry' },
        ];
      case 'NEET':
        return [
          { name: 'Physics', desc: 'Mechanics, Thermodynamics, Electromagnetism & Modern Physics' },
          { name: 'Chemistry', desc: 'Physical Chemistry, Inorganic Chemistry & Organic Chemistry' },
          { name: 'Biology', desc: 'Botany & Zoology: Cell Biology, Genetics, Ecology & Physiology' },
        ];
      case 'CET':
      default:
        return [
          { name: 'Physics', desc: 'State board curriculum aligned physics concepts' },
          { name: 'Chemistry', desc: 'State board curriculum aligned chemistry principles' },
          { name: 'Mathematics', desc: 'Engineering stream mathematical foundations' },
          { name: 'Biology', desc: 'Medical and pharmacy stream biological foundations' },
        ];
    }
  };

  const targetExams = DUMMY_EXAMS.filter(
    (ex) =>
      ex.target.toUpperCase() === targetName ||
      ex.targetBadge.toUpperCase().includes(targetName) ||
      ex.title.toUpperCase().includes(targetName),
  );

  const handleStartExam = (_examId?: string) => {
    if (!isAuthenticated) {
      navigate(
        `${PUBLIC_NAVIGATION.login}?redirect=${encodeURIComponent(PRIVATE_NAVIGATION.availableExams)}`,
      );
    } else {
      navigate(PRIVATE_NAVIGATION.availableExams);
    }
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: `${targetName} Online Examination & Practice Preparation`,
      description: getTargetDescription(targetName),
      provider: {
        '@type': 'EducationalOrganization',
        name: 'Brainros',
        url: 'https://www.brainros.com',
        logo: 'https://www.brainros.com/logo.svg',
      },
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
          name: 'Exams',
          item: 'https://www.brainros.com/exams',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: targetName,
          item: `https://www.brainros.com/exams/${targetName.toLowerCase()}`,
        },
      ],
    },
  ];

  const subjects = getSubjectsForTarget(targetName);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title={getTargetTitle(targetName)}
        description={getTargetDescription(targetName)}
        canonicalPath={`/exams/${targetName.toLowerCase()}`}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex text-xs font-semibold text-slate-400 mb-6 space-x-2"
        >
          <Link to="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/exams" className="hover:text-indigo-600 transition-colors">
            Exams
          </Link>
          <span>/</span>
          <span className="text-indigo-600 font-bold">{targetName}</span>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-white border border-indigo-100 rounded-3xl p-8 sm:p-12 mb-12 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 mb-4">
            <Award size={14} /> {targetName} Exam Preparation Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
            {targetName} Practice Exams &amp; Mock Test Series
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed mb-8">
            {getTargetDescription(targetName)}
          </p>

          <div className="flex flex-wrap gap-3.5">
            <button
              onClick={() => handleStartExam()}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/25 hover:scale-105 active:scale-95"
            >
              <Play size={14} /> Take {targetName} Mock Test
            </button>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200 shadow-xs transition-all"
            >
              Create Free Account <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Accurate Subject Breakdown */}
        <section className="mb-14">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={18} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Syllabus Structure
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Subject Structure for {targetName}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => (
              <div
                key={sub.name}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-indigo-300 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
                  {sub.name[0]}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{sub.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{sub.desc}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-indigo-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  <span>Standard Global Subject</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Target Exams List */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Available {targetName} Mock Tests
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Full-length assessments and high-yield sprints matching latest NTA standards.
              </p>
            </div>
            <Link
              to="/exams"
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>View All Exams Catalog &rarr;</span>
            </Link>
          </div>

          {targetExams.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-600 text-xs shadow-xs">
              <BookOpen className="mx-auto text-slate-400 mb-2" size={30} />
              <h4 className="font-bold text-slate-800 text-sm">No specific {targetName} mock tests found</h4>
              <p className="text-slate-500 mt-1">
                Browse our full catalog on the{' '}
                <Link to="/exams" className="text-indigo-600 underline font-bold">
                  Exams Directory
                </Link>{' '}
                page or log in to view institutional series.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {targetExams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-extrabold text-indigo-700">
                          {ex.targetBadge}
                        </span>
                        <span className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {ex.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                        <Star size={12} fill="currentColor" />
                        <span>{ex.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                      {ex.title}
                    </h3>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      {ex.description}
                    </p>

                    {/* Specs Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center mb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Duration
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {ex.durationMinutes} Mins
                        </span>
                      </div>
                      <div className="border-x border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Total Marks
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {ex.totalMarks} Marks
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                          Questions
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {ex.totalQuestions} Qs
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-1.5 mb-5 text-[11px] text-slate-600">
                      {ex.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <span>{ex.enrolledCount}</span>
                    </div>

                    <button
                      onClick={() => handleStartExam(ex.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-105 active:scale-95"
                    >
                      <Play size={12} />
                      <span>Start Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicExamTargetPage;
