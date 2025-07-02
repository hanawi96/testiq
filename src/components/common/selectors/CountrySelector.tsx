import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountrySelectorProps {
  value: string;
  onChange: (countryName: string, countryCode?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
}

// Fallback countries for offline mode
const FALLBACK_COUNTRIES = [
  'Việt Nam', 'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China', 'Colombia', 'Denmark',
  'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'India', 'Indonesia',
  'Ireland', 'Israel', 'Italy', 'Japan', 'Malaysia', 'Mexico', 'Netherlands',
  'New Zealand', 'Norway', 'Philippines', 'Poland', 'Portugal', 'Russia',
  'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Thailand',
  'Turkey', 'Ukraine', 'United Kingdom', 'United States'
];

// Country emoji mapping for popular countries
const COUNTRY_EMOJIS: { [key: string]: string } = {
  'Việt Nam': '🇻🇳',
  'United States': '🇺🇸',
  'Singapore': '🇸🇬',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'China': '🇨🇳',
  'Thailand': '🇹🇭',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Taiwan': '🇹🇼',
  'Hong Kong': '🇭🇰',
  'New Zealand': '🇳🇿',
  'Netherlands': '🇳🇱',
  'Switzerland': '🇨🇭',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'Russia': '🇷🇺',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦'
};

export default function CountrySelector({ value, onChange, disabled = false, placeholder = "Chọn quốc gia" }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load countries from database on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const backend = await import('@/backend');
        const result = await backend.getCountriesWithVietnamFirst();
        
        if (result.data && result.data.length > 0) {
          setCountries(result.data);
          console.log(`✅ Loaded ${result.data.length} countries from database`);
        } else {
          // Fallback only if database is completely empty
          const fallbackCountries = FALLBACK_COUNTRIES.map((name, index) => ({
            id: `fallback-${index}`,
            name,
            code: name === 'Việt Nam' ? 'VN' : name.substring(0, 2).toUpperCase()
          }));
          setCountries(fallbackCountries);
          console.warn('⚠️ No countries in database, using fallback');
        }
      } catch (error) {
        console.error('❌ Failed to load countries:', error);
        const fallbackCountries = FALLBACK_COUNTRIES.map((name, index) => ({
          id: `fallback-${index}`,
          name,
          code: name === 'Việt Nam' ? 'VN' : name.substring(0, 2).toUpperCase()
        }));
        setCountries(fallbackCountries);
      } finally {
        setLoading(false);
      }
    };

    loadCountries();
  }, []);

  // Smart filter countries based on search
  const filteredCountries = searchTerm.trim()
    ? countries.filter((country: Country) => {
        const searchLower = searchTerm.toLowerCase();
        const countryLower = country.name.toLowerCase();
        
        return (
          countryLower.includes(searchLower) ||
          countryLower.startsWith(searchLower) ||
          countryLower.split(' ').some((word: string) => word.startsWith(searchLower)) ||
          country.code.toLowerCase().includes(searchLower)
        );
      })
    : countries;

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setSearchTerm('');
      }
      return;
    }

    const visibleCountries = filteredCountries;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < visibleCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : visibleCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (visibleCountries[highlightedIndex]) {
          selectCountry(visibleCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          const matchIndex = visibleCountries.findIndex(country => 
            country.name.toLowerCase().startsWith(e.key.toLowerCase())
          );
          if (matchIndex !== -1) {
            setHighlightedIndex(matchIndex);
          }
        }
        break;
    }
  };

  const selectCountry = (country: Country) => {
    onChange(country.name, country.code);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(0);
  };

  const toggleDropdown = () => {
    if (disabled || loading) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Main Input */}
      <div
        onClick={toggleDropdown}
        className={`w-full px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200 ${
          disabled || loading
            ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value ? (
              <span className="flex items-center">
                {COUNTRY_EMOJIS[value] && <span className="mr-2">{COUNTRY_EMOJIS[value]}</span>}
                {value}
              </span>
            ) : loading ? (
              <span className="flex items-center text-gray-400">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mr-2"></div>
                Đang tải quốc gia...
              </span>
            ) : placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-hidden sm:max-h-96"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tìm kiếm quốc gia..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Countries List */}
            <div className="max-h-60 sm:max-h-72 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm">Đang tải quốc gia...</div>
                </div>
              ) : filteredCountries.length > 0 ? (
                filteredCountries.map((country: Country, index: number) => (
                  <div
                    key={country.id}
                    onClick={() => selectCountry(country)}
                    className={`px-4 py-3 cursor-pointer transition-colors text-sm ${
                      index === highlightedIndex
                        ? 'bg-blue-50 text-blue-700'
                        : value === country.name
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        {COUNTRY_EMOJIS[country.name] && <span className="mr-2">{COUNTRY_EMOJIS[country.name]}</span>}
                        {country.name}
                      </span>
                      {value === country.name && (
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  <div className="text-2xl mb-2">🔍</div>
                  Không tìm thấy quốc gia "{searchTerm}"
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 