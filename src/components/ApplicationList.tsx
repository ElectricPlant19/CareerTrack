import React, { useState, useEffect } from 'react';
import { Application, UserProfile, ApplicationStatus } from '../types';
import { db, getDocs, query, collection, limit, handleFirestoreError, OperationType } from '../firebase';
import { deleteApplication, updateApplicationStatus } from '../services/applicationService';
import { useToast } from '../contexts/ToastContext';
import { STAGE_COLORS, APPLICATION_STATUSES } from '../constants';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  Building2,
  Calendar,
  X,
  RefreshCw,
  CheckSquare,
  Square,
  ArrowUpDown
} from 'lucide-react';
import ApplicationForm from './ApplicationForm';

type SortBy = 'updatedAt' | 'applicationDate' | 'company';

const SESSION_KEY = 'app_list_filters';

function loadFilters() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveFilters(filters: object) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(filters));
  } catch { /* ignore */ }
}

export default function ApplicationList({ user }: { user: UserProfile }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const saved = loadFilters();
  const [searchTerm, setSearchTerm] = useState<string>(saved?.searchTerm ?? '');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>(saved?.statusFilter ?? 'All');
  const [sourceFilter, setSourceFilter] = useState<string>(saved?.sourceFilter ?? 'All');
  const [tagFilter, setTagFilter] = useState<string>(saved?.tagFilter ?? 'All');
  const [sortBy, setSortBy] = useState<SortBy>(saved?.sortBy ?? 'updatedAt');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus | ''>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, `users/${user.uid}/applications`), limit(100)));
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  useEffect(() => {
    saveFilters({ searchTerm, statusFilter, sourceFilter, tagFilter, sortBy });
  }, [searchTerm, statusFilter, sourceFilter, tagFilter, sortBy]);

  const uniqueSources = Array.from(new Set(applications.map(a => a.source).filter(Boolean))).sort() as string[];
  const uniqueTags = Array.from(new Set(applications.flatMap(a => a.tags))).sort();

  const filteredApps = applications
    .filter(app => {
      const matchesSearch =
        app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || app.source === sourceFilter;
      const matchesTag = tagFilter === 'All' || app.tags.includes(tagFilter);
      return matchesSearch && matchesStatus && matchesSource && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === 'company') return a.companyName.localeCompare(b.companyName);
      if (sortBy === 'applicationDate') {
        return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
      }
      // updatedAt (default)
      const aTime = new Date(a.updatedAt || a.applicationDate).getTime();
      const bTime = new Date(b.updatedAt || b.applicationDate).getTime();
      return bTime - aTime;
    });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteApplication(user.uid, id);
        toast.success('Application deleted.');
        fetchData();
      } catch {
        toast.error('Failed to delete application. Please try again.');
      }
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setIsFormOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApps.length && filteredApps.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApps.map(a => a.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      await Promise.all(
        Array.from(selectedIds).map(async id => {
          const app = applications.find(a => a.id === id);
          if (!app) return;
          try {
            await updateApplicationStatus(user.uid, id, bulkStatus as ApplicationStatus, app);
            successCount++;
          } catch {
            errorCount++;
          }
        })
      );
      if (successCount > 0) toast.success(`Updated ${successCount} application${successCount > 1 ? 's' : ''}.`);
      if (errorCount > 0) toast.error(`${errorCount} update${errorCount > 1 ? 's' : ''} failed.`);
      setSelectedIds(new Set());
      setBulkStatus('');
      fetchData();
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Archive ${selectedIds.size} application(s)?`)) return;
    setIsBulkUpdating(true);
    let successCount = 0;
    let errorCount = 0;
    try {
      await Promise.all(
        Array.from(selectedIds).map(async id => {
          const app = applications.find(a => a.id === id);
          if (!app) return;
          try {
            await updateApplicationStatus(user.uid, id, 'Archived', app);
            successCount++;
          } catch {
            errorCount++;
          }
        })
      );
      if (successCount > 0) toast.success(`Archived ${successCount} application${successCount > 1 ? 's' : ''}.`);
      if (errorCount > 0) toast.error(`${errorCount} archival${errorCount > 1 ? 's' : ''} failed.`);
      setSelectedIds(new Set());
      fetchData();
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter('All');
    setSourceFilter('All');
    setTagFilter('All');
    setSearchTerm('');
  };

  const activeFilterChips = [
    statusFilter !== 'All' && { label: statusFilter, clear: () => setStatusFilter('All') },
    sourceFilter !== 'All' && { label: `Source: ${sourceFilter}`, clear: () => setSourceFilter('All') },
    tagFilter !== 'All' && { label: `Tag: ${tagFilter}`, clear: () => setTagFilter('All') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
            <button
              onClick={fetchData}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-gray-500 mt-1">Manage and track all your job opportunities.</p>
        </div>
        <button
          onClick={() => { setEditingApp(null); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 self-start"
        >
          <Plus size={20} />
          Add Application
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by company or position..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
              <Filter size={16} className="text-gray-400" />
              <select
                className="bg-transparent border-none focus:ring-0 text-sm font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'All')}
              >
                <option value="All">All Statuses</option>
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {uniqueSources.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
                <select
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="All">All Sources</option>
                  {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
            {uniqueTags.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
                <select
                  className="bg-transparent border-none focus:ring-0 text-sm font-medium"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                >
                  <option value="All">All Tags</option>
                  {uniqueTags.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
              <ArrowUpDown size={16} className="text-gray-400" />
              <select
                className="bg-transparent border-none focus:ring-0 text-sm font-medium"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
              >
                <option value="updatedAt">Recently Updated</option>
                <option value="applicationDate">Application Date</option>
                <option value="company">Company (A–Z)</option>
              </select>
            </div>
          </div>
        </div>
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilterChips.map(f => (
              <button
                key={f.label}
                onClick={f.clear}
                className="flex items-center gap-1 px-3 py-1 bg-black text-white rounded-full text-xs font-bold hover:bg-gray-800 transition-colors"
              >
                {f.label}
                <X size={12} />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-400 hover:text-black font-medium underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-black text-white p-4 rounded-2xl flex flex-wrap items-center gap-4">
          <span className="text-sm font-bold">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <select
              className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-sm font-medium focus:ring-0 focus:outline-none"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as ApplicationStatus)}
            >
              <option value="">Change status to...</option>
              {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus || isBulkUpdating}
              className="px-4 py-2 bg-white text-black rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-gray-100 transition-all"
            >
              Apply
            </button>
          </div>
          <button
            onClick={handleBulkArchive}
            disabled={isBulkUpdating}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
          >
            Archive All
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-400 hover:text-black transition-colors"
                    title="Select all"
                  >
                    {selectedIds.size === filteredApps.length && filteredApps.length > 0
                      ? <CheckSquare size={18} className="text-black" />
                      : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Company & Position</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredApps.map((app) => (
                <tr
                  key={app.id}
                  className={`hover:bg-gray-50/50 transition-colors group ${selectedIds.has(app.id) ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleSelect(app.id)}
                      className="text-gray-400 hover:text-black transition-colors"
                    >
                      {selectedIds.has(app.id)
                        ? <CheckSquare size={18} className="text-black" />
                        : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{app.position}</p>
                        <p className="text-xs text-gray-500">{app.companyName}</p>
                        {app.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {app.tags.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{app.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STAGE_COLORS[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar size={14} />
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 font-medium">{app.source || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(app)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg shadow-sm transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredApps.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Briefcase size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">No applications found.</p>
                      {activeFilterChips.length > 0 && (
                        <button
                          onClick={clearAllFilters}
                          className="mt-2 text-xs text-black underline underline-offset-2"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredApps.length > 0 && (
        <p className="text-xs text-gray-400 px-2">
          Showing {filteredApps.length} of {applications.length} applications
        </p>
      )}

      {isFormOpen && (
        <ApplicationForm
          user={user}
          onClose={() => { setIsFormOpen(false); setEditingApp(null); fetchData(); }}
          editingApp={editingApp}
        />
      )}
    </div>
  );
}
