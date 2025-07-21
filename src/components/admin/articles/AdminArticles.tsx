import React from 'react';
import { motion } from 'framer-motion';
import ArticlesStats from './components/ArticlesStats';
import ArticlesFiltersComponent from './components/ArticlesFilters';
import ArticlesBulkActions from './components/ArticlesBulkActions';
import ArticlesTable from './components/ArticlesTable';
import QuickEditorsContainer from './components/QuickEditorsContainer';
import { ToastContainer, useToast } from '../common/Toast';

import { useAdminArticlesState } from './hooks/useAdminArticlesState';
import { useQuickEditHandlers } from './hooks/useQuickEditHandlers';
import { useOptimisticUpdates } from './hooks/useOptimisticUpdates';
import { useArticlesOperations } from './hooks/useArticlesOperations';

export default function AdminArticles() {
  const {
    // State
    articlesData,
    stats,
    error,
    loading,
    modals,
    // UI State
    currentPage,
    limit,
    filters,
    selectedArticles,
    showBulkActions,
    // Modal State
    quickTagsEditor,
    quickAuthorEditor,
    quickCategoryEditor,
    quickStatusEditor,
    quickTitleEditor,
    linkAnalysisModal,
    // Actions
    dispatch,
    setModal,
    setLoading
  } = useAdminArticlesState();

  // Toast system
  const toast = useToast();
  const { toasts, removeToast } = toast;

  // Quick Edit Handlers
  const {
    handleQuickTagsEdit,
    handleQuickAuthorEdit,
    handleQuickCategoryEdit,
    handleQuickStatusEdit,
    handleQuickTitleEdit
  } = useQuickEditHandlers(modals, setModal);

  // Articles Operations
  const {
    fetchStats,
    handlePageChange,
    handleFilterChange,
    handleLimitChange,
    handleSelectArticle,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleBulkDelete,
    handleDeleteArticle
  } = useArticlesOperations({
    currentPage,
    limit,
    filters,
    selectedArticles,
    articlesData,
    dispatch,
    setLoading,
    toast
  });

  // Optimistic Update Handlers
  const {
    handleTagsUpdate,
    handleAuthorUpdate,
    handleStatusUpdateOptimistic,
    handleCategoryUpdate,
    handleTitleUpdate
  } = useOptimisticUpdates({
    articlesData,
    loading,
    setLoading,
    setModal,
    dispatch,
    fetchStats
  });

  // Loading state removed - show content immediately

  return (
    <div className="space-y-6">
      {/* Global Loading Indicator */}
      {loading.updating && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-72">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300">Đang xử lý...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <ArticlesStats
        stats={stats}
        loading={loading.stats}
      />

      {/* Filters */}
      <ArticlesFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        searchStats={{
          searchTerm: filters.search || '',
          totalResults: articlesData?.total || 0,
          currentPage: currentPage,
          totalPages: articlesData?.totalPages || 1
        }}
      />

      {/* Bulk Actions */}
      <ArticlesBulkActions
        selectedArticles={selectedArticles}
        showBulkActions={showBulkActions}
        loading={loading.updating}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => dispatch({ type: 'CLEAR_SELECTION' })}
      />

      {/* Articles Table */}
      <ArticlesTable
        articlesData={articlesData}
        loading={loading}
        selectedArticles={selectedArticles}
        onSelectArticle={handleSelectArticle}
        onSelectAll={handleSelectAll}
        currentPage={currentPage}
        limit={limit}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onDeleteArticle={handleDeleteArticle}
        onQuickTagsEdit={handleQuickTagsEdit}
        onQuickAuthorEdit={handleQuickAuthorEdit}
        onQuickCategoryEdit={handleQuickCategoryEdit}
        onQuickStatusEdit={handleQuickStatusEdit}
        onQuickTitleEdit={handleQuickTitleEdit}
        onLinkAnalysis={(articleId, articleTitle) => setModal({
          linkAnalysisModal: { articleId, articleTitle }
        })}
        searchTerm={filters.search || ''}
      />

      {/* Quick Editors Container */}
      <QuickEditorsContainer
        quickTagsEditor={quickTagsEditor}
        quickAuthorEditor={quickAuthorEditor}
        quickCategoryEditor={quickCategoryEditor}
        quickStatusEditor={quickStatusEditor}
        quickTitleEditor={quickTitleEditor}
        linkAnalysisModal={linkAnalysisModal}
        articlesData={articlesData}
        handleTagsUpdate={handleTagsUpdate}
        handleAuthorUpdate={handleAuthorUpdate}
        handleCategoryUpdate={handleCategoryUpdate}
        handleTitleUpdate={handleTitleUpdate}
        handleStatusUpdateOptimistic={handleStatusUpdateOptimistic}
        setModal={setModal}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
