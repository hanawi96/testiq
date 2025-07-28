/**
 * Article Editors Entry Point
 * Separate entry for heavy editing components
 * This prevents them from being bundled with the articles list
 */

// Heavy editing components
export { default as ArticleEditor } from './editors/ArticleEditor';
export { default as TiptapEditor } from './editors/TiptapEditor';

// Editor-specific components
export * from './editors/components';
export * from './editors/layouts';

// Media components (heavy)
export { default as MediaManager } from '../media/MediaManager';
export { default as ImageCropper } from '../../ui/ImageCropper';

// Create/Edit specific
export * from './create';
export * from './modals';

// Editor utilities
export * from './editors/utils';
export * from './editors/hooks';
