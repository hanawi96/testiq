import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
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
  Link,
  ImageIcon,
  Plus
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
        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600"
      >
        <span className="min-w-[80px] text-left">{getCurrentHeading()}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-50 min-w-[140px]">
          {headingOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                option.action();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 first:rounded-t last:rounded-b"
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
        ? 'text-gray-500 cursor-not-allowed'
        : isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-600 hover:text-white'
    }`}
  >
    {children}
  </button>
);

// Toolbar Separator
const ToolbarSeparator = () => (
  <div className="w-px h-6 bg-gray-600 mx-1"></div>
);

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung...",
  height = "780px",
  className = "",
  flexHeight = false
}: TiptapEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
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
      <div className="border border-gray-600 border-b-0 rounded-t-lg bg-gray-800 p-3">
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
      <div className={`border border-gray-600 border-t-0 rounded-b-lg bg-gray-900 ${flexHeight ? 'flex-1 flex flex-col' : ''}`}>
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
    </div>
  );
}
