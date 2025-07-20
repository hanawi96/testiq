import React from 'react';
import type { Category, CreateArticleData, AuthorOption, Article } from '../../../../../backend';

// ===== INTERFACES =====
interface ArticleEditorProps {
  articleId?: string; // Nếu có = edit mode, không có = create mode
  onSave?: (article: Article) => void;
  onCancel?: () => void;
}

// ===== CONSTANTS =====
// Fallback authors for when database is not available
const FALLBACK_AUTHORS = [
  {
    id: '1',
    name: 'Nguyễn Minh Tuấn',
    email: 'tuan@iqtest.com',
    role: 'Editor'
  },
  {
    id: '2',
    name: 'Trần Thị Hương',
    email: 'huong@iqtest.com',
    role: 'Content Writer'
  },
  {
    id: '3',
    name: 'Lê Văn Đức',
    email: 'duc@iqtest.com',
    role: 'Senior Writer'
  },
  {
    id: '4',
    name: 'Phạm Thị Lan',
    email: 'lan@iqtest.com',
    role: 'Research Writer'
  }
];

// ===== SKELETON COMPONENTS MOVED =====
// Skeleton components đã được tách ra file riêng: components/SkeletonComponents.tsx



// ===== DROPDOWN SECTION MOVED =====
// DropdownSection component đã được tách ra file riêng: components/DropdownSection.tsx

// ===== EXPORTS =====
export {
  // Types
  type ArticleEditorProps,

  // Constants
  FALLBACK_AUTHORS,

  // Skeleton Components - MOVED TO components/SkeletonComponents.tsx

  // UI Components - MOVED TO components/DropdownSection.tsx
};
