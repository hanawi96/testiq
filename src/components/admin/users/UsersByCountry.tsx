import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UsersService } from '../../../../backend';

interface CountryStats {
  country_name: string;
  country_code: string | null;
  total_users: number;
  registered_users: number;
  anonymous_users: number;
}

interface UsersByCountryProps {
  className?: string;
}

export default function UsersByCountry({ className = '' }: UsersByCountryProps) {
  const [data, setData] = useState<CountryStats[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: countryData, error } = await UsersService.getUsersByCountry();
      
      if (error) {
        setError('Không thể tải dữ liệu thống kê theo quốc gia');
        console.error('Error fetching users by country:', error);
      } else {
        setData(countryData);
        setError(null);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (countryCode: string | null) => {
    if (!countryCode) return '🌍';
    return `https://country-code-au6g.vercel.app/${countryCode.toUpperCase()}.svg`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Người dùng theo quốc gia
          </h3>
          <div className="w-5 h-5 border border-current border-r-transparent rounded-full animate-spin text-gray-400"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-7 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-6"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-6"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Người dùng theo quốc gia
          </h3>
          <button
            onClick={fetchData}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Thử lại
          </button>
        </div>
        
        <div className="text-center py-8">
          <div className="text-red-500 dark:text-red-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Người dùng theo quốc gia
        </h3>
        
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Chưa có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl border border-gray-200/60 dark:border-gray-700/60 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Phân bố theo quốc gia
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Thống kê người dùng toàn cầu
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
            Quốc gia
          </div>
        </div>
      </div>

      {/* Responsive grid - 8 countries per row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {data.map((country, index) => (
            <motion.div
              key={country.country_name}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
              whileHover={{
                scale: 1.02,
                y: -2,
                transition: { duration: 0.2 }
              }}
              className="bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 rounded-xl p-4 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 cursor-pointer border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
            >
              {/* Country Header */}
              <div className="flex items-center space-x-3 mb-4">
                {/* Country Flag */}
                <div className="flex-shrink-0 relative">
                  {country.country_code ? (
                    <div className="relative">
                      <img
                        src={getCountryFlag(country.country_code)}
                        alt={country.country_name}
                        className="w-10 h-7 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjgiIHZpZXdCb3g9IjAgMCA0MCAyOCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxNEMyMCAxNi4yMDkxIDE4LjIwOTEgMTggMTYgMThDMTMuNzkwOSAxOCAxMiAxNi4yMDkxIDEyIDE0QzEyIDExLjc5MDkgMTMuNzkwOSAxMCAxNiAxMEMxOC4yMDkxIDEwIDIwIDExLjc5MDkgMjAgMTRaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                    </div>
                  ) : (
                    <div className="w-10 h-7 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg border-2 border-white dark:border-gray-700 shadow-md flex items-center justify-center">
                      <span className="text-sm">🌍</span>
                    </div>
                  )}
                </div>

                {/* Country Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
                    {country.country_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                    {country.country_code || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {/* Total Users */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tổng cộng</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {country.total_users}
                  </span>
                </div>

                {/* Breakdown */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600 dark:text-green-400">Đã đăng ký</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {country.registered_users}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-600 dark:text-orange-400">Chưa đăng ký</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {country.anonymous_users}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
