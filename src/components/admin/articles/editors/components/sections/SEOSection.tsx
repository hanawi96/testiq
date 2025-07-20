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
            {/* Left side - SEO Score & Analysis */}
            <div className="space-y-6">
              {/* SEO Score Card */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Điểm SEO</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá tổng thể</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getSeoScoreColor(seoAnalysis.score)}`}>
                        {seoAnalysis.score}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">/100</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full ${getSeoScoreGradient(seoAnalysis.score)}`}
                      style={{ width: `${seoAnalysis.score}%` }}
                    ></div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trạng thái tối ưu</span>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeoScoreBadge(seoAnalysis.score).className}`}>
                      {getSeoScoreBadge(seoAnalysis.score).text}
                    </div>
                  </div>
              </div>

              {/* SEO Checklist */}
              <div className="bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-800/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Checklist SEO</h4>
                </div>
                <div className="space-y-3">
                  {seoAnalysis.checks.map((check: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getSeoCheckColor(check.status)}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{check.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            check.status === 'good' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            check.status === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {check.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
