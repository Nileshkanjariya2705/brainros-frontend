import React, { useEffect, useState } from 'react';
import { Users, Calendar, CheckCircle } from 'lucide-react';
import { Axios } from '@/base-axios';
import { BatchItem, BatchStudentItem } from '@/types/exam.types';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';

export const BatchManagementPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [students, setStudents] = useState<BatchStudentItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const getArrayData = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await Axios.get('/institutions/me/batches');
      const batchList = getArrayData(res);
      setBatches(batchList);
      if (batchList.length > 0 && !selectedBatch) {
        selectBatch(batchList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setLoading(false);
    }
  };

  const selectBatch = async (batch: BatchItem) => {
    setSelectedBatch(batch);
    try {
      setLoadingStudents(true);
      const res = await Axios.get(`/institutions/me/batches/${batch.id}/students`);
      setStudents(getArrayData(res));
    } catch (err) {
      console.error('Failed to load batch students', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Management</h1>
          <p className="text-sm text-slate-500">
            Inspect student cohort assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPdfButton
            resource="batches"
            filename="batches-roster.pdf"
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Batch List */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Batches ({batches.length})
            </h2>
            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="py-8 text-center text-sm text-slate-400">Loading batches...</div>
              ) : batches.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No batches created yet.
                </div>
              ) : (
                batches.map((b: BatchItem) => (
                  <button
                    key={b.id}
                    onClick={() => selectBatch(b)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedBatch?.id === b.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{b.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {b.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {b._count?.students || 0} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {b.academicYear || '2026-27'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Batch Details & Students */}
        <div className="lg:col-span-2">
          {selectedBatch ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedBatch.name}</h2>
                    <p className="text-xs text-slate-500">
                      Academic Year: {selectedBatch.academicYear} • Class:{' '}
                      {selectedBatch.classLevel || 'General'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" /> {selectedBatch.status}
                  </span>
                </div>

                {/* Students Table */}
                <div className="mt-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-slate-800">
                      Assigned Students ({students.length})
                    </h3>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    {loadingStudents ? (
                      <div className="py-12 text-center text-sm text-slate-400">
                        Loading student roster...
                      </div>
                    ) : students.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-400">
                        No students currently enrolled in this batch.
                      </div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                            <th className="pb-3 font-semibold">Student ID</th>
                            <th className="pb-3 font-semibold">Name</th>
                            <th className="pb-3 font-semibold">Target</th>
                            <th className="pb-3 font-semibold">Status</th>
                            <th className="pb-3 font-semibold">Joined At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students.map((s: BatchStudentItem) => (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="py-3 font-mono text-xs text-indigo-600">
                                {s.student.studentId}
                              </td>
                              <td className="py-3 font-medium text-slate-900">{s.student.name}</td>
                              <td className="py-3 text-slate-600">
                                {s.student.examTarget?.name || 'NEET'}
                              </td>
                              <td className="py-3">
                                <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                                  {s.status}
                                </span>
                              </td>
                              <td className="py-3 text-xs text-slate-400">
                                {new Date(s.joinedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-400">
              Select a batch to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchManagementPage;
