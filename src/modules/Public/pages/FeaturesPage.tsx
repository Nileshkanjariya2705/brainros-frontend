import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileQuestion,
  Languages,
  Users,
  Target,
  BarChart3,
  School,
  UserCheck,
  Receipt,
  BellRing,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';

export const FeaturesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Brainros Platform Features',
      url: 'https://www.brainros.com/features',
      description:
        'Explore all Brainros features: online exam scheduling, 5 question types, AI multilingual translation, JEE/NEET/CET target combinations, analytics, and parent monitoring.',
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
          name: 'Features',
          item: 'https://www.brainros.com/features',
        },
      ],
    },
  ];

  const categories = [
    { id: 'all', label: 'All Features' },
    { id: 'exam-mgmt', label: 'Exam Management' },
    { id: 'questions', label: 'Question Papers' },
    { id: 'ai-translation', label: 'AI Translation' },
    { id: 'students', label: 'Student Management' },
    { id: 'targets', label: 'Exam Targets' },
    { id: 'analytics', label: 'Analytics & Reports' },
    { id: 'institution', label: 'Institution & Batches' },
    { id: 'parents', label: 'Parent Portal' },
    { id: 'billing', label: 'Billing & Invoices' },
    { id: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="Brainros Features — Online Exams, Analytics & Student Management"
        description="Explore all Brainros features: authentic NTA-pattern exam console, 5 question types, AI translation across 9 Indian languages, automated ranking, batch management, and parent monitoring."
        canonicalPath="/features"
        jsonLd={jsonLd}
      />

      {/* Header Banner */}
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
            <span className="text-indigo-600 font-bold">Features</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            <Sparkles size={14} className="text-indigo-600" />
            <span>Complete Platform Feature Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Everything You Need to Run{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              World-Class Online Exams
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From flexible question authoring to AI-powered regional translations, instant percentile evaluation, and institutional billing — explore all major Brainros capabilities.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* ── 1. EXAM MANAGEMENT ───────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'exam-mgmt') && (
            <div id="exam-mgmt" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Exam Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Full lifecycle scheduling, blueprints, and multi-tier test configurations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:border-indigo-300 transition-colors">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Exam Scheduling &amp; Calendar</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Schedule exams for specific dates, set precise submission windows, manage late-entry buffers, and visualize test schedules on an interactive calendar.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:border-indigo-300 transition-colors">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Flexible Test Scope</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Create full-syllabus mock exams, subject-specific drills (e.g. Organic Chemistry), or chapter-level practice assessments calibrated to your teaching pace.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:border-indigo-300 transition-colors">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Lifecycle &amp; Access Control</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Manage exams from Draft state to Scheduled, Active, Completed, and Archived, with strict role-based publish permissions and attempt limits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. QUESTION PAPER MANAGEMENT ─────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'questions') && (
            <div id="questions" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <FileQuestion size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Question Paper Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Author, preview, and organize competitive questions across all official patterns.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">5 Supported Question Formats</h3>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <Check size={14} className="text-purple-600" />
                      <span>Single Correct MCQ (4 options)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={14} className="text-purple-600" />
                      <span>Multiple Correct MCQ (with partial marks)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={14} className="text-purple-600" />
                      <span>Numerical Answer (decimal keypad entry)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={14} className="text-purple-600" />
                      <span>Assertion &amp; Reason format</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check size={14} className="text-purple-600" />
                      <span>Match the Following matrices</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">4 Difficulty Tiers</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Classify questions into <strong>Easy, Medium, Hard, and Very Hard</strong> to construct balanced mock assessments or targeted student remediation drills.
                  </p>
                  <div className="flex gap-1.5 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Easy</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Medium</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">Hard</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">Very Hard</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Paper Preview &amp; Answer Keys</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Inspect student-side rendering before publishing, configure positive and negative marks, configure section limits, and verify answer keys with complete audit tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. AI TRANSLATION ─────────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'ai-translation') && (
            <div id="ai-translation" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Languages size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    AI-Assisted Question Translation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Create question papers once and translate across 9 regional Indian languages instantly.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/40 p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Multilingual Access</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Translate complete mock papers into Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Punjabi, and English in a single automated process.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Preserves Formulas &amp; Equations</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Mathematical equations, LaTeX formatting, chemical reactions, and scientific units remain intact and accurate across all language outputs.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">Zero-Lag Language Switch</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Students can freely toggle languages during their live test session without losing selected answers or timer state.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. STUDENT MANAGEMENT ─────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'students') && (
            <div id="students" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Student Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registration workflows, target selection, verification, and candidate profiles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Individual &amp; Bulk Registration</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Allow self-registration through public portals, or enable school staff to bulk-upload student cohorts via spreadsheets with automated ID generation.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Approval Workflows</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Protect institutional integrity with approval queues. School administrators verify candidate enrollments before tests are unlocked.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Target Exam Eligibility</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Students choose their target exams during onboarding. Brainros automatically matches them with eligible tests, eliminating irrelevant noise.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. EXAM TARGETS ───────────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'targets') && (
            <div id="targets" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Target size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Supported Target Exam Matrices
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tailored combinations for students preparing for single or multiple entrance tests.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Students can prepare for individual competitive exams or combined streams. Brainros automatically routes them to relevant tests:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <span className="font-bold text-indigo-700 block">JEE Main &amp; Advanced</span>
                    <span className="text-slate-500 text-[11px]">Physics, Chemistry, Mathematics</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <span className="font-bold text-purple-700 block">NEET UG Medical</span>
                    <span className="text-slate-500 text-[11px]">Physics, Chemistry, Biology</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <span className="font-bold text-blue-700 block">State CET</span>
                    <span className="text-slate-500 text-[11px]">Physics, Chem, Math, Bio</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <span className="font-bold text-emerald-700 block">NEET + JEE Combo</span>
                    <span className="text-slate-500 text-[11px]">Combined engineering &amp; medical</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <span className="font-bold text-amber-700 block">NEET + State CET</span>
                    <span className="text-slate-500 text-[11px]">National &amp; state medical tracks</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50">
                    <span className="font-bold text-rose-700 block">JEE + State CET</span>
                    <span className="text-slate-500 text-[11px]">National &amp; state engineering</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50 sm:col-span-2">
                    <span className="font-bold text-indigo-900 block">JEE + NEET + State CET</span>
                    <span className="text-slate-500 text-[11px]">Comprehensive multi-exam preparation tracking</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 6. ANALYTICS & RESULTS ────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'analytics') && (
            <div id="analytics" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Analytics &amp; Results Processing
                  </h2>
                  <p className="text-xs text-slate-500">
                    Automated scoring, percentile ranking, and diagnostic student scorecards.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Automated Evaluation &amp; Negatives</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Zero human grading latency. Correct answers and negative marking rules are applied instantly on submission.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Percentile &amp; Rank Engine</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Calculates live percentiles and institutional rank lists so candidates see where they stand among their peer group.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Speed-Accuracy Diagnostics</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Detailed graphs showing time spent per question, unattempted questions, and subject-wise accuracy bottlenecks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 7. INSTITUTION MANAGEMENT ─────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'institution') && (
            <div id="institution" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <School size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Institution &amp; Batch Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comprehensive B2B administrative tools for coaching chains and schools.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Batch Partitioning</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Organize students into distinct batches (e.g. "Morning JEE 2026", "Weekend NEET Batch") with customized access rules.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Institution-Level Rank Lists</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Generate centralized rank lists for your center to benchmark student performance across teachers and batches.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Staff Access Control</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Role-based permission separation between Institution Admins, Exam Managers, Operators, and Academic Staff.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 8. PARENT EXPERIENCE ──────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'parents') && (
            <div id="parents" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Parent Monitoring Portal
                  </h2>
                  <p className="text-xs text-slate-500">
                    Keep parents actively informed and engaged in their child's academic journey.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Multi-Child Dashboard</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Parents can link and monitor multiple wards from a single secure login without juggling different accounts.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Test Attendance &amp; Scores</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Review which scheduled mock tests were attempted, track score histories, and download itemized report cards.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Weak Area Insights</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Understand specifically which subjects (Physics, Chemistry, Math, Bio) need attention before the final exam.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 9. BILLING & INVOICING ────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'billing') && (
            <div id="billing" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Billing &amp; Invoicing Management
                  </h2>
                  <p className="text-xs text-slate-500">
                    Customized pricing, automated invoice generation, and PDF downloads.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">School-Specific Pricing</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Configure custom per-student or per-exam pricing tiers tailored to your institutional contract and volume.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Bulk Invoice Generation</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automate monthly or term-based billing across enrolled students with one-click bulk invoice processing.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Itemized PDF Invoices</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Generate professional, printable PDF invoices complete with school details, GST compliance, and payment audit records.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 10. NOTIFICATIONS ─────────────────────────────────── */}
          {(selectedCategory === 'all' || selectedCategory === 'notifications') && (
            <div id="notifications" className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <BellRing size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    Multi-Channel Notifications
                  </h2>
                  <p className="text-xs text-slate-500">
                    Automated reminders and score alerts via SMS, WhatsApp, and email.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Exam Schedule Reminders</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Automated notifications sent 24 hours and 1 hour before an exam begins so candidates never miss an assessment.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Result Published Alerts</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instant alerts dispatched to students and parents as soon as test results and rank lists are released.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Multi-Channel Delivery</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Integrated delivery channels supporting WhatsApp messaging, SMS alerts, and email notifications.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 bg-slate-50 border-t border-slate-100 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            See Brainros in Action
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Create an account or connect with our team to experience how Brainros streamlines your examination workflows.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to={PUBLIC_NAVIGATION.register}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 hover:bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 transition-all"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage;
