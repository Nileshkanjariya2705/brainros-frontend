import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Search, Clock, Filter, ArrowRight } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { useGetPublicExamsAPI } from '../services';
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import type { Exam } from '@/types/exam.types';

export const ExamsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getPublicExamsAPI, isLoading } = useGetPublicExamsAPI();

  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicExamsAPI({ limit: 100 });
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

  const handleStartExam = (_examId: string) => {
    if (!isAuthenticated) {
      navigate(`${PUBLIC_NAVIGATION.login}?redirect=${encodeURIComponent(PRIVATE_NAVIGATION.availableExams)}`);
    } else {
      navigate(PRIVATE_NAVIGATION.availableExams);
    }
  };

  const jsonLd = {
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
        name: 'Exams Directory',
        item: 'https://www.brainros.com/exams',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <SeoHead
        title="Public Practice Exams & Mock Test Directory — Brainros"
        description="Browse competitive online examination practice tests for NEET, JEE, CET, SSC, and state entrance tests with instant evaluation, speed-accuracy profiling, and multi-language support."
        canonicalPath="/exams"
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
          <span className="text-indigo-400">Exams</span>
        </nav>

        {/* Page Header */}
        <section className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Online Examination & Practice Test Directory
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Select a target examination below to access online mock papers, chapter assessments, and full-length practice tests evaluated by Brainros AI.
          </p>
        </section>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam title, subject, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <Filter size={16} className="text-slate-400 shrink-0 hidden sm:block" />
            {['ALL', 'NEET', 'JEE', 'CET'].map((target) => (
              <button
                key={target}
                onClick={() => setSelectedTarget(target)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTarget.toUpperCase() === target.toUpperCase()
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {target === 'ALL' ? 'All Exams' : target}
              </button>
            ))}
            <Link
              to="/exams/neet"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
            >
              NEET Hub
            </Link>
            <Link
              to="/exams/jee"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
            >
              JEE Hub
            </Link>
          </div>
        </div>

        {/* Exams Grid */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Loading public exams directory...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center max-w-md mx-auto">
            <BookOpen className="mx-auto text-slate-500 mb-4" size={40} />
            <h3 className="text-lg font-bold text-white mb-1">No Practice Exams Found</h3>
            <p className="text-xs text-slate-400">
              Try adjusting your search filter or category selection.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((ex) => (
              <div
                key={ex.id}
                className="bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl p-6 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {ex.examTarget?.name || 'General Exam'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock size={14} /> {ex.durationMinutes} mins
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2 line-clamp-1">{ex.title}</h2>
                  <p className="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                    {ex.description || 'Full-length online examination with automated evaluation and AI performance analytics.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700/40 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Total Marks: <span className="font-bold text-emerald-400">{ex.totalMarks}</span>
                  </div>

                  <button
                    onClick={() => handleStartExam(ex.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
                  >
                    Start Test <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 text-center py-8 text-xs text-slate-500">
        © {new Date().getFullYear()} Brainros. All rights reserved.
      </footer>
    </div>
  );
};

export default ExamsDirectoryPage;
