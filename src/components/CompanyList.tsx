import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Company, UserProfile } from '../types';
import { Building2, Plus, Search, MapPin, Globe, MoreVertical, Trash2, Edit2, X, Save } from 'lucide-react';

export default function CompanyList({ user }: { user: UserProfile }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, `users/${user.uid}/companies`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/companies`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-gray-500 mt-1">Keep track of company details and research.</p>
        </div>
        <button 
          onClick={() => { setEditingCompany(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 self-start"
        >
          <Plus size={20} />
          Add Company
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search companies by name or industry..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map(company => (
          <div key={company.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                <Building2 size={24} />
              </div>
              <button 
                onClick={() => { setEditingCompany(company); setIsModalOpen(true); }}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={20} />
              </button>
            </div>
            <h3 className="text-lg font-bold mb-1">{company.name}</h3>
            <p className="text-sm text-gray-500 font-medium mb-4">{company.industry || 'No industry specified'}</p>
            
            <div className="space-y-2 mb-6">
              {company.location && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  {company.location}
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Globe size={14} className="text-gray-400" />
                  <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-black underline underline-offset-2">
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {company.notes && (
              <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-500 italic leading-relaxed">
                "{company.notes.length > 100 ? company.notes.substring(0, 100) + '...' : company.notes}"
              </div>
            )}
          </div>
        ))}
        {filteredCompanies.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-gray-400">
            <Building2 size={64} className="mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">No companies found.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-black font-bold underline underline-offset-4"
            >
              Add your first company
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <CompanyModal 
          user={user} 
          onClose={() => { setIsModalOpen(false); setEditingCompany(null); }} 
          editingCompany={editingCompany}
        />
      )}
    </div>
  );
}

const CompanyModal = ({ user, onClose, editingCompany }: { user: UserProfile, onClose: () => void, editingCompany: Company | null }) => {
  const [formData, setFormData] = useState({
    name: editingCompany?.name || '',
    size: editingCompany?.size || '',
    industry: editingCompany?.industry || '',
    location: editingCompany?.location || '',
    website: editingCompany?.website || '',
    notes: editingCompany?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const writePromise = editingCompany
        ? updateDoc(doc(db, `users/${user.uid}/companies`, editingCompany.id), formData)
        : addDoc(collection(db, `users/${user.uid}/companies`), formData);

      onClose();
      await writePromise;
    } catch (error) {
      handleFirestoreError(error, editingCompany ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/companies`);
    }
  };

  const handleDelete = async () => {
    if (editingCompany && window.confirm('Delete this company?')) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/companies`, editingCompany.id));
        onClose();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/companies/${editingCompany.id}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {editingCompany ? 'Edit Company' : 'Add Company'}
          </h2>
          <div className="flex items-center gap-2">
            {editingCompany && (
              <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Company Name *</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Industry</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.industry}
                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                placeholder="e.g. Technology"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Size</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.size}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 500-1000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Location</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. San Francisco, CA"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Website</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
              value={formData.website}
              onChange={e => setFormData({ ...formData, website: e.target.value })}
              placeholder="e.g. acme.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Notes</label>
            <textarea 
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Company culture, mission, research notes..."
            />
          </div>

          <div className="pt-4 sticky bottom-0 bg-white pb-2">
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
            >
              <Save size={20} />
              {editingCompany ? 'Update Company' : 'Save Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
