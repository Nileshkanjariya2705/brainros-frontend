import { useState, useEffect } from 'react';
import { GraduationCap, X, CheckCircle2, AlertCircle, Save, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useGetRegisterOptionsAPI } from '../services';
import type { OptionItem } from '../types/auth.types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal = ({ isOpen, onClose }: StudentProfileModalProps) => {
  const { profile, isLoading, error, successMessage, updateProfile, fetchProfile } =
    useStudentProfile();
  const { getRegisterOptionsAPI } = useGetRegisterOptionsAPI();

  const [languages, setLanguages] = useState<OptionItem[]>([]);

  // Form editable state: ONLY Name and Preferred Language
  const [name, setName] = useState('');
  const [preferredLanguageId, setPreferredLanguageId] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPreferredLanguageId(
        profile.preferredLanguageId || (profile as any).preferredLanguage?.id || '',
      );
    }
  }, [profile]);

  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await getRegisterOptionsAPI();
      if (data) {
        setLanguages(data.languages || []);
      }
    };
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen, getRegisterOptionsAPI]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim(),
      preferredLanguageId: preferredLanguageId || undefined,
    });
    fetchProfile();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student Profile & Identity</h2>
              <p className="text-xs text-slate-500">
                View official credentials and update allowed personal preferences
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Official Student Code Banner */}
          <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-indigo-50/60 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
                Official Student Code
              </span>
              <p className="text-lg font-black text-slate-900 font-mono tracking-wider">
                {profile?.studentCode || profile?.studentId || 'BRN-2026-STUDENT'}
              </p>
              <p className="text-[11px] text-slate-500">
                Permanent student identifier (Read-only)
              </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Verified
              </span>
              <span className="text-[10px] text-slate-400">
                Status: {profile?.status || 'ACTIVE'}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-start space-x-2.5 rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start space-x-2.5 rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-800 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Editable Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Full Name</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Editable
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Preferred Language</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Editable
                </span>
              </label>
              <select
                value={preferredLanguageId}
                onChange={(e) => setPreferredLanguageId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Select Language</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Read-Only Details Grid */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Official Identity & Registration Details (Read-only)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Mobile Number</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {(profile as any)?.user?.mobileNumber || (profile as any)?.user?.phone || '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-700 truncate block">
                  {(profile as any)?.user?.email || '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">State</span>
                <span className="font-semibold text-slate-700">
                  {profile?.state || (profile as any)?.stateRef?.name || '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">City / District</span>
                <span className="font-semibold text-slate-700">
                  {profile?.district || (profile as any)?.districtRef?.name || '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">School / College</span>
                <span className="font-semibold text-slate-700 truncate block">
                  {profile?.schoolCollege || '—'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Target Exam</span>
                <span className="font-semibold text-slate-700">
                  {(profile as any)?.examTarget?.name || (profile as any)?.examTarget || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} size="sm" className="shadow-sm">
              <Save className="h-4 w-4 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileModal;
