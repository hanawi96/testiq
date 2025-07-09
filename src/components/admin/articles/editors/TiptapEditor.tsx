import React, { useState } from 'react';
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
  Plus,
  Code,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Type,
  Palette,
  Highlighter
} from 'lucide-react';
import ImageUpload from './ImageUpload';

interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
  className?: string;
  flexHeight?: boolean; // Cho phép chiều cao động
}

// Heading Dropdown Component
const HeadingDropdown = ({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
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
                setIsOpen(false);
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

// Color Picker Component
const ColorPicker = ({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
    '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E'
  ];

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
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
                  setIsOpen(false);
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
              editor.chain().focus().unsetColor().run();
              setIsOpen(false);
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

// Highlight Color Picker Component
const HighlightPicker = ({ editor }: { editor: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  const highlightColors = [
    '#FEF3C7', '#FDE68A', '#FCD34D', '#F59E0B', '#D97706',
    '#FEE2E2', '#FECACA', '#F87171', '#EF4444', '#DC2626',
    '#DBEAFE', '#BFDBFE', '#60A5FA', '#3B82F6', '#2563EB',
    '#D1FAE5', '#A7F3D0', '#34D399', '#10B981', '#059669',
    '#E0E7FF', '#C7D2FE', '#A78BFA', '#8B5CF6', '#7C3AED'
  ];

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setIsOpen(!isOpen)}
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
                  setIsOpen(false);
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
              setIsOpen(false);
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
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 border border-gray-300 dark:border-gray-600">
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

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung...",
  height = "780px",
  className = "",
  flexHeight = false
}: TiptapEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Document - Gốc của editor (enabled by default)
        document: {},
        // Paragraph - Đoạn văn bình thường (enabled by default)
        paragraph: {},
        // Text - Xử lý text (enabled by default)
        text: {},
        // Bold - In đậm
        bold: {},
        // Italic - In nghiêng
        italic: {},
        // Strike - Gạch ngang
        strike: {},
        // Heading - Tiêu đề (H1-H6)
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        // Blockquote - Trích dẫn
        blockquote: {},
        // BulletList - Danh sách không thứ tự
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // OrderedList - Danh sách có thứ tự
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        // ListItem - Item trong danh sách
        listItem: {},
        // CodeBlock - Khối mã có highlight
        codeBlock: {},
        // HardBreak - Xuống dòng bằng Shift+Enter
        hardBreak: {},
        // History - Undo / Redo
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
        // Horizontal Rule - Đường kẻ ngang
        horizontalRule: {},
        // Dropcursor - Con trỏ khi kéo thả
        dropcursor: {},
        // Gapcursor - Con trỏ trong khoảng trống
        gapcursor: {},
      }),
      // Image Extension
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      // Additional Extensions
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Subscript,
      Superscript,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert max-w-none',
        style: flexHeight ? 'height: 100%; padding: 1rem;' : `min-height: ${height}; padding: 1rem;`,
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        setShowLinkModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle image upload
  const handleImageUpload = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
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
          <HeadingDropdown editor={editor} />

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
          <ColorPicker editor={editor} />
          <HighlightPicker editor={editor} />

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
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
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
            onClick={() => setShowLinkModal(true)}
            isActive={editor.isActive('link')}
            title="Insert Link (Ctrl+K)"
          >
            <LinkIcon size={16} />
          </ToolbarButton>

          {/* Image Upload */}
          <ToolbarButton
            onClick={() => setShowImageUpload(true)}
            title="Insert Image (Upload to Supabase Storage)"
            className="relative"
          >
            <ImageIcon size={16} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
          </ToolbarButton>

          <ToolbarSeparator />

          {/* Add Button (placeholder for future features) */}
          <ToolbarButton
            onClick={() => {}}
            title="Add"
          >
            <Plus size={16} />
          </ToolbarButton>

        </div>
      </div>

      {/* Editor Content */}
      <div className={`border border-gray-300 dark:border-gray-600 border-t-0 rounded-b-lg bg-white dark:bg-gray-900 ${flexHeight ? 'flex-1 flex flex-col' : ''}`}>
        <EditorContent
          editor={editor}
          className={`tiptap-content ${flexHeight ? 'flex-1' : ''}`}
          style={flexHeight ? { height: '100%' } : { minHeight: height }}
        />
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUpload
          onImageUpload={handleImageUpload}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {/* Link Modal */}
      <LinkModal
        editor={editor}
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
}
