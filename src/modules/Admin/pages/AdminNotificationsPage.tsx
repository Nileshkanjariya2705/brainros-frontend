import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  UploadCloud,
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Layers,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import { NotificationItem, NotificationTemplateItem } from '@/types/exam.types';

export interface AdminActionAlert {
  id: string;
  category: 'QUESTION_PAPER' | 'ANSWER_KEY' | 'APPROVAL' | 'SYSTEM';
  type: string;
  title: string;
  message: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  link: string;
  actionText: string;
  resourceId?: string;
  scheduleId?: string;
  examId?: string;
  startTime?: string;
  endTime?: string;
  hoursRemaining?: number;
  createdAt: string;
}

export interface ActionAlertsResponse {
  alerts: AdminActionAlert[];
  summary: {
    total: number;
    questionPapersPending: number;
    answerKeysPending: number;
    approvalsPending: number;
  };
}

export const AdminNotificationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeMainTab, setActiveMainTab] = useState<'ALERTS' | 'IN_APP' | 'GATEWAYS' | 'TEMPLATES'>('ALERTS');
  const [actionAlerts, setActionAlerts] = useState<AdminActionAlert[]>([]);
  const [alertsSummary, setAlertsSummary] = useState({
    total: 0,
    questionPapersPending: 0,
    answerKeysPending: 0,
    approvalsPending: 0,
  });
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);
  const [alertsFilter, setAlertsFilter] = useState<'ALL' | 'QUESTION_PAPER' | 'ANSWER_KEY' | 'APPROVAL'>('ALL');
  const [alertsSearch, setAlertsSearch] = useState<string>('');

  // Standard in-app notifications
  const [inAppNotifications, setInAppNotifications] = useState<any[]>([]);
  const [inAppLoading, setInAppLoading] = useState<boolean>(false);

  // Technical delivery logs & templates
  const [deliveryLogs, setDeliveryLogs] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(false);
  const [channelFilter, setChannelFilter] = useState<string>('');

  useEffect(() => {
    fetchActionAlerts();
    fetchInAppNotifications();
    fetchDeliveryLogs();
    fetchTemplates();
  }, []);

  const getArrayData = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
  };

  const fetchActionAlerts = async () => {
    try {
      setAlertsLoading(true);
      const res = await Axios.get<any>('/admin/notifications/action-alerts');
      const data: ActionAlertsResponse = res.data?.data || res.data;
      if (data && Array.isArray(data.alerts)) {
        setActionAlerts(data.alerts);
        setAlertsSummary(data.summary || {
          total: data.alerts.length,
          questionPapersPending: 0,
          answerKeysPending: 0,
          approvalsPending: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load action alerts:', err);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchInAppNotifications = async () => {
    try {
      setInAppLoading(true);
      const res = await Axios.get('/notifications');
      setInAppNotifications(getArrayData(res));
    } catch (err) {
      console.error('Failed to load in-app notifications:', err);
    } finally {
      setInAppLoading(false);
    }
  };

  const fetchDeliveryLogs = async () => {
    try {
      setLogsLoading(true);
      const params: any = {};
      if (channelFilter) params.channel = channelFilter;
      const res = await Axios.get('/admin/notifications', { params });
      setDeliveryLogs(getArrayData(res));
    } catch (err) {
      console.error('Failed to load delivery logs:', err);
      setDeliveryLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await Axios.get('/admin/notifications/templates');
      setTemplates(getArrayData(res));
    } catch (err) {
      console.error('Failed to load notification templates:', err);
      setTemplates([]);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Axios.patch('/notifications/read-all');
      fetchInAppNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Filtered action alerts
  const filteredAlerts = useMemo(() => {
    return actionAlerts.filter((item) => {
      if (alertsFilter !== 'ALL' && item.category !== alertsFilter) {
        return false;
      }
      if (alertsSearch) {
        const q = alertsSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          item.actionText.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [actionAlerts, alertsFilter, alertsSearch]);

  const resolveAlertRoute = (alert: AdminActionAlert): string => {
    if (alert.category === 'QUESTION_PAPER' || alert.type === 'QUESTION_PAPER_PENDING') {
      return `/super-admin/ai-question-paper-translation${alert.scheduleId ? `?scheduleId=${alert.scheduleId}` : alert.examId ? `?examId=${alert.examId}` : ''}`;
    }
    if (alert.category === 'ANSWER_KEY' || alert.type === 'ANSWER_KEY_PENDING') {
      return alert.scheduleId
        ? `/super-admin/exam-manager/answer-key/${alert.scheduleId}`
        : `/super-admin/exam-manager/answer-key`;
    }
    if (alert.category === 'APPROVAL' || alert.type === 'APPROVAL_REQUEST') {
      return '/super-admin/approval-queue';
    }
    if (alert.link) {
      return alert.link.replace('/super_admin/', '/super-admin/');
    }
    return '/super-admin/dashboard';
  };

  const handleNavigateAlert = (alert: AdminActionAlert) => {
    const target = resolveAlertRoute(alert);
    navigate(target);
  };

  const getPriorityBadge = (priority: AdminActionAlert['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            ACTION REQUIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            INFO
          </span>
        );
    }
  };

  const getCategoryIcon = (category: AdminActionAlert['category']) => {
    switch (category) {
      case 'QUESTION_PAPER':
        return <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'ANSWER_KEY':
        return <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'APPROVAL':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Super Admin Notification Center
            </h1>
            {alertsSummary.total > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm shadow-rose-600/20 animate-pulse">
                {alertsSummary.total} Pending
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Operational alerts, pending workflow deadlines, in-app notifications, and dispatch infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchActionAlerts();
              fetchInAppNotifications();
              fetchDeliveryLogs();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Alerts
          </button>
        </div>
      </div>

      {/* Top Action Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Action Items */}
        <div
          onClick={() => {
            setActiveMainTab('ALERTS');
            setAlertsFilter('ALL');
          }}
          className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Action Items
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {alertsSummary.total}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Requires administrative action</span>
          </div>
        </div>

        {/* 1. 24h Remaining / Question Papers Pending */}
        <div
          onClick={() => {
            setActiveMainTab('ALERTS');
            setAlertsFilter('QUESTION_PAPER');
          }}
          className={`p-5 rounded-2xl border shadow-sm transition-all cursor-pointer ${
            alertsSummary.questionPapersPending > 0
              ? 'border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/20'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Upload Question Paper
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 dark:text-indigo-300">
            {alertsSummary.questionPapersPending}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Upcoming exams missing papers</span>
          </div>
        </div>

        {/* 2. Completed Exams / Answer Key Needed */}
        <div
          onClick={() => {
            setActiveMainTab('ALERTS');
            setAlertsFilter('ANSWER_KEY');
          }}
          className={`p-5 rounded-2xl border shadow-sm transition-all cursor-pointer ${
            alertsSummary.answerKeysPending > 0
              ? 'border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 dark:from-amber-950/40 dark:via-slate-900 dark:to-orange-950/20'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Upload Answer Key
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-300">
            {alertsSummary.answerKeysPending}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Completed exams needing evaluation</span>
          </div>
        </div>

        {/* 3. Pending Approvals */}
        <div
          onClick={() => {
            setActiveMainTab('ALERTS');
            setAlertsFilter('APPROVAL');
          }}
          className={`p-5 rounded-2xl border shadow-sm transition-all cursor-pointer ${
            alertsSummary.approvalsPending > 0
              ? 'border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/20'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Approve Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-300">
            {alertsSummary.approvalsPending}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Waiting for Super Admin approval</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveMainTab('ALERTS')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeMainTab === 'ALERTS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Operational Action Alerts ({alertsSummary.total})
        </button>
        <button
          onClick={() => setActiveMainTab('IN_APP')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeMainTab === 'IN_APP'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          In-App Notifications ({inAppNotifications.length})
        </button>
        <button
          onClick={() => setActiveMainTab('GATEWAYS')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeMainTab === 'GATEWAYS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Delivery Ledger & Gateways ({deliveryLogs.length})
        </button>
        <button
          onClick={() => setActiveMainTab('TEMPLATES')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
            activeMainTab === 'TEMPLATES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Template Library ({templates.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: OPERATIONAL ACTION ALERTS (DEFAULT)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'ALERTS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { id: 'ALL', label: `All Alerts (${alertsSummary.total})` },
                  { id: 'QUESTION_PAPER', label: `Upload Question Papers (${alertsSummary.questionPapersPending})` },
                  { id: 'ANSWER_KEY', label: `Upload Answer Keys (${alertsSummary.answerKeysPending})` },
                  { id: 'APPROVAL', label: `Pending Approvals (${alertsSummary.approvalsPending})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAlertsFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    alertsFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={alertsSearch}
                onChange={(e) => setAlertsSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Alerts List */}
          {alertsLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-semibold">Checking upcoming deadlines, exams, and approval queues...</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                All Operational Workflows are Up to Date!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No pending question papers, missing answer keys, or unreviewed approval requests requiring attention.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => handleNavigateAlert(alert)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md ${
                    alert.priority === 'CRITICAL'
                      ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-400'
                      : alert.category === 'QUESTION_PAPER'
                      ? 'border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/20 hover:border-indigo-400'
                      : alert.category === 'ANSWER_KEY'
                      ? 'border-amber-200/80 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 hover:border-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                      {getCategoryIcon(alert.category)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {alert.title}
                        </h3>
                        {getPriorityBadge(alert.priority)}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-medium">
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.hoursRemaining !== undefined && (
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            • {alert.hoursRemaining}h remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateAlert(alert);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                        alert.priority === 'CRITICAL'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : alert.category === 'QUESTION_PAPER'
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : alert.category === 'ANSWER_KEY'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {alert.actionText}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: IN-APP NOTIFICATIONS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'IN_APP' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-bold text-slate-900 dark:text-white">Admin In-App Notifications</h2>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Mark All as Read
            </button>
          </div>

          {inAppLoading ? (
            <div className="p-12 text-center text-slate-400">Loading in-app notifications...</div>
          ) : inAppNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No in-app notifications found.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {inAppNotifications.map((n) => (
                <div key={n.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title || n.type}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                    <p className="text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: DELIVERY LEDGER & GATEWAYS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'GATEWAYS' && (
        <div className="space-y-6">
          {/* Channel Telemetry Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Email Gateway</span>
                <Mail className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">AWS SES</div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Status: <span className="font-bold text-emerald-600">HEALTHY</span>
                </span>
                <span>Zero-impact queue</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">SMS Gateway</span>
                <Smartphone className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">2Factor / SMS</div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Critical OTP Priority</span>
                <span className="font-bold text-emerald-600">ACTIVE</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">WhatsApp Gateway</span>
                <MessageSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Meta Cloud API</div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Transactional Alerts</span>
                <span className="font-bold text-emerald-600">ACTIVE</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Mobile Push</span>
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <div className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Firebase FCM</div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>Exam Reminders (24h/1h/15m)</span>
                <span className="font-bold text-emerald-600">ARMED</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Recent Dispatches (Delivery Ledger)</h2>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="">All Channels</option>
                <option value="EMAIL">EMAIL</option>
                <option value="SMS">SMS</option>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="PUSH">PUSH</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              {logsLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading delivery ledger...</div>
              ) : deliveryLogs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No notifications dispatched.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-400">
                      <th className="pb-3 font-semibold">Timestamp</th>
                      <th className="pb-3 font-semibold">Channel</th>
                      <th className="pb-3 font-semibold">Event Type</th>
                      <th className="pb-3 font-semibold">Recipient Address</th>
                      <th className="pb-3 font-semibold">Priority</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deliveryLogs.map((notif) => (
                      <tr key={notif.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 text-xs text-slate-500">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">
                          <span className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {notif.channel}
                          </span>
                        </td>
                        <td className="py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{notif.type}</td>
                        <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {notif.recipientAddress}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              notif.priority === 'CRITICAL'
                                ? 'bg-purple-100 text-purple-800'
                                : notif.priority === 'HIGH'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {notif.priority}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              notif.status === 'SENT' || notif.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : notif.status === 'FAILED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {notif.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: TEMPLATE LIBRARY
          ══════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">{tpl.notificationType}</span>
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  {tpl.channel} • v{tpl.version}
                </span>
              </div>
              {tpl.subject && (
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Subject: <span className="text-slate-900 dark:text-white">{tpl.subject}</span>
                </div>
              )}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {tpl.body}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Language: {tpl.languageCode.toUpperCase()}</span>
                <span className="font-bold text-emerald-600">ACTIVE VERSION</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
