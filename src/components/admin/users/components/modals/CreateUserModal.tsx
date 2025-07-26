import React, { useState, useEffect } from 'react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

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
      setShowPassword(false);
      setIsCheckingEmail(false);
    }
  }, [isOpen]);

  // Debounced email check
  useEffect(() => {
    if (!form.email.trim() || !isOpen) return;

    // Basic email format check first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrors(prev => ({ ...prev, email: undefined }));
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const { UsersService } = await import('../../../../../../backend');
        const { exists, error } = await UsersService.checkEmailExists(form.email.trim());

        if (error) {
          setErrors(prev => ({ ...prev, email: 'Không thể kiểm tra email' }));
        } else if (exists) {
          setErrors(prev => ({ ...prev, email: 'Email này đã được sử dụng' }));
        } else {
          setErrors(prev => ({ ...prev, email: undefined }));
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, email: 'Lỗi kiểm tra email' }));
      } finally {
        setIsCheckingEmail(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [form.email, isOpen]);

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

    // Simple validation - email already checked real-time
    if (validateForm() && !errors.email && !isCheckingEmail) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmCreate = async () => {
    setIsLoading(true);
    try {
      // Import UsersService dynamically to avoid SSR issues
      const { UsersService } = await import('../../../../../../backend');
      
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={!showConfirmation ? onClose : undefined}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-md my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden">
          {!showConfirmation ? (
            <>
              {/* Header - Thiết kế mới giống ảnh */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icon với background màu xanh dương */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        <path d="M20 8v6"/>
                        <path d="M23 11h-6"/>
                      </svg>
                    </div>

                    {/* Tiêu đề và mô tả */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Thêm người dùng mới
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Tạo tài khoản mới cho hệ thống
                      </p>
                    </div>
                  </div>

                  {/* Close button */}
                  <div>
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      title="Đóng"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6">
              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="create-user-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="create-user-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="user@example.com"
                    />
                    {isCheckingEmail && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      </div>
                    )}
                  </div>
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
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
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
                  <div className="relative">
                    <input
                      id="create-user-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                        errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isCheckingEmail || !!errors.email}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tạo người dùng
                  </button>
                </div>
              </form>
              </div>
            </>
          ) : (
            <>
              {/* Header cho Confirmation Dialog */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icon với background màu vàng */}
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                      >
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                      </svg>
                    </div>

                    {/* Tiêu đề và mô tả */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Xác nhận tạo người dùng
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        Kiểm tra thông tin trước khi tạo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Dialog Content */}
              <div className="p-6 text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-2">
                  <p><strong>Email:</strong> {form.email}</p>
                  <p><strong>Họ tên:</strong> {form.fullName}</p>
                  <p><strong>Vai trò:</strong> {selectedRole?.label}</p>
                  <p><strong>Trạng thái:</strong> {form.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</p>
                </div>
                <div className="flex items-center justify-center space-x-3 mt-6">
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
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    <span>{isLoading ? 'Đang tạo...' : 'Xác nhận tạo'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
