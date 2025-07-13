import { SmartPreloader } from '../../../../utils/admin/preloaders/preload-manager';
import type { ModalStates, EditorPosition } from './useAdminArticlesState';

interface PopupConfig {
  width: number;
  height: number;
}

const POPUP_CONFIGS: Record<string, PopupConfig> = {
  tags: { width: 320, height: 400 },
  author: { width: 288, height: 300 },
  category: { width: 288, height: 480 },
  status: { width: 240, height: 200 },
  title: { width: 400, height: 200 }
};

// Shared position calculation logic
function calculatePopupPosition(
  event: React.MouseEvent,
  config: PopupConfig
): { top: number; left: number } {
  const rect = event.currentTarget.getBoundingClientRect();
  const { width: popupWidth, height: popupHeight } = config;

  // Calculate position relative to viewport (for fixed positioning)
  let left = rect.left;
  let top = rect.bottom + 4;

  // Adjust horizontal position if popup would overflow viewport
  if (left + popupWidth > window.innerWidth) {
    left = window.innerWidth - popupWidth - 16;
  }
  if (left < 16) {
    left = 16;
  }

  // Adjust vertical position if popup would overflow viewport
  const spaceBelow = window.innerHeight - rect.bottom - 4;
  const spaceAbove = rect.top - 4;

  if (spaceBelow < popupHeight) {
    if (spaceAbove >= popupHeight) {
      // Show above button if there's enough space
      top = rect.top - popupHeight - 4;
    } else {
      // If neither space is enough, position to fit in viewport with margin
      if (spaceAbove > spaceBelow) {
        // More space above, position at top with margin
        top = 16;
      } else {
        // More space below, position to fit in remaining space
        top = Math.max(16, window.innerHeight - popupHeight - 16);
      }
    }
  }

  return { top, left };
}

// Generic handler for quick edit actions
function createQuickEditHandler(
  editorType: keyof ModalStates,
  config: PopupConfig,
  currentEditor: EditorPosition | null,
  setModal: (payload: Partial<ModalStates>) => void,
  triggerPreload: boolean = true
) {
  return (event: React.MouseEvent, articleId: string) => {
    event.stopPropagation();

    // Trigger smart preload when opening popup
    if (triggerPreload) {
      SmartPreloader.triggerSmartPreload('click');
    }

    // Close other editors
    const closeOthers: Partial<ModalStates> = {
      quickTagsEditor: null,
      quickAuthorEditor: null,
      quickCategoryEditor: null,
      quickStatusEditor: null,
      quickTitleEditor: null
    };

    // Toggle: if same article editor is open, close it
    if (currentEditor?.articleId === articleId) {
      setModal({ [editorType]: null });
      return;
    }

    // Calculate position
    const position = calculatePopupPosition(event, config);

    // Set the specific editor
    setModal({
      ...closeOthers,
      [editorType]: {
        articleId,
        position
      }
    });
  };
}

export function useQuickEditHandlers(
  modals: ModalStates,
  setModal: (payload: Partial<ModalStates>) => void
) {
  const handleQuickTagsEdit = createQuickEditHandler(
    'quickTagsEditor',
    POPUP_CONFIGS.tags,
    modals.quickTagsEditor,
    setModal
  );

  const handleQuickAuthorEdit = createQuickEditHandler(
    'quickAuthorEditor',
    POPUP_CONFIGS.author,
    modals.quickAuthorEditor,
    setModal
  );

  const handleQuickCategoryEdit = createQuickEditHandler(
    'quickCategoryEditor',
    POPUP_CONFIGS.category,
    modals.quickCategoryEditor,
    setModal
  );

  const handleQuickStatusEdit = createQuickEditHandler(
    'quickStatusEditor',
    POPUP_CONFIGS.status,
    modals.quickStatusEditor,
    setModal,
    false // No preload for status editor
  );

  const handleQuickTitleEdit = createQuickEditHandler(
    'quickTitleEditor',
    POPUP_CONFIGS.title,
    modals.quickTitleEditor,
    setModal,
    false // No preload for title editor
  );

  return {
    handleQuickTagsEdit,
    handleQuickAuthorEdit,
    handleQuickCategoryEdit,
    handleQuickStatusEdit,
    handleQuickTitleEdit
  };
}
