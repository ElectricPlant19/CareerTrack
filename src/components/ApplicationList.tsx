import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Application, UserProfile, ApplicationStatus } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Edit2, 
  ChevronDown,
  Briefcase,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import ApplicationForm from './ApplicationForm';

const STAGE_COLORS: Record<ApplicationStatus, string> = {
  'Bookmarked': 'bg-gray-100 text-gray-600',
  'Applied': 'bg-blue-100 text-blue-600',
  'Phone Screen': 'bg-indigo-100 text-indigo-600',
  'Interview': 'bg-purple-100 text-purple-600',
  'Offer': 'bg-green-100 text-green-600',
  'Rejected': 'bg-red-100 text-red-600',
  'Archived': 'bg-gray-200 text-gray-500'
};

export default function ApplicationList({ user }: { user: UserProfile }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  useEffect(() => {
    const q = query(collection(db, `users/${user.uid}/applications`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/applications`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/applications`, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/applications/${id}`);
      }
    }
  };

  const handleEdit = (app: Application) => {
    setEditingApp(app);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
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

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
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
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border-none">
          <Filter size={18} className="text-gray-400" />
          <select 
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="Bookmarked">Bookmarked</option>
            <option value="Applied">Applied</option>
            <option value="Phone Screen">Phone Screen</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Company & Position</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{app.position}</p>
                        <p className="text-xs text-gray-500">{app.companyName}</p>
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
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Briefcase size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">No applications found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <ApplicationForm 
          user={user} 
          onClose={() => { setIsFormOpen(false); setEditingApp(null); }} 
          editingApp={editingApp} 
        />
      )}
    </div>
  );
}
