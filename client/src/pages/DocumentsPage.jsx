import { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  TrashIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  TagIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getDocuments, getDocument, uploadDocument, deleteDocument } from '../api/documents';
import toast from 'react-hot-toast';
import Loader from '../components/Common/Loader';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(file);
      toast.success('Document uploaded and processed!');
      setShowUpload(false);
      loadDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      setDocuments(documents.filter(d => d._id !== id));
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePreview = async (docId) => {
    setPreviewLoading(true);
    try {
      const res = await getDocument(docId);
      setPreviewDoc(res.data);
    } catch (error) {
      toast.error('Failed to load document preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) return <Loader text="Loading documents..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Documents</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{documents.length} document(s) uploaded</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200 w-48"
            />
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            Upload PDF
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-300 dark:border-gray-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploading and processing...</p>
                  <p className="text-xs text-gray-400">Extracting text and topics with AI</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Drag and drop your PDF here, or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
                  >
                    Browse Files
                  </button>
                  <p className="text-xs text-gray-400">PDF only, max 50MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No documents yet</h3>
          <p className="text-sm text-gray-400 mb-4">Upload your study materials to get started</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition"
          >
            Upload Your First PDF
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.filter(doc => !searchQuery || doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())).map((doc) => (
            <div key={doc._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <DocumentTextIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{doc.originalName}</p>
                    <p className="text-xs text-gray-400">{formatSize(doc.fileSize)} · {formatDate(doc.uploadedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(doc._id)}
                    className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition"
                    title="Preview text"
                  >
                    <EyeIcon className="w-4 h-4 text-gray-400 hover:text-indigo-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id, doc.originalName)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                    title="Delete document"
                  >
                    <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </div>

              {/* Topics */}
              {doc.extractedTopics && doc.extractedTopics.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                  <div className="flex items-center gap-1 mb-2">
                    <TagIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">Topics</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.extractedTopics.slice(0, 4).map((topic, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-full text-xs">
                        {topic.name}
                      </span>
                    ))}
                    {doc.extractedTopics.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                        +{doc.extractedTopics.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Preview Modal */}
      {(previewDoc || previewLoading) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {previewDoc?.originalName || 'Loading...'}
                </h2>
                {previewDoc && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {previewDoc.extractedText?.length?.toLocaleString()} characters extracted
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {previewDoc?.extractedText || 'No text extracted from this document.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
