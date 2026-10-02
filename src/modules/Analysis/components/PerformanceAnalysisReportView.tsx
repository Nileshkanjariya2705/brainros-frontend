import React, { useState } from 'react';
import {
  Download,
  Printer,
  ChevronLeft,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  Sparkles,
  BookOpen,
  User,
  Star,
  Layers,
  HelpCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { FullAnalysisReport } from '@/types/exam.types';

interface PerformanceAnalysisReportViewProps {
  analysis: FullAnalysisReport;
  onBack?: () => void;
  onDownloadPdf?: () => void;
  isDownloadingPdf?: boolean;
}

export const PerformanceAnalysisReportView: React.FC<PerformanceAnalysisReportViewProps> = ({
  analysis,
  onBack,
  onDownloadPdf,
  isDownloadingPdf = false,
}) => {
  // Local state for interactive checklist
  const [completedChecklist, setCompletedChecklist] = useState<Record<string, boolean>>({});

  const toggleChecklist = (id: string) => {
    setCompletedChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const s1 = analysis.section1StudentDetails;
  const s2 = analysis.section2OverallPerformance;
  const s3 = analysis.section3SubjectWiseAnalysis;
  const s4 = analysis.section4SubjectPerformance;
  const s5 = analysis.section5TopicWisePerformance;
  const s6 = analysis.section6StrengthWeakness;
  const s7 = analysis.section7ErrorAnalysis;
  const s8 = analysis.section8TimeManagement;
  const s9 = analysis.section9PerformanceTrend;
  const s10 = analysis.section10ExpectedPerformance;
  const s11 = analysis.section11FourteenDayPlan;
  const s12 = analysis.section12ActionChecklist;
  const s13 = analysis.section13ParentSummary;
  const s14 = analysis.section14PerformanceIndex;

  return (
    <div className="bg-slate-50 min-h-screen pb-16 print:bg-white print:p-0">
      {/* Top Action Navigation Bar (Hidden in Print) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="gap-1.5 text-slate-700 hover:bg-slate-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Summary
              </Button>
            )}
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-900 leading-tight">
                Student Performance Analysis Report
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {analysis.examTitle} • Official Diagnostic Assessment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-slate-700 hover:bg-slate-100"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </Button>
            {onDownloadPdf && (
              <Button
                variant="primary"
                size="sm"
                onClick={onDownloadPdf}
                disabled={isDownloadingPdf}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                {isDownloadingPdf ? 'Generating PDF...' : 'Download Analysis PDF'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="max-w-5xl mx-auto mt-6 px-4 space-y-6 print:m-0 print:p-0 print:max-w-none">
        
        {/* Brand Header Banner */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 print:rounded-none print:shadow-none">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-indigo-600 text-white text-xs font-black tracking-wider px-2.5 py-0.5 rounded">
                BRAINROS 2026
              </span>
              <span className="text-xs font-semibold text-slate-400">
                NEET • JEE • CET MOCK TEST SERIES
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-2 text-white">
              STUDENT PERFORMANCE ANALYSIS REPORT
            </h2>
            <p className="text-xs text-indigo-300 mt-0.5">
              Comprehensive 14-Dimension Diagnostic & Educational Assessment
            </p>
          </div>

          <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
            <div className="text-sm font-bold text-slate-100">{analysis.examTitle}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Target: <span className="text-white font-medium">{analysis.examTargetName}</span> | Total Marks:{' '}
              <span className="text-white font-medium">{analysis.overall.totalMarks}</span>
            </div>
          </div>
        </div>

        {/* 1. STUDENT DETAILS */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            1. STUDENT DETAILS
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Student Name</span>
              <span className="text-slate-900 font-bold text-sm mt-0.5 block">{s1?.studentName || 'Student'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Student ID</span>
              <span className="text-slate-900 font-bold text-sm mt-0.5 block">{s1?.studentId || 'BR-STU-001'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Examination</span>
              <span className="text-slate-900 font-semibold mt-0.5 block">{s1?.examination || analysis.examTitle}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Class</span>
              <span className="text-slate-900 font-semibold mt-0.5 block">{s1?.className || '12th / 2nd PUC'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Test Number</span>
              <span className="text-slate-900 font-semibold mt-0.5 block">{s1?.testNumber || analysis.examTitle}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Test Date</span>
              <span className="text-slate-900 font-semibold mt-0.5 block">{s1?.testDate || 'Recently'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Test Mode</span>
              <span className="text-slate-900 font-semibold mt-0.5 block">{s1?.testMode || 'Online'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
              <span className="text-slate-500 font-medium block">Total Questions / Max Marks</span>
              <span className="text-slate-900 font-bold mt-0.5 block">
                {s1?.totalQuestions ?? analysis.overall.totalQuestions} Qs / {s1?.maximumMarks ?? analysis.overall.totalMarks} Marks
              </span>
            </div>
          </div>
        </div>

        {/* 2. OVERALL PERFORMANCE */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4" />
            2. OVERALL PERFORMANCE
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg">
              <span className="text-xs text-indigo-700 font-semibold block">Total Marks</span>
              <span className="text-lg md:text-xl font-black text-indigo-900 block mt-0.5">
                {s2?.totalMarks ?? analysis.overall.obtainedMarks} <span className="text-xs font-normal text-indigo-600">/ {s2?.maximumMarks ?? analysis.overall.totalMarks}</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-600 font-medium block">Percentage</span>
              <span className="text-lg md:text-xl font-black text-slate-900 block mt-0.5">
                {(s2?.percentage ?? analysis.overall.percentage).toFixed(2)}%
              </span>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg">
              <span className="text-xs text-emerald-700 font-semibold block">Accuracy</span>
              <span className="text-lg md:text-xl font-black text-emerald-900 block mt-0.5">
                {(s2?.accuracy ?? analysis.overall.accuracy).toFixed(2)}%
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-xs text-slate-600 font-medium block">Correct / Wrong</span>
              <span className="text-base md:text-lg font-bold text-slate-800 block mt-0.5">
                <span className="text-emerald-600 font-black">{s2?.correctAnswers ?? analysis.overall.correctCount}</span> /{' '}
                <span className="text-rose-600 font-black">{s2?.incorrectAnswers ?? analysis.overall.wrongCount}</span>
              </span>
            </div>
            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-lg col-span-2 sm:col-span-1">
              <span className="text-xs text-purple-700 font-semibold block">Performance Level</span>
              <span className="text-base md:text-lg font-black text-purple-900 block mt-0.5">
                {s2?.performanceLevel || 'Good'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. SUBJECT-WISE ANALYSIS */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4" />
            3. SUBJECT-WISE ANALYSIS
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[11px] font-bold">
                <tr>
                  <th className="p-2.5 pl-4">Subject</th>
                  <th className="p-2.5 text-center">Max Marks</th>
                  <th className="p-2.5 text-center">Score</th>
                  <th className="p-2.5 text-center">%</th>
                  <th className="p-2.5 text-center text-emerald-300">Correct</th>
                  <th className="p-2.5 text-center text-rose-300">Wrong</th>
                  <th className="p-2.5 text-center text-slate-300">Unattempted</th>
                  <th className="p-2.5 text-center pr-4">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(s3?.rows || []).map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-2.5 pl-4 font-bold text-slate-900">{row.subject}</td>
                    <td className="p-2.5 text-center text-slate-600">{row.max}</td>
                    <td className="p-2.5 text-center font-bold text-indigo-600">{row.score}</td>
                    <td className="p-2.5 text-center font-medium text-slate-700">{row.percentage.toFixed(1)}%</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">{row.correct}</td>
                    <td className="p-2.5 text-center font-bold text-rose-700">{row.wrong}</td>
                    <td className="p-2.5 text-center text-slate-500">{row.unattempted}</td>
                    <td className="p-2.5 text-center pr-4 font-bold text-indigo-700">{row.accuracy.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              {s3?.total && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td className="p-2.5 pl-4">{s3.total.subject}</td>
                    <td className="p-2.5 text-center">{s3.total.max}</td>
                    <td className="p-2.5 text-center text-indigo-700">{s3.total.score}</td>
                    <td className="p-2.5 text-center">{s3.total.percentage.toFixed(1)}%</td>
                    <td className="p-2.5 text-center text-emerald-700">{s3.total.correct}</td>
                    <td className="p-2.5 text-center text-rose-700">{s3.total.wrong}</td>
                    <td className="p-2.5 text-center text-slate-600">{s3.total.unattempted}</td>
                    <td className="p-2.5 text-center pr-4 text-indigo-700">{s3.total.accuracy.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 4. SUBJECT PERFORMANCE */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            4. SUBJECT PERFORMANCE & DIAGNOSIS
          </div>
          <div className="p-4 space-y-3">
            {(s4 || []).map((sp, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200 font-bold text-slate-900 text-sm">
                  <span>{sp.subjectName.toUpperCase()} — {sp.score} / {sp.maxScore}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    Performance Level: {sp.performanceLevel}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="font-bold text-emerald-800">Strong Areas: </span>
                  <span className="text-slate-700">{sp.strongAreas.join('; ') || 'Standard chapter performance'}</span>
                </div>
                <div>
                  <span className="font-bold text-rose-800">Areas Requiring Improvement: </span>
                  <span className="text-slate-700">{sp.areasRequiringImprovement.join('; ') || 'Advanced numerical problem solving'}</span>
                </div>
                <div>
                  <span className="font-bold text-indigo-800">Recommendation: </span>
                  <span className="text-slate-800 italic">{sp.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. TOPIC-WISE PERFORMANCE */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />
            5. TOPIC-WISE PERFORMANCE
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-900 text-white text-[11px] font-bold sticky top-0">
                <tr>
                  <th className="p-2.5 pl-4">Topic / Chapter</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5 text-center">Accuracy</th>
                  <th className="p-2.5 text-center pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(s5 || []).map((row, idx) => {
                  const statusBadgeColor =
                    row.status === 'Excellent' || row.status === 'Strong'
                      ? 'bg-emerald-100 text-emerald-800'
                      : row.status === 'Needs Improvement'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800';

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="p-2.5 pl-4 font-semibold text-slate-900">{row.topic}</td>
                      <td className="p-2.5 text-slate-600">{row.subjectName}</td>
                      <td className="p-2.5 text-center font-bold text-indigo-700">{row.accuracy.toFixed(1)}%</td>
                      <td className="p-2.5 text-center pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadgeColor}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. STRENGTH & WEAKNESS ANALYSIS */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            6. STRENGTH & WEAKNESS ANALYSIS
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-2">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5 border-b border-emerald-200 pb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                TOP STRENGTHS
              </h3>
              <ol className="space-y-1.5 list-decimal list-inside text-emerald-950 font-medium">
                {(s6?.topStrengths || []).map((str, idx) => (
                  <li key={idx} className="leading-relaxed">{str}</li>
                ))}
              </ol>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3.5 space-y-2">
              <h3 className="font-bold text-rose-900 text-sm flex items-center gap-1.5 border-b border-rose-200 pb-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                PRIORITY WEAKNESSES
              </h3>
              <ol className="space-y-1.5 list-decimal list-inside text-rose-950 font-medium">
                {(s6?.priorityWeaknesses || []).map((wk, idx) => (
                  <li key={idx} className="leading-relaxed">{wk}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* 7. ERROR ANALYSIS */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            7. ERROR ANALYSIS
          </div>
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-900 text-white text-[11px] font-bold">
                  <tr>
                    <th className="p-2.5 pl-4">Error Type</th>
                    <th className="p-2.5 text-center">No. of Questions</th>
                    <th className="p-2.5 text-center pr-4">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(s7?.categories || []).map((cat, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="p-2.5 pl-4 font-semibold text-slate-900">{cat.errorType}</td>
                      <td className="p-2.5 text-center font-bold text-indigo-700">{cat.questionCount}</td>
                      <td className="p-2.5 text-center pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cat.impact === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : cat.impact === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {cat.impact}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 leading-relaxed font-medium">
              💡 {s7?.narrative || 'Maintain an Error Notebook after every BRAINROS test to convert mistakes into marks.'}
            </div>
          </div>
        </div>

        {/* 8. TIME MANAGEMENT */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4" />
            8. TIME MANAGEMENT & PACING
          </div>
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-900 text-white text-[11px] font-bold">
                  <tr>
                    <th className="p-2.5 pl-4">Section / Subject</th>
                    <th className="p-2.5 text-center">Recommended Time</th>
                    <th className="p-2.5 text-center">Student Time</th>
                    <th className="p-2.5 text-center pr-4">Pacing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(s8?.rows || []).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="p-2.5 pl-4 font-semibold text-slate-900">{row.section}</td>
                      <td className="p-2.5 text-center text-slate-600">{row.recommendedMinutes} min</td>
                      <td className="p-2.5 text-center font-bold text-indigo-700">{row.studentMinutes} min</td>
                      <td className="p-2.5 text-center pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'Optimal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.status === 'Slow'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
              <h4 className="font-bold text-slate-900">Recommended Exam Rounds Strategy:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                {(s8?.roundsStrategy || []).map((rd, i) => (
                  <div key={i} className="bg-white p-2 rounded border border-slate-200">
                    <span className="font-bold text-indigo-700 block">{rd.round}</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">{rd.title}</span>
                    <span className="text-slate-500 block text-[10px] mt-0.5">{rd.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 9. BRAINROS PERFORMANCE TREND */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            9. BRAINROS PERFORMANCE TREND
          </div>
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-900 text-white text-[11px] font-bold">
                  <tr>
                    <th className="p-2.5 pl-4">Test Number</th>
                    <th className="p-2.5">Test Title</th>
                    <th className="p-2.5 text-center">Score</th>
                    <th className="p-2.5 text-center pr-4">Percentile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(s9?.history || []).slice(-5).map((tp, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="p-2.5 pl-4 font-bold text-slate-900">{tp.testNumber}</td>
                      <td className="p-2.5 text-slate-600">{tp.testTitle}</td>
                      <td className="p-2.5 text-center font-bold text-indigo-700">{tp.score} / {tp.maxScore}</td>
                      <td className="p-2.5 text-center pr-4 font-semibold text-slate-800">
                        {tp.percentile ? `${tp.percentile.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-950 font-semibold">
              📈 {s9?.trendSummary || 'Steady baseline recorded.'}
            </div>
          </div>
        </div>

        {/* 10. EXPECTED PERFORMANCE */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />
            10. EXPECTED PERFORMANCE & TARGETS
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-medium block">Current Score</span>
                <span className="text-base md:text-lg font-black text-slate-900 block mt-1">
                  {s10?.currentScore ?? analysis.overall.obtainedMarks} / {s10?.maxScore ?? analysis.overall.totalMarks}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                <span className="text-indigo-700 font-semibold block">Short-Term Target</span>
                <span className="text-base md:text-lg font-black text-indigo-900 block mt-1">
                  {s10?.shortTermTarget ?? 550}+
                </span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-emerald-700 font-semibold block">Strong Target</span>
                <span className="text-base md:text-lg font-black text-emerald-900 block mt-1">
                  {s10?.strongTarget ?? 600}+
                </span>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-purple-700 font-semibold block">Excellent Target</span>
                <span className="text-base md:text-lg font-black text-purple-900 block mt-1">
                  {s10?.excellentTarget ?? 650}+
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
              🎯 {s10?.actionableMessage || 'Focus on accuracy and eliminating avoidable calculation mistakes to advance to the next rank tier.'}
            </div>
          </div>
        </div>

        {/* 11. 14-DAY IMPROVEMENT PLAN */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            11. 14-DAY IMPROVEMENT PLAN
          </div>
          <div className="p-4 space-y-2.5">
            {(s11?.blocks || []).map((blk, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="sm:w-28 shrink-0">
                  <span className="inline-block bg-indigo-600 text-white px-2.5 py-1 rounded text-[11px] font-bold text-center w-full">
                    {blk.period}
                  </span>
                </div>
                <div className="grow space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-xs">{blk.title}</h4>
                  <p className="text-slate-600 text-[11px]">
                    <span className="font-semibold text-slate-700">Focus Chapters:</span> {blk.focusChapters.join(', ')}
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    {blk.activities.join(' • ')} {blk.practiceVolume ? `| ${blk.practiceVolume}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 12. PERSONALIZED ACTION CHECKLIST */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            12. PERSONALIZED ACTION CHECKLIST
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {(s12?.items || []).map((item) => {
              const isChecked = !!completedChecklist[item.id];
              return (
                <label
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through opacity-80'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium leading-tight">{item.text}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 13. PARENT SUMMARY */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            13. PARENT SUMMARY
          </div>
          <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 text-slate-800 text-xs md:text-sm leading-relaxed space-y-3">
            <p className="font-normal">{s13?.summaryParagraph}</p>
            {s13?.keyHighlights && s13.keyHighlights.length > 0 && (
              <div className="bg-white/80 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-indigo-900 block">Key Summary Highlights:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {s13.keyHighlights.map((kh, i) => (
                    <li key={i}>{kh}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 14. BRAINROS PERFORMANCE INDEX */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-300">
          <div className="bg-indigo-700 text-white px-4 py-2.5 font-bold text-xs md:text-sm tracking-wide flex items-center gap-2">
            <Star className="w-4 h-4" />
            14. BRAINROS PERFORMANCE INDEX
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(s14?.metrics || []).map((m, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
                  <span className="text-slate-600 font-medium block">{m.dimension}</span>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-3.5 h-3.5 ${
                            starIdx < Math.round(m.ratingStars)
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">{m.ratingLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 text-sm">OVERALL BRAINROS RATING:</span>
              <span className="px-3 py-1 rounded-full bg-indigo-700 text-white font-black text-xs tracking-wide">
                {s14?.overallRating || 'VERY GOOD'}
              </span>
            </div>
          </div>
        </div>

        {/* Report Footer / Branding */}
        <div className="text-center py-6 text-xs text-slate-500 space-y-1 border-t border-slate-200">
          <div className="font-bold text-slate-700 tracking-wider">
            BRAINROS — TEST. ANALYSE. IMPROVE. ACHIEVE.
          </div>
          <div className="italic text-slate-500">
            &ldquo;Every test should tell the student what to study next.&rdquo;
          </div>
          <div className="text-[10px] text-slate-400">
            BRAINROS 2026 • NEET • JEE • CET Mock Test Series • Official Confidential Student Performance Report
          </div>
        </div>

      </div>
    </div>
  );
};
