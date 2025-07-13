import React from 'react';
import { AnimatePresence } from 'framer-motion';
import QuickTagsEditor from '../quick-actions/QuickTagsEditor';
import QuickAuthorEditor from '../quick-actions/QuickAuthorEditor';
import QuickMultipleCategoryEditor from '../quick-actions/QuickMultipleCategoryEditor';
import LinkAnalysisModal from '../modals/LinkAnalysisModal';
import QuickStatusEditor from '../quick-actions/QuickStatusEditor';
import QuickTitleEditor from '../quick-actions/QuickTitleEditor';
import type { ArticlesListResponse } from '../../../../../backend';
import type { ModalStates } from '../hooks/useAdminArticlesState';

interface QuickEditorsContainerProps {
  // Modal states
  quickTagsEditor: ModalStates['quickTagsEditor'];
  quickAuthorEditor: ModalStates['quickAuthorEditor'];
  quickCategoryEditor: ModalStates['quickCategoryEditor'];
  quickStatusEditor: ModalStates['quickStatusEditor'];
  quickTitleEditor: ModalStates['quickTitleEditor'];
  linkAnalysisModal: ModalStates['linkAnalysisModal'];
  
  // Data
  articlesData: ArticlesListResponse | null;
  
  // Handlers
  handleTagsUpdate: (articleId: string, newTags: string[]) => Promise<void>;
  handleAuthorUpdate: (articleId: string, newAuthor: string, authorId: string, userProfile: any) => Promise<void>;
  handleCategoryUpdate: (articleId: string, categoryIds: string[], categoryNames: string[]) => Promise<void>;
  handleTitleUpdate: (articleId: string, newTitle: string) => Promise<void>;
  handleStatusUpdateOptimistic: (articleId: string, newStatus: 'published' | 'draft' | 'archived') => Promise<void>;
  setModal: (payload: Partial<ModalStates>) => void;
}

export default function QuickEditorsContainer({
  quickTagsEditor,
  quickAuthorEditor,
  quickCategoryEditor,
  quickStatusEditor,
  quickTitleEditor,
  linkAnalysisModal,
  articlesData,
  handleTagsUpdate,
  handleAuthorUpdate,
  handleCategoryUpdate,
  handleTitleUpdate,
  handleStatusUpdateOptimistic,
  setModal
}: QuickEditorsContainerProps) {
  return (
    <>
      {/* Quick Editors */}
      <AnimatePresence>
        {quickTagsEditor && (
          <QuickTagsEditor
            articleId={quickTagsEditor.articleId}
            currentTags={(() => {
              const article = articlesData?.articles.find(a => a.id === quickTagsEditor.articleId);
              return (article as any)?.tag_names || [];
            })()}
            onUpdate={handleTagsUpdate}
            onClose={() => setModal({ quickTagsEditor: null })}
            position={quickTagsEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickAuthorEditor && (
          <QuickAuthorEditor
            articleId={quickAuthorEditor.articleId}
            currentAuthor={(articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId) as any)?.user_profiles?.full_name || (articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId) as any)?.author || ''}
            currentAuthorId={(articlesData?.articles.find(a => a.id === quickAuthorEditor.articleId) as any)?.author_id}
            onUpdate={handleAuthorUpdate}
            onClose={() => setModal({ quickAuthorEditor: null })}
            position={quickAuthorEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickCategoryEditor && (
          <QuickMultipleCategoryEditor
            articleId={quickCategoryEditor.articleId}
            currentCategoryIds={(() => {
              const article = articlesData?.articles.find(a => a.id === quickCategoryEditor.articleId) as any;
              // Use category_ids if available, otherwise fallback to category_id as single item array
              if (article?.category_ids && article.category_ids.length > 0) {
                return article.category_ids;
              }
              return article?.category_id ? [article.category_id] : [];
            })()}
            currentCategoryNames={(() => {
              const article = articlesData?.articles.find(a => a.id === quickCategoryEditor.articleId) as any;
              return article?.category_names || [];
            })()}
            onUpdate={handleCategoryUpdate}
            onClose={() => setModal({ quickCategoryEditor: null })}
            position={quickCategoryEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickTitleEditor && (
          <QuickTitleEditor
            articleId={quickTitleEditor.articleId}
            currentTitle={(() => {
              const article = articlesData?.articles.find(a => a.id === quickTitleEditor.articleId);
              return article?.title || '';
            })()}
            onUpdate={handleTitleUpdate}
            onClose={() => setModal({ quickTitleEditor: null })}
            position={quickTitleEditor.position}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickStatusEditor && (
          <QuickStatusEditor
            articleId={quickStatusEditor.articleId}
            currentStatus={articlesData?.articles.find(a => a.id === quickStatusEditor.articleId)?.status || 'draft'}
            onUpdate={handleStatusUpdateOptimistic}
            onClose={() => setModal({ quickStatusEditor: null })}
            position={quickStatusEditor.position}
          />
        )}
      </AnimatePresence>

      {/* Link Analysis Modal */}
      {linkAnalysisModal && (
        <LinkAnalysisModal
          articleId={linkAnalysisModal.articleId}
          articleTitle={linkAnalysisModal.articleTitle}
          isOpen={true}
          onClose={() => setModal({ linkAnalysisModal: null })}
        />
      )}
    </>
  );
}
