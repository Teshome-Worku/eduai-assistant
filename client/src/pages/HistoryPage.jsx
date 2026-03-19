import { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getHistory } from '../api/analytics';
import Loader from '../components/Common/Loader';
import ReactMarkdown from 'react-markdown';

const typeConfig = {
  ask: { label: 'Question', icon: ChatBubbleLeftRightIcon, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  summarize: { label: 'Summary', icon: DocumentTextIcon, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
  compare: { label: 'Comparison', icon: ArrowsRightLeftIcon, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' }
};

const HistoryPage = () => {
  const [interactions, setInteractions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadHistory(1);
  }, [filter]);

  const loadHistory = async (page) => {
    setLoading(true);
    try {
      const res = await getHistory(page, 15, filter);
      setInteractions(res.data.interactions);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleExport = () => {
    if (interactions.length === 0) return;
    const lines = interactions.map((item) => {
      const date = new Date(item.createdAt).toLocaleString();
      const type = (typeConfig[item.type]?.label || item.type).toUpperCase();
      return `[${date}] [${type}]\nQ: ${item.question}\nA: ${item.response}\n${'─'.repeat(60)}`;
    });
    const content = `EduAI – Interaction History Export\nExported: ${new Date().toLocaleString()}\nTotal: ${interactions.length} item(s)\n${'═'.repeat(60)}\n\n${lines.join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduai-history-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && interactions.length === 0) return <Loader text="Loading history..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Interaction History</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {pagination.total} total interaction{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter & Export */}
        <div className="flex items-center gap-2">
          {interactions.length > 0 && (
            <button
              onClick={handleExport}
              title="Export history"
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="">All Types</option>
            <option value="ask">Questions</option>
            <option value="summarize">Summaries</option>
            <option value="compare">Comparisons</option>
          </select>
        </div>
      </div>

      {/* Interactions List */}
      {interactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">No interactions yet</h3>
          <p className="text-sm text-gray-400 mt-1">Start asking questions or summarizing documents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((item) => {
            const config = typeConfig[item.type] || typeConfig.ask;
            const Icon = config.icon;
            const isExpanded = expandedId === item._id;

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition hover:shadow-sm"
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                      {item.question}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                      {item.topicTag && item.topicTag !== 'general' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                          {item.topicTag}
                        </span>
                      )}
                      {item.responseTime && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <ClockIcon className="w-3 h-3" />
                          {(item.responseTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded response */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-700/50">
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">AI Response</p>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2">
                        <ReactMarkdown>{item.response}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => loadHistory(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeftIcon className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => loadHistory(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300"
          >
            Next <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
