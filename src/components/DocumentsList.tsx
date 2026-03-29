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
  RefreshCw,
  ArrowUpDown,
  Link2,
  ExternalLink,
  FileImage,
  File
} from 'lucide-react';
import DocumentUploadModal from './DocumentUploadModal';
import { Application } from '../types';

type SortBy = 'recent' | 'size' | 'type' | 'name';

function getFileCategory(mimeType: string): 'pdf' | 'image' | 'office' | 'other' {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('word') || mimeType.includes('officedocument') || mimeType.includes('ms-doc')) return 'office';
  return 'other';
}

const PreviewModal = ({ doc, onClose, onDownload }: { doc: Document; onClose: () => void; onDownload: (doc: Document) => void }) => {
  const fileCategory = getFileCategory(doc.mimeType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">{doc.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{doc.type} · {formatFileSize(doc.fileSize)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(doc)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium transition-all"
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {fileCategory === 'image' ? (
            <img
              src={doc.fileUrl}
              alt={doc.name}
              className="max-w-full max-h-[60vh] mx-auto rounded-lg object-contain"
            />
          ) : fileCategory === 'pdf' ? (
            <iframe
              src={`${doc.fileUrl}#toolbar=1`}
              className="w-full h-[60vh] rounded-xl border border-gray-100"
              title={doc.name}
            />
          ) : fileCategory === 'office' ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                <File size={32} className="text-blue-500" />
              </div>
              <div>
                <p className="font-bold text-gray-700 mb-1">{doc.name}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Office documents can't be previewed inline. Open in Office Online or download to view.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <a
                  href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc.fileUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  <ExternalLink size={14} />
                  Open in Office Online
                </a>
                <button
                  onClick={() => onDownload(doc)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                <FileText size={32} className="text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-gray-700 mb-1">{doc.name}</p>
                <p className="text-sm text-gray-500 mb-6">Preview is not available for this file type ({doc.mimeType || 'unknown'}).</p>
              </div>
              <button
                onClick={() => onDownload(doc)}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all mx-auto"
              >
                <Download size={16} />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DocumentsList({ user }: { user: UserProfile }) {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'All'>('All');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsSnap, appsSnap] = await Promise.all([
        getDocs(query(collection(db, `users/${user.uid}/documents`), limit(100))),
        getDocs(query(collection(db, `users/${user.uid}/applications`), limit(100))),
      ]);
      setDocuments(docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document)));
      setApplications(appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/documents`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.uid]);

  const filteredDocs = documents
    .filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.notes && doc.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'All' || doc.type === typeFilter;
      const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'size') return b.fileSize - a.fileSize;
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // recent (default)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const FileTypeIcon = ({ mimeType }: { mimeType: string }) => {
    const cat = getFileCategory(mimeType);
    if (cat === 'image') return <FileImage size={24} className="text-purple-400" />;
    if (cat === 'pdf') return <FileText size={24} className="text-red-400" />;
    if (cat === 'office') return <File size={24} className="text-blue-400" />;
    return <FileText size={24} className="text-gray-500" />;
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

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, tag, or notes..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
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
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
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
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl">
          <ArrowUpDown size={18} className="text-gray-400" />
          <select
            className="bg-transparent border-none focus:ring-0 text-sm font-medium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name (A–Z)</option>
            <option value="size">Largest First</option>
            <option value="type">By Type</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => {
          const linkedApp = applications.find(a => a.id === doc.applicationId);
          return (
            <div key={doc.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileTypeIcon mimeType={doc.mimeType} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelectedDoc(doc)}
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

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_COLORS[doc.type]}`}>
                  {doc.type}
                </span>
                <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${CATEGORY_COLORS[doc.category]}`}>
                  {doc.category}
                </span>
              </div>

              {linkedApp && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <Link2 size={11} className="text-gray-400" />
                  <span className="font-medium truncate">{linkedApp.companyName} – {linkedApp.position}</span>
                </div>
              )}

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
          );
        })}
      </div>

      {filteredDocs.length === 0 && !loading && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm font-medium text-gray-400">No documents found.</p>
          {(searchTerm || typeFilter !== 'All' || categoryFilter !== 'All') ? (
            <button
              onClick={() => { setSearchTerm(''); setTypeFilter('All'); setCategoryFilter('All'); }}
              className="mt-2 text-xs text-black underline underline-offset-2"
            >
              Clear filters
            </button>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Upload your first document to get started.</p>
          )}
        </div>
      )}

      {filteredDocs.length > 0 && (
        <p className="text-xs text-gray-400 px-2">
          Showing {filteredDocs.length} of {documents.length} documents
        </p>
      )}

      {isUploadModalOpen && (
        <DocumentUploadModal
          user={user}
          onClose={() => { setIsUploadModalOpen(false); setEditingDoc(null); fetchData(); }}
          editingDoc={editingDoc}
        />
      )}

      {selectedDoc && (
        <PreviewModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
