import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  ChevronDown,
  BrainCircuit,
  Languages,
  School,
  TrendingUp,
  Sparkles,
  ArrowRight,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';

interface FaqItem {
  id: string;
  category: 'general' | 'exams' | 'translation' | 'institutions' | 'scoring' | 'support';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-brainros',
    category: 'general',
    question: 'What is Brainros?',
    answer:
      'Brainros is an all-in-one online examination, assessment, and analytics platform. It enables educational institutions, coaching centers, and schools to author question papers, conduct online mock exams with authentic NTA pattern interfaces, translate questions into 9 regional languages, and generate instant percentile and diagnostic reports.',
  },
  {
    id: 'who-can-use-brainros',
    category: 'general',
    question: 'Who can use Brainros?',
    answer:
      'Brainros is designed for Schools, Coaching Institutes, and Educational Organizations managing entrance exam preparation, as well as Students preparing for competitive exams (JEE, NEET, CET) and Parents who want clear visibility into their child’s progress.',
  },
  {
    id: 'supported-exams',
    category: 'exams',
    question: 'Which competitive entrance exams are supported?',
    answer:
      'Brainros supports national and state-level competitive exams including JEE (Physics, Chemistry, Mathematics), NEET (Physics, Chemistry, Biology), and State CET (Physics, Chemistry, Mathematics, Biology). Students can select individual or combined target goals such as NEET + JEE or JEE + State CET.',
  },
  {
    id: 'nta-interface-parity',
    category: 'exams',
    question: 'How does Brainros mirror the official NTA examination pattern?',
    answer:
      'The Brainros test console replicates the exact layout, color-coded question palette (Answered, Not Answered, Marked for Review, Answered & Marked for Review, Not Visited), countdown timer, section navigation, and full-screen distraction-free environment used in official computer-based entrance tests.',
  },
  {
    id: 'regional-languages',
    category: 'translation',
    question: 'Which regional Indian languages are supported for question translation?',
    answer:
      'Brainros includes AI-assisted question paper translation supporting 9 regional Indian languages including Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Malayalam, and Punjabi. Mathematical formulas, LaTeX symbols, and diagram references are preserved seamlessly.',
  },
  {
    id: 'in-flight-language-switch',
    category: 'translation',
    question: 'Can students switch examination languages while attempting a test?',
    answer:
      'Yes. Students can switch languages in-flight per question or for the entire exam with a single click from the test console without losing their saved answers or timer state.',
  },
  {
    id: 'institution-question-authoring',
    category: 'institutions',
    question: 'Can institutions author their own question papers and manage batches?',
    answer:
      'Yes. Institution administrators and faculty can create question papers supporting 5 question formats (Single MCQ, Multi-correct, Numerical, Assertion & Reason, and Match the Following), configure marking schemes, schedule tests for custom batches, and monitor live test submissions.',
  },
  {
    id: 'batch-scheduling',
    category: 'institutions',
    question: 'How does batch and exam scheduling work for schools and coaching centers?',
    answer:
      'Administrators can define student batches (e.g., JEE Morning Batch 2026), schedule specific start and end windows, set maximum test attempts, and restrict exam access strictly to enrolled students.',
  },
  {
    id: 'automated-scoring-percentiles',
    category: 'scoring',
    question: 'How does the automated evaluation and rank engine calculate scores?',
    answer:
      'Upon test submission, Brainros evaluates student responses against the official answer key, applies positive and negative marking rules, calculates percentile ranks relative to peer candidates, and provides granular diagnostics for speed vs accuracy, time per question, and subject strengths.',
  },
  {
    id: 'parent-progress-monitoring',
    category: 'scoring',
    question: 'Can parents monitor their child’s performance and attendance?',
    answer:
      'Yes. Parents have access to a dedicated progress view where they can link multiple enrolled children, review exam scorecards, track test attendance, and identify topics requiring additional practice.',
  },
  {
    id: 'contact-demo-request',
    category: 'support',
    question: 'How can an educational institution contact Brainros to request a demo or get started?',
    answer:
      'Institutions can visit our Contact Us page (/contact) to submit an inquiry, request a platform demonstration, or speak directly with our team at info@brainros.com or phone (+91 90083 05109).',
  },
  {
    id: 'data-privacy-security',
    category: 'support',
    question: 'How is student examination data and personal information protected?',
    answer:
      'Brainros uses industry-standard TLS encryption in transit and encrypted data storage at rest with strict role-based access control. Academic performance records are strictly confidential and never sold to third-party advertisers.',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: <Sparkles size={14} /> },
  { id: 'general', label: 'General & Overview', icon: <BrainCircuit size={14} /> },
  { id: 'exams', label: 'Exams & Test Series', icon: <BookOpen size={14} /> },
  { id: 'translation', label: 'AI Translation', icon: <Languages size={14} /> },
  { id: 'institutions', label: 'Institutions & Batches', icon: <School size={14} /> },
  { id: 'scoring', label: 'Scoring & Analytics', icon: <TrendingUp size={14} /> },
  { id: 'support', label: 'Support & Inquiries', icon: <MessageSquare size={14} /> },
];

export const FaqPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'what-is-brainros': true,
    'supported-exams': true,
  });

  const toggleFaq = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        query === '' ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Schema.org FAQPage + BreadcrumbList JSON-LD
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
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
          name: 'Frequently Asked Questions',
          item: 'https://www.brainros.com/faq',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="Frequently Asked Questions (FAQ) — Brainros Online Exam Platform"
        description="Find answers to common questions about Brainros: supported competitive entrance exams (JEE, NEET, CET), AI translation across 9 languages, institutional batch management, and scoring."
        canonicalPath="/faq"
        jsonLd={jsonLd}
      />

      {/* Header Banner */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-indigo-50/60 via-white to-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center justify-center text-xs font-semibold text-slate-400 mb-6 space-x-2"
          >
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-indigo-600 font-bold">FAQ</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            <HelpCircle size={14} className="text-indigo-600" />
            <span>Help Center &amp; Common Inquiries</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about the Brainros examination platform, supported competitive test series, AI translation, institutional onboarding, and rank evaluation.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g., NEET, AI translation, batches, scoring)..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-900 shadow-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-16 rounded-3xl border border-slate-200 bg-slate-50/50 p-8">
              <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No questions found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                We couldn&apos;t find any questions matching &quot;{searchQuery}&quot;. Try adjusting your search query or select another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = !!openItems[faq.id];
                return (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50/80 focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-bold text-slate-900">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-indigo-600' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/30">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Still Have Questions?
          </h2>
          <p className="mt-3 text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Our team is available to assist educators, institution administrators, and students with any questions regarding test scheduling, paper translation, or custom partnerships.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>Contact Support Team</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/features"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 transition-all"
            >
              <span>Explore Platform Features</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
