import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Languages,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import PublicNavbar from '@/components/layout/PublicNavbar';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';

export const AboutPage: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Brainros',
    url: 'https://www.brainros.com',
    logo: 'https://www.brainros.com/logo.svg',
    description:
      'Brainros is an AI-powered online examination and evaluation platform for competitive entrance exams, institutional assessment, and multi-language paper generation.',
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <SeoHead
        title="About Brainros — AI Online Examination & Assessment Platform"
        description="Learn how Brainros empowers educational institutions, teachers, and students with AI-driven exam creation, multi-language paper translation, and instant performance diagnostics."
        canonicalPath="/about"
        jsonLd={jsonLd}
      />

      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <nav className="flex text-xs font-semibold text-slate-400 mb-8 space-x-2">
          <Link to="/" className="hover:text-indigo-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-indigo-400">About Us</span>
        </nav>

        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
            <BrainCircuit size={16} /> Empowering Modern Education
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Brainros</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Brainros is an advanced, AI-powered online examination, assessment, and analytics ecosystem designed for competitive exams like NEET, JEE, CET, and institutional testing across regional languages.
          </p>
        </section>

        {/* Core Pillars */}
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <BrainCircuit size={24} />
            </div>
            <h2 className="text-xl font-bold mb-3 text-white">AI-Powered Evaluation</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated scoring, strategy analysis, speed-accuracy profiling, and personalized performance diagnostic reports generated instantly upon exam submission.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
              <Languages size={24} />
            </div>
            <h2 className="text-xl font-bold mb-3 text-white">Regional Language Translation</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Break language barriers with automated multi-language question paper translation supporting Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, and Bengali.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8 hover:border-indigo-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-bold mb-3 text-white">Institutional Exam Portal</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Secure batch management, candidate rankings, parent progress portals, and comprehensive analytics for schools, coaching institutes, and universities.
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Ready to Experience Next-Gen Testing?</h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm mb-8">
            Join thousands of students and educators taking online practice tests and competitive entrance exam preparation on Brainros.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/exams"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30"
            >
              <BookOpen size={16} /> Explore Available Exams
            </Link>
            <Link
              to={PUBLIC_NAVIGATION.register}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 text-center py-8 text-xs text-slate-500">
        © {new Date().getFullYear()} Brainros. All rights reserved. Online Examination & Educational Portal.
      </footer>
    </div>
  );
};

export default AboutPage;
