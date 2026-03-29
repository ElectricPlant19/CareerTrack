import React, { useState, useEffect } from 'react';
import { db, getDocs, query, collection, limit, deleteDocument, handleFirestoreError, OperationType } from '../firebase';
import { Document, UserProfile, DocumentType, DocumentCategory } from '../types';
import { useToast } from '../contexts/ToastContext';
import { formatFileSize } from '../utils';
import { TYPE_COLORS, CATEGORY_COLORS } from '../constants';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Calendar,
  Tag,
  Folder,
  X,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';

export default function DocumentsList({ user }: { user: UserProfile }) {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'All'>('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, `users/${user.uid}/documents`), limit(100)));
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/documents`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDelete = async (doc: Document) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument(doc.id, user.uid, doc.storagePath);
        toast.success('Document deleted.');
        fetchData();
      } catch {
        toast.error('Failed to delete document.');
      }
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc);
    setIsUploadModalOpen(true);
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (doc: Document) => {
    setSelectedDoc(doc);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <button
              onClick={fetchData}
              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <p className="text-gray-500 mt-1">Manage your career documents and files.</p>
        </div>
        <button
          onClick={() => { setEditingDoc(null); setIsUploadModalOpen(true); }}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-semibold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 self-start"
        >
          <Plus size={20} />
          Upload Document
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search documents..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border-none">
          <Filter size={18} className="text-gray-400" />
          <select
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DocumentType | 'All')}
          >
            <option value="All">All Types</option>
            <option value="Resume">Resume</option>
            <option value="Cover Letter">Cover Letter</option>
            <option value="Offer Letter">Offer Letter</option>
            <option value="Certification">Certification</option>
            <option value="Portfolio">Portfolio</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border-none">
          <Folder size={18} className="text-gray-400" />
          <select
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | 'All')}
          >
            <option value="All">All Categories</option>
            <option value="General">General</option>
            <option value="Application">Application</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-gray-500" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreview(doc)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleEdit(doc)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-sm mb-2 line-clamp-1">{doc.name}</h3>

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[doc.type]}`}>
                {doc.type}
              </span>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[doc.category]}`}>
                {doc.category}
              </span>
            </div>

            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {doc.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="flex items-center gap-1 text-xs text-gray-500">
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
                {doc.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{doc.tags.length - 3} more</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(doc.createdAt).toLocaleDateString()}
              </div>
              <span>{formatFileSize(doc.fileSize)}</span>
            </div>

            {doc.notes && (
              <p className="mt-3 text-xs text-gray-500 line-clamp-2">{doc.notes}</p>
            )}
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && !loading && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium text-gray-400">No documents found.</p>
          <p className="text-xs text-gray-400 mt-1">Upload your first document to get started.</p>
        </div>
      )}

      {isUploadModalOpen && (
        <DocumentUploadModal
          user={user}
          onClose={() => { setIsUploadModalOpen(false); setEditingDoc(null); fetchData(); }}
          editingDoc={editingDoc}
        />
      )}

      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{selectedDoc.name}</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {selectedDoc.mimeType.startsWith('image/') ? (
                <img
                  src={selectedDoc.fileUrl}
                  alt={selectedDoc.name}
                  className="max-w-full max-h-[60vh] mx-auto rounded-lg"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800 transition-all mx-auto"
                  >
                    <Download size={16} />
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
