import React, { useState, useRef, useEffect } from 'react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

export default function DateTimePicker({
  value,
  onChange,
  label,
  disabled = false
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(value || new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format display value
  const formatDisplayValue = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(newDate);
    onChange(newDate.toISOString().slice(0, 16));
  };

  const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
    const newDate = new Date(selectedDate);
    if (type === 'hour') {
      newDate.setHours(value);
    } else {
      newDate.setMinutes(value);
    }
    setSelectedDate(newDate);
    onChange(newDate.toISOString().slice(0, 16));
  };

  const days = generateCalendarDays();
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
      </label>

      {/* Input Field */}
      <div className="relative mt-2">
        <input
          type="text"
          value={formatDisplayValue(value)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          readOnly
          disabled={disabled}
          className={`w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl text-sm 
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            cursor-pointer transition-all duration-200
            ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}`}
          placeholder="Chọn ngày và giờ..."
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      {/* Custom Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
          {/* Header */}
          <div className="p-5 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-gray-700/80 dark:via-gray-600/60 dark:to-gray-500/40 border-b border-gray-100/50 dark:border-gray-600/50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 rounded-xl hover:bg-white/70 dark:hover:bg-gray-600/70 transition-all duration-300 hover:scale-105 hover:shadow-sm"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 rounded-xl hover:bg-white/70 dark:hover:bg-gray-600/70 transition-all duration-300 hover:scale-105 hover:shadow-sm"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(day)}
                    className={`w-9 h-9 text-xs rounded-2xl transition-all duration-300 font-medium ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                        : isToday
                        ? 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : isCurrentMonth
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 hover:scale-105'
                        : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker */}
          <div className="p-5 border-t border-gray-100/50 dark:border-gray-600/50 bg-gradient-to-br from-gray-50/80 to-gray-100/40 dark:from-gray-700/60 dark:to-gray-600/40">
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Giờ:</label>
                <select
                  value={selectedDate.getHours()}
                  onChange={(e) => handleTimeChange('hour', parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Phút:</label>
                <select
                  value={selectedDate.getMinutes()}
                  onChange={(e) => handleTimeChange('minute', parseInt(e.target.value))}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedDate(now);
                  onChange(now.toISOString().slice(0, 16));
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
              >
                Bây giờ
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-500 dark:hover:to-gray-600 transition-all duration-300 hover:scale-105"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
