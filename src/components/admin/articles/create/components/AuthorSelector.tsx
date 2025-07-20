import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown, User, Check, Search, Crown, Edit } from 'lucide-react';

interface AuthorOption {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  role_display_name: string;
}

interface AuthorSelectorProps {
  value: string;
  authors: AuthorOption[];
  onChange: (authorId: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function AuthorSelector({
  value,
  authors,
  onChange,
  disabled = false,
  className = ""
}: AuthorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get current selected author
  const selectedAuthor = authors.find(author => author.id === value);

  // Filter authors based on search query
  const filteredAuthors = authors.filter(author =>
    author.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    author.role_display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle dropdown toggle
  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    setSearchQuery('');
    setHoveredIndex(-1);
  }, [disabled]);

  // Handle author selection
  const selectAuthor = useCallback((authorId: string) => {
    onChange(authorId);
    setIsOpen(false);
    setSearchQuery('');
    setHoveredIndex(-1);
  }, [onChange]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHoveredIndex(-1);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHoveredIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHoveredIndex(prev => Math.min(prev + 1, filteredAuthors.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHoveredIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (hoveredIndex >= 0 && filteredAuthors[hoveredIndex]) {
          selectAuthor(filteredAuthors[hoveredIndex].id);
        }
        break;
    }
  }, [isOpen, hoveredIndex, filteredAuthors, toggleDropdown, selectAuthor]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHoveredIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Get role badge styling - modern version
  const getRoleBadgeStyle = (role: string) => {
    const roleStyles = {
      admin: 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm',
      editor: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm',
      author: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm',
      reviewer: 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-sm',
      default: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-sm'
    };
    return roleStyles[role as keyof typeof roleStyles] || roleStyles.default;
  };

  // Get role icon - smaller size
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown size={10} />;
      case 'editor': return <Edit size={10} />;
      case 'author': return <User size={10} />;
      default: return <User size={10} />;
    }
  };

  return (
    <div ref={containerRef} className={`relative z-10 ${className}`}>
      {/* Modern Compact Author Selector */}
      <button
        type="button"
        className={`
          group w-full px-4 py-3 border rounded-xl text-left transition-all duration-200
          ${isOpen
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg shadow-primary-500/10'
            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-800 hover:shadow-md'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
        `}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white transition-all duration-200
            ${selectedAuthor
              ? 'bg-gradient-to-br from-primary-500 to-purple-500'
              : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }
            ${!disabled && 'group-hover:scale-110'}
          `}>
            {selectedAuthor ? selectedAuthor.full_name?.charAt(0)?.toUpperCase() : <User size={14} />}
          </div>

          {/* Author Info */}
          <div className="flex-1 min-w-0">
            {selectedAuthor ? (
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                  {selectedAuthor.full_name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {selectedAuthor.role_display_name}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Chọn tác giả
              </div>
            )}
          </div>

          {/* Dropdown Arrow */}
          <div className={`
            text-gray-400 transition-all duration-200
            ${isOpen ? 'rotate-180 text-primary-500' : 'group-hover:text-gray-600 dark:group-hover:text-gray-300'}
          `}>
            <ChevronDown size={16} />
          </div>
        </div>
      </button>

      {/* Modern Author Selection Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl shadow-black/5 dark:shadow-black/20 z-[9999] overflow-hidden backdrop-blur-sm"
          style={{
            position: 'absolute',
            zIndex: 9999,
            minWidth: '100%'
          }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm tác giả..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
              />
            </div>
          </div>

          {/* Authors List */}
          <div className="max-h-56 overflow-y-auto">
            {filteredAuthors.length > 0 ? (
              filteredAuthors.map((author, index) => (
                <div
                  key={author.id}
                  className={`
                    group flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                    ${hoveredIndex === index || author.id === value
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-2 border-primary-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-2 border-transparent'
                    }
                  `}
                  onClick={() => selectAuthor(author.id)}
                  onMouseEnter={() => setHoveredIndex(index)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                      <span className="text-xs font-semibold text-white">
                        {author.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    {author.id === value && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Author Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                          {author.full_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {author.email}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(author.role)}`}>
                        {getRoleIcon(author.role)}
                        {author.role_display_name}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <User size={24} className="mx-auto text-gray-400 mb-2" />
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Không tìm thấy tác giả
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
