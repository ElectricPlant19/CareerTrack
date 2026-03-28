import React, { useState, useRef } from 'react';
import { uploadDocument, updateDocument, handleFirestoreError, OperationType } from '../firebase';
import { Document, UserProfile, DocumentType, DocumentCategory } from '../types';
import { 
  X, 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Plus,
  X as XIcon
} from 'lucide-react';

interface DocumentUploadModalProps {
  user: UserProfile;
  onClose: () => void;
  editingDoc?: Document | null;
}

export default function DocumentUploadModal({ user, onClose, editingDoc }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState(editingDoc?.name || '');
  const [type, setType] = useState<DocumentType>(editingDoc?.type || 'Other');
  const [category, setCategory] = useState<DocumentCategory>(editingDoc?.category || 'General');
  const [tags, setTags] = useState<string[]>(editingDoc?.tags || []);
  const [notes, setNotes] = useState(editingDoc?.notes || '');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
      setError('');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDoc && !file) {
      setError('Please select a file to upload');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a document name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingDoc) {
        // Update existing document
        const updates = {
          name,
          type,
          category,
          tags,
          notes
        };

        if (file) {
          // Upload new file and update URL
          const result = await uploadDocument(file, user.uid, {
            id: editingDoc.id,
            name,
            type,
            category,
            tags,
            notes,
            applicationId: editingDoc.applicationId
          });
          await updateDocument(editingDoc.id, user.uid, {
            ...updates,
            fileUrl: result.fileUrl,
            storagePath: result.storagePath,
            fileSize: file.size,
            mimeType: file.type
          });
        } else {
          // Just update metadata
          await updateDocument(editingDoc.id, user.uid, updates);
        }
      } else {
        // Create new document
        const documentId = Date.now().toString();
        await uploadDocument(file!, user.uid, {
          id: documentId,
          name,
          type,
          category,
          tags,
          notes,
          applicationId: undefined
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'documents');
      setError('Failed to save document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">
            {editingDoc ? 'Edit Document' : 'Upload Document'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-green-600">Success!</h3>
              <p className="text-gray-500 text-sm mt-1">
                {editingDoc ? 'Document updated successfully' : 'Document uploaded successfully'}
              </p>
            </div>
          ) : (
            <>
              {!editingDoc && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Select File
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText size={48} className="text-gray-400 mb-2" />
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload size={48} className="text-gray-400 mb-2" />
                        <p className="font-medium text-sm">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, images up to 10MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                    placeholder="Enter document name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DocumentType)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                  >
                    <option value="Resume">Resume</option>
                    <option value="Cover Letter">Cover Letter</option>
                    <option value="Offer Letter">Offer Letter</option>
                    <option value="Certification">Certification</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                >
                  <option value="General">General</option>
                  <option value="Application">Application</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="p-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <XIcon size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all text-sm resize-none"
                  placeholder="Add any notes about this document..."
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-2xl font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingDoc ? 'Update Document' : 'Upload Document')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
