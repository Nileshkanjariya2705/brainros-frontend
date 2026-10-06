import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  MapPin,
  Clock,
  Search,
  Navigation,
  Plus,
  History,
  X,
} from 'lucide-react';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { salesAgentKeys } from '@/services/queryKeys';

export const SalesVisitsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  const { data: visitsData, isLoading } = useQuery({
    queryKey: salesAgentKeys.visits({ search }),
    queryFn: () =>
      SalesVisitService.listVisits({
        search: search.trim() || undefined,
      }),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const rawVisitsData = visitsData as any;
  const visits: SalesVisit[] = Array.isArray(rawVisitsData?.items)
    ? rawVisitsData.items
    : Array.isArray(rawVisitsData?.data?.items)
    ? rawVisitsData.data.items
    : Array.isArray(rawVisitsData?.data)
    ? rawVisitsData.data
    : Array.isArray(rawVisitsData)
    ? rawVisitsData
    : [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-indigo-600" />
            <span>Activity History & Field Visits</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse all past field activities, client discussions, verified GPS photos, and visit logs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/sales-agent/add-activity')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search school name, city, contact person, notes..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
          />
        </div>
      </div>

      {/* Visits List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading activity history...</div>
      ) : visits.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No Activities Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No activities matched your search. Click "Add Activity" to log an activity.
          </p>
          <button
            onClick={() => navigate('/sales-agent/add-activity')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow hover:bg-indigo-700"
          >
            + Add Today's Activity
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                      {visit.institutionName}
                    </h3>
                    {visit.locationAddress && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {visit.locationAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Contact Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {new Date(visit.scheduledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {visit.contactPerson && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>{visit.contactPerson}</span>
                      {visit.contactPhone && (
                        <a href={`tel:${visit.contactPhone}`} className="text-blue-600 font-semibold hover:underline">
                          {visit.contactPhone}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Check-in GPS proof info if available */}
                {visit.checkInLat && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Navigation className="w-3 h-3 text-emerald-500" />
                    <span>
                      GPS Coordinates Verified ({visit.checkInLat.toFixed(4)}, {visit.checkInLng?.toFixed(4)})
                    </span>
                  </div>
                )}

                {/* GPS Map Camera Photo Proof Thumbnail */}
                {(visit.photos && visit.photos.length > 0) || (visit.checkInPhotos && visit.checkInPhotos.length > 0) ? (
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      {((visit.photos || visit.checkInPhotos) as string[]).map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setSelectedPhotoUrl(photoUrl)}
                          className="relative group w-20 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow transition-all"
                        >
                          <img
                            src={photoUrl}
                            alt="GPS Map Camera Proof"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            View
                          </div>
                          <span className="absolute bottom-1 right-1 p-0.5 rounded bg-black/60 text-white text-[8px] font-bold flex items-center">
                            📷 GPS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {visit.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50/70 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    "{visit.summary}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Photo Proof */}
      {selectedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <button
            onClick={() => setSelectedPhotoUrl(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhotoUrl}
            alt="GPS Map Camera Field Proof"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
export default SalesVisitsPage;
