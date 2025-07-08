import React, { useEffect, useRef, useState } from 'react';
import { Crepe } from '@milkdown/crepe';

// Import CSS cho Milkdown theme
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

interface SimpleMilkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

export default function SimpleMilkdownEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung...",
  className = "",
  height = "780px"
}: SimpleMilkdownEditorProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !divRef.current) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const initializeEditor = async () => {
      try {
        console.log('Initializing Simple Milkdown editor...');
        
        // Tạo editor với config tối giản
        const crepe = new Crepe({
          root: divRef.current!,
          defaultValue: value || '# Tiêu đề\n\nViết nội dung ở đây...',
        });

        // Setup change listener
        crepe.on(listener => {
          listener.markdownUpdated((_, markdown) => {
            if (mounted) {
              // Debounce để tránh quá nhiều updates
              setTimeout(() => {
                onChange(markdown);
              }, 300);
            }
          });
        });

        await crepe.create();
        
        if (mounted) {
          crepeRef.current = crepe;
          setIsLoading(false);
          console.log('Simple Milkdown editor initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize Simple Milkdown editor:', err);
        if (mounted) {
          setError(`Lỗi khởi tạo editor: ${err.message}`);
          setIsLoading(false);
        }
      }
    };

    initializeEditor();

    return () => {
      mounted = false;
      if (crepeRef.current) {
        try {
          crepeRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying editor:', e);
        }
        crepeRef.current = null;
      }
    };
  }, [isClient]);

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center" style={{ height, minHeight: '400px' }}>
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Đang khởi tạo trình soạn thảo...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border border-red-300 dark:border-red-600 rounded-lg p-4 bg-red-50 dark:bg-red-900/20 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Đang khởi tạo trình soạn thảo...</span>
          </div>
        </div>
      )}
      
      <div
        ref={divRef}
        className={`
          simple-milkdown-editor w-full border border-gray-200 dark:border-gray-600 rounded-lg 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-200
        `}
        style={{ height, minHeight: '400px' }}
      />
    </div>
  );
}
