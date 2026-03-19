import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getExamReadiness } from '../api/analytics';
import Loader from '../components/Common/Loader';

const ExamReadinessPage = () => {
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadiness();
  }, []);

  const loadReadiness = async () => {
    try {
      const res = await getExamReadiness();
      setReadiness(res.data);
    } catch (error) {
      console.error('Failed to load readiness');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Calculating exam readiness..." />;

  const score = readiness?.readinessScore || 0;
  const gaugeData = [
    { value: score },
    { value: 100 - score }
  ];

  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Well Prepared' : score >= 40 ? 'Needs More Work' : 'Not Ready';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Exam Readiness</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">AI-predicted exam preparedness</p>
      </div>

      {/* Score Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Gauge */}
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={scoreColor} />
                  <Cell fill="#f3f4f6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: scoreColor }}>{score}</span>
              <span className="text-xs text-gray-400">out of 100</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{scoreLabel}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{readiness?.summary}</p>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{readiness?.passProbability || 0}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pass Probability</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{readiness?.avgMastery || 0}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Avg Mastery</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{readiness?.coveragePercent || 0}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Topic Coverage</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{readiness?.attemptedTopics || 0}/{readiness?.totalTopics || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Topics Attempted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            Recommended Focus Areas
          </h3>
          {readiness?.focusAreas?.length > 0 ? (
            <div className="space-y-3">
              {readiness.focusAreas.map((area, i) => (
                <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{area.topicName}</p>
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                      {area.accuracy}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{area.recommendation}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No focus areas identified yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4 text-blue-500" />
            Uncovered Topics
          </h3>
          {readiness?.uncoveredTopics?.length > 0 ? (
            <div className="space-y-2">
              {readiness.uncoveredTopics.map((topic, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-400 rounded-full shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">Take quizzes on these topics to improve coverage.</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">All topics have been attempted!</p>
          )}
        </div>
      </div>

      {/* Action */}
      <Link
        to="/quiz"
        className="block bg-indigo-600 text-white text-center py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
      >
        <PlayIcon className="w-5 h-5 inline mr-2" />
        Start Focused Study Session
      </Link>
    </div>
  );
};

export default ExamReadinessPage;
