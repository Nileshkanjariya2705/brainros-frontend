import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Clock,
  Loader2,
  Phone,
  MapPin,
} from 'lucide-react';
import SeoHead from '@/components/seo/SeoHead';
import { Axios } from '@/base-axios';
import { CONTACT_EMAIL } from '@/config';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    subject: '',
    message: '',
    honeypot: '', // hidden field for bot protection
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Official contact email from environment or default
  const officialContactEmail = CONTACT_EMAIL;

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Please enter a valid full name (at least 2 characters).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = 'Please provide details in your message (at least 10 characters).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        institution: formData.institution.trim() || undefined,
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
        honeypot: formData.honeypot || undefined,
      };

      const res = await Axios.post('/public/contact', payload);

      if (res.data?.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(
          res.data?.message || 'Unable to submit your message at this time. Please try again.',
        );
      }
    } catch (err: any) {
      console.error('Contact form submission error:', err);
      const serverMsg =
        err?.response?.data?.message ||
        'Failed to connect to the server. Please check your internet connection or email us directly.';
      setErrorMessage(typeof serverMsg === 'string' ? serverMsg : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Brainros',
      url: 'https://www.brainros.com/contact',
      description:
        'Get in touch with Brainros for student support, institutional exam management inquiries, or regional AI translation demos.',
      mainEntity: {
        '@type': 'Organization',
        name: 'Brainros (SSKSSVL EDUCATION AND EVENTS OPC PVT LTD)',
        email: officialContactEmail,
        telephone: '+91-9008305109',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'No 209, Charan Habitat, No 24 Dena Bank Colony, Ganganagar',
          addressLocality: 'Bangalore',
          addressRegion: 'Karnataka',
          postalCode: '560032',
          addressCountry: 'IN',
        },
        url: 'https://www.brainros.com',
        logo: 'https://www.brainros.com/logo.svg',
      },
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
          name: 'Contact Us',
          item: 'https://www.brainros.com/contact',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <SeoHead
        title="Contact Brainros — Inquiries & Institutional Partnerships"
        description="Contact Brainros for school and coaching institute test series inquiries, student accounts, and AI multilingual exam translation demonstrations."
        canonicalPath="/contact"
        jsonLd={jsonLd}
      />

      {/* Header Banner */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-indigo-50/50 via-white to-white border-b border-slate-100">
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
            <span className="text-indigo-600 font-bold">Contact</span>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-6">
            <Sparkles size={14} className="text-indigo-600" />
            <span>We Are Here to Help</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Get in Touch with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Brainros
            </span>
          </h1>

          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Have questions about institutional onboarding, student test access, batch scheduling, or AI question translation? Send us a message and our team will respond promptly.
          </p>
        </div>
      </section>

      {/* Contact Content Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-6xl mx-auto">
            {/* Left Contact Information Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 shadow-xs">
                <h2 className="text-lg font-black text-slate-900 mb-6">
                  Direct Inquiries &amp; Support
                </h2>

                <div className="space-y-6 text-xs">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Official Contact Email
                      </span>
                      <a
                        href={`mailto:${officialContactEmail}`}
                        className="text-sm font-bold text-indigo-600 hover:underline mt-0.5 inline-block"
                      >
                        {officialContactEmail}
                      </a>
                      <p className="text-slate-500 mt-0.5">
                        Inquiries typically answered within 24 business hours.
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Direct Phone / Support
                      </span>
                      <a
                        href="tel:+919008305109"
                        className="text-sm font-bold text-indigo-600 hover:underline mt-0.5 inline-block"
                      >
                        +91 90083 05109
                      </a>
                      <p className="text-slate-500 mt-0.5">
                        Call us for quick support and onboarding inquiries.
                      </p>
                    </div>
                  </div>

                  {/* Registered Office Address */}
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Registered Office Address
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                        SSKSSVL EDUCATION AND EVENTS OPC PVT LTD
                      </p>
                      <p className="text-slate-600 mt-1 leading-relaxed">
                        No 209, Charan Habitat, No 24 Dena Bank Colony, Ganganagar, Bangalore, Karnataka &ndash; 560032
                      </p>
                    </div>
                  </div>

                  {/* Institutional Partnerships */}
                  {/* <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Institutional Partnerships
                      </span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        Schools &amp; Coaching Centers
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        Assistance with batch enrollment, custom question banks, and portal setup.
                      </p>
                    </div>
                  </div> */}

                  {/* Support Availability */}
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Support Availability
                      </span>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">
                        Monday &ndash; Saturday
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        9:30 AM to 6:30 PM IST (Excluding National Holidays)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-200/80">
                  <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 text-xs text-indigo-950">
                    <strong className="block font-bold mb-1">Are you a registered student?</strong>
                    <span>
                      If you already have an account, you can sign in directly to access your mock test calendar and performance reports.
                    </span>
                    <Link
                      to="/login"
                      className="block font-bold text-indigo-600 hover:underline mt-2"
                    >
                      Sign In to Student Portal &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Form Card */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
                {isSubmitted ? (
                  <div className="text-center py-10">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Thank you. Your message has been received.
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Our academic technology team has received your message and will get back to you shortly via the email address you provided.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          institution: '',
                          subject: '',
                          message: '',
                          honeypot: '',
                        });
                      }}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
                    >
                      <span>Send Another Message</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 mb-1">
                        Send Us an Inquiry
                      </h2>
                      <p className="text-xs text-slate-500 mb-6">
                        Complete the form below and an academic coordinator will get in touch with you.
                      </p>
                    </div>

                    {errorMessage && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                        <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Honeypot field (hidden from genuine users) */}
                    <div className="hidden" aria-hidden="true">
                      <input
                        type="text"
                        name="honeypot"
                        tabIndex={-1}
                        value={formData.honeypot}
                        onChange={(e) =>
                          setFormData({ ...formData, honeypot: e.target.value })
                        }
                        autoComplete="off"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                          }}
                          placeholder="e.g. Ramesh Kulkarni"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                            fieldErrors.name
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white'
                          }`}
                        />
                        {fieldErrors.name && (
                          <span className="text-[11px] text-rose-600 mt-1 block">
                            {fieldErrors.name}
                          </span>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                          }}
                          placeholder="you@school.edu or you@gmail.com"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                            fieldErrors.email
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                              : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white'
                          }`}
                        />
                        {fieldErrors.email && (
                          <span className="text-[11px] text-rose-600 mt-1 block">
                            {fieldErrors.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phone / Mobile (Optional)
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder="+91 98765 43210"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>

                      {/* Institution / Organization */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          School / Coaching Center (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.institution}
                          onChange={(e) =>
                            setFormData({ ...formData, institution: e.target.value })
                          }
                          placeholder="e.g. Apex Academy"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Inquiry Topic (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        placeholder="e.g. Inquiring about NEET Test Series for 200 Students"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value });
                          if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
                        }}
                        placeholder="Please describe your requirements, student cohort size, or any specific questions..."
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 ${
                          fieldErrors.message
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white'
                        }`}
                      />
                      {fieldErrors.message && (
                        <span className="text-[11px] text-rose-600 mt-1 block">
                          {fieldErrors.message}
                        </span>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-7 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" />
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
