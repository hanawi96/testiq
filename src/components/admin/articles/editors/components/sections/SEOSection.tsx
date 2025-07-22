import React from 'react';
import { SEOSkeleton } from '../SkeletonComponents';

interface SEOSectionProps {
  formData: any;
  shouldShowArticleSkeleton: boolean;
  seoAnalysis: any;
  setFormData: (updater: (prev: any) => any) => void;
  getSeoScoreColor: (score: number) => string;
  getSeoScoreGradient: (score: number) => string;
  getSeoScoreBadge: (score: number) => { className: string; text: string };
  getSeoCheckColor: (status: 'good' | 'warning' | 'bad') => string;
}

export const SEOSection: React.FC<SEOSectionProps> = ({
  formData,
  shouldShowArticleSkeleton,
  seoAnalysis,
  setFormData,
  getSeoScoreColor,
  getSeoScoreGradient,
  getSeoScoreBadge,
  getSeoCheckColor
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header với màu nền nhẹ nhàng */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 px-6 py-4 border-b border-blue-100/50 dark:border-blue-900/30">
        <div className="flex items-center gap-3">
          {/* Icon với gradient đẹp */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SEO & Tối ưu hóa</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Cải thiện khả năng tìm kiếm và hiển thị</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* PROGRESSIVE LOADING: Show skeleton for SEO when loading article data */}
        {shouldShowArticleSkeleton ? (
          <SEOSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side - SEO Analysis Combined */}
            <div className="space-y-6">
              {/* SEO Analysis - Combined Score & Checklist */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden shadow-sm">
                

                <div className="p-5">
                  {/* Top Section: Modern Score Display */}
                  <div className="mb-6">
                    {/* Score Card with Gradient Background */}
                    <div className={`relative overflow-hidden rounded-2xl p-6 ${
                      seoAnalysis.score >= 80
                        ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/40'
                        : seoAnalysis.score >= 60
                        ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40'
                        : 'bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-950/40 dark:via-pink-950/30 dark:to-rose-950/40'
                    }`}>
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <div className={`w-full h-full rounded-full ${
                          seoAnalysis.score >= 80
                            ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                            : seoAnalysis.score >= 60
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                            : 'bg-gradient-to-br from-red-400 to-pink-500'
                        } transform translate-x-16 -translate-y-16`}></div>
                      </div>

                      <div className="relative flex items-center justify-between">
                        {/* Left: Score Display */}
                        <div className="flex items-center gap-6">
                          {/* Modern Score Circle */}
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center border border-white/50 dark:border-gray-700/50">
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${getSeoScoreColor(seoAnalysis.score)}`}>
                                  {seoAnalysis.score}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1">/100</div>
                              </div>
                            </div>

                            {/* Floating Progress Ring */}
                            <div className="absolute inset-0">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  className="text-white/30 dark:text-gray-600/30"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                                <path
                                  className={`${
                                    seoAnalysis.score >= 80
                                      ? 'text-emerald-500'
                                      : seoAnalysis.score >= 60
                                      ? 'text-amber-500'
                                      : 'text-red-500'
                                  }`}
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  fill="none"
                                  strokeDasharray={`${seoAnalysis.score}, 100`}
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* Score Info */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-2 h-2 rounded-full ${
                                seoAnalysis.score >= 80
                                  ? 'bg-emerald-500'
                                  : seoAnalysis.score >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}></div>
                              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Điểm SEO
                              </span>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                              seoAnalysis.score >= 80
                                ? 'bg-white/80 dark:bg-gray-800/80 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                : seoAnalysis.score >= 60
                                ? 'bg-white/80 dark:bg-gray-800/80 text-amber-700 dark:text-amber-400 shadow-sm'
                                : 'bg-white/80 dark:bg-gray-800/80 text-red-700 dark:text-red-400 shadow-sm'
                            }`}>
                              {seoAnalysis.score >= 80 ? (
                                // Excellent - Trophy/Award Icon
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                              ) : seoAnalysis.score >= 60 ? (
                                // Good - Trending Up Icon
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                              ) : (
                                // Needs Improvement - Tools/Settings Icon
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                              <span>{getSeoScoreBadge(seoAnalysis.score).text}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Quick Stats */}
                        <div className="flex gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                              {seoAnalysis.wordCount}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              Số từ
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                              {seoAnalysis.readingTime}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                              Phút đọc
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100 dark:border-gray-700/50 mb-5"></div>

                  {/* Checklist Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Checklist tối ưu</h5>
                    </div>

                    <div className="space-y-2">
                      {seoAnalysis.checks.map((check: any, index: number) => (
                        <div key={index} className="group relative">
                          <div className="absolute inset-0 bg-gray-50/50 dark:bg-gray-700/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                          <div className="relative flex items-center gap-3 p-2.5 rounded-lg">
                            <div className="flex-shrink-0">
                              {check.status === 'good' ? (
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              ) : check.status === 'warning' ? (
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {check.name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                                  check.status === 'good'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                    : check.status === 'warning'
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                }`}>
                                  {check.message}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - SEO Fields */}
            <div className="space-y-6">
              {/* Focus Keyword */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  Từ khóa chính
                </label>
                <input
                  type="text"
                  value={formData.focus_keyword}
                  onChange={(e) => setFormData(prev => ({ ...prev, focus_keyword: e.target.value }))}
                  placeholder="Nhập từ khóa chính cho bài viết..."
                  className="w-full px-4 py-3.5 border rounded-xl
                    bg-white dark:bg-gray-800/50 backdrop-blur-sm
                    text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                    focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
                    border-gray-200 dark:border-gray-700"
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Từ khóa chính giúp tối ưu hóa nội dung cho search engine
                </div>
              </div>

              {/* Meta Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  Meta Title
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    formData.meta_title.length >= 50 && formData.meta_title.length <= 60
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : formData.meta_title.length > 60
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {formData.meta_title.length}/60
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="Tiêu đề hiển thị trên Google..."
                    maxLength={60}
                    className="w-full px-4 py-3.5 pr-12 border rounded-xl
                      bg-white dark:bg-gray-800/50 backdrop-blur-sm
                      text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500
                      border-gray-200 dark:border-gray-700"
                  />
                  <button
                    onClick={() => {
                      if (!formData.title.trim()) {
                        alert('Vui lòng nhập tiêu đề bài viết trước');
                        return;
                      }
                      const autoMetaTitle = formData.title.length <= 60
                        ? formData.title
                        : formData.title.substring(0, 60);
                      setFormData(prev => ({ ...prev, meta_title: autoMetaTitle }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-all duration-200"
                    title="Tạo meta title từ tiêu đề bài viết"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tiêu đề hiển thị trên kết quả tìm kiếm Google
                </div>
              </div>

              {/* Meta Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  Meta Description
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    formData.meta_description.length >= 120 && formData.meta_description.length <= 160
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : formData.meta_description.length > 160
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {formData.meta_description.length}/160
                  </span>
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Mô tả ngắn gọn hiển thị trên Google..."
                  maxLength={160}
                  rows={4}
                  className="w-full px-4 py-3.5 border rounded-xl resize-none
                    bg-white dark:bg-gray-800/50 backdrop-blur-sm
                    text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                    focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500
                    border-gray-200 dark:border-gray-700"
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mô tả ngắn gọn hiển thị trên kết quả tìm kiếm Google
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
