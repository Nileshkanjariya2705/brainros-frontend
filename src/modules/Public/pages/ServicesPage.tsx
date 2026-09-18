import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  FileSpreadsheet,
  Languages,
  TrendingUp,
  School,
  UserCheck,
  BarChart3,
  Receipt,
  BellRing,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';

export const ServicesPage: React.FC = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Online Examination & Assessment Services',
      provider: {
        '@type': 'EducationalOrganization',
        name: 'Brainros',
        url: 'https://www.brainros.com',
        logo: 'https://www.brainros.com/logo.svg',
      },
      description:
        'Brainros provides 10 core examination services: online test delivery, question authoring, AI multilingual translation, student tracking, institutional portals, and automated scoring.',
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
          name: 'Services',
          item: 'https://www.brainros.com/services',
        },
      ],
    },
  ];

  const services = [
    {
      id: 1,
      title: 'Online Examination Management',
      icon: <Calendar className="text-indigo-600" size={24} />,
      badge: 'Core Service',
      description:
        'Deliver reliable, timed mock tests matching the official computer-based interface for JEE, NEET, and CET. Fully manage schedules, test windows, and attempt rules.',
      customerBenefit:
        'Eliminate exam hall anxiety and software unfamiliarity by giving students authentic test experience before their final entrance exam.',
      cta: 'Explore Exams',
      href: '/exams',
    },
    {
      id: 2,
      title: 'Student Management & Eligibility',
      icon: <Users className="text-purple-600" size={24} />,
      badge: 'Administration',
      description:
        'Streamline candidate onboarding with self-service registration or spreadsheet bulk-upload. Verify candidates and assign unique student IDs automatically.',
      customerBenefit:
        'Save hundreds of administrative hours each term with automated roster verification and target exam eligibility filters.',
      cta: 'Register Student',
      href: PUBLIC_NAVIGATION.register,
    },
    {
      id: 3,
      title: 'Question Paper Management',
      icon: <FileSpreadsheet className="text-blue-600" size={24} />,
      badge: 'Academic Tools',
      description:
        'Author questions in 5 formats (Single MCQ, Multi-correct, Numerical, Assertion-Reason, Match the Following) with 4 difficulty levels and customizable marking schemes.',
      customerBenefit:
        'Create balanced, high-quality test papers in minutes with instant mathematical notation preview and strict answer key verification.',
      cta: 'View Features',
      href: '/features#questions',
    },
    {
      id: 4,
      title: 'AI-Assisted Question Translation',
      icon: <Languages className="text-emerald-600" size={24} />,
      badge: 'Multilingual',
      description:
        'Translate complete question papers into 9 regional Indian languages (Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, and more) with one click.',
      customerBenefit:
        'Reach vernacular-medium students effortlessly without incurring high third-party translation costs or mathematical formula errors.',
      cta: 'Learn More',
      href: '/features#ai-translation',
    },
    {
      id: 5,
      title: 'Performance Analytics & Rank Prediction',
      icon: <TrendingUp className="text-amber-600" size={24} />,
      badge: 'Insights',
      description:
        'Automatic evaluation the second an exam is submitted. Calculates negative marks, institutional rankings, peer percentiles, and speed-vs-accuracy diagnostics.',
      customerBenefit:
        'Students immediately understand where they stand among their peer group and identify exactly which topics cost them negative marks.',
      cta: 'View Analytics',
      href: '/features#analytics',
    },
    {
      id: 6,
      title: 'Institution & Batch Administration',
      icon: <School className="text-rose-600" size={24} />,
      badge: 'B2B Solutions',
      description:
        'Custom administrative consoles for schools and coaching chains to partition students into batches, schedule batch-specific tests, and benchmark academic performance.',
      customerBenefit:
        'Centralize multi-branch coaching operations in a single secure system with granular staff role permissions and complete audit trails.',
      cta: 'Talk to Us',
      href: '/contact',
    },
    {
      id: 7,
      title: 'Parent Monitoring Portal',
      icon: <UserCheck className="text-indigo-600" size={24} />,
      badge: 'Parent Engagement',
      description:
        'Dedicated progress views for parents and guardians. Track test attendance, examine score trends across subjects, and monitor academic commitment.',
      customerBenefit:
        'Build trust and transparent communication between institutions and parents without requiring tedious manual report card printing.',
      cta: 'Inquire Now',
      href: '/contact',
    },
    {
      id: 8,
      title: 'Comprehensive Reports & Exports',
      icon: <BarChart3 className="text-purple-600" size={24} />,
      badge: 'Reporting',
      description:
        'Export institution-wide rank lists, student diagnostic scorecards, and historical dataset trends in clean, printable PDF and spreadsheet formats.',
      customerBenefit:
        'Equip academic directors with data-driven evidence to refine curriculum pacing and support underperforming students effectively.',
      cta: 'Contact Us',
      href: '/contact',
    },
    {
      id: 9,
      title: 'Billing & Invoicing Automation',
      icon: <Receipt className="text-blue-600" size={24} />,
      badge: 'Finance',
      description:
        'Customized pricing models per institution, bulk invoice generation, and GST-compliant downloadable PDF invoices for commercial partners.',
      customerBenefit:
        'Eliminate billing disputes and streamline financial reconciliation between coaching institutes and platform administration.',
      cta: 'Pricing Inquiries',
      href: '/contact',
    },
    {
      id: 10,
      title: 'Multi-Channel Notifications',
      icon: <BellRing className="text-emerald-600" size={24} />,
      badge: 'Communication',
      description:
        'Automated 24-hour and 1-hour exam countdown reminders, along with instant result-published alerts dispatched via SMS, WhatsApp, and email.',
      customerBenefit:
        'Maximize mock exam attendance and ensure students and parents are alerted the moment performance analytics are available.',
      cta: 'Get Started',
      href: PUBLIC_NAVIGATION.register,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="Brainros Services — Examination & Institution Management"
        description="Discover comprehensive online examination services by Brainros for schools and coaching institutes: mock test hosting, automated ranking, multilingual question conversion, and parent progress tracking."
        canonicalPath="/services"
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
            <span className="text-indigo-600 font-bold">Services</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            <Sparkles size={14} className="text-indigo-600" />
            <span>Comprehensive Examination Services</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Assessment Services Engineered for{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Academic Excellence
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Everything an educational institution needs to create, deliver, translate, evaluate, and analyze entrance examination assessments at scale.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-8 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      {srv.icon}
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{srv.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{srv.description}</p>

                  <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 mb-6">
                    <span className="text-[11px] font-bold text-slate-800 block mb-0.5">
                      Key Benefit:
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      {srv.customerBenefit}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Service #{srv.id}
                  </span>
                  <Link
                    to={srv.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <span>{srv.cta}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing Call to Action */}
      <section className="py-16 bg-slate-50 border-t border-slate-100 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Need a Customized Solution for Your Institution?
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Speak with our academic technology team to discuss batch sizes, custom question banks, and onboarding timelines.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>Contact Us</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              to="/exams"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 hover:bg-white px-6 py-3 text-xs sm:text-sm font-bold text-slate-700 transition-all"
            >
              <span>Explore Supported Exams</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
