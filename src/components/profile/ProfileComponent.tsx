import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { type TestResult, getAnonymousUserInfo } from '@/utils/testing/iq-test/core';
import LoginPopup from '@/components/auth/login/LoginPopup';
import AvatarUpload from './AvatarUpload';
import CoverPhotoUpload from './CoverPhotoUpload';
import EditProfileModal from './EditProfileModal';

interface UserProfile {
  name: string;
  age: string;
  location: string;
  email?: string;
  joinDate?: string;
  totalTests?: number;
  averageScore?: number;
  bestScore?: number;
  testHistory?: any[];
  isAuthenticated?: boolean;
  avatarUrl?: string;
  coverPhotoUrl?: string | null;
  countryCode?: string;
  countryName?: string;
  gender?: string;
  bio?: string;
  isSharedProfile?: boolean;
  canEdit?: boolean;
  profileUserId?: string;
  isProfilePublic?: boolean;
}

interface Props {
  initialProfile?: UserProfile;
  profileUsername?: string;
}

// Generate avatar from name
const generateAvatar = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600',
    'bg-gradient-to-br from-green-400 to-green-600', 
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-yellow-400 to-orange-500',
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-teal-400 to-cyan-600'
  ];
  
  const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[nameHash % colors.length];
};

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

// Enhanced loading states
const ProgressiveLoader = ({ progress }: { progress: number }) => (
  <div className="fixed top-0 left-0 right-0 z-50">
    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" 
         style={{ width: `${progress}%` }} />
  </div>
);

// Optimized skeleton with better animations
const OptimizedSkeleton = ({ className = '', delay = 0 }: { className?: string; delay?: number }) => (
  <div
    className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  />
);

// Smart content loader with fade-in
const ContentLoader = ({ children, isLoading, skeleton }: { 
  children: React.ReactNode; 
  isLoading: boolean; 
  skeleton: React.ReactNode;
}) => (
  <AnimatePresence mode="wait">
    {isLoading ? (
      <motion.div
        key="skeleton"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {skeleton}
      </motion.div>
    ) : (
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

// Smart skeleton components
const SkeletonProfile = () => (
  <div className="relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-200/50 dark:border-gray-700/50">
    {/* Cover Photo Skeleton */}
    <div className="relative h-48 md:h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
      <OptimizedSkeleton className="w-full h-full" />
    </div>

    {/* Profile Content Skeleton */}
    <div className="relative px-6 pb-6">
      {/* Avatar Skeleton */}
      <div className="relative -mt-16 mb-4">
        <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
          <OptimizedSkeleton className="w-full h-full rounded-full" />
        </div>
      </div>

      {/* User Info Skeleton */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <OptimizedSkeleton className="h-8 w-48 mb-2" delay={100} />
            <OptimizedSkeleton className="h-5 w-32" delay={200} />
          </div>
          <div className="flex gap-2">
            <OptimizedSkeleton className="h-10 w-24 rounded-lg" delay={300} />
            <OptimizedSkeleton className="h-10 w-10 rounded-lg" delay={400} />
          </div>
        </div>

        {/* Bio Skeleton */}
        <div className="mb-4">
          <OptimizedSkeleton className="h-4 w-full mb-2" delay={500} />
          <OptimizedSkeleton className="h-4 w-3/4" delay={600} />
        </div>

        {/* Details Skeleton */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <OptimizedSkeleton className="h-4 w-20" delay={700} />
          <OptimizedSkeleton className="h-4 w-24" delay={800} />
          <OptimizedSkeleton className="h-4 w-28" delay={900} />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <OptimizedSkeleton className="h-8 w-12 mx-auto mb-2" delay={1000 + i * 100} />
              <OptimizedSkeleton className="h-4 w-16 mx-auto" delay={1100 + i * 100} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SkeletonTestList = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-center justify-between mb-6">
      <OptimizedSkeleton className="h-6 w-40" />
      <OptimizedSkeleton className="h-8 w-24 rounded-xl" delay={100} />
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <OptimizedSkeleton className="w-12 h-12 rounded-full" delay={i * 100} />
              <div className="space-y-2">
                <OptimizedSkeleton className="w-32 h-4" delay={i * 100 + 50} />
                <OptimizedSkeleton className="w-24 h-3" delay={i * 100 + 100} />
              </div>
            </div>
            <div className="text-right space-y-1">
              <OptimizedSkeleton className="w-12 h-6" delay={i * 100 + 150} />
              <OptimizedSkeleton className="w-8 h-3" delay={i * 100 + 200} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);



const ProfileComponent: React.FC<Props> = ({ initialProfile, profileUsername }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showCoverPhotoUpload, setShowCoverPhotoUpload] = useState(false);
  const [coverPhotoLoading, setCoverPhotoLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // 🚀 CLEAN INIT: Always start fresh, load from correct source based on auth
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return initialProfile || {
      name: 'Người dùng',
      age: '',
      location: '',
      totalTests: 0,
      averageScore: 0,
      bestScore: 0,
      testHistory: [],
      isAuthenticated: false
    };
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(initialProfile?.isAuthenticated || null);

  // Memoized calculations
  const profileStats = useMemo(() => {
    if (!userProfile.testHistory?.length) return { average: 0, best: 0, joinDate: new Date().toLocaleDateString('vi-VN') };

    const scores = userProfile.testHistory.map(test => test.iq || 0);
    const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const best = Math.max(...scores);

    const oldestTest = userProfile.testHistory[userProfile.testHistory.length - 1];
    const joinDate = oldestTest?.timestamp
      ? new Date(oldestTest.timestamp).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');

    return { average, best, joinDate };
  }, [userProfile.testHistory]);

  // 🚀 MEMOIZED TEST LIST - Chỉ re-render khi testHistory thực sự thay đổi
  const memoizedTestList = useMemo(() => {
    return userProfile.testHistory || [];
  }, [userProfile.testHistory]);

  // IQ Achievement System
  const getIQAchievement = useMemo(() => {
    const bestScore = profileStats.best;

    if (bestScore >= 160) return {
      level: 'genius',
      title: 'Thiên Tài',
      subtitle: 'IQ Siêu Việt',
      description: 'Thuộc top 0.01% dân số thế giới',
      icon: '🧠',
      gradient: 'from-purple-600 via-pink-600 to-red-600',
      glowColor: 'shadow-purple-500/50',
      borderGradient: 'from-purple-400 to-pink-400',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      textColor: 'text-purple-700 dark:text-purple-300',
      animation: 'animate-pulse'
    };

    if (bestScore >= 145) return {
      level: 'exceptional',
      title: 'Xuất Sắc',
      subtitle: 'IQ Đặc Biệt',
      description: 'Thuộc top 0.1% dân số thế giới',
      icon: '⭐',
      gradient: 'from-yellow-500 via-orange-500 to-red-500',
      glowColor: 'shadow-yellow-500/50',
      borderGradient: 'from-yellow-400 to-orange-400',
      bgGradient: 'from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      animation: 'animate-bounce'
    };

    if (bestScore >= 130) return {
      level: 'superior',
      title: 'Ưu Việt',
      subtitle: 'IQ Cao',
      description: 'Thuộc top 2% dân số thế giới',
      icon: '🏆',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      glowColor: 'shadow-blue-500/50',
      borderGradient: 'from-blue-400 to-cyan-400',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      animation: ''
    };

    if (bestScore >= 115) return {
      level: 'above_average',
      title: 'Trên Trung Bình',
      subtitle: 'IQ Tốt',
      description: 'Thuộc top 15% dân số thế giới',
      icon: '🎯',
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      glowColor: 'shadow-green-500/50',
      borderGradient: 'from-green-400 to-emerald-400',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      textColor: 'text-green-700 dark:text-green-300',
      animation: ''
    };

    return null;
  }, [profileStats.best]);

  // Start loading immediately when user clicks crop
  const handleStartAvatarLoading = useCallback(() => {
    console.log('🚀 Starting avatar loading immediately');
    setAvatarLoading(true);
    setShowAvatarUpload(false);
  }, []);

  // Avatar upload handlers - Update immediately when ready
  const handleAvatarUpdate = useCallback((newAvatarUrl: string) => {
    console.log('✅ Avatar ready, updating immediately:', newAvatarUrl);

    // Nếu là empty string (xóa avatar), update ngay lập tức về avatar chữ cái
    if (!newAvatarUrl || newAvatarUrl === '') {
      console.log('🗑️ Removing avatar, switching to letter avatar');
      setUserProfile(prevProfile => ({
        ...prevProfile,
        avatarUrl: undefined // undefined để hiển thị avatar chữ cái
      }));
      setAvatarLoading(false);
      return;
    }

    // Preload image to ensure it's ready before showing
    const img = new Image();
    img.onload = () => {
      console.log('🖼️ Image preloaded, updating UI immediately');
      setUserProfile(prevProfile => ({
        ...prevProfile,
        avatarUrl: newAvatarUrl + '?t=' + Date.now() // Cache busting
      }));
      setAvatarLoading(false);
    };
    img.onerror = () => {
      console.log('⚠️ Image preload failed, updating anyway');
      setUserProfile(prevProfile => ({
        ...prevProfile,
        avatarUrl: newAvatarUrl + '?t=' + Date.now() // Cache busting
      }));
      setAvatarLoading(false);
    };
    img.src = newAvatarUrl;
  }, []);

  // Avatar viewer handlers
  const handleAvatarClick = useCallback(() => {
    if (userProfile.avatarUrl) {
      setShowAvatarViewer(true);
    }
  }, [userProfile.avatarUrl]);

  // Cover photo handlers
  const handleStartCoverPhotoLoading = useCallback(() => {
    console.log('🚀 Starting cover photo loading immediately');
    setCoverPhotoLoading(true);
    setShowCoverPhotoUpload(false);
  }, []);

  const handleCoverPhotoUpdate = useCallback((newCoverPhotoUrl: string) => {
    console.log('✅ Cover photo ready, updating immediately:', newCoverPhotoUrl);

    // Preload image to ensure it's ready before showing
    const img = new Image();
    img.onload = () => {
      console.log('🖼️ Cover photo preloaded, updating UI immediately');
      setUserProfile(prevProfile => ({
        ...prevProfile,
        coverPhotoUrl: newCoverPhotoUrl + '?t=' + Date.now() // Cache busting
      }));
      setCoverPhotoLoading(false);
    };
    img.onerror = () => {
      console.log('⚠️ Cover photo preload failed, updating anyway');
      setUserProfile(prevProfile => ({
        ...prevProfile,
        coverPhotoUrl: newCoverPhotoUrl + '?t=' + Date.now() // Cache busting
      }));
      setCoverPhotoLoading(false);
    };
    img.src = newCoverPhotoUrl;
  }, []);

  const handleCoverPhotoUploadClose = useCallback(() => {
    setShowCoverPhotoUpload(false);
  }, []);

  const handleAvatarUploadClose = useCallback(() => {
    setShowAvatarUpload(false);
  }, []);

  // Handle edit profile success - 🚀 OPTIMIZED: Chỉ update fields thay đổi, giữ nguyên testHistory
  const handleEditProfileSuccess = useCallback((updatedProfile: any) => {
    console.log('✅ Profile updated successfully:', updatedProfile);
    setUserProfile(prev => {
      // Chỉ update những field thực sự thay đổi, giữ nguyên testHistory reference
      const newProfile = { ...prev };

      // Chỉ update các field profile cơ bản, KHÔNG touch testHistory
      if (updatedProfile.name !== undefined) newProfile.name = updatedProfile.name;
      if (updatedProfile.age !== undefined) newProfile.age = updatedProfile.age;
      if (updatedProfile.location !== undefined) newProfile.location = updatedProfile.location;
      if (updatedProfile.bio !== undefined) newProfile.bio = updatedProfile.bio;
      if (updatedProfile.gender !== undefined) newProfile.gender = updatedProfile.gender;
      if (updatedProfile.countryCode !== undefined) newProfile.countryCode = updatedProfile.countryCode;
      if (updatedProfile.isProfilePublic !== undefined) newProfile.isProfilePublic = updatedProfile.isProfilePublic;

      return newProfile;
    });
  }, []);



  // Handle remove cover photo - WITH STORAGE CLEANUP
  const handleRemoveCoverPhoto = useCallback(async () => {
    if (!userProfile.coverPhotoUrl) return;
    if (!confirm('Xóa ảnh bìa?')) return;

    console.log('🗑️ Removing cover photo:', userProfile.coverPhotoUrl);

    try {
      const { AdminProfileService } = await import('../admin/profile/AdminProfileService');
      const { AuthService } = await import('@/backend');
      const { ImageStorageService } = await import('@/backend/storage/image-storage');

      const { user } = await AuthService.getCurrentUser();
      if (!user) return;

      // Extract file path for storage deletion
      const filePath = ImageStorageService.extractPathFromUrl(userProfile.coverPhotoUrl);
      console.log('📁 Extracted file path:', filePath);

      // Update database first
      const updateResult = await AdminProfileService.updateAdminProfile(user.id, {
        cover_photo_url: null
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error?.message || 'Failed to update database');
      }
      console.log('✅ Database updated successfully');

      // Update UI immediately
      setUserProfile(prev => ({ ...prev, coverPhotoUrl: null }));

      // Delete file from storage
      if (filePath) {
        console.log('🗂️ Deleting file from storage...');
        const { success, error } = await ImageStorageService.deleteImage(filePath);
        if (success) {
          console.log('✅ Storage file deleted successfully');
        } else {
          console.error('❌ Failed to delete storage file:', error);
        }
      } else {
        console.warn('⚠️ Could not extract file path from URL');
      }

    } catch (error) {
      console.error('❌ Error removing cover photo:', error);
      alert('Lỗi xóa ảnh bìa');
    }
  }, [userProfile.coverPhotoUrl]);

  // Handle opening register popup with prefilled email
  const handleOpenRegisterPopup = async () => {
    try {
      // Lấy email từ localStorage nếu có
      const anonymousUserInfo = getAnonymousUserInfo();
      if (anonymousUserInfo?.email) {
        setPrefilledEmail(anonymousUserInfo.email);
      }
      setShowLoginPopup(true);
    } catch (error) {
      console.warn('⚠️ Could not get anonymous user info:', error);
      setShowLoginPopup(true);
    }
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowLoginPopup(false);
    // Reload page để cập nhật trạng thái authentication
    window.location.reload();
  };

  // Handle share profile
  const handleShareProfile = useCallback(() => {
    try {
      // Simple profile URL: /u/username
      const shareUrl = `${window.location.origin}/u/${profileUsername || 'user'}`;

      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.innerHTML = '✅ Link profile đã được sao chép!';
        toast.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #10b981; color: white; padding: 12px 20px;
          border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 14px; font-weight: 500;
          transform: translateX(100%); transition: transform 0.3s ease;
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.style.transform = 'translateX(0)', 10);
        setTimeout(() => {
          toast.style.transform = 'translateX(100%)';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, 2500);
      }).catch(() => {
        // Fallback: show URL in prompt
        prompt('Sao chép link này để chia sẻ:', shareUrl);
      });
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Có lỗi xảy ra khi tạo link chia sẻ.');
    }
  }, [profileUsername]);

  // 💯 SMART DATA LOADING: Auth-first, then fallback (page reload on auth change)
  useEffect(() => {
    let isMounted = true;

    const loadDataSmartly = async () => {
      try {
        setLoadingProgress(20);

        // 🔗 CHECK FOR SHARED PROFILE FIRST
        const urlParams = new URLSearchParams(window.location.search);
        const isSharedProfile = urlParams.get('share') === 'true';
        const sharedData = urlParams.get('data');

        if (isSharedProfile && sharedData) {
          try {
            // Decode base64 to UTF-8 safely
            const decodedString = decodeURIComponent(Array.prototype.map.call(atob(sharedData), (c) => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decodedData = JSON.parse(decodedString);
            const sharedProfile = {
              ...decodedData,
              isSharedProfile: true
            };

            if (!isMounted) return;
            setUserProfile(sharedProfile);
            setIsAuthenticated(false);
            setLoadingProgress(100);
            setDataReady(true);
            console.log('✅ Shared profile loaded:', sharedProfile.name);
            return;
          } catch (error) {
            console.error('❌ Failed to decode shared profile:', error);
            // Continue with normal loading if shared data is invalid
          }
        }

        // 1️⃣ Load modules
        const [testUtils, backend] = await Promise.all([
          import('@/utils/testing/iq-test/core'),
          import('@/backend').catch(() => null)
        ]);

        setLoadingProgress(40);

        // 2️⃣ Check authentication status
        const isAuth = await (backend?.AuthService?.getCurrentUser?.()
          .then(result => !!result?.user)
          .catch(() => false)) || false;

        if (!isMounted) return;
        setIsAuthenticated(isAuth);
        setLoadingProgress(60);

        // 3️⃣ Load data based on auth - PRIORITY: Database > localStorage
        let profileData: UserProfile = {
          name: 'Người dùng',
          age: '',
          location: '',
          totalTests: 0,
          averageScore: 0,
          bestScore: 0,
          testHistory: [],
          isAuthenticated: isAuth,
          canEdit: initialProfile?.canEdit || false
        };

        if (isAuth && backend) {
          // 🔥 AUTHENTICATED: Only use database data
          console.log('🔐 Loading from DATABASE (authenticated user)');
          console.log('🔍 Profile loading debug:', {
            profileUsername: profileUsername,
            isViewingOtherProfile: !!profileUsername,
            shouldLoadCurrentUser: !profileUsername,
            shouldLoadSpecificUser: !!profileUsername
          });
          try {
            // Get user data first, then profile
            const currentUser = await backend.AuthService.getCurrentUser();
            const userId = currentUser?.user?.id;

            console.log('👤 Current user info:', {
              userId: userId,
              email: currentUser?.user?.email,
              profileUsername: profileUsername,
              shouldLoadThisUser: !profileUsername
            });

            if (!userId) {
              throw new Error('No user ID found');
            }

            let profileResult, historyResult;
            let targetUserId = userId; // Default to current user
            let isOwnProfile = true; // Default to own profile

            if (profileUsername) {
              // Load specific user by username
              console.log('🔍 Loading specific user by username:', profileUsername);

              // First get user ID by username
              const { data: userData, error: userError } = await backend.supabase
                .from('user_profiles')
                .select('id')
                .eq('username', profileUsername)
                .single();

              if (userError || !userData) {
                console.log('❌ User not found:', profileUsername);
                // Graceful fallback instead of throwing error
                profileData = {
                  name: profileUsername,
                  age: '',
                  location: '',
                  totalTests: 0,
                  averageScore: 0,
                  bestScore: 0,
                  testHistory: [],
                  isAuthenticated: isAuth,
                  canEdit: false
                };

                if (!isMounted) return;
                setUserProfile(profileData);
                setLoadingProgress(100);
                setDataReady(true);
                console.log('✅ Fallback profile created for:', profileUsername);
                return;
              }

              console.log('✅ Found user ID for username:', { username: profileUsername, userId: userData.id });

              // Update variables for scope
              targetUserId = userData.id;
              isOwnProfile = userData.id === userId;
              console.log('🔍 Profile type check:', {
                targetUserId: userData.id,
                currentUserId: userId,
                isOwnProfile: isOwnProfile
              });

              if (isOwnProfile) {
                // Load own profile with test history
                console.log('👤 Loading own profile with test history');
                [profileResult, historyResult] = await Promise.all([
                  backend.getUserProfile?.(userData.id),
                  testUtils.getUserRealTestHistory?.()
                ]);
                console.log('📊 Own test history loaded:', historyResult?.length || 0, 'tests');
              } else {
                // Load other user's profile with test history
                console.log('👥 Loading other user profile with test history');
                console.log('🔍 Other user ID:', userData.id);

                // Load other user's test history from database
                console.log('📊 Fetching test results for other user...');
                const otherUserHistory = await backend.getUserTestResults?.({
                  user_id: userData.id,
                  test_type: 'iq',
                  limit: 10
                });

                console.log('📊 Raw other user history:', {
                  type: typeof otherUserHistory,
                  success: otherUserHistory?.success,
                  dataLength: otherUserHistory?.data?.length || 0,
                  sample: otherUserHistory?.data?.[0]
                });

                // Convert to expected format
                const rawData = otherUserHistory?.success ? otherUserHistory.data : [];
                const convertedHistory = (Array.isArray(rawData) ? rawData : []).map((test: any) => ({
                  iq: test.score,
                  timestamp: new Date(test.tested_at).getTime(),
                  timeSpent: test.duration_seconds || 0,
                  accuracy: test.accuracy || 0,
                  percentile: Math.round((test.score - 70) * 1.2)
                }));

                console.log('📊 Converted other user history:', {
                  length: convertedHistory.length,
                  sample: convertedHistory[0]
                });

                [profileResult, historyResult] = await Promise.all([
                  backend.getUserProfile?.(userData.id),
                  Promise.resolve(convertedHistory)
                ]);
                console.log('📊 Other user test history loaded:', convertedHistory.length, 'tests');
              }
            } else {
              // Load current user's profile (fallback)
              console.log('👤 Loading current user profile (fallback)');
              [profileResult, historyResult] = await Promise.all([
                backend.getUserProfile?.(userId),
                testUtils.getUserRealTestHistory?.()
              ]);
              console.log('📊 Current user test history loaded:', historyResult?.length || 0, 'tests');
            }

            if (profileResult?.success && profileResult.data) {
              const profile = profileResult.data;
              const user = currentUser?.user;

              profileData = {
                name: profile.full_name || user?.email?.split('@')[0] || 'Người dùng',
                age: profile.age?.toString() || '',
                location: profile.country_name || profile.location || '',
                email: profile.email || user?.email || '',
                totalTests: historyResult?.length || 0,
                averageScore: 0,
                bestScore: 0,
                testHistory: historyResult || [],
                isAuthenticated: true,
                avatarUrl: profile.avatar_url || undefined,
                coverPhotoUrl: profile.cover_photo_url || undefined,
                countryCode: profile.country_code || undefined,
                countryName: profile.country_name || undefined,
                gender: profile.gender || undefined,
                bio: profile.bio || undefined,
                canEdit: initialProfile?.canEdit || false,
                isProfilePublic: profile.is_profile_public ?? true
              };

              // Set canEdit dựa trên isOwnProfile đã tính ở trên
              profileData.canEdit = isOwnProfile;

              console.log('🔍 CanEdit check:', {
                currentUserId: userId,
                profileUserId: targetUserId,
                isOwnProfile: isOwnProfile,
                canEdit: profileData.canEdit
              });

              console.log('💾 Database profile loaded with canEdit:', profileData.canEdit);
              console.log('📊 Final test history check:', {
                historyResultLength: historyResult?.length || 0,
                profileDataTestHistory: profileData.testHistory?.length || 0,
                profileDataTotalTests: profileData.totalTests,
                hasTestHistory: !!profileData.testHistory && profileData.testHistory.length > 0,
                historyResultSample: historyResult?.[0],
                profileDataHistorySample: profileData.testHistory?.[0]
              });
            } else {
              // Fallback to basic auth info if no profile exists
              const user = currentUser?.user;
              const historyResult = await testUtils.getUserRealTestHistory?.() || [];
              profileData = {
                name: user?.email?.split('@')[0] || 'Người dùng',
                age: '',
                location: '',
                email: user?.email || '',
                totalTests: historyResult?.length || 0,
                averageScore: 0,
                bestScore: 0,
                testHistory: historyResult || [],
                isAuthenticated: true,
                canEdit: initialProfile?.canEdit || false
              };

              console.log('📧 Using auth fallback with canEdit:', profileData.canEdit);
            }
          } catch (error) {
            console.error('❌ Database load failed:', error);
          }
        } else {
          // 📱 ANONYMOUS: Use localStorage only
          console.log('📱 Loading from LOCALSTORAGE (anonymous user)');
          try {
            const [freshHistory, freshUserInfo] = await Promise.all([
              testUtils.getUserRealTestHistory?.() || [],
              testUtils.getAnonymousUserInfo?.() || null
            ]);

            profileData = {
              name: freshUserInfo?.name || 'Người dùng',
              age: freshUserInfo?.age || '',
              location: freshUserInfo?.location || '',
              totalTests: freshHistory?.length || 0,
              averageScore: 0,
              bestScore: 0,
              testHistory: freshHistory || [],
              isAuthenticated: false,
              canEdit: initialProfile?.canEdit || false
            };

            console.log('📱 LocalStorage loaded with canEdit:', profileData.canEdit);
          } catch (error) {
            console.warn('⚠️ LocalStorage load failed:', error);
          }
        }

        if (!isMounted) return;
        
        console.log('✅ Profile loaded:', {
          source: isAuth ? 'DATABASE' : 'LOCALSTORAGE',
          authenticated: isAuth,
          name: profileData.name,
          totalTests: profileData.totalTests,
          testHistory: profileData.testHistory?.length || 0,
          canEdit: profileData.canEdit,
          profileUsername: profileUsername
        });
        setUserProfile(profileData);
        setLoadingProgress(100);
        setDataReady(true);

      } catch (error) {
        console.error('💥 Profile loading failed:', error);
        setLoadingProgress(100);
        setDataReady(true);
      }
    };

    // Start loading after smooth delay
    const timer = setTimeout(loadDataSmartly, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [profileUsername]);

  // Optimized helper functions with memoization
  const formatTimeDisplay = useCallback((totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0 && seconds > 0) return `${minutes} phút ${seconds} giây`;
    if (minutes > 0) return `${minutes} phút`;
    return `${seconds} giây`;
  }, []);

  const getTimeAgo = useCallback((date: Date): string => {
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  }, []);



  const HeroSection = () => (
    <div className="relative bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-200/50 dark:border-gray-700/50">
      {/* Cover Photo */}
      <div className="relative h-48 md:h-64 overflow-hidden group">
        {/* Cover Photo Image or Gradient Background */}
        {userProfile.coverPhotoUrl ? (
          <img
            src={userProfile.coverPhotoUrl}
            alt="Cover photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${
            getIQAchievement
              ? `bg-gradient-to-br ${getIQAchievement.gradient}`
              : 'bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700'
          }`} />
        )}

        {/* Cover Photo Loading Overlay */}
        <AnimatePresence>
          {coverPhotoLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-6 h-6 text-blue-500" />
                  </motion.div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Đang cập nhật ảnh bìa...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Special Achievement Effects */}
        {getIQAchievement && getIQAchievement.level === 'genius' && (
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-4 w-4 h-4 bg-white rounded-full animate-ping"></div>
            <div className="absolute top-8 right-12 w-3 h-3 bg-white rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-12 left-8 w-2 h-2 bg-white rounded-full animate-bounce delay-500"></div>
            <div className="absolute bottom-6 right-6 w-3 h-3 bg-white rounded-full animate-ping delay-700"></div>
          </div>
        )}

        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-8 left-8 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-8 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/3 rounded-full blur-2xl"></div>
        </div>

        {/* Geometric Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-12 right-12 w-16 h-16 border border-white/20 rounded-lg rotate-12"></div>
          <div className="absolute bottom-16 left-16 w-12 h-12 bg-white/10 rounded-full"></div>
          <div className="absolute top-20 left-1/3 w-8 h-8 border border-white/15 rotate-45"></div>
        </div>



        {/* Edit Cover Photo Button - Only show if user can edit */}
        {(() => {
          console.log('🎨 Cover Photo Button - canEdit:', userProfile.canEdit);
          return userProfile.canEdit;
        })() && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setShowCoverPhotoUpload(true)}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm hidden sm:inline">Chỉnh sửa ảnh bìa</span>
              <span className="text-sm sm:hidden">Chỉnh sửa</span>
            </button>
          </div>
        )}

        {/* Remove Cover Photo Button - Only show if user can edit */}
        {userProfile.coverPhotoUrl && userProfile.canEdit && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 999 }}>
            <button
              onClick={handleRemoveCoverPhoto}
              className="bg-red-500/90 hover:bg-red-600 text-white p-3 rounded-lg shadow-lg"
              title="Xóa ảnh bìa"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }}>
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        )}

        {/* Quick Camera Icon - Mobile friendly, only show if user can edit */}
        {userProfile.canEdit && (
          <div className="absolute top-4 left-4 sm:hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => setShowCoverPhotoUpload(true)}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 p-2.5 rounded-full shadow-lg"
              title="Chỉnh sửa ảnh bìa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* Cover Photo Info (Bottom Left) - Always visible */}
        
      </div>

      {/* Profile Content */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4 z-20">
          <div className="relative inline-block">
            {/* Avatar with Achievement Border */}
            <div
              className={`relative w-32 h-32 rounded-full shadow-xl border-4 ${
                getIQAchievement ? `border-gradient-to-r ${getIQAchievement.borderGradient}` : 'border-white dark:border-gray-800'
              } ${userProfile.avatarUrl && !avatarLoading ? 'cursor-pointer hover:scale-105' : ''}`}
              onClick={userProfile.avatarUrl && !avatarLoading ? handleAvatarClick : undefined}
              title={userProfile.avatarUrl && !avatarLoading ? 'Click để xem ảnh đại diện' : undefined}
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className={`w-full h-full ${generateAvatar(userProfile.name)} flex items-center justify-center text-white text-3xl font-bold rounded-full`}>
                  {getInitials(userProfile.name)}
                </div>
              )}

              {/* Avatar Loading Overlay */}
              <AnimatePresence>
                {avatarLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center z-10"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-8 h-8 text-blue-500" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>





            {/* Edit Avatar Button - Only show if user can edit */}
            {(() => {
              console.log('👤 Avatar Button - canEdit:', userProfile.canEdit);
              return userProfile.canEdit;
            })() && (
              <button
                onClick={() => setShowAvatarUpload(true)}
                className="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-full shadow-lg hover:scale-110"
                title="Cập nhật ảnh đại diện"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {userProfile.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                @{profileUsername || userProfile.name.toLowerCase().replace(/\s+/g, '')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {(() => {
                console.log('✏️ Edit Profile Button - canEdit:', userProfile.canEdit);
                return userProfile.canEdit;
              })() && (
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  title="Chỉnh sửa thông tin"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleShareProfile}
                className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg"
                title="Chia sẻ profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* IQ Achievement Highlight */}
          {getIQAchievement && (
            <div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${getIQAchievement.bgGradient} border border-white/20 dark:border-gray-700/20 shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getIQAchievement.gradient} flex items-center justify-center shadow-lg ${getIQAchievement.glowColor}`}>
                  <span className="text-white text-xl">{getIQAchievement.icon}</span>
                </div>
                <div className="flex-1">
                  <div className={`font-bold ${getIQAchievement.textColor} text-lg`}>
                    {getIQAchievement.title}
                  </div>
                  <div className={`text-sm ${getIQAchievement.textColor} opacity-80`}>
                    {getIQAchievement.description}
                  </div>
                </div>
                <div className={`text-right`}>
                  <div className={`text-2xl font-bold ${getIQAchievement.textColor}`}>
                    {profileStats.best}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    IQ Score
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bio/Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {userProfile.bio || 'Đam mê thử thách trí tuệ và phát triển bản thân. Luôn tìm kiếm những bài test IQ thú vị để nâng cao khả năng tư duy.'}
          </p>

          {/* User Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            {userProfile.age && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {userProfile.age} tuổi
              </div>
            )}

            {userProfile.gender && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {userProfile.gender === 'male' ? 'Nam' : userProfile.gender === 'female' ? 'Nữ' : userProfile.gender}
              </div>
            )}

            {(userProfile.countryName || userProfile.location) && (
              <div className="flex items-center gap-1">
                {userProfile.countryCode ? (
                  <img
                    src={`https://country-code-au6g.vercel.app/${userProfile.countryCode.toUpperCase()}.svg`}
                    alt={userProfile.countryName || userProfile.location}
                    className="w-4 h-3 object-cover rounded-sm"
                    onError={(e) => {
                      // Fallback to location icon if flag fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <svg className={`w-4 h-4 ${userProfile.countryCode ? 'hidden' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {userProfile.countryName || userProfile.location}
              </div>
            )}

            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Tham gia {profileStats.joinDate}
            </div>
          </div>

          {/* Stats - Enhanced Design */}
          <div>
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">Thống kê thành tích</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl"></div>
                <div className="relative text-center p-5 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-blue-200/50 dark:border-blue-700/30 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-105">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-2">
                    {userProfile.totalTests || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Bài test</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl"></div>
                <div className="relative text-center p-5 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-green-200/50 dark:border-green-700/30 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-105">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">
                    {profileStats.average || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Điểm TB</div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl"></div>
                <div className="relative text-center p-5 bg-white/70 dark:bg-gray-800/70 rounded-2xl border border-purple-200/50 dark:border-purple-700/30 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-105">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-2">
                    {profileStats.best || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tốt nhất</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AnonymousUserWarning = () => (
    isAuthenticated === false && (
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">⚠️ Tài khoản tạm thời</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              Dữ liệu profile và kết quả test của bạn chỉ được lưu trên thiết bị này.
              Khi xóa dữ liệu trình duyệt, mọi thông tin sẽ bị mất vĩnh viễn.
            </p>
            <button
              onClick={handleOpenRegisterPopup}
              className="px-4 py-2 bg-amber-600 dark:bg-amber-700 text-white rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 text-sm font-medium"
            >
              🔐 Đăng ký tài khoản để lưu dữ liệu
            </button>
          </div>
        </div>
      </div>
    )
  );



  // 🚀 MEMOIZED COMPONENT - Chỉ re-render khi testHistory thay đổi
  const RecentTestsOverview = useMemo(() => {
    const getScoreGradient = (score: number) => {
      if (score >= 140) return 'from-purple-500 via-pink-500 to-red-500';
      if (score >= 130) return 'from-blue-500 via-purple-500 to-pink-500';
      if (score >= 120) return 'from-cyan-500 via-blue-500 to-purple-500';
      if (score >= 110) return 'from-green-500 via-cyan-500 to-blue-500';
      if (score >= 100) return 'from-yellow-500 via-green-500 to-cyan-500';
      return 'from-gray-400 via-gray-500 to-gray-600';
    };

    const getScoreLevel = (score: number) => {
      if (score >= 140) return { label: 'Thiên tài', icon: '🧠', color: 'text-purple-600' };
      if (score >= 130) return { label: 'Xuất sắc', icon: '⭐', color: 'text-blue-600' };
      if (score >= 120) return { label: 'Cao', icon: '🚀', color: 'text-cyan-600' };
      if (score >= 110) return { label: 'Khá', icon: '💪', color: 'text-green-600' };
      if (score >= 100) return { label: 'Trung bình', icon: '👍', color: 'text-yellow-600' };
      return { label: 'Cần cải thiện', icon: '📈', color: 'text-gray-600' };
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
        {/* Header - Modern Minimalist Design */}
        <div className="mb-6 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Icon với background màu xanh lá cho recent tests */}
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4" />
                  <rect x="9" y="7" width="6" height="6" />
                  <path d="M12 1v6" />
                </svg>
              </div>

              {/* Tiêu đề và mô tả */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Bài test gần nhất
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {userProfile.totalTests || 0} bài test đã hoàn thành
                </p>
              </div>
            </div>

            {/* Action button */}
            {(userProfile.totalTests || 0) > 0 && userProfile.canEdit && (
              <a
                href="/test-history"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                title="Xem tất cả lịch sử test"
              >
                <span>Xem tất cả</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <ContentLoader
          isLoading={!dataReady && (!memoizedTestList || memoizedTestList.length === 0)}
          skeleton={<SkeletonTestList />}
        >
          {memoizedTestList.length > 0 ? (
            <div className="space-y-4">
              {memoizedTestList.slice(0, 10).map((test, index) => {
                const date = test.timestamp ? new Date(test.timestamp) : new Date();
                const timeAgo = getTimeAgo(date);
                const scoreLevel = getScoreLevel(test.iq);
                const testNumber = memoizedTestList.length - index;

                return (
                  <div
                    key={`${test.timestamp || index}-${test.iq}`}
                    className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        {/* Left side - Score & Basic Info */}
                        <div className="flex items-center gap-4">
                          {/* Score Circle - Compact */}
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getScoreGradient(test.iq)} p-0.5`}>
                              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {test.iq}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Test Info - Compact */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                Test #{testNumber}
                              </h4>
                              <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${scoreLevel.color}`}>
                                <span className="mr-1">{scoreLevel.icon}</span>
                                {scoreLevel.label}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {date.toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </span>
                              <span>•</span>
                              <span>{timeAgo}</span>
                              {test.totalTime && (
                                <>
                                  <span>•</span>
                                  <span>{formatTimeDisplay(test.totalTime)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Performance & Action */}
                        <div className="flex items-center gap-3">
                          {/* Performance indicator - Compact */}
                          {index > 0 && userProfile.testHistory && userProfile.testHistory[index - 1] && (
                            <div className={`flex items-center text-xs px-2 py-1 rounded-md ${
                              test.iq > userProfile.testHistory[index - 1].iq
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : test.iq < userProfile.testHistory[index - 1].iq
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {test.iq > userProfile.testHistory[index - 1].iq ? '↗' :
                               test.iq < userProfile.testHistory[index - 1].iq ? '↘' : '→'}
                              <span className="ml-1">
                                {test.iq > userProfile.testHistory[index - 1].iq ? '+' : ''}
                                {test.iq - userProfile.testHistory[index - 1].iq}
                              </span>
                            </div>
                          )}

                          {/* View Details Button */}
                          <a
                            href={`/result?score=${test.iq}&percentile=${test.percentile || 50}&time=${test.totalTime || 1800}&correct=${test.correctAnswers || Math.round(test.iq / 10)}&accuracy=${test.accuracy || 75}&name=${encodeURIComponent(userProfile.name)}&age=${userProfile.age}&location=${encodeURIComponent(userProfile.location || '')}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <span>Xem chi tiết</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="text-8xl mb-4">🧠</div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Bắt đầu hành trình IQ của bạn
              </h4>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                Khám phá tiềm năng trí tuệ của bạn với bài test IQ chuyên nghiệp đầu tiên
              </p>
              <button
                onClick={() => window.location.href = '/test/iq'}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <span className="flex items-center">
                  <span className="mr-2">🚀</span>
                  Bắt đầu test ngay
                </span>
              </button>
            </div>
          )}
        </ContentLoader>
      </div>
    );
  }, [memoizedTestList, dataReady, getTimeAgo]);





  const renderContent = () => {
    if (!dataReady) {
      return (
        <>
          <SkeletonTestList />
        </>
      );
    }

    // Direct content rendering without tabs
    return (
      <>
        {RecentTestsOverview}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-8">
      {/* Loading indicator for background updates */}
      {loadingProgress < 100 && <ProgressiveLoader progress={loadingProgress} />}

      <div className="max-w-4xl mx-auto px-4">
        <div className="space-y-6">
          <ContentLoader
            isLoading={!dataReady}
            skeleton={<SkeletonProfile />}
          >
            <HeroSection />
          </ContentLoader>

          {isAuthenticated === false && <AnonymousUserWarning />}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>

      {/* Login/Register Popup */}
      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode="register"
        prefilledEmail={prefilledEmail}
      />

      {/* Avatar Upload Modal - Only show if user can edit */}
      {showAvatarUpload && userProfile.canEdit && (
        <AvatarUpload
          currentAvatar={userProfile.avatarUrl}
          onAvatarUpdate={handleAvatarUpdate}
          onClose={handleAvatarUploadClose}
          onStartLoading={handleStartAvatarLoading}
        />
      )}

      {/* Avatar Viewer Modal */}
      <AnimatePresence>
        {showAvatarViewer && userProfile.avatarUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAvatarViewer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAvatarViewer(false)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={userProfile.avatarUrl}
                alt={`Ảnh đại diện của ${userProfile.name}`}
                className="max-w-full max-h-full rounded-lg object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal - Only show if user can edit */}
      {showEditProfile && userProfile.canEdit && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleEditProfileSuccess}
          currentProfile={userProfile}
        />
      )}

      {/* Cover Photo Upload Modal - Only show if user can edit */}
      {showCoverPhotoUpload && userProfile.canEdit && (
        <CoverPhotoUpload
          currentCoverPhoto={userProfile.coverPhotoUrl || undefined}
          onCoverPhotoUpdate={handleCoverPhotoUpdate}
          onClose={handleCoverPhotoUploadClose}
          onStartLoading={handleStartCoverPhotoLoading}
        />
      )}
    </div>
  );
};

export default ProfileComponent; 