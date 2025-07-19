import React from 'react';
import type { ArticlesListResponse } from '../../../../../backend';
import { SkeletonTable } from '../../common/Skeleton';

import { SmartPreloader } from '../../../../utils/admin/preloaders/preload-manager';
import SearchHighlight from '../../common/SearchHighlight';
import CategoryDisplay from './CategoryDisplay';
import { getCategoryColor, getStatusBadge, getStatusLabel, formatDate, formatNumber } from '../utils/articleHelpers';

interface LoadingStates {
  articles: boolean;
  updating: boolean;
  titleIds: Set<string>;
  tagIds: Set<string>;
  categoryIds: Set<string>;
  authorIds: Set<string>;
  statusIds: Set<string>;
}

interface ArticlesTableProps {
  // Data
  articlesData: ArticlesListResponse | null;
  loading: LoadingStates;
  
  // Selection
  selectedArticles: string[];
  onSelectArticle: (articleId: string) => void;
  onSelectAll: () => void;
  
  // Pagination
  currentPage: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  
  // Actions
  onDeleteArticle: (articleId: string) => void;
  
  // Quick Editors
  onQuickTagsEdit: (event: React.MouseEvent, articleId: string) => void;
  onQuickAuthorEdit: (event: React.MouseEvent, articleId: string) => void;
  onQuickCategoryEdit: (event: React.MouseEvent, articleId: string) => void;
  onQuickStatusEdit: (event: React.MouseEvent, articleId: string) => void;
  onQuickTitleEdit: (event: React.MouseEvent, articleId: string) => void;
  
  // Other handlers
  onLinkAnalysis: (articleId: string, articleTitle: string) => void;
  
  // Search
  searchTerm?: string;
}

export default function ArticlesTable({
  articlesData,
  loading,
  selectedArticles,
  onSelectArticle,
  onSelectAll,
  currentPage,
  limit,
  onPageChange,
  onLimitChange,
  onDeleteArticle,
  onQuickTagsEdit,
  onQuickAuthorEdit,
  onQuickCategoryEdit,
  onQuickStatusEdit,
  onQuickTitleEdit,
  onLinkAnalysis,
  searchTerm = ''
}: ArticlesTableProps) {
  
  if (loading.articles) {
    return <SkeletonTable rows={10} />;
  }

  if (!articlesData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Danh sách bài viết ({articlesData.total.toLocaleString()})
          </h3>
          <div>
            <a
              href="/admin/articles/create"
              onClick={() => SmartPreloader.triggerSmartPreload('click')}
              onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
              className="flex items-center justify-center w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              title="Tạo bài viết mới"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {articlesData.articles.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Không có bài viết nào</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Thử điều chỉnh bộ lọc để xem kết quả khác</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedArticles.length === articlesData.articles.length && articlesData.articles.length > 0}
                      onChange={onSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span>Bài viết</span>
                  </div>
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Thống kê
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {articlesData.articles.map((article) => (
                <tr
                  key={article.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {/* Article Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article.id)}
                        onChange={() => onSelectArticle(article.id)}
                        className="mt-1 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 flex-1">
                            <SearchHighlight
                              text={article.title}
                              searchTerm={searchTerm}
                            />
                          </div>
                          <button
                            onClick={(e) => onQuickTitleEdit(e, article.id)}
                            disabled={loading.titleIds.has(article.id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Chỉnh sửa tiêu đề"
                            data-quick-edit-button="title"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        {/* Category info for mobile */}
                        <div className="sm:hidden mt-2 flex items-center">
                          {loading.categoryIds.has(article.id) ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Đang cập nhật danh mục...
                              </div>
                            </div>
                          ) : (
                            <CategoryDisplay
                              categories={article.category_names || []}
                              maxVisible={2}
                              getCategoryColor={getCategoryColor}
                              className=""
                              showIcon={true}
                              iconPrefix="📁"
                            />
                          )}
                          <button
                            onClick={(e) => onQuickCategoryEdit(e, article.id)}
                            onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                            disabled={loading.categoryIds.has(article.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Chỉnh sửa danh mục"
                            data-quick-edit-button="category"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          {loading.tagIds.has(article.id) ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Đang cập nhật tags...
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const tagNames = article.tag_names || [];
                                return tagNames.slice(0, 3).map((tagName: string, index: number) => (
                                  <span
                                    key={`${article.id}-tag-${index}-${tagName}`}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                                  >
                                    {tagName}
                                  </span>
                                ));
                              })()}
                              {(() => {
                                const tagNames = article.tag_names || [];
                                return tagNames.length > 3 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    +{tagNames.length - 3} khác
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                          <button
                            onClick={(e) => onQuickTagsEdit(e, article.id)}
                            onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                            disabled={loading.tagIds.has(article.id)}
                            className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Chỉnh sửa tags"
                            data-quick-edit-button="tags"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </button>
                        </div>

                        {/* Stats for mobile */}
                        <div className="sm:hidden mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{formatNumber(article.view_count || 0)}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{formatNumber(article.like_count || 0)}</span>
                          </div>

                          {article.word_count && article.word_count > 0 && (
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>{formatNumber(article.word_count)}</span>
                            </div>
                          )}

                          {/* Links for mobile - compact display */}
                          <div className="lg:hidden flex items-center space-x-2">
                            {/* Internal Links */}
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              <span className="text-green-600 dark:text-green-400 text-xs">
                                {article.internal_links && Array.isArray(article.internal_links) ? article.internal_links.length : 0}
                              </span>
                            </div>

                            {/* External Links */}
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="text-blue-600 dark:text-blue-400 text-xs">
                                {article.external_links && Array.isArray(article.external_links) ? article.external_links.length : 0}
                              </span>
                            </div>

                            {/* Analyze button for mobile */}
                            <button
                              onClick={() => onLinkAnalysis(article.id, article.title)}
                              className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                              title="Phân tích links"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category Column - Desktop */}
                  <td className="hidden sm:table-cell px-6 py-4">
                    {loading.categoryIds.has(article.id) ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Đang cập nhật...
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <CategoryDisplay
                          categories={article.category_names || []}
                          maxVisible={3}
                          getCategoryColor={getCategoryColor}
                          className=""
                        />
                        <button
                          onClick={(e) => onQuickCategoryEdit(e, article.id)}
                          onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                          disabled={loading.categoryIds.has(article.id)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Chỉnh sửa danh mục"
                          data-quick-edit-button="category"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Author Column */}
                  <td className="px-6 py-4">
                    {loading.authorIds.has(article.id) ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Đang cập nhật...
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          <SearchHighlight
                            text={article.user_profiles?.full_name || article.author || 'Không xác định'}
                            searchTerm={searchTerm}
                          />
                        </div>
                        <button
                          onClick={(e) => onQuickAuthorEdit(e, article.id)}
                          onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                          disabled={loading.authorIds.has(article.id)}
                          className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Chỉnh sửa tác giả"
                          data-quick-edit-button="author"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(article.status)}>
                        {getStatusLabel(article.status)}
                      </span>
                      <button
                        onClick={(e) => onQuickStatusEdit(e, article.id)}
                        className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Chỉnh sửa trạng thái"
                        data-quick-edit-button="status"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {/* Stats Column - Desktop */}
                  <td className="hidden sm:table-cell px-6 py-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{formatNumber(article.view_count || 0)}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{formatNumber(article.like_count || 0)}</span>
                      </div>

                      {article.word_count && article.word_count > 0 && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{formatNumber(article.word_count)}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Links Column - Desktodp */}
                  <td className="hidden lg:table-cell px-6 py-4">
                    <div className="flex items-center space-x-4">
                      {/* Internal Links */}
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                          {article.internal_links && Array.isArray(article.internal_links) ? article.internal_links.length : 0}
                        </span>
                      </div>

                      {/* External Links */}
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                          {article.external_links && Array.isArray(article.external_links) ? article.external_links.length : 0}
                        </span>
                      </div>

                      {/* Analyze button */}
                      <button
                        onClick={() => onLinkAnalysis(article.id, article.title)}
                        className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Phân tích links"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                    </div>
                  </td>

                  {/* Date Column */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div>{formatDate(article.created_at)}</div>
                      {article.updated_at && article.updated_at !== article.created_at && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Cập nhật: {formatDate(article.updated_at)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* View Article */}
                      <a
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Xem bài viết"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>

                      {/* Edit Article */}
                      <a
                        href={`/admin/articles/edit?id=${article.id}`}
                        onClick={() => SmartPreloader.triggerSmartPreload('click')}
                        onMouseEnter={() => SmartPreloader.triggerSmartPreload('hover')}
                        className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Chỉnh sửa bài viết"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </a>

                      {/* Delete Article */}
                      <button
                        onClick={() => onDeleteArticle(article.id)}
                        disabled={loading.updating}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Xóa bài viết"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {articlesData.total > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {Math.min(currentPage * limit, articlesData.total)}/{articlesData.total} bài viết
            </div>

            <div className="flex items-center space-x-4">
              {/* Page Navigation - Only show if more than 1 page */}
              {articlesData.totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trang {currentPage} / {articlesData.totalPages}
                  </span>

                  <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= articlesData.totalPages}
                    className="p-2 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Items Per Page - Always show */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Hiển thị:</span>
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm text-gray-700 dark:text-gray-300">/ trang</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
