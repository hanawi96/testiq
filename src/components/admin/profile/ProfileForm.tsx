import React, { useState, useEffect } from 'react';

interface AdminProfileData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at?: string;
  avatar_url?: string;
  bio?: string;
}

interface ProfileFormProps {
  profile: AdminProfileData;
  isLoading: boolean;
  hasChanges: boolean;
  onFormChange: (changes: Partial<AdminProfileData>) => void;
  onSave: (changes: Partial<AdminProfileData>) => void;
  onReset: () => void;
}

interface FormData {
  full_name: string;
  email: string;
  bio: string;
}

interface FormErrors {
  full_name?: string;
  email?: string;
  bio?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  isLoading,
  hasChanges,
  onFormChange,
  onSave,
  onReset
}) => {
  const [formData, setFormData] = useState<FormData>({
    full_name: profile.full_name || '',
    email: profile.email || '',
    bio: profile.bio || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when hasChanges becomes false (external reset)
  useEffect(() => {
    if (!hasChanges) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        bio: profile.bio || ''
      });
      setErrors({});
      setTouched({});
    }
  }, [hasChanges, profile]);

  // Validation rules
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          return 'Tên đầy đủ là bắt buộc';
        }
        if (value.trim().length < 2) {
          return 'Tên đầy đủ phải có ít nhất 2 ký tự';
        }
        if (value.trim().length > 100) {
          return 'Tên đầy đủ không được vượt quá 100 ký tự';
        }
        return undefined;

      case 'email':
        if (!value.trim()) {
          return 'Email là bắt buộc';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          return 'Email không hợp lệ';
        }
        return undefined;

      case 'bio':
        if (value.trim().length > 500) {
          return 'Bio không được vượt quá 500 ký tự';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));

    // Check for changes and notify parent
    const changes: Partial<AdminProfileData> = {};
    Object.keys(newFormData).forEach(key => {
      const currentValue = newFormData[key as keyof FormData];
      const originalValue = profile[key as keyof AdminProfileData];

      // Normalize values for comparison (treat undefined/null as empty string)
      const normalizedCurrent = currentValue || '';
      const normalizedOriginal = originalValue || '';

      if (normalizedCurrent !== normalizedOriginal) {
        changes[key as keyof AdminProfileData] = currentValue as any;
      }
    });

    onFormChange(changes);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    setTouched({ full_name: true, email: true });

    // If no errors, prepare changes and save
    if (Object.keys(newErrors).length === 0) {
      const changes: Partial<AdminProfileData> = {};
      Object.keys(formData).forEach(key => {
        const currentValue = formData[key as keyof FormData];
        const originalValue = profile[key as keyof AdminProfileData] || '';
        if (currentValue !== originalValue) {
          changes[key as keyof AdminProfileData] = currentValue as any;
        }
      });

      if (Object.keys(changes).length > 0) {
        onSave(changes);
      }
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      full_name: profile.full_name || '',
      email: profile.email || ''
    });
    setErrors({});
    setTouched({});
    onReset();
  };

  // Check if form is valid
  const isFormValid = !errors.full_name && !errors.email && !errors.bio &&
                     formData.full_name.trim() &&
                     formData.email.trim();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      
      {/* Form Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chỉnh sửa hồ sơ
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Cập nhật thông tin cá nhân của bạn
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* Full Name Field */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên đầy đủ *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              errors.full_name && touched.full_name
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Nhập tên đầy đủ của bạn"
            disabled={isLoading}
          />
          {errors.full_name && touched.full_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.full_name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              errors.email && touched.email
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Nhập địa chỉ email của bạn"
            disabled={isLoading}
          />
          {errors.email && touched.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        {/* Bio Field */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Giới thiệu bản thân
          </label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 resize-vertical ${
              errors.bio && touched.bio
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Viết một vài dòng giới thiệu về bản thân..."
            disabled={isLoading}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.bio && touched.bio && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.bio}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              {formData.bio.length}/500 ký tự
            </p>
          </div>
        </div>

        {/* Role Field (Read-only) */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vai trò
          </label>
          <input
            type="text"
            id="role"
            value={profile.role === 'admin' ? 'Quản trị viên' : profile.role}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            disabled
            readOnly
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vai trò không thể thay đổi
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0 sm:space-x-3">
          
          {/* Left side - Status */}
          <div className="flex items-center text-sm">
            {hasChanges && (
              <div className="flex items-center text-amber-600 dark:text-amber-400">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Có thay đổi chưa lưu
              </div>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Đặt lại
            </button>
            
            <button
              type="submit"
              disabled={!hasChanges || !isFormValid || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
