import React, { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import cn from 'classnames';
import {
  useGetHistoricalExamsAPI,
  useCreateHistoricalExamAPI,
  useGetHistoricalExamByIdAPI,
  useImportScoreRangesAPI,
  useValidateDatasetAPI,
  useGetModelAccuracySummaryAPI,
} from '@/modules/Exams/services';
import type {
  HistoricalExamEntity,
  HistoricalScoreRangeEntity,
  DataQualityStatusEnum,
  ModelAccuracySummary,
} from '@/types/exam.types';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';

const EXAM_TYPES = [
  'All Types',
  'NEET',
  'JEE_MAIN',
  'JEE_ADVANCED',
  'BITSAT',
  'MHT_CET',
  'GENERAL',
];

export const HistoricalDatasetsPage: React.FC = () => {
  const { getHistoricalExamsAPI, isLoading } = useGetHistoricalExamsAPI();
  const { createHistoricalExamAPI, isLoading: isCreating } = useCreateHistoricalExamAPI();
  const { getHistoricalExamByIdAPI } = useGetHistoricalExamByIdAPI();
  const { importScoreRangesAPI, isLoading: isImporting } = useImportScoreRangesAPI();
  const { validateDatasetAPI } = useValidateDatasetAPI();
  const { getModelAccuracySummaryAPI } = useGetModelAccuracySummaryAPI();

  const [exams, setExams] = useState<HistoricalExamEntity[]>([]);
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modelSummary, setModelSummary] = useState<ModelAccuracySummary | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [selectedExamForImport, setSelectedExamForImport] = useState<HistoricalExamEntity | null>(
    null,
  );
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [selectedExamDetails, setSelectedExamDetails] = useState<HistoricalExamEntity | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    examName: '',
    examType: 'NEET',
    durationMinutes: 180,
    totalMarks: 720,
    totalCandidates: 15000,
    source: 'OFFICIAL_SOURCE',
  });

  // Import JSON/CSV State
  const [rawJsonText, setRawJsonText] = useState<string>('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const loadExamsAndSummary = async () => {
    const [examsRes, summaryRes] = await Promise.all([
      getHistoricalExamsAPI(selectedType !== 'All Types' ? selectedType : undefined),
      getModelAccuracySummaryAPI('v1.0.0'),
    ]);

    if (examsRes.data) {
      setExams(examsRes.data);
    }
    if (summaryRes.data) {
      setModelSummary(summaryRes.data);
    }
  };

  useEffect(() => {
    loadExamsAndSummary();
  }, [selectedType]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createHistoricalExamAPI(createForm);
    if (res.data || res.isSuccess) {
      setShowCreateModal(false);
      setCreateForm({
        examName: '',
        examType: 'NEET',
        durationMinutes: 180,
        totalMarks: 720,
        totalCandidates: 15000,
        source: 'OFFICIAL_SOURCE',
      });
      loadExamsAndSummary();
    }
  };

  const handleOpenImportModal = (exam: HistoricalExamEntity) => {
    setSelectedExamForImport(exam);
    setRawJsonText(
      JSON.stringify(
        [
          {
            minScore: 680,
            maxScore: 720,
            representativeScore: 700,
            minRank: 1,
            maxRank: 50,
            candidateCount: 50,
          },
          {
            minScore: 640,
            maxScore: 679,
            representativeScore: 660,
            minRank: 51,
            maxRank: 250,
            candidateCount: 200,
          },
          {
            minScore: 600,
            maxScore: 639,
            representativeScore: 620,
            minRank: 251,
            maxRank: 750,
            candidateCount: 500,
          },
          {
            minScore: 550,
            maxScore: 599,
            representativeScore: 575,
            minRank: 751,
            maxRank: 2000,
            candidateCount: 1250,
          },
        ],
        null,
        2,
      ),
    );
    setImportMessage(null);
    setShowImportModal(true);
  };

  const handleImportScoreRanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamForImport) return;

    try {
      const parsed = JSON.parse(rawJsonText);
      if (!Array.isArray(parsed)) {
        setImportMessage('Input must be a valid JSON array of score ranges.');
        return;
      }

      const res = await importScoreRangesAPI(selectedExamForImport.id, {
        scoreRanges: parsed,
      });

      if (res.data || res.isSuccess) {
        setImportMessage('Score ranges successfully imported and validated!');
        setTimeout(() => {
          setShowImportModal(false);
          loadExamsAndSummary();
        }, 1200);
      }
    } catch (err: any) {
      setImportMessage(`Invalid JSON format: ${err.message}`);
    }
  };

  const handleViewRanges = async (exam: HistoricalExamEntity) => {
    const res = await getHistoricalExamByIdAPI(exam.id);
    if (res.data) {
      setSelectedExamDetails(res.data);
      setShowDrawer(true);
    }
  };

  const handleValidateExam = async (examId: string) => {
    const res = await validateDatasetAPI(examId);
    if (res.data || res.isSuccess) {
      loadExamsAndSummary();
    }
  };

  const filteredExams = exams.filter((ex) => {
    const matchesSearch =
      ex.examName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.examType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: DataQualityStatusEnum) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 size={12} />
            VALID
          </span>
        );
      case 'PARTIALLY_VALID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle size={12} />
            PARTIAL
          </span>
        );
      case 'INVALID':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <XCircle size={12} />
            INVALID
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-800">
              Prediction Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Historical Interpolation v1.0.0
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Historical Exam Datasets & Models
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage validated benchmark datasets, inspect score-to-rank distributions, and monitor
            prediction accuracy.
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="self-start md:self-auto gap-2">
          <Plus size={16} />
          <span>New Historical Exam</span>
        </Button>
      </div>

      {/* ── Model Accuracy Summary Strip ────────────────────────────── */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
            Evaluated Predictions
          </span>
          <div className="text-2xl md:text-3xl font-black text-white mt-1">
            {modelSummary?.totalEvaluations?.toLocaleString() || '0'}
          </div>
          <span className="text-[10px] text-indigo-300">
            Model {modelSummary?.modelVersion || 'v1.0.0'}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
            Range Coverage
          </span>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">
            {modelSummary?.rangeCoveragePercentage
              ? `${modelSummary.rangeCoveragePercentage}%`
              : '—'}
          </div>
          <span className="text-[10px] text-indigo-300">Within Predicted Bracket</span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
            Mean Absolute Error
          </span>
          <div className="text-2xl md:text-3xl font-black text-teal-300 mt-1">
            {modelSummary?.meanAbsoluteError ? `±${modelSummary.meanAbsoluteError}` : '—'}
          </div>
          <span className="text-[10px] text-indigo-300">Average Rank Variance</span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
            Relative Error
          </span>
          <div className="text-2xl md:text-3xl font-black text-amber-300 mt-1">
            {modelSummary?.meanRelativeError ? `${modelSummary.meanRelativeError}%` : '—'}
          </div>
          <span className="text-[10px] text-indigo-300">Normalized Error Rate</span>
        </div>
      </div>

      {/* ── Controls Bar: Filters & Search ──────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by exam name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {EXAM_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap',
                selectedType === t
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Historical Exams Grid ───────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20">
          <Loader label="Loading historical exam datasets..." />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-md mx-auto">
          <Database className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800">No Historical Datasets Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Import past exam benchmark data to power deterministic statistical rank prediction.
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            Add Historical Exam
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-700">
                    {exam.examType}
                  </span>
                  {getStatusBadge(exam.dataQualityStatus)}
                </div>

                <h3 className="text-base font-black text-slate-900 mt-2">{exam.examName}</h3>
                <span className="text-xs text-slate-400 font-medium block">
                  Source: {exam.source}
                </span>

                {/* Score & Candidate Meta */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Max Marks
                    </span>
                    <span className="text-xs font-black text-slate-800">{exam.totalMarks}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Candidates
                    </span>
                    <span className="text-xs font-black text-slate-800">
                      {exam.totalCandidates.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Ranges
                    </span>
                    <span className="text-xs font-black text-indigo-600">
                      {exam._count?.scoreRanges ?? 0}
                    </span>
                  </div>
                </div>

                {/* Quality Score Meter */}
                {exam.qualityScore !== null && exam.qualityScore !== undefined && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Quality Score</span>
                      <span className="text-emerald-600 font-black">{exam.qualityScore}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${exam.qualityScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleViewRanges(exam)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Layers size={13} />
                  <span>Inspect ({exam._count?.scoreRanges ?? 0})</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleValidateExam(exam.id)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title="Validate Quality"
                  >
                    <ShieldCheck size={14} />
                  </button>
                  <button
                    onClick={() => handleOpenImportModal(exam)}
                    className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100"
                  >
                    Import Data
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Historical Exam Modal ────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 mb-1">Add Historical Exam</h3>
            <p className="text-xs text-slate-500 mb-5">
              Register a past benchmark exam to calibrate prediction distributions.
            </p>

            <form onSubmit={handleCreateExam} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Exam Name</label>
                <input
                  type="text"
                  required
                  value={createForm.examName}
                  onChange={(e) => setCreateForm({ ...createForm, examName: e.target.value })}
                  placeholder="e.g. NEET 2025 All-India Benchmark"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Exam Type</label>
                  <select
                    value={createForm.examType}
                    onChange={(e) => setCreateForm({ ...createForm, examType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {EXAM_TYPES.filter((t) => t !== 'All Types').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Source</label>
                  <select
                    value={createForm.source}
                    onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OFFICIAL_SOURCE">OFFICIAL_SOURCE</option>
                    <option value="INTERNAL_RESULTS">INTERNAL_RESULTS</option>
                    <option value="ADMIN_IMPORT">ADMIN_IMPORT</option>
                    <option value="PARTNER_DATA">PARTNER_DATA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Marks</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={createForm.totalMarks}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, totalMarks: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Candidates</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={createForm.totalCandidates}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, totalCandidates: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  Create Exam
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Import Score Ranges Modal ───────────────────────────────── */}
      {showImportModal && selectedExamForImport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Import Score Ranges: {selectedExamForImport.examName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste score-to-rank distribution JSON array. Monotonicity quality checks will run
              automatically upon ingestion.
            </p>

            {importMessage && (
              <div className="p-3 mb-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold">
                {importMessage}
              </div>
            )}

            <form onSubmit={handleImportScoreRanges} className="space-y-4">
              <div>
                <textarea
                  rows={10}
                  required
                  value={rawJsonText}
                  onChange={(e) => setRawJsonText(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 text-xs">
                <Button variant="secondary" type="button" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isImporting}>
                  {isImporting ? 'Ingesting & Validating...' : 'Ingest Score Ranges'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Score Ranges Drawer ────────────────────────────────────── */}
      {showDrawer && selectedExamDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedExamDetails.examName}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedExamDetails.scoreRanges?.length || 0} Calibrated Score Ranges
                </span>
              </div>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            {/* Score Ranges Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Score Bracket</th>
                    <th className="py-2.5 px-3">Rank Bracket</th>
                    <th className="py-2.5 px-3 text-right">Candidates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {selectedExamDetails.scoreRanges?.map((r: HistoricalScoreRangeEntity) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-indigo-700 font-bold">
                        {r.minScore} – {r.maxScore}
                      </td>
                      <td className="py-2 px-3 text-slate-800 font-bold">
                        #{r.minRank} – #{r.maxRank}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">{r.candidateCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={() => setShowDrawer(false)} className="w-full" variant="secondary">
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricalDatasetsPage;
