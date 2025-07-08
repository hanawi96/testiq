import React, { useRef, useEffect, useState } from 'react';

interface ToastEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: string;
}

export default function ToastEditor({ 
  content, 
  onChange, 
  placeholder = "Viết nội dung bài viết...",
  height = "400px" 
}: ToastEditorProps) {
  const editorRef = useRef<any>(null);
  const [Editor, setEditor] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamic import chỉ khi ở client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.all([
        import('@toast-ui/react-editor').then(mod => mod.Editor),
        import('@toast-ui/editor/dist/toastui-editor.css')
      ]).then(([EditorComponent]) => {
        setEditor(() => EditorComponent);
        setIsLoaded(true);
      }).catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && editorRef.current && content !== editorRef.current.getInstance().getMarkdown()) {
      const editorInstance = editorRef.current.getInstance();
      editorInstance.setMarkdown(content);
    }
  }, [content, isLoaded]);

  const handleChange = () => {
    if (editorRef.current) {
      const editorInstance = editorRef.current.getInstance();
      const markdown = editorInstance.getMarkdown();
      onChange(markdown);
    }
  };

  // Add custom styles with dark mode support
  useEffect(() => {
    if (!isLoaded) return;

    const style = document.createElement('style');
    style.textContent = `
      .toast-editor-wrapper .toastui-editor-defaultUI {
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
      }

      .toast-editor-wrapper .toastui-editor-toolbar {
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }

      .toast-editor-wrapper .toastui-editor-md-container {
        background-color: white;
      }

      .toast-editor-wrapper .toastui-editor-md-preview {
        background-color: #f9fafb;
      }

      .toast-editor-wrapper .toastui-editor-md-splitter {
        background-color: #e5e7eb;
      }

      .toast-editor-wrapper .toastui-editor-toolbar-icons {
        color: #4b5563;
      }

      .toast-editor-wrapper .toastui-editor-toolbar-icons:hover {
        color: #3b82f6;
      }

      /* Dark mode styles */
      .dark .toast-editor-wrapper .toastui-editor-defaultUI {
        border: 1px solid #4b5563;
      }

      .dark .toast-editor-wrapper .toastui-editor-toolbar {
        background-color: #374151;
        border-bottom: 1px solid #4b5563;
      }

      .dark .toast-editor-wrapper .toastui-editor-md-container {
        background-color: #1f2937;
        color: #f3f4f6;
      }

      .dark .toast-editor-wrapper .toastui-editor-md-preview {
        background-color: #111827;
        color: #f3f4f6;
      }

      .dark .toast-editor-wrapper .toastui-editor-md-splitter {
        background-color: #4b5563;
      }

      .dark .toast-editor-wrapper .toastui-editor-toolbar-icons {
        color: #d1d5db;
      }

      .dark .toast-editor-wrapper .toastui-editor-toolbar-icons:hover {
        color: #60a5fa;
      }

      .dark .toast-editor-wrapper .toastui-editor-md-container .toastui-editor {
        background-color: #1f2937;
        color: #f3f4f6;
      }

      .dark .toast-editor-wrapper .toastui-editor-md-container .CodeMirror {
        background-color: #1f2937;
        color: #f3f4f6;
      }

      .dark .toast-editor-wrapper .toastui-editor-md-container .CodeMirror-cursor {
        border-left: 1px solid #f3f4f6;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [isLoaded]);

  // Loading state
  if (!isLoaded || !Editor) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="toast-editor-wrapper">
      <Editor
        ref={editorRef}
        initialValue={content}
        placeholder={placeholder}
        previewStyle="vertical"
        height={height}
        initialEditType="markdown"
        useCommandShortcut={true}
        hideModeSwitch={false}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'image', 'link'],
          ['code', 'codeblock'],
          ['scrollSync']
        ]}
        onChange={handleChange}
      />
    </div>
  );
} 