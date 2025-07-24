import React, { useState, useEffect } from 'react';
import { SettingsService } from '../../../../backend';
import type { SiteSettings, SettingsUpdateData } from '../../../../backend';

interface SiteSettingsFormProps {
  settings: SiteSettings;
  isLoading: boolean;
  hasChanges: boolean;
  onChange: (changes: Partial<SiteSettings>) => void;
  onSave: (updates: SettingsUpdateData) => void;
  onReset: () => void;
}

interface FormData {
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  timezone: string;
}

interface FormErrors {
  site_name?: string;
  site_tagline?: string;
  site_description?: string;
  logo_url?: string;
  favicon_url?: string;
  timezone?: string;
}

export default function SiteSettingsForm({
  settings,
  isLoading,
  hasChanges,
  onChange,
  onSave,
  onReset
}: SiteSettingsFormProps) {
  const [formData, setFormData] = useState<FormData>({
    site_name: settings.site_name || '',
    site_tagline: settings.site_tagline || '',
    site_description: settings.site_description || '',
    logo_url: settings.logo_url || '',
    favicon_url: settings.favicon_url || '',
    timezone: settings.timezone || 'Asia/Ho_Chi_Minh'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when settings change (external reset)
  useEffect(() => {
    if (!hasChanges) {
      setFormData({
        site_name: settings.site_name || '',
        site_tagline: settings.site_tagline || '',
        site_description: settings.site_description || '',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        timezone: settings.timezone || 'Asia/Ho_Chi_Minh'
      });
      setErrors({});
      setTouched({});
    }
  }, [hasChanges, settings]);



  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form data
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Đơn giản hóa validation - chỉ kiểm tra field bắt buộc
    const error = name === 'site_name' && !value.trim() ? 'Tên website là bắt buộc' : undefined;
    setErrors(prev => ({ ...prev, [name]: error }));

    // Notify parent of changes
    onChange(newFormData);
  };

  // Handle form submission - đơn giản hóa
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Chỉ kiểm tra field bắt buộc
    if (formData.site_name.trim()) {
      onSave(formData);
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      site_name: settings.site_name || '',
      site_tagline: settings.site_tagline || '',
      site_description: settings.site_description || '',
      logo_url: settings.logo_url || '',
      favicon_url: settings.favicon_url || '',
      timezone: settings.timezone || 'Asia/Ho_Chi_Minh'
    });
    setErrors({});
    setTouched({});
    onReset();
  };

  // Check if form is valid - đơn giản hóa
  const isFormValid = formData.site_name.trim().length > 0;

  // Get timezones
  const timezones = SettingsService.getTimezones();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-purple-950/20">
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
          </div>

          {/* Title and Description */}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Nội dung bài viết
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Soạn thảo nội dung chính của bài viết
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Site Name */}
        <div>
          <label htmlFor="site_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tên website *
          </label>
          <input
            type="text"
            id="site_name"
            name="site_name"
            value={formData.site_name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              errors.site_name && touched.site_name
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Nhập tên website"
            disabled={isLoading}
          />
          {errors.site_name && touched.site_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.site_name}
            </p>
          )}
        </div>

        {/* Site Tagline */}
        <div>
          <label htmlFor="site_tagline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Slogan
          </label>
          <input
            type="text"
            id="site_tagline"
            name="site_tagline"
            value={formData.site_tagline}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              errors.site_tagline && touched.site_tagline
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Nhập slogan của website"
            disabled={isLoading}
          />
          {errors.site_tagline && touched.site_tagline && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.site_tagline}
            </p>
          )}
        </div>

        {/* Site Description */}
        <div>
          <label htmlFor="site_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả website
          </label>
          <textarea
            id="site_description"
            name="site_description"
            value={formData.site_description}
            onChange={handleInputChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 resize-vertical ${
              errors.site_description && touched.site_description
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Nhập mô tả ngắn về website"
            disabled={isLoading}
          />
          {errors.site_description && touched.site_description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.site_description}
            </p>
          )}
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formData.site_description.length}/500 ký tự
          </p>
        </div>

        {/* Logo URL */}
        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL Logo
          </label>
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              errors.logo_url && touched.logo_url
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="https://example.com/logo.png"
            disabled={isLoading}
          />
          {errors.logo_url && touched.logo_url && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.logo_url}
            </p>
          )}
        </div>

        {/* Favicon URL */}
        <div>
          <label htmlFor="favicon_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL Favicon
          </label>
          <input
            type="url"
            id="favicon_url"
            name="favicon_url"
            value={formData.favicon_url}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
              errors.favicon_url && touched.favicon_url
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="https://example.com/favicon.ico"
            disabled={isLoading}
          />
          {errors.favicon_url && touched.favicon_url && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.favicon_url}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Múi giờ *
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.timezone && touched.timezone
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            disabled={isLoading}
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {errors.timezone && touched.timezone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.timezone}
            </p>
          )}
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
              disabled={!isFormValid || isLoading}
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
}
