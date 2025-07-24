import React from 'react';
import type { SocialLinks } from './AdminProfileService';

interface AdminProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  cover_photo_url?: string;
  bio?: string;
  social_links?: SocialLinks;
}

interface ProfileHeaderProps {
  profile: AdminProfileData;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
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

  // Generate avatar initials
  const getAvatarInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.trim().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header - Thiết kế mới giống ảnh */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Icon với background màu cyan */}
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="drop-shadow-sm"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            
            {/* Tiêu đề và mô tả */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Hồ sơ Admin
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Quản lý thông tin cá nhân và cài đặt tài khoản
              </p>
            </div>
          </div>
          
          {/* Role badge */}
          <div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${getRoleBadgeColor(profile.role)}`}>
              {getRoleDisplay(profile.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
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

              {/* Bio */}
              {profile.bio && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
