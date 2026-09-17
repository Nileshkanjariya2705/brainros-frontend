import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import PublicNavbar from '@/components/layout/PublicNavbar';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Brainros',
    url: 'https://www.brainros.com',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-1800-BRAINROS',
      contactType: 'customer support',
      email: 'support@brainros.com',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
      <SeoHead
        title="Contact Brainros — Support & Institutional Partnerships"
        description="Get in touch with Brainros for student support, institutional exam management inquiries, AI translation integration, or general support."
        canonicalPath="/contact"
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
          <span className="text-indigo-400">Contact</span>
        </nav>

        <section className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Contact <span className="text-indigo-400">Brainros</span>
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Have questions about student testing, institutional onboarding, or AI multi-language exam translation? We are here to help.
          </p>
        </section>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Details */}
          <div className="space-y-8 bg-slate-800/40 border border-slate-700/60 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Get in Touch</h2>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Support</h3>
                <p className="text-sm font-semibold text-white mt-1">support@brainros.com</p>
                <p className="text-xs text-slate-400">Response within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Helpline</h3>
                <p className="text-sm font-semibold text-white mt-1">+91 1800 272 4676 (Toll-Free)</p>
                <p className="text-xs text-slate-400">Mon - Sat: 9:00 AM - 7:00 PM IST</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Headquarters</h3>
                <p className="text-sm font-semibold text-white mt-1">Brainros Educational Technologies</p>
                <p className="text-xs text-slate-400">Tech Park Campus, Educational District, India</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-8">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold text-white">Message Sent Successfully!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Thank you for reaching out. Our support team will respond to your inquiry shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Send us a Message</h2>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">School / Institution (Optional)</label>
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="Institution name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Send size={16} /> Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 text-center py-8 text-xs text-slate-500">
        © {new Date().getFullYear()} Brainros. All rights reserved.
      </footer>
    </div>
  );
};

export default ContactPage;
