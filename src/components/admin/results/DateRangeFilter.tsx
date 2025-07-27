import { useState, useRef, useEffect } from 'react';
import type { ResultsFilters } from '../../../../backend';

interface Props {
  filters: ResultsFilters;
  onFilterChange: (filters: Partial<ResultsFilters>) => void;
}

export default function DateRangeFilter({ filters, onFilterChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick presets - Compact design
  const presets = [
    {
      label: 'Hôm nay',
      short: 'Hôm nay',
      days: 0
    },
    {
      label: '7 ngày qua',
      short: '7d',
      days: 7
    },
    {
      label: '30 ngày qua',
      short: '30d',
      days: 30
    },
    {
      label: '60 ngày qua',
      short: '60d',
      days: 60
    },
    {
      label: '90 ngày qua',
      short: '90d',
      days: 90
    },
    {
      label: '120 ngày qua',
      short: '120d',
      days: 120
    },
    {
      label: '180 ngày qua',
      short: '180d',
      days: 180
    }
  ];

  // Generate date range for preset
  const getPresetValue = (days: number) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (days === 0) {
      return { date_from: todayStr, date_to: todayStr };
    }

    const from = new Date(today);
    from.setDate(today.getDate() - days);
    return {
      date_from: from.toISOString().split('T')[0],
      date_to: todayStr
    };
  };

  const handlePresetClick = (preset: typeof presets[0]) => {
    const dateRange = getPresetValue(preset.days);
    onFilterChange(dateRange);
    setIsOpen(false);
  };

  const handleCustomDateChange = (field: 'date_from' | 'date_to', value: string) => {
    onFilterChange({ [field]: value || undefined });
  };

  const clearDateFilter = () => {
    onFilterChange({ date_from: undefined, date_to: undefined });
    setIsOpen(false);
  };

  const hasDateFilter = filters.date_from || filters.date_to;

  const getDateRangeText = () => {
    if (!hasDateFilter) return null;
    
    if (filters.date_from && filters.date_to) {
      if (filters.date_from === filters.date_to) {
        return new Date(filters.date_from).toLocaleDateString('vi-VN');
      }
      return `${new Date(filters.date_from).toLocaleDateString('vi-VN')} - ${new Date(filters.date_to).toLocaleDateString('vi-VN')}`;
    }
    
    if (filters.date_from) {
      return `Từ ${new Date(filters.date_from).toLocaleDateString('vi-VN')}`;
    }
    
    return `Đến ${new Date(filters.date_to!).toLocaleDateString('vi-VN')}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
          hasDateFilter
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
        title={hasDateFilter ? getDateRangeText() || 'Lọc theo ngày' : 'Lọc theo ngày'}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lọc theo thời gian</h3>
              {hasDateFilter && (
                <button
                  onClick={clearDateFilter}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
            {hasDateFilter && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getDateRangeText()}
              </p>
            )}
          </div>

          {/* Quick Presets - 3 Column Grid */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Lựa chọn nhanh</h4>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  title={preset.label}
                  className="px-3 py-2 text-xs text-center bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  {preset.short}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="p-4">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Tùy chọn thời gian</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleCustomDateChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleCustomDateChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
