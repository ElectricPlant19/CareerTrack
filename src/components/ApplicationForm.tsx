import React, { useState } from 'react';
import { Application, UserProfile, ApplicationStatus } from '../types';
import { createApplication, updateApplication } from '../services/applicationService';
import { useToast } from '../contexts/ToastContext';
import { getErrorMessage } from '../utils';
import { X, Save, Plus } from 'lucide-react';

export default function ApplicationForm({ user, onClose, editingApp }: { user: UserProfile, onClose: () => void, editingApp: Application | null }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    companyName: editingApp?.companyName || '',
    position: editingApp?.position || '',
    source: editingApp?.source || '',
    status: editingApp?.status || 'Bookmarked' as ApplicationStatus,
    applicationDate: editingApp?.applicationDate ? new Date(editingApp.applicationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    salary: editingApp?.salary || '',
    benefits: editingApp?.benefits || '',
    notes: editingApp?.notes || '',
    tags: editingApp?.tags || [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const data = {
        ...formData,
        applicationDate: new Date(formData.applicationDate).toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingApp) {
        await updateApplication(user.uid, editingApp.id, data);
        toast.success('Application updated.');
      } else {
        await createApplication(user.uid, data);
        toast.success('Application added.');
      }
      onClose();
    } catch (error) {
      const message = getErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {editingApp ? 'Edit Application' : 'Add New Application'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Company Name *</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Google, Stripe, Startup X"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Position *</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Software Engineer Intern"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Status</label>
              <select 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
              >
                <option value="Bookmarked">Bookmarked</option>
                <option value="Applied">Applied</option>
                <option value="Phone Screen">Phone Screen</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Application Date</label>
              <input 
                type="date" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.applicationDate}
                onChange={e => setFormData({ ...formData, applicationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Source</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g. LinkedIn, Referral, Company Website"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Salary / Compensation</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. $120k, $50/hr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Tags</label>
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add a tag (e.g. #Remote, #HighPriority)"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button 
                type="button"
                onClick={addTag}
                className="p-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Notes</label>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[120px]"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any details, interview notes, or preparation materials..."
            />
          </div>

          <div className="pt-4 sticky bottom-0 bg-white pb-2">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {isSubmitting ? 'Saving...' : (editingApp ? 'Update Application' : 'Save Application')}
            </button>
            {submitError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
                {submitError}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
