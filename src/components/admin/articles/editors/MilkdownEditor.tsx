import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Crepe } from '@milkdown/crepe';

// Import CSS cho Milkdown theme
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

interface MilkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  disabled?: boolean;
}

export default function MilkdownEditor({
  value,
  onChange,
  placeholder = "Bắt đầu viết nội dung tuyệt vời của bạn...",
  className = "",
  height = "780px",
  disabled = false
}: MilkdownEditorProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const lastValueRef = useRef<string>(value);
  const isUpdatingRef = useRef<boolean>(false);

  // Debounced onChange với better logic
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      if (newValue !== lastValueRef.current && !isUpdatingRef.current) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    }, 500), // Tăng debounce time để ổn định hơn
    [onChange]
  );

  // Check if we're on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !divRef.current || disabled) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    const initializeEditor = async () => {
      try {
        console.log('Initializing Milkdown editor...');

        const crepe = new Crepe({
          root: divRef.current!,
          defaultValue: value || '',
          features: {
            // Chỉ bật các features cơ bản để tránh conflict
            [Crepe.Feature.CodeMirror]: false, // Tắt CodeMirror để tránh conflict
            [Crepe.Feature.BlockEdit]: false,  // Tắt block edit để đơn giản
            [Crepe.Feature.Cursor]: true,
            [Crepe.Feature.History]: true,
            [Crepe.Feature.Clipboard]: true,
            [Crepe.Feature.Indent]: true,
            [Crepe.Feature.Upload]: false,     // Tắt upload để đơn giản
            [Crepe.Feature.Tooltip]: false,   // Tắt tooltip để tránh conflict
            [Crepe.Feature.Slash]: false,     // Tắt slash command để tránh conflict
            [Crepe.Feature.Diagram]: false,
            [Crepe.Feature.Math]: false,
          },
        });

        // Setup listener đơn giản hơn
        crepe.on(listener => {
          listener.markdownUpdated((_, markdown) => {
            if (mounted && !isUpdatingRef.current) {
              debouncedOnChange(markdown);
            }
          });
        });

        await crepe.create();

        if (mounted) {
          crepeRef.current = crepe;
          lastValueRef.current = value;
          setIsLoading(false);
          console.log('Milkdown editor initialized successfully');
        }
      } catch (err) {
        console.error('Failed to initialize Milkdown editor:', err);
        if (mounted) {
          setError('Không thể khởi tạo trình soạn thảo. Vui lòng thử lại.');
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
  }, [isClient, disabled]); // Bỏ value và debouncedOnChange khỏi dependencies

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (crepeRef.current && value !== undefined && value !== lastValueRef.current) {
      isUpdatingRef.current = true;
      try {
        // Sử dụng timeout để tránh conflict với user input
        setTimeout(() => {
          if (crepeRef.current) {
            const currentContent = crepeRef.current.getMarkdown?.() || '';
            if (currentContent !== value) {
              crepeRef.current.setMarkdown?.(value);
              lastValueRef.current = value;
            }
          }
          isUpdatingRef.current = false;
        }, 100);
      } catch (e) {
        console.warn('Error updating editor content:', e);
        isUpdatingRef.current = false;
      }
    }
  }, [value]);

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
          milkdown-editor w-full border border-gray-200 dark:border-gray-600 rounded-lg 
          bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-200
        `}
        style={{ height, minHeight: '400px' }}
      />
    </div>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
