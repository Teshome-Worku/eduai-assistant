import { useState, useEffect } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMastery } from '../api/analytics';
import Loader from '../components/Common/Loader';
import ProgressBar from '../components/Common/ProgressBar';

const MasteryPage = () => {
  const [mastery, setMastery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, weak, strong

  useEffect(() => {
    loadMastery();
  }, []);

  const loadMastery = async () => {
    try {
      const res = await getMastery();
      setMastery(res.data);
    } catch (error) {
      console.error('Failed to load mastery');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Loading mastery data..." />;

  const filteredTopics = mastery?.topics?.filter(t => {
    if (filter === 'weak') return t.accuracy < 50;
    if (filter === 'strong') return t.accuracy >= 70;
    return true;
  }) || [];

  const chartData = filteredTopics.map(t => ({
    name: t.topicName.length > 15 ? t.topicName.substring(0, 15) + '...' : t.topicName,
    accuracy: t.accuracy,
    confidence: t.confidenceScore
  }));

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend === 'declining') return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-gray-400" />;
  };

  const getBarColor = (accuracy) => {
    if (accuracy >= 70) return '#22c55e';
    if (accuracy >= 40) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Topic Mastery</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {mastery?.totalTopics || 0} topics tracked · {mastery?.averageAccuracy || 0}% average mastery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          {['all', 'weak', 'strong'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                filter === f ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{mastery?.mastered || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mastered (&ge;80%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{mastery?.inProgress || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">In Progress (50-79%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{mastery?.weak || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weak (&lt;50%)</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Mastery by Topic</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" angle={-30} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Topic List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-50 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Topics ({filteredTopics.length})</h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {filteredTopics.length === 0 ? (
            <p className="p-8 text-center text-gray-400 text-sm">
              {filter === 'all' ? 'No topics tracked yet. Upload documents and take quizzes.' : `No ${filter} topics found.`}
            </p>
          ) : (
            filteredTopics.map((topic, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{topic.topicName}</p>
                    {getTrendIcon(topic.trend)}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {topic.attempts} attempts · Confidence: {topic.confidenceScore}%
                  </p>
                </div>
                <div className="w-32">
                  <ProgressBar value={topic.accuracy} color="auto" size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MasteryPage;
