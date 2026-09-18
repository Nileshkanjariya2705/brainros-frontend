// ** Packages **
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Search,
  Languages,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Globe2,
  Play,
  Filter,
  BarChart3,
  Users,
  School,
  FileSpreadsheet,
  BellRing,
  Receipt,
  ChevronDown,
  Layers,
  Check,
  Zap,
  XCircle,
} from 'lucide-react';

// ** Services & Hooks **
import { useAuth } from '@/hooks/useAuth';

// ** Constants **
import { PUBLIC_NAVIGATION, PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { DUMMY_EXAMS } from '@/modules/Exams/constants/dummyExams.constant';

// ** Components **
import SeoHead from '@/components/seo/SeoHead';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');

  // Interactive Simulator State for Hero
  const [simulatorLang, setSimulatorLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [simulatorSelectedOption, setSimulatorSelectedOption] = useState<number | null>(1);
  const [simulatorSubmitted, setSimulatorSubmitted] = useState<boolean>(false);

  // FAQ Accordion open item
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Active workflow step
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);

  const targetCategories = ['ALL', 'JEE', 'NEET', 'CET', 'FOUNDATION'];

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

      return matchesSearch && matchesTarget;
    });
  }, [searchQuery, selectedTarget]);

  // Handle Start Test Click
  const handleStartTestClick = (_examId: string) => {
    if (!isAuthenticated) {
      navigate(
        `${PUBLIC_NAVIGATION.login}?redirect=${encodeURIComponent(PRIVATE_NAVIGATION.availableExams)}`,
      );
    } else {
      navigate(PRIVATE_NAVIGATION.availableExams);
    }
  };

  const faqs = [
    {
      q: 'What is Brainros?',
      a: 'Brainros is an all-in-one online examination, assessment, and analytics platform. It enables educational institutions, coaching centers, and schools to author question papers, conduct online mock exams with authentic NTA pattern interfaces, translate questions into 9 regional languages, and generate instant percentile and diagnostic reports.',
    },
    {
      q: 'Who can use Brainros?',
      a: 'Brainros is designed for Schools, Coaching Institutes, and Educational Organizations managing entrance exam preparation, as well as Students preparing for competitive exams (JEE, NEET, CET) and Parents who want clear visibility into their child’s progress.',
    },
    {
      q: 'Which competitive exams are supported?',
      a: 'Brainros supports national and state-level competitive exams including JEE (Physics, Chemistry, Mathematics), NEET (Physics, Chemistry, Biology), and State CET (Physics, Chemistry, Mathematics, Biology). Students can select individual or combined target goals such as NEET + JEE or JEE + State CET.',
    },
    {
      q: 'Does Brainros support regional Indian languages?',
      a: 'Yes. Brainros includes AI-assisted question paper translation supporting 9 regional Indian languages including Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, and Bengali. Students can switch languages in-flight during the examination without losing their answered state.',
    },
    {
      q: 'Can institutions create their own question papers and manage batches?',
      a: 'Yes. Institution administrators can author question papers with multiple question formats (Single MCQ, Multi-correct, Numerical, Assertion & Reason, and Match the Following), configure marking schemes and difficulty levels, schedule exams for specific batches, and monitor live test submissions.',
    },
    {
      q: 'How does the automated evaluation and rank engine work?',
      a: 'Upon exam submission, Brainros evaluates student responses against the official answer key, calculates positive and negative marks, determines percentile rankings among peer candidates, and breaks down performance into accuracy, time per question, and subject-wise strengths.',
    },
    {
      q: 'Can parents monitor their child’s performance?',
      a: 'Yes. Parents have access to a dedicated progress view where they can monitor multiple enrolled children, review exam scores, check attendance, and identify subjects requiring additional practice.',
    },
    {
      q: 'How can an institution contact Brainros to get started?',
      a: 'Institutions can visit our Contact Us page (/contact) to submit an inquiry, request a platform demonstration, or speak directly with our team at info@brainros.com.',
    },
  ];

  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Brainros',
      url: 'https://www.brainros.com',
      description:
        'Smarter Online Exams. Better Student Performance. Comprehensive examination platform for JEE, NEET, and CET with AI translation in 9 languages.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.brainros.com/exams?search={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Brainros',
      url: 'https://www.brainros.com',
      logo: 'https://www.brainros.com/logo.svg',
      description:
        'Online examination, assessment, and regional language question paper translation platform for competitive entrance exams.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.a,
        },
      })),
    },
  ];

  // Simulator Question Data
  const sampleQuestion = {
    en: {
      subject: 'Physics • Classical Mechanics',
      question:
        'A particle moves in a straight line with a constant acceleration of 4 m/s². If its initial velocity is 10 m/s, what is the distance traversed in the 3rd second?',
      options: ['18 meters', '20 meters', '22 meters', '24 meters'],
      explanation: 'Using formula S_nth = u + a/2(2n - 1) = 10 + 4/2(2×3 - 1) = 10 + 2(5) = 20 meters.',
    },
    hi: {
      subject: 'भौतिक विज्ञान • यांत्रिकी',
      question:
        'एक कण 4 m/s² के नियत त्वरण के साथ सीधी रेखा में गतिमान है। यदि इसका प्रारंभिक वेग 10 m/s है, तो तीसरे सेकंड में तय की गई दूरी क्या होगी?',
      options: ['18 मीटर', '20 मीटर', '22 मीटर', '24 मीटर'],
      explanation: 'सूत्र S_nth = u + a/2(2n - 1) = 10 + 4/2(2×3 - 1) = 10 + 10 = 20 मीटर।',
    },
    mr: {
      subject: 'भौतिकशास्त्र • यांत्रिकी',
      question:
        'एक कण 4 m/s² च्या स्थिर प्रवेगाने सरळ रेषेत फिरत आहे. त्याचा सुरुवातीचा वेग 10 m/s असल्यास, तिसऱ्या सेकंदात पार केलेले अंतर किती?',
      options: ['18 मीटर', '20 मीटर', '22 मीटर', '24 मीटर'],
      explanation: 'सूत्र S_nth = u + a/2(2n - 1) = 10 + 4/2(2×3 - 1) = 20 मीटर.',
    },
  };

  const workflowSteps = [
    {
      title: '1. Institution Setup & Batch Creation',
      desc: 'Set up your coaching center or school account, create custom batches, and define target exam streams (JEE, NEET, CET).',
      badge: 'Institution Admin',
      icon: <School className="text-indigo-600" size={20} />,
    },
    {
      title: '2. Student Registration & Target Enrollment',
      desc: 'Enrol students individually or in bulk. Students select their target exams and are automatically verified for relevant test series.',
      badge: 'Students & Staff',
      icon: <Users className="text-indigo-600" size={20} />,
    },
    {
      title: '3. Question Paper Authoring',
      desc: 'Create questions with Single Correct, Multiple Correct, Numerical, Assertion-Reason, and Match the Following across 4 difficulty tiers.',
      badge: 'Exam Manager',
      icon: <FileSpreadsheet className="text-indigo-600" size={20} />,
    },
    {
      title: '4. AI Multilingual Translation',
      desc: 'One-click automated translation into Hindi, Marathi, Gujarati, Tamil, Telugu, and 4 other regional languages while preserving mathematical formulas.',
      badge: 'AI Engine',
      icon: <Languages className="text-indigo-600" size={20} />,
    },
    {
      title: '5. Distraction-Free Exam Attempt',
      desc: 'Students attempt tests under an authentic NTA-standard full-screen test console with live question palette, timers, and in-flight language switching.',
      badge: 'Student Portal',
      icon: <Play className="text-indigo-600" size={20} />,
    },
    {
      title: '6. Instant Scoring & Rank Analytics',
      desc: 'Automated evaluation instantly calculates overall score, negative marking, percentile ranking, and speed-vs-accuracy diagnostics.',
      badge: 'Rank Engine',
      icon: <TrendingUp className="text-indigo-600" size={20} />,
    },
    {
      title: '7. Reports, Invoicing & Parent Visibility',
      desc: 'Generate PDF performance scorecards, dispatch WhatsApp/SMS notifications, monitor weak subjects, and manage itemized school invoices.',
      badge: 'All Stakeholders',
      icon: <BarChart3 className="text-indigo-600" size={20} />,
    },
  ];

  return (
    <div className="w-full bg-white text-slate-900">
      <SeoHead
        title="Brainros — Smarter Online Exams. Better Student Performance."
        description="Brainros is the modern online examination and test series platform for JEE, NEET, and CET. Features official NTA-pattern interface, AI translation across 9 languages, and instant percentile diagnostics."
        canonicalPath="/"
        jsonLd={homeJsonLd}
      />

      {/* ══ SECTION 1: HERO SECTION ═════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-indigo-50/60 via-white to-slate-50/50 border-b border-slate-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-200/30 to-purple-200/20 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs mb-6">
                <Sparkles size={14} className="text-indigo-600" />
                <span>NTA Pattern • JEE • NEET • CET Mock Platform</span>
              </div>

              <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
                Smarter Online Exams.{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Better Student Performance.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Brainros is the all-in-one assessment ecosystem for educational institutions and competitive exam aspirants. Conduct official-standard mock tests, translate question papers into 9 regional languages with AI, and unlock instant percentile analytics.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                <Link
                  to={PUBLIC_NAVIGATION.register}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/exams"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3.5 text-sm font-bold text-slate-700 hover:text-slate-900 shadow-xs transition-all"
                >
                  <BookOpen size={16} className="text-slate-500" />
                  <span>Explore Supported Exams</span>
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-2 transition-colors"
                >
                  <span>Talk to Us &rarr;</span>
                </Link>
              </div>

              {/* Verified Trust Badges */}
              <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>NTA Standard Screen Layout</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>9 Regional Indian Languages</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Instant Automated Evaluation</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Product Visual / Simulator */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-indigo-100/50 relative">
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">
                      Live Exam Simulation
                    </span>
                  </div>

                  {/* Language Switcher in Hero Simulator */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSimulatorLang('en')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        simulatorLang === 'en'
                          ? 'bg-white text-indigo-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorLang('hi')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        simulatorLang === 'hi'
                          ? 'bg-white text-indigo-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      हिंदी
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorLang('mr')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        simulatorLang === 'mr'
                          ? 'bg-white text-indigo-600 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      मराठी
                    </button>
                  </div>
                </div>

                {/* Question Info Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                  <span className="font-semibold text-indigo-600">
                    {sampleQuestion[simulatorLang].subject}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    <Clock size={12} />
                    02:44:18 Left
                  </span>
                </div>

                {/* Question Statement */}
                <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-100 text-xs font-medium text-slate-800 leading-relaxed min-h-[85px]">
                  <span className="font-bold text-indigo-600 mr-1.5">Q.14</span>
                  {sampleQuestion[simulatorLang].question}
                </div>

                {/* Options List */}
                <div className="mt-3 space-y-2">
                  {sampleQuestion[simulatorLang].options.map((opt, idx) => {
                    const isSelected = simulatorSelectedOption === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSimulatorSelectedOption(idx);
                          setSimulatorSubmitted(false);
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-left transition-all border ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/70 text-indigo-900 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-slate-300 text-slate-600'
                            }`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons in Simulator */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Try switching languages or options
                  </span>

                  <button
                    type="button"
                    onClick={() => setSimulatorSubmitted(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all"
                  >
                    <span>Save &amp; Check Score</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* Score Simulation Banner */}
                {simulatorSubmitted && (
                  simulatorSelectedOption === 1 ? (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <CheckCircle2 size={14} />
                        <span>Correct Answer! (+4 Marks)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 mt-1 leading-normal">
                        {sampleQuestion[simulatorLang].explanation}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700">
                        <XCircle size={14} />
                        <span>Incorrect Answer (-1 Mark)</span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1 leading-normal">
                        <strong>Correct Answer is {sampleQuestion[simulatorLang].options[1]}:</strong> {sampleQuestion[simulatorLang].explanation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: WHAT IS BRAINROS? ════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              The Platform Overview
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What is Brainros?
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              Brainros is a unified, cloud-native online assessment platform built specifically for competitive entrance examinations like <strong>JEE, NEET, and State CET</strong>. It bridges the gap between traditional paper tests and high-stakes digital examinations by giving institutions and students a reliable, multilingual testing environment.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <BookOpen size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Standardized Test Series</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Full-length, subject-wise, and chapter-level practice exams structured strictly to current NTA specifications.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Languages size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multilingual Inclusivity</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Empower regional language students with instant AI translation across 9 Indian languages while keeping mathematical precision intact.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Actionable Analytics</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Instant score processing, negative mark breakdowns, percentile rankings, and personalized topic-level improvement insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: WHO BRAINROS IS FOR ═══════════════════════════ */}
      <section className="py-16 sm:py-20 bg-slate-50/60 border-t border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Tailored For Every Stakeholder
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Who is Brainros For?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              A comprehensive solution designed specifically for every member of the academic ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schools */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <School size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Schools &amp; Junior Colleges</h3>
                  <span className="text-[11px] text-indigo-600 font-medium">Academic Assessment</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Eliminate manual paper photocopying and grading lag. Conduct chapter tests and term mock exams with instant computer-based grading.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-600 shrink-0" />
                  <span>Bulk student enrollment with student IDs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-indigo-600 shrink-0" />
                  <span>Batch-specific exam scheduling &amp; calendar</span>
                </li>
              </ul>
            </div>

            {/* Coaching Centers */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Coaching Institutes</h3>
                  <span className="text-[11px] text-purple-600 font-medium">Entrance Test Series</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Deliver competitive test series for JEE and NEET with rigorous negative marking, multi-batch rankings, and percentile engine.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600 shrink-0" />
                  <span>All 5 competitive question types supported</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-purple-600 shrink-0" />
                  <span>Instant rank lists and peer percentiles</span>
                </li>
              </ul>
            </div>

            {/* Students */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Students &amp; Aspirants</h3>
                  <span className="text-[11px] text-blue-600 font-medium">Self-Paced Practice</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Overcome exam hall anxiety with authentic NTA exam screens, live timer countdowns, and instant multilingual language switching.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-blue-600 shrink-0" />
                  <span>Distraction-free test console</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-blue-600 shrink-0" />
                  <span>Detailed speed vs accuracy performance reports</span>
                </li>
              </ul>
            </div>

            {/* Parents */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Parents &amp; Guardians</h3>
                  <span className="text-[11px] text-emerald-600 font-medium">Ward Monitoring</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Stay continuously informed on your child’s preparation, score progress, weak subjects, and test attendance through a dedicated portal.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Multi-child monitoring in single view</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Clear subject weakness breakdowns</span>
                </li>
              </ul>
            </div>

            {/* Administrators */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-colors sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Administrators &amp; Academic Directors</h3>
                  <span className="text-[11px] text-amber-600 font-medium">Control &amp; Compliance</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Maintain complete oversight of question paper approval workflows, candidate registries, billing and invoicing, role-based staff access, and security audit logs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 shrink-0" />
                  <span>Approval workflows for question papers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-amber-600 shrink-0" />
                  <span>Itemized school billing &amp; PDF invoice exports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: HOW BRAINROS WORKS (WORKFLOW) ════════════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              End-To-End Assessment Lifecycle
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How Brainros Works
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              From student enrollment to post-exam analytics, explore the seamless workflow designed for schools and coaching institutes.
            </p>
          </div>

          {/* Interactive Workflow Diagram / Stepper */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Navigation Cards */}
            <div className="lg:col-span-5 space-y-2">
              {workflowSteps.map((step, idx) => {
                const isActive = activeWorkflowStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={`w-full text-left rounded-xl p-3.5 transition-all flex items-center gap-3 border ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold truncate ${
                            isActive ? 'text-indigo-950' : 'text-slate-800'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-semibold uppercase shrink-0 ml-2">
                          {step.badge}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Step Preview Details */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 p-8 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    {workflowSteps[activeWorkflowStep].icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Step {activeWorkflowStep + 1} of 7 • {workflowSteps[activeWorkflowStep].badge}
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      {workflowSteps[activeWorkflowStep].title}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mt-4">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>

                <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={activeWorkflowStep === 0}
                    onClick={() => setActiveWorkflowStep((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Previous Step
                  </button>

                  <button
                    type="button"
                    disabled={activeWorkflowStep === workflowSteps.length - 1}
                    onClick={() =>
                      setActiveWorkflowStep((prev) =>
                        Math.min(workflowSteps.length - 1, prev + 1),
                      )
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    Next Step &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 5: EXAM CAPABILITIES & QUESTION TYPES ═══════════ */}
      <section className="py-16 sm:py-20 bg-slate-50/60 border-t border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Authoring Flexibility
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Supported Question Types &amp; Complexity
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Brainros supports all official competitive test patterns, negative marking schemes, and multi-tier difficulty categorizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <span className="inline-block rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-600 mb-2">
                Type 1
              </span>
              <h4 className="text-xs font-bold text-slate-900">Single Correct MCQ</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard 4-option questions with single valid choice and negative marking.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <span className="inline-block rounded-lg bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-600 mb-2">
                Type 2
              </span>
              <h4 className="text-xs font-bold text-slate-900">Multiple Correct</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                JEE Advanced pattern with partial marking support for subsets of correct choices.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <span className="inline-block rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600 mb-2">
                Type 3
              </span>
              <h4 className="text-xs font-bold text-slate-900">Numerical Answer</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Virtual numeric keypad entry with customizable decimal precision tolerance.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <span className="inline-block rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 mb-2">
                Type 4
              </span>
              <h4 className="text-xs font-bold text-slate-900">Assertion &amp; Reason</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Logical reasoning evaluation pairing independent assertions and explanations.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <span className="inline-block rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-600 mb-2">
                Type 5
              </span>
              <h4 className="text-xs font-bold text-slate-900">Match the Following</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Matrix matching questions comparing Column I and Column II elements.
              </p>
            </div>
          </div>

          {/* Difficulty Levels Bar */}
          <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900">4 Difficulty Tiers for Calibrated Testing</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Tag each question to build balanced mock papers or chapter-level diagnostic tests.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                Easy
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
                Medium
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                Hard
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800">
                Very Hard
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 6: AI-POWERED MULTILINGUAL TRANSLATION ═══════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Inclusive Testing Without Language Barriers
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                AI-Powered Multilingual Question Translation
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Create your question paper once in English or any base language, and make it accessible across 9 regional Indian languages with a single click.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Our AI translation preserves mathematical formulas, chemical structures, units of measurement, and scientific context without corrupting notation.
              </p>

              <div className="pt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="block font-bold text-slate-900 mb-0.5">Zero Retyping</span>
                  <span className="text-slate-500">Eliminate manual translation agency costs and delays.</span>
                </div>
                <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50">
                  <span className="block font-bold text-slate-900 mb-0.5">In-Flight Toggle</span>
                  <span className="text-slate-500">Students switch languages during exam without reloading.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe2 size={16} className="text-indigo-600" />
                  <span>9 Supported Indian Languages</span>
                </h4>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { code: 'hi', name: 'Hindi', script: 'हिंदी' },
                    { code: 'mr', name: 'Marathi', script: 'मराठी' },
                    { code: 'gu', name: 'Gujarati', script: 'ગુજરાતી' },
                    { code: 'ta', name: 'Tamil', script: 'தமிழ்' },
                    { code: 'te', name: 'Telugu', script: 'తెలుగు' },
                    { code: 'kn', name: 'Kannada', script: 'ಕನ್ನಡ' },
                    { code: 'bn', name: 'Bengali', script: 'বাংলা' },
                    { code: 'pa', name: 'Punjabi', script: 'ਪੰਜਾਬੀ' },
                    { code: 'en', name: 'English', script: 'English' },
                  ].map((l) => (
                    <div
                      key={l.code}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <span className="block text-xs font-bold text-slate-900">{l.name}</span>
                      <span className="block text-[11px] text-indigo-600 font-medium">{l.script}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 7: LIVE TEST SERIES CATALOG ═════════════════════ */}
      <section id="test-series" className="py-16 sm:py-20 bg-slate-50/70 border-t border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Active Mock Exams
              </span>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Explore Available Mock Test Series
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Preview active mock tests and experience official computer-based testing.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search mock exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 mr-2">
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
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Cards Grid */}
          {filteredExams.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center max-w-md mx-auto my-8">
              <BookOpen className="mx-auto text-slate-400 mb-3" size={32} />
              <h4 className="text-sm font-bold text-slate-800">No mock tests found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting a different target exam category or clearing your search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.slice(0, 6).map((exam) => (
                <div
                  key={exam.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                        {exam.targetBadge}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                        <Clock size={12} />
                        {exam.durationMinutes} mins
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {exam.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {exam.totalMarks} Marks &bull; {exam.totalQuestions} Qs
                    </span>

                    <button
                      type="button"
                      onClick={() => handleStartTestClick(exam.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all"
                    >
                      <Play size={12} />
                      <span>Take Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/exams"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <span>View All Supported Exams &amp; Blueprints &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══ SECTION 8: WHY BRAINROS? ═════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Built For High Concurrency &amp; Trust
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Educational Institutions Trust Brainros
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Designed specifically to meet the high stakes and exacting standards of Indian entrance examinations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Anti-Cheating &amp; Integrity</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Full-screen lock detection, tab-switch monitoring, and randomized question/option sequencing.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <Layers size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">NTA Exam Parity</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Exact color palettes for Answered, Not Answered, and Marked for Review, eliminating testing interface friction.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <BellRing size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Multi-Channel Alerts</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Automated 24-hour and 1-hour exam reminders, plus instant score notifications via SMS, WhatsApp, and email.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Receipt size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">School Invoicing</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Custom billing models per school, automated PDF invoice generation, and transparent enrollment tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 9: FREQUENTLY ASKED QUESTIONS (FAQ) ══════════════ */}
      <section className="py-16 sm:py-20 bg-slate-50/70 border-t border-slate-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Common Inquiries
            </span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Clear answers to the most common questions from students, parents, and institutions.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ SECTION 10: CLOSING CALL TO ACTION ══════════════════════ */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white text-center">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-6">
            <Sparkles size={14} className="text-indigo-400" />
            <span>Ready for Next-Gen Online Assessments?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight max-w-3xl mx-auto">
            Experience Modern Online Testing Built for Academic Excellence
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Join institutions and students practicing with authentic examination interfaces, AI-powered multilingual paper translation, and instant percentile analytics.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={PUBLIC_NAVIGATION.register}
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 px-6 py-3.5 text-xs sm:text-sm font-black shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-6 py-3.5 text-xs sm:text-sm font-bold transition-all hover:text-white"
            >
              <span>Contact Our Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
