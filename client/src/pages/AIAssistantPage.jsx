import { useState, useEffect, useRef } from 'react';
import {
  PaperAirplaneIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  SparklesIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { askQuestion, summarizeDocument, compareDocuments } from '../api/ai';
import { getDocuments } from '../api/documents';
import toast from 'react-hot-toast';
import Loader from '../components/Common/Loader';
import ReactMarkdown from 'react-markdown';

const AIAssistantPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [mode, setMode] = useState('ask'); // ask, summarize, compare
  const [compareDocA, setCompareDocA] = useState('');
  const [compareDocB, setCompareDocB] = useState('');
  const messagesEndRef = useRef(null);
  const [docsLoading, setDocsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to load documents');
    } finally {
      setDocsLoading(false);
    }
  };

  const toggleDocSelection = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleAsk = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await askQuestion(input, selectedDocs);
      const aiMessage = {
        role: 'ai',
        content: res.data.answer,
        topicTag: res.data.topicTag,
        documentsUsed: res.data.documentsUsed,
        responseTime: res.data.responseTime,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to get answer';
      toast.error(errMsg);
      const isQuota = error.response?.status === 429;
      setMessages(prev => [...prev, {
        role: 'ai',
        content: isQuota
          ? 'Your AI quota has been exceeded for today. The Gemini API free tier has a daily limit. Please wait until it resets (usually midnight Pacific Time) or use an API key with billing enabled.'
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (docId) => {
    setLoading(true);
    const doc = documents.find(d => d._id === docId);
    setMessages(prev => [...prev, { role: 'user', content: `Summarize: ${doc?.originalName}`, timestamp: new Date() }]);

    try {
      const res = await summarizeDocument(docId);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.data.summary,
        topicTag: 'summary',
        timestamp: new Date()
      }]);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to summarize document';
      toast.error(errMsg);
      const isQuota = error.response?.status === 429;
      if (isQuota) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: 'Your AI quota has been exceeded for today. The Gemini API free tier has a daily limit. Please wait until it resets (usually midnight Pacific Time) or use an API key with billing enabled.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareDocA || !compareDocB) {
      toast.error('Select two documents to compare');
      return;
    }
    if (compareDocA === compareDocB) {
      toast.error('Select two different documents');
      return;
    }

    setLoading(true);
    const docA = documents.find(d => d._id === compareDocA);
    const docB = documents.find(d => d._id === compareDocB);
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Compare: "${docA?.originalName}" vs "${docB?.originalName}"`,
      timestamp: new Date()
    }]);

    try {
      const res = await compareDocuments(compareDocA, compareDocB);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: res.data.comparison,
        topicTag: 'comparison',
        timestamp: new Date()
      }]);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to compare documents';
      toast.error(errMsg);
      const isQuota = error.response?.status === 429;
      if (isQuota) {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: 'Your AI quota has been exceeded for today. The Gemini API free tier has a daily limit. Please wait until it resets (usually midnight Pacific Time) or use an API key with billing enabled.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  if (docsLoading) return <Loader text="Loading AI Assistant..." />;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">AI Assistant</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Ask questions about your study materials</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('ask')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === 'ask' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Ask
          </button>
          <button
            onClick={() => setMode('summarize')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === 'summarize' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Summarize
          </button>
          <button
            onClick={() => setMode('compare')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              mode === 'compare' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Document Selector Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hidden lg:block overflow-y-auto shrink-0">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {mode === 'compare' ? 'Select Documents' : 'Filter by Documents'}
          </h3>

          {mode === 'compare' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Document A</label>
                <select
                  value={compareDocA}
                  onChange={(e) => setCompareDocA(e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">Select...</option>
                  {documents.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.originalName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Document B</label>
                <select
                  value={compareDocB}
                  onChange={(e) => setCompareDocB(e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="">Select...</option>
                  {documents.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.originalName}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCompare}
                disabled={loading || !compareDocA || !compareDocB}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <ArrowsRightLeftIcon className="w-4 h-4 inline mr-1" />
                Compare
              </button>
            </div>
          ) : mode === 'summarize' ? (
            <div className="space-y-2">
              {documents.map(doc => (
                <button
                  key={doc._id}
                  onClick={() => handleSummarize(doc._id)}
                  disabled={loading}
                  className="w-full text-left p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition text-sm disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="truncate text-gray-700 dark:text-gray-300">{doc.originalName}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setSelectedDocs([])}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition ${
                  selectedDocs.length === 0 ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                All Documents
              </button>
              {documents.map(doc => (
                <button
                  key={doc._id}
                  onClick={() => toggleDocSelection(doc._id)}
                  className={`w-full text-left p-2 rounded-lg transition text-sm ${
                    selectedDocs.includes(doc._id) ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DocumentTextIcon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{doc.originalName}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <SparklesIcon className="w-12 h-12 text-indigo-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">Ask anything about your notes</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-md">
                  I can answer questions, summarize documents, and compare study materials.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                }`}>
                  {msg.role === 'ai' ? (
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-indigo-600 dark:prose-code:text-indigo-400">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.topicTag && msg.topicTag !== 'general' && (
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${
                      msg.role === 'user' ? 'bg-indigo-500 text-indigo-100' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'
                    }`}>
                      {msg.topicTag}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area (only for ask mode) */}
          {mode === 'ask' && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your study materials..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-gray-200"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !input.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
