import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, Plus } from 'lucide-react';
import { getInstantTagsTabsData, preloadTagsTabsData, isTagsTabsDataReady } from '../../../../../utils/admin/preloaders/tags-tabs-preloader';
import { lowercaseNormalizeTag } from '../../../../../utils/tag-processing';

interface TagsTabsProps {
  selectedTags: string[];
  onTagAdd: (tag: string) => void;
  maxTags?: number;
  disabled?: boolean;
}

type TabType = 'popular' | 'newest';

export default function TagsTabs({
  selectedTags = [],
  onTagAdd,
  maxTags = 20,
  disabled = false
}: TagsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [newestTags, setNewestTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tags data
  useEffect(() => {
    // Set instant data immediately
    const instantData = getInstantTagsTabsData();
    setPopularTags(instantData.popular);
    setNewestTags(instantData.newest);
    
    if (instantData.popular.length > 0 || instantData.newest.length > 0) {
      setIsLoading(false);
    }

    // Load fresh data in background
    if (!isTagsTabsDataReady()) {
      preloadTagsTabsData().then(({ popular, newest }) => {
        setPopularTags(popular);
        setNewestTags(newest);
        setIsLoading(false);
        console.log(`🏷️ TagsTabs: Loaded ${popular.length} popular, ${newest.length} newest tags`);
      }).catch(() => {
        setIsLoading(false);
        console.warn('🏷️ TagsTabs: Failed to load tags');
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // Handle tag click
  const handleTagClick = useCallback((tag: string) => {
    if (disabled) return;
    
    const normalizedTag = lowercaseNormalizeTag(tag);
    const isAlreadySelected = selectedTags.map(t => t.toLowerCase()).includes(normalizedTag.toLowerCase());
    
    if (!isAlreadySelected && selectedTags.length < maxTags) {
      onTagAdd(normalizedTag);
    }
  }, [selectedTags, onTagAdd, maxTags, disabled]);

  // Check if tag is selected
  const isTagSelected = useCallback((tag: string) => {
    return selectedTags.map(t => t.toLowerCase()).includes(tag.toLowerCase());
  }, [selectedTags]);

  // Get current tags based on active tab
  const currentTags = activeTab === 'popular' ? popularTags : newestTags;

  // Filter out already selected tags
  const availableTags = currentTags.filter(tag => !isTagSelected(tag));

  const canAddMore = selectedTags.length < maxTags;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('popular')}
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'popular'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <TrendingUp size={14} />
            <span>Phổ biến</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('newest')}
          className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
            activeTab === 'newest'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50/50 dark:bg-green-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Clock size={14} />
            <span>Mới nhất</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-2.5">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"
                  style={{ width: `${50 + Math.random() * 30}px` }}
                />
              ))}
            </div>
          </div>
        ) : availableTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag, index) => (
              <button
                key={`${activeTab}-${tag}-${index}`}
                onClick={() => handleTagClick(tag)}
                disabled={disabled || !canAddMore}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all duration-200 ${
                  disabled || !canAddMore
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : activeTab === 'popular'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:shadow-sm border border-blue-200 dark:border-blue-800'
                    : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 hover:shadow-sm border border-green-200 dark:border-green-800'
                }`}
                title={disabled || !canAddMore ? 'Đã đạt giới hạn tags' : `Thêm tag: ${tag}`}
              >
                <Plus size={12} />
                <span className="font-medium">{tag}</span>
              </button>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-3 text-gray-500 dark:text-gray-400">
            <div className="text-xs">
              {activeTab === 'popular' ? 'Chưa có tags phổ biến' : 'Chưa có tags mới'}
            </div>
          </div>
        )}

        {/* Info text */}
        {!isLoading && availableTags.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeTab === 'popular'
                ? `${availableTags.length} tags phổ biến`
                : `${availableTags.length} tags mới`
              }
              {!canAddMore && ' • Đã đạt giới hạn'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
