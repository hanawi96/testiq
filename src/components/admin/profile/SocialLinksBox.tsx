import React, { useState, useEffect } from 'react';
import type { SocialLinks, AdminProfileData } from './AdminProfileService';

interface SocialLinksBoxProps {
  profile: AdminProfileData;
  isLoading: boolean;
  onSave: (changes: Partial<AdminProfileData>) => void;
}

interface FormData {
  social_links: SocialLinks;
}

interface FormErrors {
  social_links?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    tiktok?: string;
  };
}

const SocialLinksBox: React.FC<SocialLinksBoxProps> = ({
  profile,
  isLoading,
  onSave
}) => {
  const [formData, setFormData] = useState<FormData>({
    social_links: profile.social_links || {}
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when profile changes
  useEffect(() => {
    setFormData({
      social_links: profile.social_links || {}
    });
    setErrors({});
    setHasChanges(false);
  }, [profile]);

  // Handle social links input changes
  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    const newSocialLinks = { ...formData.social_links, [platform]: value };
    const newFormData = { ...formData, social_links: newSocialLinks };
    setFormData(newFormData);

    // Validate URL format
    const error = value && !value.match(/^https?:\/\/[^\s]+$/) ? 'URL không hợp lệ' : undefined;
    setErrors(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: error }
    }));

    // Check for changes
    const originalSocialLinks = profile.social_links || {};
    const hasChanges = JSON.stringify(newSocialLinks) !== JSON.stringify(originalSocialLinks);
    setHasChanges(hasChanges);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: FormErrors = {};
    let hasErrors = false;

    // Validate social links URLs
    Object.entries(formData.social_links).forEach(([platform, url]) => {
      if (url && !url.match(/^https?:\/\/[^\s]+$/)) {
        if (!newErrors.social_links) newErrors.social_links = {};
        newErrors.social_links[platform as keyof SocialLinks] = 'URL không hợp lệ';
        hasErrors = true;
      }
    });

    setErrors(newErrors);

    if (!hasErrors) {
      onSave({ social_links: formData.social_links });
      setHasChanges(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    setFormData({
      social_links: profile.social_links || {}
    });
    setErrors({});
    setHasChanges(false);
  };

  // Check if form is valid
  const isFormValid = !Object.values(errors.social_links || {}).some(error => error);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 via-purple-50/80 to-pink-50 dark:from-purple-900/20 dark:via-purple-900/15 dark:to-pink-900/20 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-pink-200/30 dark:from-purple-700/20 dark:to-pink-700/20 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/20 to-purple-200/20 dark:from-pink-700/15 dark:to-purple-700/15 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            {/* Icon với background màu tím - thiết kế mới */}
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200">
              <div className="relative">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-sm"
                >
                  {/* Globe/Network icon */}
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                  <path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/>
                </svg>
                {/* Decorative dots */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-80 animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-white rounded-full opacity-60 animate-pulse delay-300"></div>
              </div>
            </div>

            {/* Tiêu đề và mô tả */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                Liên kết mạng xã hội
                
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                Kết nối với cộng đồng thông qua các nền tảng mạng xã hội và trang web cá nhân
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Links Content */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                Website
              </span>
            </label>
            <input
              type="url"
              id="website"
              value={formData.social_links.website || ''}
              onChange={(e) => handleSocialLinkChange('website', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.website
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://yourwebsite.com"
              disabled={isLoading}
            />
            {errors.social_links?.website && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.website}
              </p>
            )}
          </div>

          {/* Facebook */}
          <div>
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </span>
            </label>
            <input
              type="url"
              id="facebook"
              value={formData.social_links.facebook || ''}
              onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.facebook
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://facebook.com/username"
              disabled={isLoading}
            />
            {errors.social_links?.facebook && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.facebook}
              </p>
            )}
          </div>

          {/* Twitter */}
          <div>
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter
              </span>
            </label>
            <input
              type="url"
              id="twitter"
              value={formData.social_links.twitter || ''}
              onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.twitter
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://twitter.com/username"
              disabled={isLoading}
            />
            {errors.social_links?.twitter && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.twitter}
              </p>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </span>
            </label>
            <input
              type="url"
              id="linkedin"
              value={formData.social_links.linkedin || ''}
              onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.linkedin
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://linkedin.com/in/username"
              disabled={isLoading}
            />
            {errors.social_links?.linkedin && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.linkedin}
              </p>
            )}
          </div>

          {/* Instagram */}
          <div>
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </span>
            </label>
            <input
              type="url"
              id="instagram"
              value={formData.social_links.instagram || ''}
              onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.instagram
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://instagram.com/username"
              disabled={isLoading}
            />
            {errors.social_links?.instagram && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.instagram}
              </p>
            )}
          </div>

          {/* YouTube */}
          <div>
            <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                YouTube
              </span>
            </label>
            <input
              type="url"
              id="youtube"
              value={formData.social_links.youtube || ''}
              onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.youtube
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://youtube.com/channel/username"
              disabled={isLoading}
            />
            {errors.social_links?.youtube && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.youtube}
              </p>
            )}
          </div>

          {/* GitHub */}
          <div>
            <label htmlFor="github" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </span>
            </label>
            <input
              type="url"
              id="github"
              value={formData.social_links.github || ''}
              onChange={(e) => handleSocialLinkChange('github', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.github
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://github.com/username"
              disabled={isLoading}
            />
            {errors.social_links?.github && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.github}
              </p>
            )}
          </div>

          {/* TikTok */}
          <div>
            <label htmlFor="tiktok" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </span>
            </label>
            <input
              type="url"
              id="tiktok"
              value={formData.social_links.tiktok || ''}
              onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                errors.social_links?.tiktok
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="https://tiktok.com/@username"
              disabled={isLoading}
            />
            {errors.social_links?.tiktok && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.social_links.tiktok}
              </p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0 sm:space-x-3">
          
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Đặt lại
            </button>
            
            <button
              type="submit"
              disabled={!hasChanges || !isFormValid || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

export default SocialLinksBox;
