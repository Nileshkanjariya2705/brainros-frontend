import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Globe2,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  Save,
  X,
  UploadCloud,
} from 'lucide-react';
import {
  useGetLanguagesAPI,
  useCreateLanguageAPI,
  useUpdateLanguageAPI,
  useDeleteLanguageAPI,
} from '../services/regionalLanguage.service';
import type { SupportedLanguage } from '../types/regionalLanguage.types';
import Button from '@/components/ui/Button';

const LanguageManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const firstSegment = location.pathname.split('/')[1];
  const routePrefix = [
    'super-admin',
    'admin',
    'general-manager',
    'manager',
    'operator',
    'staff',
  ].includes(firstSegment)
    ? `/${firstSegment}`
    : '/admin';

  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLang, setEditingLang] = useState<SupportedLanguage | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNativeName, setFormNativeName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { getLanguagesAPI } = useGetLanguagesAPI();
  const { createLanguageAPI, isLoading: isCreating } = useCreateLanguageAPI();
  const { updateLanguageAPI, isLoading: isUpdating } = useUpdateLanguageAPI();
  const { deleteLanguageAPI } = useDeleteLanguageAPI();

  const fetchLanguages = useCallback(async () => {
    const { data } = await getLanguagesAPI(true);
    if (data) setLanguages(data);
  }, [getLanguagesAPI]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  const handleOpenCreateModal = () => {
    setEditingLang(null);
    setFormCode('');
    setFormName('');
    setFormNativeName('');
    setFormDesc('');
    setFormOrder(languages.length + 1);
    setFormIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lang: SupportedLanguage) => {
    setEditingLang(lang);
    setFormCode(lang.code);
    setFormName(lang.name);
    setFormNativeName(lang.nativeName || '');
    setFormDesc(lang.description || '');
    setFormOrder(lang.displayOrder);
    setFormIsActive(lang.isActive);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formCode.trim() || !formName.trim()) {
      setErrorMsg('Code and Name are required.');
      return;
    }
    setErrorMsg(null);

    if (editingLang) {
      const { error } = await updateLanguageAPI(editingLang.id, {
        name: formName.trim(),
        nativeName: formNativeName.trim() || formName.trim(),
        description: formDesc.trim() || undefined,
        displayOrder: formOrder,
        isActive: formIsActive,
      });

      if (error) {
        setErrorMsg(typeof error === 'string' ? error : 'Failed to update language');
        return;
      }
    } else {
      const { error } = await createLanguageAPI({
        code: formCode.trim().toLowerCase(),
        name: formName.trim(),
        nativeName: formNativeName.trim() || formName.trim(),
        description: formDesc.trim() || undefined,
        displayOrder: formOrder,
        isActive: formIsActive,
      });

      if (error) {
        setErrorMsg(typeof error === 'string' ? error : 'Failed to create language');
        return;
      }
    }

    setIsModalOpen(false);
    fetchLanguages();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this language?')) return;
    const { error } = await deleteLanguageAPI(id);
    if (error) {
      alert(typeof error === 'string' ? error : 'Cannot delete language');
      return;
    }
    fetchLanguages();
  };

  const filteredLanguages = languages.filter((l) =>
    `${l.name} ${l.nativeName} ${l.code}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Globe2 size={13} />
            <span>Regional Language Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Regional Language Master
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure official regional languages, native scripts, display priority, and
            availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/languages/import`)}
            className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold"
          >
            <UploadCloud size={16} />
            <span>Bulk Import Translations</span>
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
          >
            <Plus size={16} />
            <span>Add New Language</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Languages
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{languages.length}</span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Active in Exams
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {languages.filter((l) => l.isActive).length}
          </span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Regional Scripts
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">9 Standard</span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Zero Answer Loss
          </span>
          <span className="text-xs font-semibold text-purple-900 mt-2 block">
            Live Exam Switching Enabled
          </span>
        </div>
      </div>

      {/* Search & Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or script..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <span className="text-xs font-medium text-slate-500">
            Showing <strong>{filteredLanguages.length}</strong> languages
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Order</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Language Name</th>
                <th className="px-6 py-3.5">Native Script Preview</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredLanguages.map((lang) => (
                <tr key={lang.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">
                    #{lang.displayOrder}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono font-bold text-slate-700 uppercase border border-slate-200">
                      {lang.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {lang.name}
                    {lang.description && (
                      <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                        {lang.description}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700 border border-indigo-100">
                      <Sparkles size={12} className="text-indigo-500" />
                      {lang.nativeName || lang.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {lang.isActive ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-semibold">
                        <XCircle size={14} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(lang)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        title="Edit Language"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(lang.id)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        title="Delete Language"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingLang ? 'Edit Language' : 'Add Regional Language'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">ISO Code (e.g. 'hi') *</label>
                  <input
                    type="text"
                    disabled={Boolean(editingLang)}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="hi, gu, ta..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-mono text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Display Order</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 font-semibold text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Language Name (English) *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Hindi, Gujarati, Tamil..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Native Script Name</label>
                <input
                  type="text"
                  value={formNativeName}
                  onChange={(e) => setFormNativeName(e.target.value)}
                  placeholder="हिन्दी, ગુજરાતી, தமிழ்..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Regional language description..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-indigo-600"
                />
                <span className="font-bold text-slate-800">
                  Active (Available for examinations)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={isCreating || isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save size={14} className="mr-1" />
                Save Language
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageManagementPage;
