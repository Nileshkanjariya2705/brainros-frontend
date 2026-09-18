import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  Users,
  School,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';

export const AboutPage: React.FC = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Brainros',
      url: 'https://www.brainros.com',
      logo: 'https://www.brainros.com/logo.svg',
      description:
        'Brainros is an online examination and evaluation platform for competitive entrance exams, institutional assessment, and multi-language paper generation.',
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
          name: 'About Us',
          item: 'https://www.brainros.com/about',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="About Brainros — Online Examination & Education Platform"
        description="Learn how Brainros empowers schools, coaching institutes, and students with standardized NTA-pattern online exams, multilingual AI translations, and granular diagnostic analytics."
        canonicalPath="/about"
        jsonLd={jsonLd}
      />

      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-indigo-50/50 via-white to-white border-b border-slate-100">
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
            <span className="text-indigo-600 font-bold">About Us</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            <BrainCircuit size={15} />
            <span>Our Purpose &amp; Platform Mission</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Empowering Educational Institutions with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Modern Online Assessments
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Brainros is an advanced online examination, assessment, and analytics ecosystem designed specifically for competitive entrance exams like <strong>JEE, NEET, and State CET</strong>. We help schools, coaching institutes, and students transition from cumbersome manual testing to standardized, multilingual digital assessments.
          </p>
        </div>
      </section>

      {/* Core Mission & Vision */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                The Core Vision
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Why Brainros Was Created
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                National competitive entrance tests are conducted via computer-based testing software with standardized interfaces, strict timing rules, and negative marking. Yet millions of students still practice predominantly using paper sheets, and educators spend hours printing, distributing, and manually grading question papers.
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Brainros was built to solve these fundamental bottlenecks: eliminating exam hall interface intimidation for students, freeing educators from grading overhead, and breaking regional language barriers with automated question translation.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Official Exam Parity</h4>
                    <p className="text-xs text-slate-500">
                      Mirroring the real NTA test interface so students enter exam halls with total confidence.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Multilingual Inclusivity</h4>
                    <p className="text-xs text-slate-500">
                      Making high-quality practice papers accessible in 9 regional Indian languages.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Diagnostic Clarity</h4>
                    <p className="text-xs text-slate-500">
                      Providing instant percentile ranks, speed vs accuracy profiling, and weak topic insights.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                The Problems Brainros Solves
              </h3>
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-rose-600 block mb-1">Traditional Problem:</span>
                  <p className="text-slate-600">
                    Delayed result turnaround: manual paper marking takes days or weeks, delaying timely student feedback and remediation.
                  </p>
                  <span className="font-bold text-emerald-600 block mt-2 mb-1">Brainros Solution:</span>
                  <p className="text-slate-600">
                    Instant automated evaluation the moment an exam is submitted, with full score breakdowns and peer percentiles.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-rose-600 block mb-1">Traditional Problem:</span>
                  <p className="text-slate-600">
                    Language barriers: students comfortable in regional languages often lack translated question banks for STEM subjects.
                  </p>
                  <span className="font-bold text-emerald-600 block mt-2 mb-1">Brainros Solution:</span>
                  <p className="text-slate-600">
                    AI-powered translation into Hindi, Marathi, Gujarati, Tamil, Telugu, and 4 other languages without loss of formulas or diagrams.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-rose-600 block mb-1">Traditional Problem:</span>
                  <p className="text-slate-600">
                    Exam hall anxiety caused by unfamiliar computer test interfaces, palettes, and timer pressures.
                  </p>
                  <span className="font-bold text-emerald-600 block mt-2 mb-1">Brainros Solution:</span>
                  <p className="text-slate-600">
                    100% NTA-pattern simulation matching official question palettes, color codes, and navigation shortcuts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Brainros Helps */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Dedicated Value
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed For Institutions &amp; Students
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Clear, practical benefits engineered directly for day-to-day academic workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <School size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">For Educational Institutions</h3>
                  <span className="text-xs text-indigo-600 font-medium">Schools, Colleges &amp; Coaching</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Effortless Question Authoring:</strong> Support for 5 question formats including Single MCQ, Multi-correct, Numerical, Assertion &amp; Reason, and Match the Following.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Batch &amp; Schedule Management:</strong> Schedule exams for specific student batches, set start and expiry windows, and control test attempts.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Institutional Invoicing:</strong> Automated generation of customized invoices with itemized student usage and PDF exports.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Live Administrative Auditing:</strong> Review logs, question approval queues, and staff role permissions with total transparency.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">For Students &amp; Parents</h3>
                  <span className="text-xs text-purple-600 font-medium">Aspirants &amp; Guardians</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Relevant Exam Filtering:</strong> Select your target entrance goals (JEE, NEET, CET, or combinations) and view only eligible mock series.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Distraction-Free Environment:</strong> Full-screen test interface that keeps students focused and prepared for actual examination conditions.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Granular Score Reports:</strong> Speed vs accuracy profiling, negative marking analysis, and topic-wise strength mapping.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Parent Progress Portal:</strong> Dedicated monitoring allowing parents to track multiple children, view test attendance, and identify improvement areas.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Strip */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ready to Explore Brainros?
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto">
            Discover our comprehensive feature suite or contact our team to learn how Brainros fits your institution’s examination requirements.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>Explore All Features</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 transition-all"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
