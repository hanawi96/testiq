import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import UnifiedCountrySelector from '../common/UnifiedCountrySelector';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProfile: any) => void;
  currentProfile: {
    name: string;
    age: string;
    location: string;
    email?: string;
    bio?: string;
    gender?: string;
    countryCode?: string;
    countryName?: string;
    isProfilePublic?: boolean;
  };
}

interface EditProfileForm {
  fullName: string;
  age: number | '';
  gender: 'male' | 'female' | 'other' | '';
  location: string;
  countryCode: string;
  bio: string;
  isProfilePublic: boolean;
}

interface FormErrors {
  fullName?: string;
  age?: string;
  bio?: string;
}

const GENDERS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
] as const;

export default function EditProfileModal({ isOpen, onClose, onSuccess, currentProfile }: EditProfileModalProps) {
  const [form, setForm] = useState<EditProfileForm>(() => ({
    fullName: currentProfile?.name || '',
    age: currentProfile?.age ? parseInt(currentProfile.age) : '',
    gender: (currentProfile?.gender as any) || '',
    location: currentProfile?.location || '',
    countryCode: currentProfile?.countryCode || '',
    bio: currentProfile?.bio || '',
    isProfilePublic: currentProfile?.isProfilePublic ?? true
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen && currentProfile) {
      setForm({
        fullName: currentProfile.name || '',
        age: currentProfile.age ? parseInt(currentProfile.age) : '',
        gender: (currentProfile.gender as any) || '',
        location: currentProfile.location || '',
        countryCode: currentProfile.countryCode || '',
        bio: currentProfile.bio || '',
        isProfilePublic: currentProfile.isProfilePublic ?? true
      });
      setErrors({});
    }
  }, [isOpen, currentProfile]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Tên là bắt buộc';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Tên phải có ít nhất 2 ký tự';
    }

    if (form.age !== '' && (Number(form.age) < 1 || Number(form.age) > 120)) {
      newErrors.age = 'Tuổi phải từ 1 đến 120';
    }

    if (form.bio.length > 500) {
      newErrors.bio = 'Tiểu sử không được quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Import services
      const { AuthService } = await import('@/backend');
      const { updateUserProfile } = await import('@/backend/utils/user-profile-service');

      // Get current user
      const { user } = await AuthService.getCurrentUser();
      if (!user) {
        throw new Error('Không thể xác thực người dùng');
      }

      // Update profile
      const profileData = {
        full_name: form.fullName.trim(),
        age: form.age === '' ? undefined : Number(form.age),
        gender: form.gender || undefined,
        country_name: form.location.trim() || undefined,
        country_code: form.countryCode || undefined,
        bio: form.bio.trim() || undefined,
        is_profile_public: form.isProfilePublic
      };

      const { success, error } = await updateUserProfile(user.id, profileData);

      if (!success) {
        throw new Error(error?.message || 'Cập nhật thất bại');
      }

      // Success - call onSuccess with updated data
      onSuccess({
        name: form.fullName.trim(),
        age: form.age === '' ? '' : form.age.toString(),
        location: form.location.trim(),
        countryCode: form.countryCode,
        bio: form.bio.trim(),
        gender: form.gender,
        isProfilePublic: form.isProfilePublic
      });

      onClose();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            {/* Header with gradient background */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-6">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      <span className="mr-3 text-3xl">✨</span>
                      Chỉnh sửa thông tin
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Cập nhật thông tin cá nhân của bạn
                    </p>
                  </div>

                  {/* Close button */}
                  <button
                    className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-20 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute bottom-4 left-20 w-12 h-12 bg-white/5 rounded-full blur-lg"></div>
            </div>

            {/* Content */}
            <div className="p-8">

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name & Age Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="mr-2">👤</span>
                      Họ và tên *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleInputChange}
                        className={`w-full h-[52px] px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                          errors.fullName ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        placeholder="Nhập họ và tên của bạn"
                        disabled={isLoading}
                      />
                      {errors.fullName && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-red-500">⚠️</span>
                        </div>
                      )}
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <span className="mr-1">❌</span>
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Age */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="mr-2">🎂</span>
                      Tuổi
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleInputChange}
                        className={`w-full h-[52px] px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-all duration-200 ${
                          errors.age ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        placeholder="Nhập tuổi"
                        min="1"
                        max="120"
                        disabled={isLoading}
                      />
                      {errors.age && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <span className="text-red-500">⚠️</span>
                        </div>
                      )}
                    </div>
                    {errors.age && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <span className="mr-1">❌</span>
                        {errors.age}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gender & Country Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gender */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="mr-2">⚧️</span>
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleInputChange}
                      className="w-full h-[52px] px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:text-white hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <option value="">Chọn giới tính</option>
                      {GENDERS.map(gender => (
                        <option key={gender.value} value={gender.value}>
                          {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Country */}
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <span className="mr-2">🌍</span>
                      Quốc gia
                    </label>
                    <UnifiedCountrySelector
                      value={form.location}
                      onChange={(country, countryName, countryCode) => {
                        setForm(prev => ({
                          ...prev,
                          location: countryName || '',
                          countryCode: countryCode || ''
                        }));
                      }}
                      disabled={isLoading}
                      placeholder="Chọn quốc gia của bạn"
                      variant="admin"
                      showFlag={true}
                    />
                  </div>
                </div>



                {/* Bio */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <span className="mr-2">📝</span>
                    Tiểu sử
                  </label>
                  <div className="relative">
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white resize-none transition-all duration-200 ${
                        errors.bio ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                      placeholder="Viết vài dòng về bản thân, sở thích, công việc..."
                      maxLength={500}
                      disabled={isLoading}
                    />
                    {errors.bio && (
                      <div className="absolute top-3 right-3">
                        <span className="text-red-500">⚠️</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    {errors.bio && (
                      <p className="text-red-500 text-sm flex items-center">
                        <span className="mr-1">❌</span>
                        {errors.bio}
                      </p>
                    )}
                    <p className={`text-sm ml-auto transition-colors ${
                      form.bio.length > 450 ? 'text-orange-500' :
                      form.bio.length > 400 ? 'text-yellow-500' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {form.bio.length}/500
                    </p>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Profile công khai</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {form.isProfilePublic ? 'Mọi người có thể xem' : 'Chỉ bạn mới xem được'}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="isProfilePublic"
                      checked={form.isProfilePublic}
                      onChange={(e) => setForm(prev => ({ ...prev, isProfilePublic: e.target.checked }))}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="isProfilePublic"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                        form.isProfilePublic
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          form.isProfilePublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-8">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
