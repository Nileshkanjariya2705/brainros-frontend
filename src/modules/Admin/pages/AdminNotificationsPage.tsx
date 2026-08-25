import React, { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, RefreshCw } from 'lucide-react';
import { Axios } from '@/base-axios';
import { NotificationItem, NotificationTemplateItem } from '@/types/exam.types';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'LOGS' | 'TEMPLATES'>('LOGS');
  const [channelFilter, setChannelFilter] = useState<string>('');

  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
  }, [channelFilter]);

  const getArrayData = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (channelFilter) params.channel = channelFilter;
      const res = await Axios.get('/admin/notifications', { params });
      setNotifications(getArrayData(res));
    } catch (err) {
      console.error('Failed to load notifications', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await Axios.get('/admin/notifications/templates');
      setTemplates(getArrayData(res));
    } catch (err) {
      console.error('Failed to load notification templates', err);
      setTemplates([]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Communication & Notification Operations
          </h1>
          <p className="text-sm text-slate-500">
            Multi-channel asynchronous delivery pipeline, provider logs, failure isolation
            telemetry, and template library.
          </p>
        </div>
        <button
          onClick={() => {
            fetchNotifications();
            fetchTemplates();
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Channel Telemetry Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Email Gateway</span>
            <Mail className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">AWS SES</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>
              Status: <span className="font-bold text-emerald-600">HEALTHY</span>
            </span>
            <span>Zero-impact queue</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">SMS Gateway</span>
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">2Factor / SMS</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Critical OTP Priority</span>
            <span className="font-bold text-emerald-600">ACTIVE</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">WhatsApp Gateway</span>
            <MessageSquare className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">Meta Cloud API</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Transactional Alerts</span>
            <span className="font-bold text-emerald-600">ACTIVE</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Mobile Push</span>
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-slate-900">Firebase FCM</div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Exam Reminders (24h/1h/15m)</span>
            <span className="font-bold text-emerald-600">ARMED</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSelectedTab('LOGS')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedTab === 'LOGS'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Delivery Ledger ({notifications.length})
        </button>
        <button
          onClick={() => setSelectedTab('TEMPLATES')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedTab === 'TEMPLATES'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Template Library ({templates.length})
        </button>
      </div>

      {/* Tab 1: Delivery Logs */}
      {selectedTab === 'LOGS' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Recent Dispatches</h2>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <option value="">All Channels</option>
              <option value="EMAIL">EMAIL</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WHATSAPP</option>
              <option value="PUSH">PUSH</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Loading delivery ledger...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No notifications dispatched.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">Channel</th>
                    <th className="pb-3 font-semibold">Event Type</th>
                    <th className="pb-3 font-semibold">Recipient Address</th>
                    <th className="pb-3 font-semibold">Priority</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notifications.map((notif) => (
                    <tr key={notif.id} className="hover:bg-slate-50">
                      <td className="py-3 text-xs text-slate-500">
                        {new Date(notif.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                          {notif.channel}
                        </span>
                      </td>
                      <td className="py-3 text-xs font-semibold text-slate-800">{notif.type}</td>
                      <td className="py-3 font-mono text-xs text-slate-600 truncate max-w-xs">
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
      )}

      {/* Tab 2: Template Library */}
      {selectedTab === 'TEMPLATES' && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{tpl.notificationType}</span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  {tpl.channel} • v{tpl.version}
                </span>
              </div>
              {tpl.subject && (
                <div className="text-xs font-semibold text-slate-600">
                  Subject: <span className="text-slate-900">{tpl.subject}</span>
                </div>
              )}
              <div className="rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-700 whitespace-pre-wrap">
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
