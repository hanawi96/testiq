import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateUserForm {
  email: string;
  fullName: string;
  password: string;
  role: 'user' | 'admin' | 'editor' | 'author' | 'reviewer';
  isVerified: boolean;
}

interface CreateUserFormErrors {
  email?: string;
  fullName?: string;
  password?: string;
  role?: string;
  isVerified?: string;
}

const ROLES = [
  { value: 'user', label: 'User', description: 'Người dùng thông thường', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  { value: 'admin', label: 'Admin', description: 'Toàn quyền quản lý hệ thống', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  { value: 'editor', label: 'Editor', description: 'Quản lý nội dung, bài viết, danh mục', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  { value: 'author', label: 'Author', description: 'Tạo và chỉnh sửa bài viết của mình', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  { value: 'reviewer', label: 'Reviewer', description: 'Xem xét và phê duyệt nội dung', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' }
] as const;

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    fullName: '',
    password: '',
    role: 'user',
    isVerified: false
  });
  const [errors, setErrors] = useState<CreateUserFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        email: '',
        fullName: '',
        password: '',
        role: 'user',
        isVerified: false
      });
      setErrors({});
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Auto-focus email field when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const emailInput = document.getElementById('create-user-email');
        if (emailInput) {
          emailInput.focus();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: CreateUserFormErrors = {};

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Full name validation
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (form.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    // Role validation
    if (!form.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmCreate = async () => {
    setIsLoading(true);
    try {
      // Import UsersService dynamically to avoid SSR issues
      const { UsersService } = await import('../../../../backend');
      
      const { success, error } = await UsersService.createUser({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
        role: form.role,
        isVerified: form.isVerified
      });

      if (success) {
        onSuccess();
        onClose();
      } else {
        setErrors({ email: error?.message || 'Có lỗi xảy ra khi tạo người dùng' });
        setShowConfirmation(false);
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setErrors({ email: 'Có lỗi xảy ra khi tạo người dùng' });
      setShowConfirmation(false);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRole = ROLES.find(role => role.value === form.role);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0"
            onClick={onClose}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15 }}
              className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 relative z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {!showConfirmation ? (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Thêm người dùng mới
                    </h3>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label htmlFor="create-user-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="create-user-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                          errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="user@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                      )}
                    </div>

                    {/* Full Name */}
                    <div>
                      <label htmlFor="create-user-fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Họ tên đầy đủ <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="create-user-fullname"
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                          errors.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Nguyễn Văn A"
                      />
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="create-user-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mật khẩu tạm thời <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="create-user-password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                          errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="Tối thiểu 8 ký tự"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label htmlFor="create-user-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vai trò <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="create-user-role"
                        value={form.role}
                        onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label} - {role.description}
                          </option>
                        ))}
                      </select>
                      {selectedRole && (
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedRole.color}`}>
                            {selectedRole.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Verification */}
                    <div className="flex items-center">
                      <input
                        id="create-user-verified"
                        type="checkbox"
                        checked={form.isVerified}
                        onChange={(e) => setForm(prev => ({ ...prev, isVerified: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                      />
                      <label htmlFor="create-user-verified" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Xác thực ngay lập tức
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                      >
                        Tạo người dùng
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  {/* Confirmation Dialog */}
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                      <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Xác nhận tạo người dùng
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                      <p><strong>Email:</strong> {form.email}</p>
                      <p><strong>Họ tên:</strong> {form.fullName}</p>
                      <p><strong>Vai trò:</strong> {selectedRole?.label}</p>
                      <p><strong>Trạng thái:</strong> {form.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</p>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => setShowConfirmation(false)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={handleConfirmCreate}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {isLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        <span>{isLoading ? 'Đang tạo...' : 'Xác nhận tạo'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
