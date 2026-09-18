import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Mail,
  ShieldCheck,
  ArrowRight,
  Globe2,
  Sparkles,
} from 'lucide-react';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';
import { ENABLE_AUTH_ROUTES, CONTACT_EMAIL } from '@/config';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      {/* Top Pre-Footer Call to Action Strip */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row text-center md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Next-Gen Examination Infrastructure</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Modernize Your Institution’s Online Exams Today
              </h3>
              <p className="mt-1 text-sm text-slate-400 max-w-xl">
                Deliver official NTA-standard mock tests in 9 regional languages with instant AI rank analytics.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {ENABLE_AUTH_ROUTES && (
                <Link
                  to={PUBLIC_NAVIGATION.register}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </Link>
              )}
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-200 transition-all hover:text-white"
              >
                <Mail size={14} />
                <span>Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                <BrainCircuit size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white">BRAINROS</span>
                <span className="text-[10px] tracking-wider uppercase text-indigo-400 font-bold">
                  Examination &amp; Analytics Platform
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Brainros provides comprehensive online exam management, automated question paper translation in 9 regional languages, standardized NTA testing interfaces, and granular AI performance analytics for schools, coaching centers, and competitive exam aspirants.
            </p>

            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck size={14} /> High-Security Architecture
              </span>
              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-medium">
                <Globe2 size={14} /> 9 Languages Supported
              </span>
            </div>
          </div>

          {/* Column 1: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/exams" className="text-slate-400 hover:text-white transition-colors">
                  Exams / Solutions
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-white transition-colors">
                  FAQ &amp; Knowledge Base
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Supported Solutions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Exam Solutions
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/exams/jee" className="text-slate-400 hover:text-white transition-colors">
                  JEE Main &amp; Advanced
                </Link>
              </li>
              <li>
                <Link to="/exams/neet" className="text-slate-400 hover:text-white transition-colors">
                  NEET UG Medical Series
                </Link>
              </li>
              <li>
                <Link to="/exams/cet" className="text-slate-400 hover:text-white transition-colors">
                  State Engineering &amp; CET
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-slate-400 hover:text-white transition-colors">
                  AI Regional Translation
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
                  Institution Batch Portals
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-slate-400 hover:text-white transition-colors">
                  Parent Progress Monitoring
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Support &amp; Trust
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/faq" className="text-slate-400 hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-white transition-colors">
                  Help Desk &amp; Inquiries
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li className="pt-2 text-[11px] text-slate-400 space-y-1">
                <span className="block font-semibold text-slate-300">Official Contact</span>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-indigo-400 hover:underline block"
                >
                  {CONTACT_EMAIL}
                </a>
                <a
                  href="tel:+919008305109"
                  className="text-indigo-400 hover:underline block"
                >
                  +91 90083 05109
                </a>
                <p className="text-[10px] text-slate-400 pt-1 leading-snug">
                  SSKSSVL EDUCATION AND EVENTS OPC PVT LTD<br />
                  No 209, Charan Habitat, No 24 Dena Bank Colony, Ganganagar, Bangalore 560032
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {currentYear} Brainros. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
