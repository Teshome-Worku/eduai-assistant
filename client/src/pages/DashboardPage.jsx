import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ClockIcon, FireIcon, ChatBubbleLeftRightIcon, AcademicCapIcon,
  DocumentPlusIcon, PlayIcon, SparklesIcon, PauseIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { getStudyTime, getMastery, getWeakTopics, getExamReadiness } from '../api/analytics';
import Loader from '../components/Common/Loader';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const TIMER_MODES = [
  { label: 'Focus', minutes: 25, color: 'text-indigo-600 dark:text-indigo-400' },
  { label: 'Short Break', minutes: 5, color: 'text-green-600 dark:text-green-400' },
  { label: 'Long Break', minutes: 15, color: 'text-blue-600 dark:text-blue-400' },
];

const PomodoroTimer = () => {
  const [modeIdx, setModeIdx] = useState(0);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const mode = TIMER_MODES[modeIdx];

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        // Auto-switch mode
        if (modeIdx === 0) {
          setSessions(s => s + 1);
          const nextMode = (sessions + 1) % 4 === 0 ? 2 : 1;
          setModeIdx(nextMode);
          return TIMER_MODES[nextMode].minutes * 60;
        } else {
          setModeIdx(0);
          return TIMER_MODES[0].minutes * 60;
        }
      }
      return prev - 1;
    });
  }, [modeIdx, sessions]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, tick]);

  const toggleTimer = () => setRunning(prev => !prev);

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(mode.minutes * 60);
  };

  const switchMode = (idx) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setModeIdx(idx);
    setSeconds(TIMER_MODES[idx].minutes * 60);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - seconds / (mode.minutes * 60);

  return (
    <div className="text-center">
      <div className="flex justify-center gap-2 mb-4">
        {TIMER_MODES.map((m, i) => (
          <button
            key={i}
            onClick={() => switchMode(i)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              modeIdx === i
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="relative w-36 h-36 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4"
            strokeDasharray={`${progress * 283} 283`}
            strokeLinecap="round"
            className={mode.color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-100 font-mono">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <span className="text-xs text-gray-400 mt-1">{mode.label}</span>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={toggleTimer}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          {running ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={resetTimer}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset
        </button>
      </div>
      {sessions > 0 && (
        <p className="text-xs text-gray-400 mt-3">{sessions} focus session{sessions > 1 ? 's' : ''} completed</p>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [studyData, setStudyData] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [weakTopics, setWeakTopics] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studyRes, masteryRes, weakRes, readyRes] = await Promise.allSettled([
          getStudyTime(), getMastery(), getWeakTopics(), getExamReadiness()
        ]);
        if (studyRes.status === 'fulfilled') setStudyData(studyRes.value.data);
        if (masteryRes.status === 'fulfilled') setMastery(masteryRes.value.data);
        if (weakRes.status === 'fulfilled') setWeakTopics(weakRes.value.data);
        if (readyRes.status === 'fulfilled') setReadiness(readyRes.value.data);
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;

  const masteryChartData = mastery?.topics?.slice(0, 8).map(t => ({
    name: t.topicName.length > 12 ? t.topicName.substring(0, 12) + '...' : t.topicName,
    accuracy: t.accuracy
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of your learning progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClockIcon} label="Study Time" value={`${user?.studyTime || 0} min`} color="bg-blue-500" sub="Total study time" />
        <StatCard icon={FireIcon} label="Streak" value={`${user?.streak || 0} days`} color="bg-orange-500" sub="Keep it going!" />
        <StatCard icon={ChatBubbleLeftRightIcon} label="AI Interactions" value={user?.aiInteractions || 0} color="bg-purple-500" sub="Questions asked" />
        <StatCard icon={AcademicCapIcon} label="Readiness" value={`${readiness?.readinessScore || 0}%`} color="bg-green-500" sub={`${readiness?.passProbability || 0}% pass probability`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Study Activity (Last 7 Days)</h3>
          {studyData?.dailyData ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={studyData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
                <Line type="monotone" dataKey="interactions" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">No study data yet. Start learning!</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Topic Mastery Overview</h3>
          {masteryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={masteryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#9ca3af" angle={-20} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#f3f4f6' }} />
                <Bar dataKey="accuracy" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-16">Upload documents and take quizzes to see mastery.</p>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Weak Topics</h3>
          {weakTopics?.topics?.length > 0 ? (
            <div className="space-y-3">
              {weakTopics.topics.slice(0, 5).map((topic, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{topic.topicName}</p>
                    <p className="text-xs text-gray-400">{topic.reasons.join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div className={`h-2 rounded-full ${topic.accuracy < 30 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${topic.accuracy}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8">{topic.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No weak topics detected yet.</p>
          )}
        </div>

        {/* Study Timer + Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Study Timer</h3>
          <PomodoroTimer />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link to="/documents" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition">
            <DocumentPlusIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Document</p>
              <p className="text-xs text-gray-400">Add study material</p>
            </div>
          </Link>
          <Link to="/quiz" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition">
            <PlayIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Quiz</p>
              <p className="text-xs text-gray-400">Test your knowledge</p>
            </div>
          </Link>
          <Link to="/ai-assistant" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition">
            <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ask AI</p>
              <p className="text-xs text-gray-400">Get answers from notes</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
