import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit2, Trash2, Search } from 'lucide-react';
import cn from 'classnames';
import {
  useGetStrategyRulesAPI,
  useCreateStrategyRuleAPI,
  useUpdateStrategyRuleAPI,
  useDeleteStrategyRuleAPI,
} from '@/modules/Exams/services';
import type { StrategyRuleEntity, StrategyCategory, StrategySeverity } from '@/types/exam.types';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';

const CATEGORIES: { label: string; value: StrategyCategory }[] = [
  { label: 'All Categories', value: '' as any },
  { label: 'Attempt Coverage', value: 'ATTEMPT_COVERAGE' },
  { label: 'Risk Analysis', value: 'RISK' },
  { label: 'Negative Marking', value: 'NEGATIVE_MARKING' },
  { label: 'Time Management', value: 'TIME_MANAGEMENT' },
  { label: 'Question Selection', value: 'QUESTION_SELECTION' },
  { label: 'Review Behavior', value: 'REVIEW_BEHAVIOR' },
];

const OPERATORS = ['GT', 'GTE', 'LT', 'LTE', 'EQ', 'BETWEEN', 'PERCENT_GT', 'PERCENT_LT'];
const SEVERITIES: StrategySeverity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const StrategyRuleManagementPage: React.FC = () => {
  const { getStrategyRulesAPI, isLoading } = useGetStrategyRulesAPI();
  const { createStrategyRuleAPI, isLoading: isCreating } = useCreateStrategyRuleAPI();
  const { updateStrategyRuleAPI, isLoading: isUpdating } = useUpdateStrategyRuleAPI();
  const { deleteStrategyRuleAPI } = useDeleteStrategyRuleAPI();

  const [rules, setRules] = useState<StrategyRuleEntity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<StrategyRuleEntity | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'RISK' as StrategyCategory,
    metric: 'HIGH_RISK_WRONG_COUNT',
    operator: 'GTE',
    threshold: 4,
    comparisonValue: 0,
    severity: 'HIGH' as StrategySeverity,
    priority: 1,
    titleTemplate: 'Selective Question Attempt Strategy',
    recommendationTemplate:
      'You attempted {highRiskAttemptCount} high-risk questions and {highRiskWrongCount} were incorrect. Estimated avoidable loss: {avoidableNegativeMarks} marks.',
    isActive: true,
  });

  const loadRules = async () => {
    const res = await getStrategyRulesAPI(
      selectedCategory ? { category: selectedCategory } : undefined,
    );
    if (res.data) {
      setRules(res.data);
    }
  };

  useEffect(() => {
    loadRules();
  }, [selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'RISK',
      metric: 'HIGH_RISK_WRONG_COUNT',
      operator: 'GTE',
      threshold: 4,
      comparisonValue: 0,
      severity: 'HIGH',
      priority: 1,
      titleTemplate: 'Selective Question Attempt Strategy',
      recommendationTemplate:
        'You attempted {highRiskAttemptCount} high-risk questions and {highRiskWrongCount} were incorrect. Estimated avoidable loss: {avoidableNegativeMarks} marks.',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (rule: StrategyRuleEntity) => {
    setEditingRule(rule);
    setFormData({
      code: rule.code,
      name: rule.name,
      description: rule.description || '',
      category: rule.category,
      metric: rule.metric,
      operator: rule.operator,
      threshold: rule.threshold,
      comparisonValue: rule.comparisonValue || 0,
      severity: rule.severity,
      priority: rule.priority,
      titleTemplate: rule.titleTemplate,
      recommendationTemplate: rule.recommendationTemplate,
      isActive: rule.isActive,
    });
    setShowModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRule) {
      const res = await updateStrategyRuleAPI(editingRule.id, formData);
      if (res.data || res.isSuccess) {
        setShowModal(false);
        loadRules();
      }
    } else {
      const res = await createStrategyRuleAPI(formData);
      if (res.data || res.isSuccess) {
        setShowModal(false);
        loadRules();
      }
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this strategy rule?')) {
      await deleteStrategyRuleAPI(id);
      loadRules();
    }
  };

  const handleToggleActive = async (rule: StrategyRuleEntity) => {
    await updateStrategyRuleAPI(rule.id, { isActive: !rule.isActive });
    loadRules();
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.metric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
              Admin Configuration
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Rule Engine v1.0.0
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Attempt Strategy Rules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure deterministic evaluation rules, severity thresholds, and message templates for
            behavioral analysis.
          </p>
        </div>

        <Button onClick={handleOpenCreateModal} className="self-start md:self-auto gap-2">
          <Plus size={16} />
          <span>New Strategy Rule</span>
        </Button>
      </div>

      {/* ── Controls Bar ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, name, metric..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value || 'all'}
              onClick={() => setSelectedCategory(cat.value)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap',
                selectedCategory === cat.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rules Grid / List ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20">
          <Loader label="Loading strategy rules..." />
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-md mx-auto">
          <Sliders className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800">No Strategy Rules Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            No rules match the selected filter. Click below to add a new strategy rule.
          </p>
          <Button onClick={handleOpenCreateModal} size="sm">
            Create Rule
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                'rounded-3xl border p-6 bg-white shadow-sm transition-all flex flex-col justify-between',
                rule.isActive
                  ? 'border-slate-200 hover:border-indigo-200'
                  : 'border-slate-200/60 opacity-60 bg-slate-50/50',
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700">
                        {rule.category}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                          rule.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : rule.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200',
                        )}
                      >
                        {rule.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Priority {rule.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mt-1">{rule.name}</h3>
                    <span className="text-xs font-mono font-bold text-slate-500 block">
                      {rule.code}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleActive(rule)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors',
                      rule.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200',
                    )}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Condition Box */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-xs text-slate-800">
                  <span className="text-indigo-600 font-bold">{rule.metric}</span>{' '}
                  <span className="text-slate-500 font-extrabold">{rule.operator}</span>{' '}
                  <span className="text-rose-600 font-bold">{rule.threshold}</span>
                  {rule.comparisonValue ? (
                    <span>
                      {' '}
                      to <span className="text-rose-600 font-bold">{rule.comparisonValue}</span>
                    </span>
                  ) : null}
                </div>

                {/* Template */}
                <div className="mt-3 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-0.5">Template:</span>
                  <p className="italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    "{rule.recommendationTemplate}"
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Config v{rule.configVersion}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(rule)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingRule ? 'Edit Strategy Rule' : 'Create New Strategy Rule'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Define the condition operator, metric, severity level, and recommendation template.
            </p>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rule Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRule}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. HIGH_RISK_ATTEMPTING"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. High Risk Attempting"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as StrategyCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value as StrategySeverity })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Metric</label>
                  <input
                    type="text"
                    required
                    value={formData.metric}
                    onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                    placeholder="e.g. HIGH_RISK_WRONG_COUNT"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operator</label>
                  <select
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Threshold</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={formData.threshold}
                    onChange={(e) =>
                      setFormData({ ...formData, threshold: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Title Template</label>
                <input
                  type="text"
                  required
                  value={formData.titleTemplate}
                  onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
                  placeholder="e.g. Selective Question Attempt Strategy"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Recommendation Template
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.recommendationTemplate}
                  onChange={(e) =>
                    setFormData({ ...formData, recommendationTemplate: e.target.value })
                  }
                  placeholder="e.g. You attempted {highRiskAttemptCount} questions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyRuleManagementPage;
