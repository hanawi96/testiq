import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SEOSettings from './SEOSettings';
import MediaUpload from './MediaUpload';
import CategorySelector from './CategorySelector';
import TagsInput from './TagsInput';
import type { SettingsSidebarProps } from '../types/articleForm';

export default function SettingsSidebar({
  formData,
  errors,
  onChange,
  onClearError,
  isSubmitting
}: SettingsSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    media: true,
    categories: true,
    seo: false,
    advanced: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const SectionHeader = ({ 
    title, 
    section, 
    icon 
  }: { 
    title: string; 
    section: keyof typeof expandedSections;
    icon: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="text-gray-400 dark:text-gray-500">
          {icon}
        </div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <svg
        className={`w-5 h-5 text-gray-400 transition-transform ${
          expandedSections[section] ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <SectionHeader
          title="Cài đặt cơ bản"
          section="basic"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        
        <AnimatePresence>
          {expandedSections.basic && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    placeholder="Nhập tiêu đề bài viết"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.title ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => onChange('slug', e.target.value)}
                    placeholder="url-slug-bai-viet"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.slug ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.slug}
                    </p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tóm tắt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => onChange('excerpt', e.target.value)}
                    placeholder="Tóm tắt ngắn gọn về bài viết"
                    rows={3}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.excerpt ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.excerpt && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.excerpt}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => onChange('status', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="draft">Nháp</option>
                    <option value="published">Đã xuất bản</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>

                {/* Featured */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => onChange('featured', e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Bài viết nổi bật
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <SectionHeader
          title="Hình ảnh"
          section="media"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        
        <AnimatePresence>
          {expandedSections.media && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <MediaUpload
                  value={formData.cover_image}
                  alt={formData.cover_image_alt}
                  onChange={(url, alt) => {
                    onChange('cover_image', url);
                    if (alt !== undefined) {
                      onChange('cover_image_alt', alt);
                    }
                  }}
                  onRemove={() => {
                    onChange('cover_image', '');
                    onChange('cover_image_alt', '');
                  }}
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Categories & Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <SectionHeader
          title="Danh mục & Tags"
          section="categories"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        />
        
        <AnimatePresence>
          {expandedSections.categories && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                <CategorySelector
                  selectedIds={formData.category_ids}
                  onChange={(ids) => onChange('category_ids', ids)}
                  error={errors.category_id}
                  disabled={isSubmitting}
                />
                
                <TagsInput
                  selectedIds={formData.tag_ids}
                  onChange={(ids) => onChange('tag_ids', ids)}
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SEO Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <SectionHeader
          title="Cài đặt SEO"
          section="seo"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        
        <AnimatePresence>
          {expandedSections.seo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-200 dark:border-gray-700">
                <SEOSettings
                  formData={formData}
                  errors={errors}
                  onChange={onChange}
                  onClearError={onClearError}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
