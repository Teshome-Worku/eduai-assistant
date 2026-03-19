import { useState, useEffect } from 'react';
import {
  UsersIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { getAdminStats, getAdminUsers, toggleUserRole, deleteAdminUser } from '../api/admin';
import Loader from '../components/Common/Loader';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadUsers(1);
  }, [search]);

  const loadStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      }
    }
  };

  const loadUsers = async (page) => {
    setLoading(true);
    try {
      const res = await getAdminUsers(page, 15, search);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleToggleRole = async (userId, currentRole) => {
    try {
      await toggleUserRole(userId);
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, role: currentRole === 'admin' ? 'user' : 'admin' } : u
      ));
      toast.success('User role updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await deleteAdminUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setDeleteConfirm(null);
      toast.success('User deleted');
      loadStats(); // refresh stats
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading && users.length === 0 && !stats) return <Loader text="Loading admin panel..." />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <ShieldCheckIcon className="w-7 h-7 text-indigo-600" />
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Manage users and monitor platform activity
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalUsers}</p>
                <p className="text-xs text-gray-400">Total Users</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <UserPlusIcon className="w-3.5 h-3.5" />
              <span>{stats.usersToday} today, {stats.usersThisWeek} this week</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalDocuments}</p>
                <p className="text-xs text-gray-400">Documents</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalQuizzes}</p>
                <p className="text-xs text-gray-400">Quizzes Taken</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.totalInteractions}</p>
                <p className="text-xs text-gray-400">AI Interactions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Search header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Registered Users ({pagination.total})
          </h2>
          <form onSubmit={handleSearch} className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200 w-64"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Study Time</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Docs</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">AI Uses</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
                          <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                            {user.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      user.role === 'admin'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{user.studyTime || 0}m</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{user.documentCount || 0}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{user.aiInteractions || 0}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(user.createdAt)}</p>
                      <p className="text-xs text-gray-400">{formatTime(user.createdAt)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleRole(user._id, user.role)}
                        title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition"
                      >
                        <ShieldCheckIcon className={`w-4 h-4 ${
                          user.role === 'admin' ? 'text-amber-500' : 'text-gray-400'
                        }`} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user)}
                        title="Delete user"
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    {search ? `No users found matching "${search}"` : 'No users registered yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400">
              Showing {((pagination.page - 1) * 15) + 1}–{Math.min(pagination.page * 15, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              </button>
              <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 px-2">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => loadUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">
              Delete User?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <p className="text-xs text-gray-400 text-center mb-6">
              ({deleteConfirm.email}) — All their data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm._id)}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
