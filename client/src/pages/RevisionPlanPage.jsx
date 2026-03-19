import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { getRevisionPlan } from '../api/analytics';
import Loader from '../components/Common/Loader';

const RevisionPlanPage = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(new Set());

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const res = await getRevisionPlan();
      setPlan(res.data);
    } catch (error) {
      console.error('Failed to load revision plan');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (topicName) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(topicName)) next.delete(topicName);
      else next.add(topicName);
      return next;
    });
  };

  if (loading) return <Loader text="Generating revision plan..." />;

  const getPriorityColor = (priority) => {
    if (priority === 'due') return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    if (priority === 'weak') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  };

  const completedCount = completed.size;
  const totalTopics = plan?.topics?.length || 0;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Smart Revision Plan</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Spaced repetition schedule for today
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{plan?.date || 'Today'}</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{totalTopics} topics to review</p>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <ClockIcon className="w-5 h-5" />
              <span className="text-sm">{plan?.estimatedTotalMinutes || 0} min estimated</span>
            </div>
          </div>

          {/* Progress */}
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{progressPercent}%</p>
            <p className="text-xs text-gray-400">{completedCount}/{totalTopics} done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{plan?.message}</p>
      </div>

      {/* Topic List */}
      {totalTopics === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">All caught up!</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            No topics due for review today. Keep up the great work!
          </p>
          <Link to="/quiz" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition">
            Take a Practice Quiz
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plan.topics.map((topic, i) => {
            const isCompleted = completed.has(topic.topicName);
            return (
              <div
                key={i}
                className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border transition ${
                  isCompleted ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(topic.topicName)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                    }`}
                  >
                    {isCompleted && <CheckCircleIcon className="w-4 h-4 text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                        {topic.topicName}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(topic.priority)}`}>
                        {topic.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{topic.action}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Accuracy: {topic.accuracy}%</span>
                      <span>~{topic.estimatedMinutes} min</span>
                      <span className="capitalize">Trend: {topic.trend}</span>
                    </div>
                  </div>

                  {/* Quiz shortcut */}
                  {!isCompleted && (
                    <Link
                      to={`/quiz`}
                      className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition shrink-0"
                      title="Take quiz on this topic"
                    >
                      <PlayIcon className="w-5 h-5 text-indigo-500" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RevisionPlanPage;
