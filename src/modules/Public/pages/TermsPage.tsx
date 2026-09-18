import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';

export const TermsPage: React.FC = () => {
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
        name: 'Terms of Service',
        item: 'https://www.brainros.com/terms',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="Terms of Service — Brainros Online Examination Platform"
        description="Review the terms and conditions governing the use of the Brainros examination software, student test portals, and institutional assessments."
        canonicalPath="/terms"
        jsonLd={jsonLd}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline mb-8"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Legal &amp; Compliance
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Terms of Service
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-8">
          Last Updated: September 2026 &bull; Effective Date: Immediate
        </p>

        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Brainros (&quot;the Platform&quot;), including any online examinations, mock test series, or administrative dashboards, you agree to be bound by these Terms of Service. If you are using the Platform on behalf of an institution, school, or coaching institute, you confirm that you have the requisite authority to bind that entity.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Examination Integrity &amp; Student Conduct</h2>
            <p>
              Brainros provides standardized online mock assessments mirroring official national entrance examinations. When attempting an online examination:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Candidates must complete tests independently without unauthorized external assistance.</li>
              <li>Circumvention of anti-cheating security features, including tab-switch locks or automated scripting, is strictly prohibited.</li>
              <li>Institutions retain the authority to invalidate attempts or ban accounts for academic dishonesty.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Question Papers &amp; Intellectual Property</h2>
            <p>
              All proprietary platform software, question paper authoring interfaces, multilingual translation workflows, and AI ranking algorithms remain the intellectual property of Brainros. Question contents authoring rights uploaded by specific institutional partners remain owned by their respective creators.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Service Availability &amp; Maintenance</h2>
            <p>
              While Brainros strives for continuous high availability during scheduled test windows, occasional scheduled maintenance or unscheduled network interruptions may occur. Institutions are advised to schedule high-stakes tests within defined operating windows.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Governing Law &amp; Contact</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. For questions regarding these terms, please contact us at{' '}
              <a href="mailto:info@brainros.com" className="text-indigo-600 font-semibold hover:underline">
                info@brainros.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
