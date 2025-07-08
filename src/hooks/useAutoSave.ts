import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  delay?: number; // milliseconds
  enabled?: boolean;
  dependencies?: any[];
}

interface UseAutoSaveReturn {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  triggerAutoSave: () => void;
  cancelAutoSave: () => void;
}

export function useAutoSave({
  data,
  onSave,
  delay = 30000, // 30 seconds default
  enabled = true,
  dependencies = []
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAutoSavingRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);
  const lastDataRef = useRef<string>('');

  // Cancel existing timeout
  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Trigger auto-save immediately
  const triggerAutoSave = useCallback(async () => {
    if (isAutoSavingRef.current || !enabled) return;

    const currentDataString = JSON.stringify(data);
    
    // Don't save if data hasn't changed
    if (currentDataString === lastDataRef.current) return;

    isAutoSavingRef.current = true;
    
    try {
      await onSave(data);
      lastSavedRef.current = new Date();
      lastDataRef.current = currentDataString;
      
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('auto-save-success', {
        detail: { timestamp: lastSavedRef.current }
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('auto-save-error', {
        detail: { error }
      }));
    } finally {
      isAutoSavingRef.current = false;
    }
  }, [data, onSave, enabled]);

  // Set up auto-save timer
  useEffect(() => {
    if (!enabled) return;

    const currentDataString = JSON.stringify(data);
    
    // Don't set timer if data hasn't changed
    if (currentDataString === lastDataRef.current) return;

    // Cancel existing timeout
    cancelAutoSave();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      triggerAutoSave();
    }, delay);

    return cancelAutoSave;
  }, [data, delay, enabled, triggerAutoSave, cancelAutoSave, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAutoSave();
    };
  }, [cancelAutoSave]);

  return {
    isAutoSaving: isAutoSavingRef.current,
    lastSaved: lastSavedRef.current,
    triggerAutoSave,
    cancelAutoSave
  };
}

// Hook for unsaved changes warning
export function useUnsavedChanges(hasChanges: boolean, message?: string) {
  useEffect(() => {
    const defaultMessage = 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang?';
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = message || defaultMessage;
        return message || defaultMessage;
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasChanges) {
        const shouldLeave = window.confirm(message || defaultMessage);
        if (!shouldLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    if (hasChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasChanges, message]);
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Build shortcut string
      let shortcut = '';
      if (ctrl) shortcut += 'ctrl+';
      if (shift) shortcut += 'shift+';
      if (alt) shortcut += 'alt+';
      shortcut += key;

      // Execute shortcut if found
      if (shortcuts[shortcut]) {
        e.preventDefault();
        shortcuts[shortcut]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Hook for form validation
export function useFormValidation<T>(
  data: T,
  rules: Record<keyof T, (value: any) => string | null>
) {
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = rules[field];
    return rule ? rule(value) : null;
  }, [rules]);

  const validateAll = useCallback((): Record<keyof T, string | null> => {
    const errors = {} as Record<keyof T, string | null>;
    
    Object.keys(rules).forEach((field) => {
      const key = field as keyof T;
      errors[key] = validateField(key, data[key]);
    });

    return errors;
  }, [data, rules, validateField]);

  const isValid = useCallback((): boolean => {
    const errors = validateAll();
    return Object.values(errors).every(error => error === null);
  }, [validateAll]);

  return {
    validateField,
    validateAll,
    isValid
  };
}
