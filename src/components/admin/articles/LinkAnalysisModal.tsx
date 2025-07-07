import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArticlesService } from '../../../../backend';

interface LinkInfo {
  url: string;
  text: string;
  title?: string;
  isExternal: boolean;
  domain?: string;
}

interface LinkAnalysis {
  internal_links: LinkInfo[];
  external_links: LinkInfo[];
  total_internal: number;
  total_external: number;
}

interface LinkAnalysisModalProps {
  articleId: string;
  articleTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkAnalysisModal({ articleId, articleTitle, isOpen, onClose }: LinkAnalysisModalProps) {
  const [linkAnalysis, setLinkAnalysis] = useState<LinkAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && articleId) {
      analyzeLinkss();
    }
  }, [isOpen, articleId]);

  const analyzeLinkss = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: analysisError } = await ArticlesService.analyzeArticleLinks(articleId);
      
      if (analysisError) {
        setError('Không thể phân tích links');
        return;
      }

      setLinkAnalysis(data);
    } catch (err) {
      setError('Có lỗi xảy ra khi phân tích links');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Phân tích Links
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {articleTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Đang phân tích links...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
                <button
                  onClick={analyzeLinkss}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            ) : linkAnalysis ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {linkAnalysis.total_internal + linkAnalysis.total_external}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Tổng links</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {linkAnalysis.total_internal}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Internal links</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {linkAnalysis.total_external}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">External links</div>
                  </div>
                </div>

                {/* Internal Links */}
                {linkAnalysis.internal_links.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Internal Links ({linkAnalysis.total_internal})
                    </h4>
                    <div className="space-y-2">
                      {linkAnalysis.internal_links.map((link, index) => (
                        <div key={index} className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {link.text || 'Không có text'}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                            {link.url}
                          </div>
                          {link.title && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Title: {link.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                {linkAnalysis.external_links.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      External Links ({linkAnalysis.total_external})
                    </h4>
                    <div className="space-y-2">
                      {linkAnalysis.external_links.map((link, index) => (
                        <div key={index} className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {link.text || 'Không có text'}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                            {link.url}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Domain: {link.domain}
                          </div>
                          {link.title && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Title: {link.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Links */}
                {linkAnalysis.total_internal === 0 && linkAnalysis.total_external === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Không tìm thấy links nào trong bài viết</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Đóng
            </button>
            {linkAnalysis && (
              <button
                onClick={analyzeLinkss}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Phân tích lại
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
