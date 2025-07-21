import React, { useState } from 'react';
import TagsInput from './TagsInput';

/**
 * Demo component để test TagsInput với tabs
 */
export default function TagsInputDemo() {
  const [tags, setTags] = useState<string[]>([]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Tags Input với Tabs Demo
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags cho bài viết
            </label>
            <TagsInput
              value={tags}
              onChange={setTags}
              placeholder="Nhập tags hoặc chọn từ gợi ý..."
              maxTags={10}
            />
          </div>

          {/* Display selected tags */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags đã chọn ({tags.length}):
            </h3>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa có tags nào được chọn
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setTags([])}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Xóa tất cả
            </button>
            <button
              onClick={() => setTags(['React', 'TypeScript', 'JavaScript'])}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Thêm mẫu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
