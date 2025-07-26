import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserWithProfile } from '../../../../../../backend';
import UnifiedCountrySelector, { type Country } from '../../../../common/UnifiedCountrySelector';
import { getInstantCountryData, preloadTriggers } from '../../../../../utils/admin/preloaders/country-preloader';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOptimisticUpdate?: (updatedUser: Partial<UserWithProfile>) => void;
  user: UserWithProfile | null;
}

interface EditUserForm {
  username: string;
  fullName: string;
  age: number | '';
  gender: 'male' | 'female' | 'other' | '';
  country: Country | null;
  role: 'user' | 'admin' | 'editor' | 'author' | 'reviewer';
}

interface EditUserFormErrors {
  username?: string;
  fullName?: string;
  age?: string;
  gender?: string;
  country?: string;
  role?: string;
}

const ROLES = [
  { value: 'user', label: 'User', description: 'Người dùng thông thường', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  { value: 'admin', label: 'Admin', description: 'Toàn quyền quản lý hệ thống', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  { value: 'editor', label: 'Editor', description: 'Quản lý nội dung, bài viết, danh mục', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  { value: 'author', label: 'Author', description: 'Tạo và chỉnh sửa bài viết của mình', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  { value: 'reviewer', label: 'Reviewer', description: 'Xem xét và phê duyệt nội dung', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' }
] as const;

const GENDERS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
] as const;

export default function EditUserModal({ isOpen, onClose, onSuccess, onOptimisticUpdate, user }: EditUserModalProps) {
  const [form, setForm] = useState<EditUserForm>({
    username: '',
    fullName: '',
    age: '',
    gender: '',
    country: null,
    role: 'user'
  });
  const [errors, setErrors] = useState<EditUserFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Smart country resolver - find country with proper code and flag
  const resolveUserCountry = (countryName: string | null): Country | null => {
    if (!countryName) return null;

    const countries = getInstantCountryData();
    const searchName = countryName.toLowerCase().trim();

    // Exact match first
    let found = countries.find(c =>
      c.name.toLowerCase() === searchName ||
      c.code.toLowerCase() === searchName
    );

    if (found) return found;

    // Partial match
    found = countries.find(c =>
      c.name.toLowerCase().includes(searchName) ||
      searchName.includes(c.name.toLowerCase())
    );

    // Fallback with basic info
    return found || {
      id: countryName,
      name: countryName,
      code: '',
      flag: '/flag/VN.svg' // Default flag
    };
  };

  // Pre-fill form when user data changes
  useEffect(() => {
    if (isOpen && user) {
      // Trigger additional preload when modal opens
      preloadTriggers.onUserInteraction();

      setForm({
        username: user.username || '',
        fullName: user.full_name || '',
        age: user.age || '',
        gender: (user.gender as 'male' | 'female' | 'other') || '',
        country: resolveUserCountry(user.country_name || null),
        role: (user.role as 'user' | 'admin' | 'editor' | 'author' | 'reviewer')
      });
      setErrors({});
    }
  }, [isOpen, user]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof EditUserFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: EditUserFormErrors = {};

    if (!form.username.trim()) {
      newErrors.username = 'Username là bắt buộc';
    } else if (form.username.trim().length < 3) {
      newErrors.username = 'Username phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(form.username.trim())) {
      newErrors.username = 'Username chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang';
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Tên là bắt buộc';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Tên phải có ít nhất 2 ký tự';
    }

    if (form.age !== '' && (Number(form.age) < 1 || Number(form.age) > 120)) {
      newErrors.age = 'Tuổi phải từ 1 đến 120';
    }

    if (!form.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    setIsLoading(true);

    try {
      // Import UsersService dynamically to avoid SSR issues
      const { UsersService } = await import('../../../../../../backend');

      // Prepare update data
      const updateData = {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        age: form.age === '' ? undefined : Number(form.age),
        gender: form.gender || undefined,
        country_name: form.country?.name || undefined,
        role: form.role
      };

      console.log('Updating user:', user.id, updateData);

      const { success, error } = await UsersService.updateUser(user.id, updateData);

      if (success) {
        console.log('EditUserModal: Success, updated user:', user.id);

        // Success - optimistic update for immediate UI feedback
        if (onOptimisticUpdate) {
          const countryName = form.country?.name || undefined;
          const optimisticData = {
            username: form.username.trim(),
            full_name: form.fullName.trim(),
            age: form.age === '' ? undefined : Number(form.age),
            gender: form.gender || undefined,
            country_name: countryName,
            country: countryName, // Cập nhật cả country field
            role: form.role,
            updated_at: new Date().toISOString()
          };
          console.log('EditUserModal: Applying optimistic update:', optimisticData);
          onOptimisticUpdate(optimisticData);
        }

        // Close modal immediately for better UX
        onClose();

        // Then refresh data in background to ensure consistency
        onSuccess();
      } else {
        // Set error for specific field or general error
        if (error?.message?.includes('role')) {
          setErrors({ role: error.message || 'Không thể cập nhật vai trò' });
        } else if (error?.message?.includes('name')) {
          setErrors({ fullName: error.message || 'Không thể cập nhật tên' });
        } else {
          setErrors({ fullName: error?.message || 'Có lỗi xảy ra khi cập nhật thông tin người dùng' });
        }
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      setErrors({ fullName: error?.message || 'Có lỗi xảy ra khi cập nhật thông tin người dùng' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={handleClose}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 relative">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={handleClose}
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Chỉnh sửa thông tin người dùng
          </h3>
          
          {/* User email info */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Email</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{user.email}</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={form.username}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 ${
                  errors.username ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nhập username (chỉ chữ cái, số, _, -)"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 ${
                  errors.fullName ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Nhập tên đầy đủ"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
              )}
            </div>

            {/* Age and Gender Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Age */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tuổi
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  min="1"
                  max="120"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 ${
                    errors.age ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Tuổi"
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Giới tính
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                >
                  <option value="">Chọn giới tính</option>
                  {GENDERS.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quốc gia
              </label>
              <div className="relative">
                <UnifiedCountrySelector
                  value={form.country?.name || ''}
                  onChange={(country) => setForm(prev => ({ ...prev, country }))}
                  placeholder="Chọn quốc gia"
                  disabled={isLoading}
                  variant="popup"
                  showFlag={true}
                  showCode={false}
                />
              </div>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.country}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 ${
                  errors.role ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 transition-colors flex items-center space-x-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                <span>{isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
