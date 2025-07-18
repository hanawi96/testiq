import React from 'react';
import { Eye, EyeOff, FileText } from 'lucide-react';
import type { MediaEditFormData, MediaEditFormErrors } from '../../../types/media-metadata';

interface MediaEditManagementTabProps {
  formData: MediaEditFormData;
  errors: MediaEditFormErrors;
  onChange: (field: keyof MediaEditFormData, value: any) => void;
}

const STATUS_OPTIONS = [
  { 
    value: 'public', 
    label: 'Công khai', 
    description: 'Hiển thị công khai cho tất cả người dùng',
    icon: Eye,
    color: 'text-green-600 dark:text-green-400'
  },
  { 
    value: 'private', 
    label: 'Riêng tư', 
    description: 'Chỉ admin và editor có thể xem',
    icon: EyeOff,
    color: 'text-orange-600 dark:text-orange-400'
  },
  { 
    value: 'draft', 
    label: 'Bản nháp', 
    description: 'Đang chỉnh sửa, chưa sẵn sàng sử dụng',
    icon: FileText,
    color: 'text-gray-600 dark:text-gray-400'
  }
];

export default function MediaEditManagementTab({
  formData,
  errors,
  onChange
}: MediaEditManagementTabProps) {

  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Trạng thái hiển thị
        </label>
        <div className="space-y-3">
          {STATUS_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.status === option.value;
            
            return (
              <label
                key={option.value}
                className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={isSelected}
                  onChange={(e) => onChange('status', e.target.value as any)}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <Icon className={`w-5 h-5 mt-0.5 ${option.color}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {option.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        {errors.status && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
        )}
      </div>



      {/* Expiry Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ngày hết hạn
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            value={formatDateForInput(formData.expiry_date)}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`admin-input ${errors.expiry_date ? 'error' : ''}`}
            min={new Date().toISOString().slice(0, 16)}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        {errors.expiry_date && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiry_date}</p>
        )}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Để trống nếu không có ngày hết hạn. Hình ảnh sẽ tự động ẩn sau ngày này.
        </p>
      </div>


    </div>
  );
}
