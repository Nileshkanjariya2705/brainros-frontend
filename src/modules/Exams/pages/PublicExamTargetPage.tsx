import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Award,
  ArrowRight,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { useGetPublicExamsAPI } from '../services';
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import type { Exam } from '@/types/exam.types';

export const PublicExamTargetPage: React.FC = () => {
  const { targetOrSlug } = useParams<{ targetOrSlug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getPublicExamsAPI, isLoading } = useGetPublicExamsAPI();

  const [exams, setExams] = useState<Exam[]>([]);

  const targetName = (targetOrSlug || 'NEET').toUpperCase();

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
        return 'Prepare for NTA NEET UG entrance exam with automated online mock papers in Physics, Chemistry, and Biology. Get instant AI score reports and chapter accuracy diagnostics.';
      case 'JEE':
        return 'Master IIT JEE Main & Advanced entrance examination with online practice tests in Physics, Chemistry, and Mathematics. AI speed-accuracy analysis included.';
      case 'CET':
        return 'Comprehensive CET entrance mock tests and subject assessments with automated evaluation and multi-language paper generation.';
      default:
        return `Prepare for ${target} entrance examinations on Brainros with automated practice tests, AI score evaluation, and performance diagnostics.`;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicExamsAPI({ search: targetName, limit: 50 });
        const payload: any = res.data;
        if (Array.isArray(payload)) {
          setExams(payload);
        } else if (Array.isArray(payload?.data)) {
          setExams(payload.data);
        } else if (Array.isArray(payload?.exams)) {
          setExams(payload.exams);
        }
      } catch (err) {
        console.error('Failed to load target exams:', err);
      }
    })();
  }, [getPublicExamsAPI, targetName]);

  const targetExams = exams.filter(
    (ex) =>
      ex.examTarget?.name?.toUpperCase() === targetName ||
      ex.title.toUpperCase().includes(targetName),
  );

  const handleStartExam = () => {
    if (!isAuthenticated) {
      navigate(`${PUBLIC_NAVIGATION.login}?redirect=${encodeURIComponent(PRIVATE_NAVIGATION.availableExams)}`);
    } else {
      navigate(PRIVATE_NAVIGATION.availableExams);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${targetName} Online Examination & Practice Preparation`,
    description: getTargetDescription(targetName),
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Brainros',
      url: 'https://www.brainros.com',
    },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <SeoHead
        title={getTargetTitle(targetName)}
        description={getTargetDescription(targetName)}
        canonicalPath={`/exams/${targetName.toLowerCase()}`}
        jsonLd={jsonLd}
      />

      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex text-xs font-semibold text-slate-400 mb-6 space-x-2">
          <Link to="/" className="hover:text-indigo-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/exams" className="hover:text-indigo-400 transition-colors">
            Exams
          </Link>
          <span>/</span>
          <span className="text-indigo-400 font-bold">{targetName}</span>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-slate-800/80 via-slate-800/50 to-indigo-950/40 border border-slate-700/60 rounded-3xl p-8 sm:p-12 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4">
            <Award size={14} /> {targetName} Exam Preparation Hub
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            {targetName} Practice Exams & Mock Test Preparation
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed mb-8">
            {getTargetDescription(targetName)} Access simulated test series, subject diagnostics, time management pacing tools, and multi-language paper translation on Brainros.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleStartExam}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <BookOpen size={16} /> Take {targetName} Mock Test
            </button>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Subjects Covered */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold text-white mb-6">Subject Breakdown & Syllabus Covered</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map((subject) => (
              <div key={subject} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
                  {subject[0]}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{subject}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chapter-wise practice questions, formula mastery, and diagnostic scoring for {targetName}.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Target Exams List */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Available {targetName} Mock Examinations</h2>
          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading practice tests...</div>
          ) : targetExams.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8 text-center text-slate-300 text-sm">
              Featured {targetName} test series papers available in student portal upon login.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {targetExams.map((ex) => (
                <div
                  key={ex.id}
                  className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{ex.title}</h3>
                    <p className="text-xs text-slate-300 mb-4 line-clamp-2">{ex.description}</p>
                  </div>
                  <button
                    onClick={handleStartExam}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    Start {targetName} Practice Test <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-800 text-center py-8 text-xs text-slate-500">
        © {new Date().getFullYear()} Brainros. All rights reserved.
      </footer>
    </div>
  );
};

export default PublicExamTargetPage;
