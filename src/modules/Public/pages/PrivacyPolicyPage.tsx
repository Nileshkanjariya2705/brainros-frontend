import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';

export const PrivacyPolicyPage: React.FC = () => {
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
        name: 'Privacy Policy',
        item: 'https://www.brainros.com/privacy-policy',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="Privacy Policy — Brainros Online Examination Platform"
        description="Learn how Brainros handles, protects, and respects institutional and student examination data, personal identifiers, and test attempts."
        canonicalPath="/privacy-policy"
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
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Legal &amp; Compliance
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-8">
          Last Updated: September 2026 &bull; Effective Date: Immediate
        </p>

        <div className="space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Introduction</h2>
            <p>
              Brainros (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) respects the privacy of students, teachers, educational institutions, and parents. This Privacy Policy explains what information we collect when you access our public website and web application, how we store and protect that information, and your rights regarding your personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Information We Collect</h2>
            <p>
              Depending on how you use Brainros, we may collect:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Contact Inquiries:</strong> Name, email address, phone number, and institution name submitted via our public contact form.
              </li>
              <li>
                <strong>Student Account Information:</strong> Name, student ID, enrolled batch, target exam selections (JEE, NEET, CET), and contact phone number.
              </li>
              <li>
                <strong>Academic Data:</strong> Mock examination responses, time spent per question, test completion timestamps, score calculations, and percentile rankings.
              </li>
              <li>
                <strong>Technical Logs:</strong> IP address, device type, browser metadata, and security audit events strictly for fraud prevention and cheating mitigation during live tests.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. How We Use Academic Data</h2>
            <p>
              We process examination data exclusively for legitimate educational purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Scoring student answer keys and computing accurate peer percentiles.</li>
              <li>Generating topic-level diagnostic performance reports for students and parents.</li>
              <li>Providing institution administrators with aggregated batch rank lists.</li>
              <li>Dispatching exam schedule alerts and score release notifications.</li>
            </ul>
            <p>
              We do not sell student data, personal phone numbers, or institutional rosters to commercial third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Data Security &amp; Storage</h2>
            <p>
              Brainros employs industry-standard encryption protocols (TLS in transit and encryption at rest) to safeguard credentials and examination records. Access to institutional portals and student logs is strictly protected through role-based access control (RBAC).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900">5. Contact Us Regarding Privacy</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our data compliance coordinator at{' '}
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

export default PrivacyPolicyPage;
