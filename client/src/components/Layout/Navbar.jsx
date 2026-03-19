import { useContext, useState, useEffect, useRef } from 'react';
import { Bars3Icon, BellIcon, SunIcon, MoonIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  ExclamationTriangleIcon,
  AcademicCapIcon,
  ClockIcon,
  BookOpenIcon,
  FireIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../context/ThemeContext';
import { getWeakTopics, getRevisionPlan } from '../../api/analytics';

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { dark, toggleTheme } = useContext(ThemeContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (loading) return;
    setLoading(true);
    const items = [];

    try {
      // Check weak topics
      const weakRes = await getWeakTopics();
      if (weakRes.data?.count > 0) {
        items.push({
          id: 'weak',
          icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />,
          title: `${weakRes.data.count} weak topic${weakRes.data.count > 1 ? 's' : ''} need attention`,
          desc: weakRes.data.topics.slice(0, 3).map(t => t.topicName).join(', '),
          link: '/mastery',
          type: 'warning'
        });
      }
    } catch (e) { /* ignore */ }

    try {
      // Check revision plan
      const revRes = await getRevisionPlan();
      const plan = revRes.data;
      if (plan?.todayTasks && plan.todayTasks.length > 0) {
        items.push({
          id: 'revision',
          icon: <BookOpenIcon className="w-5 h-5 text-blue-500" />,
          title: `${plan.todayTasks.length} topic${plan.todayTasks.length > 1 ? 's' : ''} due for revision today`,
          desc: plan.todayTasks.slice(0, 3).map(t => t.topicName).join(', '),
          link: '/revision-plan',
          type: 'info'
        });
      }
      if (plan?.overdueTasks && plan.overdueTasks.length > 0) {
        items.push({
          id: 'overdue',
          icon: <ClockIcon className="w-5 h-5 text-orange-500" />,
          title: `${plan.overdueTasks.length} overdue revision${plan.overdueTasks.length > 1 ? 's' : ''}`,
          desc: 'These topics are past their review date',
          link: '/revision-plan',
          type: 'warning'
        });
      }
    } catch (e) { /* ignore */ }

    // Study streak notification
    if (user?.streak > 0) {
      items.push({
        id: 'streak',
        icon: <FireIcon className="w-5 h-5 text-orange-500" />,
        title: `${user.streak} day streak! Keep it up!`,
        desc: 'Study today to maintain your streak',
        type: 'success'
      });
    } else {
      items.push({
        id: 'streak-start',
        icon: <AcademicCapIcon className="w-5 h-5 text-indigo-500" />,
        title: 'Start your study streak!',
        desc: 'Ask a question or take a quiz to begin',
        type: 'info'
      });
    }

    setNotifications(items);
    setLoading(false);
  };

  const handleBellClick = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState) {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => n.type === 'warning').length;

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-full">
            <span className="text-orange-500 text-sm">&#128293;</span>
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">{user?.streak || 0} day streak</span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? (
              <SunIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <MoonIcon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleBellClick}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative"
            >
              <BellIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <BellIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                        onClick={() => {
                          if (n.link) window.location.href = n.link;
                          setShowNotifications(false);
                        }}
                      >
                        <div className="shrink-0 mt-0.5">{n.icon}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{n.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{n.desc}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
