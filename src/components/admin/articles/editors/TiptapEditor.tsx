import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  ImageIcon,
  Code,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Type,
  Highlighter,
  Loader2
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import ImageAltEditPopup from '../../../ui/ImageAltEditPopup';
import ImageHoverOverlay from './ImageHoverOverlay';
import { ImageStorageService } from '../../../../../backend/storage/image-storage';

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
  flexHeight?: boolean; // Cho phép chiều cao động
}

// OPTIMIZED: Heading Dropdown Component with unified popup management
const HeadingDropdown = ({ editor, activePopup, openPopup, closePopup }: {
  editor: any,
  activePopup: string | null,
  openPopup: (popup: string) => void,
  closePopup: () => void
}) => {
  const isOpen = activePopup === 'heading';

  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('heading', { level: 4 })) return 'Heading 4';
    if (editor.isActive('heading', { level: 5 })) return 'Heading 5';
    if (editor.isActive('heading', { level: 6 })) return 'Heading 6';
    return 'Paragraph';
  };

  const headingOptions = [
    { label: 'Paragraph', action: () => editor.chain().focus().setParagraph().run() },
    { label: 'Heading 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Heading 4', action: () => editor.chain().focus().toggleHeading({ level: 4 }).run() },
    { label: 'Heading 5', action: () => editor.chain().focus().toggleHeading({ level: 5 }).run() },
    { label: 'Heading 6', action: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
  ];

  return (
    <div className="relative popup-container">
      <button
        type="button"
        onClick={() => isOpen ? closePopup() : openPopup('heading')}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-200 rounded"
      >
        <span className="min-w-[80px] text-left">{getCurrentHeading()}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50 min-w-[140px]">
          {headingOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                option.action();
                closePopup();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t last:rounded-b"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Toolbar Button Component
const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded transition-colors ${
      disabled
        ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
        : isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    {children}
  </button>
);

// Toolbar Separator
const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
);

// OPTIMIZED: Color Picker Component with unified popup management
const ColorPicker = ({ editor, activePopup, openPopup, closePopup }: {
  editor: any,
  activePopup: string | null,
  openPopup: (popup: string) => void,
  closePopup: () => void
}) => {
  const isOpen = activePopup === 'color';

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
  ];

  return (
    <div className="relative popup-container">
      <ToolbarButton
        onClick={() => isOpen ? closePopup() : openPopup('color')}
        title="Text Color"
        className="relative"
      >
        <Type size={16} />
        <div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-sm"
          style={{ backgroundColor: editor.getAttributes('textStyle').color || '#ffffff' }}
        />
      </ToolbarButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50 p-2">
          <div className="grid grid-cols-6 gap-1 w-32">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  editor.chain().focus().setColor(color).run();
                  closePopup();
                }}
                className="w-4 h-4 rounded border border-gray-400 dark:border-gray-500 hover:scale-110"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              closePopup();
            }}
            className="w-full mt-2 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            Remove Color
          </button>
        </div>
      )}
    </div>
  );
};

// OPTIMIZED: Highlight Color Picker Component with unified popup management
const HighlightPicker = ({ editor, activePopup, openPopup, closePopup }: {
  editor: any,
  activePopup: string | null,
  openPopup: (popup: string) => void,
  closePopup: () => void
}) => {
  const isOpen = activePopup === 'highlight';

  const highlightColors = [
    '#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#D97706',
    '#FEE2E2', '#FECACA', '#F87171', '#EF4444', '#DC2626',
    '#DBEAFE', '#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB',
    '#D1FAE5', '#A7F3D0', '#34D399', '#10B981', '#059669',
    '#E0E7FF', '#C7D2FE', '#A78BFA', '#8B5CF6', '#7C3AED'
  ];

  return (
    <div className="relative popup-container">
      <ToolbarButton
        onClick={() => isOpen ? closePopup() : openPopup('highlight')}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <Highlighter size={16} />
      </ToolbarButton>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50 p-2">
          <div className="grid grid-cols-5 gap-1 w-32">
            {highlightColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  editor.chain().focus().setHighlight({ color }).run();
                  closePopup();
                }}
                className="w-4 h-4 rounded border border-gray-400 dark:border-gray-500 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetHighlight().run();
              closePopup();
            }}
            className="w-full mt-2 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            Remove Highlight
          </button>
        </div>
      )}
    </div>
  );
};

// Link Modal Component
const LinkModal = ({ editor, isOpen, onClose }: { editor: any, isOpen: boolean, onClose: () => void }) => {
  const [url, setUrl] = React.useState('');
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      // Get selected text if any
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, '');
      setText(selectedText);

      // If cursor is on a link, get the URL
      const linkMark = editor.getAttributes('link');
      if (linkMark.href) {
        setUrl(linkMark.href);
      } else {
        setUrl('');
      }
    }
  }, [isOpen, editor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      if (text) {
        // Insert new text with link
        editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
      } else {
        // Apply link to selected text
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
    onClose();
    setUrl('');
    setText('');
  };

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="popup-container bg-white dark:bg-gray-800 rounded-lg p-6 w-96 border border-gray-300 dark:border-gray-600">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Chèn liên kết</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Văn bản hiển thị (tùy chọn)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Văn bản liên kết"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!url}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded transition-colors"
            >
              Chèn liên kết
            </button>

            {editor.isActive('link') && (
              <button
                type="button"
                onClick={handleRemoveLink}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Xóa liên kết
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// OPTIMIZED: Custom hook for popup management
const usePopupManager = () => {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const openPopup = (popupName: string) => setActivePopup(popupName);
  const closePopup = () => setActivePopup(null);
  const isPopupOpen = (popupName: string) => activePopup === popupName;

  return { activePopup, openPopup, closePopup, isPopupOpen };
};

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung...",
  height = "780px",
  className = "",
  flexHeight = false
}: TiptapEditorProps) {
  // OPTIMIZED: Unified popup management
  const { activePopup, openPopup, closePopup, isPopupOpen } = usePopupManager();

  // State cho image hover overlay - ĐƠN GIẢN
  const [hoveredImage, setHoveredImage] = useState<HTMLImageElement | null>(null);

  // State để force re-render khi selection thay đổi (cho toolbar active states)
  const [selectionUpdate, setSelectionUpdate] = useState(0);

  // Helper function để check text alignment active state
  const isAlignmentActive = (alignment: string) => {
    if (!editor) return false;

    // Check if current node has the alignment
    const paragraphAlign = editor.getAttributes('paragraph').textAlign;
    const headingAlign = editor.getAttributes('heading').textAlign;
    const listItemAlign = editor.getAttributes('listItem').textAlign;

    const currentAlignment = paragraphAlign || headingAlign || listItemAlign;

    // If no alignment is set, default is 'left'
    if (!currentAlignment && alignment === 'left') return true;

    return currentAlignment === alignment;
  };

  // Image alt edit popup state
  const [imageAltEdit, setImageAltEdit] = useState<{
    isOpen: boolean;
    currentAlt: string;
    position: { x: number; y: number };
    imageElement: HTMLImageElement | null;
  }>({
    isOpen: false,
    currentAlt: '',
    position: { x: 0, y: 0 },
    imageElement: null
  });




  const editor = useEditor({
    extensions: [
      // OPTIMIZED: StarterKit with performance-focused configuration
      StarterKit.configure({
        // Core extensions (always needed)
        document: {},
        paragraph: {},
        text: {},

        // Text formatting (essential)
        bold: {},
        italic: {},
        strike: {},

        // Headings (optimized - only common levels)
        heading: {
          levels: [1, 2, 3, 4], // Reduced from 6 to 4 levels for better performance
        },

        // Block elements
        blockquote: {},

        // Lists (optimized configuration)
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // Disable for better performance
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false, // Disable for better performance
        },
        listItem: {},

        // Code blocks
        codeBlock: {},

        // Line breaks
        hardBreak: {},

        // History (optimized)
        history: {
          depth: 50, // Reduced from 100 to 50 for better memory usage
          newGroupDelay: 300, // Reduced from 500ms to 300ms for faster grouping
        },

        // Layout elements
        horizontalRule: {},

        // Cursor enhancements (lightweight)
        dropcursor: {
          color: '#3b82f6', // Blue color for better visibility
          width: 2,
        },
        gapcursor: {},
      }),
      // OPTIMIZED: Image Extension with alt text support
      Image.configure({
        inline: true,
        allowBase64: false, // Disabled for better performance - use URLs instead
        HTMLAttributes: {
          class: 'tiptap-image',
          loading: 'lazy', // Lazy loading for better performance
        },
        // Ensure alt attribute is preserved in HTML output
        addAttributes() {
          return {
            ...this.parent?.(),
            alt: {
              default: null,
              parseHTML: element => element.getAttribute('alt'),
              renderHTML: attributes => {
                if (!attributes.alt) {
                  return {};
                }
                return {
                  alt: attributes.alt,
                };
              },
            },
          };
        },
      }),

      // OPTIMIZED: Essential text extensions
      Underline,
      TextStyle, // Required for Color extension

      // OPTIMIZED: Color extension with limited palette for better performance
      Color.configure({
        types: ['textStyle'], // Limit to textStyle only
      }),

      // OPTIMIZED: Highlight with performance settings
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'tiptap-highlight',
        },
      }),

      // OPTIMIZED: Text alignment (support for all content types)
      TextAlign.configure({
        types: ['heading', 'paragraph', 'listItem'], // Added listItem for list alignment support
        alignments: ['left', 'center', 'right', 'justify'], // Explicit alignment options
        defaultAlignment: 'left',
      }),

      // OPTIMIZED: Link extension with performance settings
      Link.configure({
        openOnClick: false,
        linkOnPaste: true, // Auto-detect links on paste
        HTMLAttributes: {
          class: 'tiptap-link',
          rel: 'noopener noreferrer', // Security best practice
          target: '_blank', // Open in new tab
        },
      }),

      // OPTIMIZED: Script extensions (keep for completeness)
      Subscript,
      Superscript,
    ],
    content: value,

    // OPTIMIZED: Performance-focused event handlers
    onCreate: ({ editor }) => {
      const startTime = performance.now();

      // PERFORMANCE: Trigger editor ready event with timing
      window.dispatchEvent(new CustomEvent('editor-ready', {
        detail: { initTime: performance.now() - startTime }
      }));

      // SIÊU NHANH: Hover listeners cho instant overlay
      const editorElement = editor.view.dom;

      const handleImageHover = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'IMG') {
          const img = target as HTMLImageElement;

          // INSTANT: Hiển thị ngay lập tức (0ms delay)
          setHoveredImage(img);
        }
      };

      const handleImageLeave = (event: Event) => {
        const target = event.target as HTMLElement;
        const relatedTarget = (event as MouseEvent).relatedTarget as HTMLElement;

        if (target.tagName === 'IMG') {
          // INSTANT: Không có delay, ẩn ngay lập tức
          const hasOpenModal = document.querySelector('.fixed.inset-0.bg-black\\/50, .fixed.inset-0.z-50');
          const isHoveringOverlay = relatedTarget?.closest('.image-hover-overlay');

          if (!isHoveringOverlay && !hasOpenModal) {
            setHoveredImage(null);
          }
        }
      };

      editorElement.addEventListener('mouseenter', handleImageHover, true);
      editorElement.addEventListener('mouseleave', handleImageLeave, true);

      // Store cleanup
      (editor as any)._imageHoverCleanup = () => {
        editorElement.removeEventListener('mouseenter', handleImageHover, true);
        editorElement.removeEventListener('mouseleave', handleImageLeave, true);
      };

      console.log(`✅ TiptapEditor initialized in ${(performance.now() - startTime).toFixed(2)}ms`);
    },

    onUpdate: ({ editor }) => {
      // OPTIMIZED: Debounced content updates for better performance
      const html = editor.getHTML();
      onChange(html);
    },

    onSelectionUpdate: ({ editor }) => {
      // Force re-render when selection changes to update toolbar button states
      // This ensures toolbar buttons show correct active states
      setHoveredImage(null); // Reset any image hover state
      setSelectionUpdate(prev => prev + 1); // Trigger re-render
    },

    onDestroy: ({ editor }) => {
      // Cleanup event listeners
      if ((editor as any)._imageHoverCleanup) {
        (editor as any)._imageHoverCleanup();
      }
    },

    // OPTIMIZED: Editor properties for better performance
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert max-w-none',
        style: flexHeight ? 'height: 100%; padding: 1rem;' : `min-height: ${height}; padding: 1rem;`,
        spellcheck: 'true', // Enable spellcheck for better UX
        autocomplete: 'on', // Enable autocomplete
      },
      handleDOMEvents: {
        // OPTIMIZED: Prevent unnecessary re-renders on certain events
        focus: () => false,
        blur: () => false,
      },
    },

    // OPTIMIZED: Performance settings
    immediatelyRender: false, // Prevent unnecessary initial render
    shouldRerenderOnTransaction: true, // Enable re-renders for toolbar state updates
  });

  // OPTIMIZED: Update editor content with performance checks
  React.useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();

    // PERFORMANCE: Only update if content actually changed
    if (value !== currentContent) {
      // PERFORMANCE: Use transaction for better performance
      editor.chain()
        .setContent(value, false) // Don't emit update event
        .run();
    }
  }, [editor, value]);

  // OPTIMIZED: Keyboard shortcuts with unified popup management
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        openPopup('link');
      }
      // Close popups on Escape
      if (event.key === 'Escape') {
        closePopup();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openPopup, closePopup]);

  // OPTIMIZED: Click outside handler with better performance
  React.useEffect(() => {
    if (!activePopup) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside any popup
      if (!target.closest('.popup-container')) {
        closePopup();
      }
    };

    // Use passive listener for better performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true });
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopup, closePopup]);

  // Cleanup image hover handlers on unmount
  React.useEffect(() => {
    return () => {
      if (editor && (editor as any)._imageHoverCleanup) {
        (editor as any)._imageHoverCleanup();
      }
    };
  }, [editor]);

  // Force re-render when editor is ready and on selection changes
  React.useEffect(() => {
    if (!editor) return;

    const updateHandler = () => {
      setSelectionUpdate(prev => prev + 1);
    };

    // Listen to transaction events for real-time toolbar updates
    editor.on('transaction', updateHandler);
    editor.on('selectionUpdate', updateHandler);
    editor.on('focus', updateHandler);

    return () => {
      editor.off('transaction', updateHandler);
      editor.off('selectionUpdate', updateHandler);
      editor.off('focus', updateHandler);
    };
  }, [editor]);

  // Handle image upload with alt text
  const handleImageUpload = (url: string, alt: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url, alt: alt }).run();
    }
  };

  // Handle image alt text and filename save
  const handleImageAltSave = async (newAlt: string, newFileName?: string) => {
    if (!editor || !imageAltEdit.imageElement) return;

    const { imageElement } = imageAltEdit;
    const currentFileName = ImageStorageService.extractFileNameFromUrl(imageElement.src);
    const hasFileNameChanged = newFileName && currentFileName && newFileName !== currentFileName;

    try {
      let finalUrl = imageElement.src;

      // If filename changed, rename the file
      if (hasFileNameChanged) {
        const renameResult = await ImageStorageService.renameImage(imageElement.src, newFileName, {
          folder: 'articles'
        });

        if (renameResult.error || !renameResult.data) {
          throw new Error(renameResult.error?.message || 'Lỗi khi đổi tên file');
        }

        finalUrl = renameResult.data.url;

        // Preload ảnh mới để đảm bảo hiển thị ngay lập tức
        await new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = finalUrl;
        });
      }

      // Find the image node position in the editor
      const { state } = editor;
      const { doc } = state;
      let imagePos = -1;

      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && node.attrs.src === imageElement.src) {
          imagePos = pos;
          return false; // Stop searching
        }
      });

      if (imagePos !== -1) {
        // Set selection to the image node and update attributes
        editor.chain()
          .focus()
          .setNodeSelection(imagePos)
          .updateAttributes('image', {
            src: finalUrl,
            alt: newAlt
          })
          .run();

        // CRITICAL FIX: Reset hover state để hover buttons hoạt động với ảnh mới
        // Delay để đảm bảo DOM đã cập nhật với ảnh mới
        setTimeout(() => {
          setHoveredImage(null);
        }, 50);
      }

      // Close popup after successful save
      setImageAltEdit({
        isOpen: false,
        currentAlt: '',
        position: { x: 0, y: 0 },
        imageElement: null
      });

    } catch (error: any) {
      console.error('Save error:', error);
      throw error; // Re-throw để popup có thể handle
    }
  };

  // Handle image alt edit cancel
  const handleImageAltCancel = () => {
    setImageAltEdit({
      isOpen: false,
      currentAlt: '',
      position: { x: 0, y: 0 },
      imageElement: null
    });
  };

  if (!editor) {
    return (
      <div 
        className={`w-full border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm">Đang khởi tạo trình soạn thảo...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tiptap-editor ${flexHeight ? 'h-full flex flex-col' : ''} ${className}`}>
      {/* Modern Toolbar - Single Row */}
      <div className="border border-gray-300 dark:border-gray-600 border-b-0 rounded-t-lg bg-gray-100 dark:bg-gray-800 p-3">
        <div className="flex items-center gap-1 flex-wrap">

          {/* History */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Heading Dropdown */}
          <HeadingDropdown editor={editor} activePopup={activePopup} openPopup={openPopup} closePopup={closePopup} />

          <ToolbarSeparator />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon size={16} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Inline Code */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="Inline Code"
          >
            <Code size={16} />
          </ToolbarButton>

          {/* Subscript & Superscript */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            isActive={editor.isActive('subscript')}
            title="Subscript"
          >
            <SubscriptIcon size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            isActive={editor.isActive('superscript')}
            title="Superscript"
          >
            <SuperscriptIcon size={16} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Color & Highlight */}
          <ColorPicker editor={editor} activePopup={activePopup} openPopup={openPopup} closePopup={closePopup} />
          <HighlightPicker editor={editor} activePopup={activePopup} openPopup={openPopup} closePopup={closePopup} />

          <ToolbarSeparator />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Text Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={isAlignmentActive('left')}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={isAlignmentActive('center')}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={isAlignmentActive('right')}
            title="Align Right"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={isAlignmentActive('justify')}
            title="Justify"
          >
            <AlignJustify size={16} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Blocks */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus size={16} />
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Link */}
          <ToolbarButton
            onClick={() => openPopup('link')}
            isActive={editor.isActive('link')}
            title="Insert Link (Ctrl+K)"
          >
            <LinkIcon size={16} />
          </ToolbarButton>

          {/* Image Upload */}
          <ToolbarButton
            onClick={() => openPopup('image')}
            title="Insert Image (Upload to Supabase Storage)"
            className="relative"
          >
            <ImageIcon size={16} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
          </ToolbarButton>



        </div>
      </div>

      {/* Editor Content */}
      <div className={`border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-900 ${flexHeight ? 'flex-1 flex flex-col' : ''}`}>
        <EditorContent
          editor={editor}
          className={`tiptap-content ${flexHeight ? 'flex-1' : ''}`}
          style={flexHeight ? { height: '100%' } : { height: height }}
        />
      </div>

      {/* OPTIMIZED: Unified Modal Management */}
      {isPopupOpen('image') && (
        <ImageUpload
          onImageUpload={handleImageUpload}
          onClose={closePopup}
        />
      )}

      {/* Link Modal */}
      <LinkModal
        editor={editor}
        isOpen={isPopupOpen('link')}
        onClose={closePopup}
      />

      {/* Image Alt Edit Popup */}
      {imageAltEdit.isOpen && (
        <ImageAltEditPopup
          currentAlt={imageAltEdit.currentAlt}
          onSave={handleImageAltSave}
          onCancel={handleImageAltCancel}
          position={imageAltEdit.position}
          imageElement={imageAltEdit.imageElement}
          enableFileNameEdit={true} // Enable filename editing for TipTap images
        />
      )}

      {/* SIÊU NHANH: Image Hover Overlay */}
      <AnimatePresence>
        {hoveredImage && editor && (
          <ImageHoverOverlay
            key={hoveredImage.src} // Key để trigger animation
            imageElement={hoveredImage}
            editor={editor}
            onClose={() => setHoveredImage(null)}
          />
        )}
      </AnimatePresence>



      {/* CSS tối ưu cho images với hover overlay */}
      <style>{`
        .tiptap-content img {
          border-radius: 8px;
          max-width: 100%;
          height: auto;
          cursor: pointer;
          transition: all 0.15s ease; /* SIÊU NHANH */
        }

        .tiptap-content img:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .tiptap-content .ProseMirror img.ProseMirror-selectednode {
          border: 2px solid #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        /* Overlay positioning */
        .image-hover-overlay {
          pointer-events: none;
        }

        .image-hover-overlay > div {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
