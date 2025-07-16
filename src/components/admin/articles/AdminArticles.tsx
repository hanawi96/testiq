import React from 'react';
import { motion } from 'framer-motion';
import ArticlesStats from './components/ArticlesStats';
import ArticlesFiltersComponent from './components/ArticlesFilters';
import ArticlesBulkActions from './components/ArticlesBulkActions';
import ArticlesTable from './components/ArticlesTable';
import QuickEditorsContainer from './components/QuickEditorsContainer';

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
    handleDeleteArticle
  } = useArticlesOperations({
    currentPage,
    limit,
    filters,
    selectedArticles,
    articlesData,
    dispatch,
    setLoading
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
    </div>
  );
}
