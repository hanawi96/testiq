import React from 'react';

interface AdminProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
}

interface ProfileHeaderProps {
  profile: AdminProfileData;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  // Generate avatar initials
  const getAvatarInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.trim().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  // Format role display
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Quản trị viên',
      'editor': 'Biên tập viên',
      'author': 'Tác giả',
      'reviewer': 'Người duyệt'
    };
    return roleMap[role] || role;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Không xác định';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    const colorMap: Record<string, string> = {
      'admin': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      'editor': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      'author': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      'reviewer': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        
        {/* Left side - Avatar and basic info */}
        <div className="flex items-center space-x-4">
          
          {/* Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || profile.email}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold border-2 border-gray-200 dark:border-gray-600">
                {getAvatarInitials(profile.full_name, profile.email)}
              </div>
            )}
            
            {/* Online status indicator */}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
          </div>

          {/* Basic info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {profile.full_name || 'Chưa có tên'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 truncate">
              {profile.email}
            </p>
            <div className="flex items-center mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                {getRoleDisplay(profile.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Stats and actions */}
        <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
          <div className="flex flex-col sm:items-end space-y-2">
            
            {/* Account creation date */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium">Tạo tài khoản:</span>
              <br className="sm:hidden" />
              <span className="sm:ml-2">{formatDate(profile.created_at)}</span>
            </div>

            {/* Last updated */}
            {profile.updated_at && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Cập nhật cuối:</span>
                <br className="sm:hidden" />
                <span className="sm:ml-2">{formatDate(profile.updated_at)}</span>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => window.location.href = '/admin'}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
                </svg>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional info bar */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          
          {/* User ID */}
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">ID người dùng:</span>
            <p className="text-gray-900 dark:text-white font-mono text-xs mt-1 break-all">
              {profile.id}
            </p>
          </div>

          {/* Account status */}
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Trạng thái:</span>
            <p className="text-green-600 dark:text-green-400 mt-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Hoạt động
            </p>
          </div>

          {/* Permissions */}
          <div>
            <span className="font-medium text-gray-500 dark:text-gray-400">Quyền hạn:</span>
            <p className="text-gray-900 dark:text-white mt-1">
              Toàn quyền quản trị
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
