import { useState, useRef, useContext } from 'react';
import {
  UserCircleIcon,
  KeyIcon,
  ClockIcon,
  FireIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  CameraIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { updateProfile, changePassword, uploadAvatar, removeAvatar, deleteAccount } from '../api/auth';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const { dark, toggleTheme } = useContext(ThemeContext);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const avatarInputRef = useRef(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await updateProfile({ name: name.trim() });
      if (updateUser) {
        updateUser({ name: res.data.name });
      }
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPw(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      updateUser({ profilePicture: res.data.profilePicture });
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload picture');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
      updateUser({ profilePicture: '' });
      toast.success('Profile picture removed');
    } catch (error) {
      toast.error('Failed to remove picture');
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile & Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your account</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                <span className="text-indigo-700 dark:text-indigo-300 font-bold text-3xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 hover:bg-indigo-700 transition"
            >
              <CameraIcon className="w-3.5 h-3.5 text-white" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Member since {memberSince}</p>
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {uploadingAvatar ? 'Uploading...' : 'Change photo'}
              </button>
              {user?.profilePicture && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-500 hover:underline flex items-center gap-0.5"
                >
                  <TrashIcon className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <ClockIcon className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{user?.studyTime || 0}</p>
            <p className="text-xs text-gray-400">Minutes Studied</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <FireIcon className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{user?.streak || 0}</p>
            <p className="text-xs text-gray-400">Day Streak</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{user?.aiInteractions || 0}</p>
            <p className="text-xs text-gray-400">AI Questions</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <AcademicCapIcon className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{user?.readinessScore || 0}%</p>
            <p className="text-xs text-gray-400">Exam Ready</p>
          </div>
        </div>

        {/* Edit Name */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <UserCircleIcon className="w-4 h-4" /> Update Name
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
              placeholder="Your name"
            />
            <button
              type="submit"
              disabled={saving || name.trim() === user?.name}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? 'Saving...' : <><CheckCircleIcon className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
          <KeyIcon className="w-4 h-4" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            placeholder="Current password"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            placeholder="New password (min 6 characters)"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            placeholder="Confirm new password"
          />
          <button
            type="submit"
            disabled={changingPw || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Preferences</h3>
        <div className="space-y-4">
          {/* Theme toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dark ? <MoonIcon className="w-5 h-5 text-indigo-400" /> : <SunIcon className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Appearance</p>
                <p className="text-xs text-gray-400">{dark ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${dark ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Export data */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowDownTrayIcon className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Export Data</p>
                <p className="text-xs text-gray-400">Download your learning data as JSON</p>
              </div>
            </div>
            <button
              onClick={() => {
                const data = {
                  name: user?.name,
                  email: user?.email,
                  studyTime: user?.studyTime,
                  streak: user?.streak,
                  aiInteractions: user?.aiInteractions,
                  readinessScore: user?.readinessScore,
                  exportedAt: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `eduai-profile-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Data exported!');
              }}
              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-900/50">
        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
          <ExclamationTriangleIcon className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Once you delete your account, all of your data including documents, quiz history, and learning progress will be permanently removed. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">
              Delete Account?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              This will permanently delete your account and all associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteAccount();
                    toast.success('Account deleted successfully');
                    setShowDeleteConfirm(false);
                    logout();
                  } catch {
                    toast.error('Failed to delete account');
                  }
                }}
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

export default ProfilePage;
