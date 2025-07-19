import { useEffect, useRef } from 'react';

interface UseViewTrackingOptions {
  articleId: string;
  delay?: number; // Delay in milliseconds before tracking
}

export function useViewTracking({
  articleId,
  delay = 500 // Track after 500ms to ensure page is loaded
}: UseViewTrackingOptions) {
  const hasTracked = useRef(false);

  const trackView = async () => {
    if (hasTracked.current) return;

    try {


      const response = await fetch('/api/track-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      const result = await response.json();

      if (result.success) {
        hasTracked.current = true;
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  useEffect(() => {
    // Track view immediately when component mounts
    const timeoutId = setTimeout(trackView, delay);

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [articleId, delay]);

  return {
    trackView: () => {
      if (!hasTracked.current) {
        trackView();
      }
    },
    hasTracked: hasTracked.current
  };
}

// Main hook for immediate tracking on page access
export function useArticleViewTracking(articleId: string) {
  return useViewTracking({
    articleId,
    delay: 500 // Track after 500ms
  });
}

// Alternative with no delay (immediate)
export function useInstantViewTracking(articleId: string) {
  return useViewTracking({
    articleId,
    delay: 0 // Track immediately
  });
}
