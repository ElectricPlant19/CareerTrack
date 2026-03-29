import React, { useState, useEffect } from 'react';
import { Contact, Company, UserProfile } from '../types';
import { db, getDocs, query, collection, limit, handleFirestoreError, OperationType } from '../firebase';
import { useCompanies } from '../hooks/useCompanies';
import { createContact, updateContact, deleteContact } from '../services/contactService';
import { useToast } from '../contexts/ToastContext';
import { Users, Plus, Search, Mail, Phone, Linkedin, MoreVertical, Trash2, X, Save, Building2, RefreshCw } from 'lucide-react';

export default function ContactList({ user }: { user: UserProfile }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { companies } = useCompanies(user.uid);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, `users/${user.uid}/contacts`), limit(100)));
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/contacts`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <button
              onClick={fetchData}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-gray-500 mt-1">Manage recruiters, hiring managers, and networking contacts.</p>
        </div>
        <button
          onClick={() => { setEditingContact(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 self-start"
        >
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contacts by name or email..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map(contact => {
          const company = companies.find(c => c.id === contact.companyId);
          return (
            <div key={contact.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                  <Users size={24} />
                </div>
                <button
                  onClick={() => { setEditingContact(contact); setIsModalOpen(true); }}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
              <h3 className="text-lg font-bold mb-1">{contact.name}</h3>
              {company && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-4">
                  <Building2 size={12} className="text-gray-400" />
                  {company.name}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {contact.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail size={14} className="text-gray-400" />
                    <a href={`mailto:${contact.email}`} className="hover:text-black truncate">{contact.email}</a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={14} className="text-gray-400" />
                    <a href={`tel:${contact.phone}`} className="hover:text-black">{contact.phone}</a>
                  </div>
                )}
                {contact.linkedInUrl && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Linkedin size={14} className="text-gray-400" />
                    <a href={contact.linkedInUrl} target="_blank" rel="noopener noreferrer" className="hover:text-black underline underline-offset-2 truncate">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>

              {contact.notes && (
                <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-500 italic leading-relaxed">
                  "{contact.notes.length > 80 ? contact.notes.substring(0, 80) + '...' : contact.notes}"
                </div>
              )}
            </div>
          );
        })}
        {filteredContacts.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-gray-400">
            <Users size={64} className="mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">No contacts found.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-black font-bold underline underline-offset-4"
            >
              Add your first contact
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ContactModal
          user={user}
          companies={companies}
          onClose={() => { setIsModalOpen(false); setEditingContact(null); fetchData(); }}
          editingContact={editingContact}
        />
      )}
    </div>
  );
}

const ContactModal = ({ user, companies, onClose, editingContact }: { user: UserProfile, companies: Company[], onClose: () => void, editingContact: Contact | null }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: editingContact?.name || '',
    email: editingContact?.email || '',
    phone: editingContact?.phone || '',
    linkedInUrl: editingContact?.linkedInUrl || '',
    companyId: editingContact?.companyId || '',
    notes: editingContact?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await updateContact(user.uid, editingContact.id, formData);
        toast.success('Contact updated.');
      } else {
        await createContact(user.uid, formData);
        toast.success('Contact added.');
      }
      onClose();
    } catch {
      toast.error('Failed to save contact. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (editingContact && window.confirm('Delete this contact?')) {
      try {
        await deleteContact(user.uid, editingContact.id);
        toast.success('Contact deleted.');
        onClose();
      } catch {
        toast.error('Failed to delete contact.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold tracking-tight">
            {editingContact ? 'Edit Contact' : 'Add Contact'}
          </h2>
          <div className="flex items-center gap-2">
            {editingContact && (
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
            <label className="text-sm font-bold text-gray-700">Full Name *</label>
            <input
              required
              type="text"
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Company</label>
            <select
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
              value={formData.companyId}
              onChange={e => setFormData({ ...formData, companyId: e.target.value })}
            >
              <option value="">Select a company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@company.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Phone</label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">LinkedIn URL</label>
            <input
              type="url"
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all"
              value={formData.linkedInUrl}
              onChange={e => setFormData({ ...formData, linkedInUrl: e.target.value })}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Notes</label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all min-h-[100px]"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Interaction history, follow-up reminders..."
            />
          </div>

          <div className="pt-4 sticky bottom-0 bg-white pb-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
            >
              <Save size={20} />
              {editingContact ? 'Update Contact' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
