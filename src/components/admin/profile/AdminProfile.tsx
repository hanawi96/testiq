import React, { useState, useEffect } from 'react';
import { AuthService } from '@/backend';
import type { UserProfile } from '@/backend';
import ProfileHeader from './ProfileHeader';
import ProfileForm from './ProfileForm';
import SocialLinksBox from './SocialLinksBox';
import LoadingSpinner from '../common/LoadingSpinner';
import AdminProfileService from './AdminProfileService';
import type { AdminProfileData } from './AdminProfileService';



interface ProfileState {
  data: AdminProfileData | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  hasChanges: boolean;
}

const AdminProfile: React.FC = () => {
  const [profileState, setProfileState] = useState<ProfileState>({
    data: null,
    isLoading: true,
    error: null,
    isSaving: false,
    hasChanges: false
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Partial<AdminProfileData> | null>(null);

  // Fetch admin profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('AdminProfile: Fetching current admin profile...');

        // Use AdminProfileService to get profile
        const { data: profileData, error } = await AdminProfileService.getCurrentAdminProfile();

        if (error || !profileData) {
          throw new Error(error?.message || 'Không thể lấy thông tin hồ sơ admin');
        }

        // Set profile data
        setProfileState({
          data: profileData,
          isLoading: false,
          error: null,
          isSaving: false,
          hasChanges: false
        });

        console.log('AdminProfile: Profile loaded successfully');

      } catch (error) {
        console.error('AdminProfile: Error fetching profile:', error);
        setProfileState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải hồ sơ'
        }));
      }
    };

    fetchProfile();
  }, []);

  // Handle form changes
  const handleFormChange = (changes: Partial<AdminProfileData>) => {
    if (!profileState.data) return;

    const hasActualChanges = Object.keys(changes).some(key => {
      const currentValue = profileState.data![key as keyof AdminProfileData];
      const newValue = changes[key as keyof AdminProfileData];
      return currentValue !== newValue;
    });

    setProfileState(prev => ({
      ...prev,
      hasChanges: hasActualChanges
    }));
  };

  // Handle save with confirmation
  const handleSave = (changes: Partial<AdminProfileData>) => {
    setPendingChanges(changes);
    setShowConfirmDialog(true);
  };

  // Confirm and execute save
  const confirmSave = async () => {
    if (!profileState.data || !pendingChanges) return;

    setShowConfirmDialog(false);
    setProfileState(prev => ({ ...prev, isSaving: true }));

    try {
      console.log('AdminProfile: Saving profile changes...');

      // Update profile using AdminProfileService
      const { success, data: updatedData, error } = await AdminProfileService.updateAdminProfile(
        profileState.data.id,
        pendingChanges
      );

      if (!success || error) {
        throw new Error(error?.message || 'Không thể cập nhật hồ sơ');
      }

      // Update local state with actual returned data
      setProfileState(prev => ({
        ...prev,
        data: updatedData || prev.data,
        isSaving: false,
        hasChanges: false
      }));

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      console.log('AdminProfile: Profile updated successfully');

    } catch (error) {
      console.error('AdminProfile: Error saving profile:', error);
      setProfileState(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu hồ sơ'
      }));
    } finally {
      setPendingChanges(null);
    }
  };

  // Cancel save
  const cancelSave = () => {
    setShowConfirmDialog(false);
    setPendingChanges(null);
  };

  // Reset form
  const handleReset = () => {
    setProfileState(prev => ({ ...prev, hasChanges: false }));
    // Form will reset itself based on hasChanges prop
  };

  if (profileState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (profileState.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-red-800 dark:text-red-200 font-medium">Lỗi tải hồ sơ</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mt-2">{profileState.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!profileState.data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Không tìm thấy thông tin hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 dark:text-green-200 font-medium">Hồ sơ đã được cập nhật thành công!</p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <ProfileHeader profile={profileState.data} />

      {/* Profile Form */}
      <ProfileForm
        profile={profileState.data}
        isLoading={profileState.isSaving}
        hasChanges={profileState.hasChanges}
        onFormChange={handleFormChange}
        onSave={handleSave}
        onReset={handleReset}
      />

      {/* Social Links Box */}
      <SocialLinksBox
        profile={profileState.data}
        isLoading={profileState.isSaving}
        onSave={handleSave}
      />

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Xác nhận thay đổi
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Bạn có chắc chắn muốn lưu những thay đổi này vào hồ sơ của mình?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmSave}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xác nhận
              </button>
              <button
                onClick={cancelSave}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default AdminProfile;
