import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPopup from '../../auth/login/LoginPopup';
import { AuthService } from '../../../../backend';

export default function Header() {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState({ code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳' });
  
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const languages = [
    { code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'EN', name: 'English', flag: '🇺🇸' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'JP', name: '日本語', flag: '🇯🇵' }
  ];

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  // Check auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // ✅ SMART: Only close dropdowns if click is truly outside AND not already handled by stopPropagation
      if (!target.closest('.user-dropdown') && !target.closest('.language-dropdown')) {
        setShowUserDropdown(false);
        setShowLanguageDropdown(false);
      }
    };

    // ✅ Use 'click' instead of 'mousedown' for better compatibility with stopPropagation
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('Header: Checking auth state...');
      const { user: currentUser, error } = await AuthService.getCurrentUser();
      
      if (error) {
        console.log('Header: Auth check returned error (normal if not logged in):', error.message);
      }
      
      setUser(currentUser);
      console.log('Header: Auth state updated, user:', currentUser ? 'logged in' : 'not logged in');
    } catch (err) {
      console.log('Header: Auth check failed (normal if not logged in)');
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      
      // 🚀 SIMPLE: Just reload page to clear all data
      window.location.reload();
    } catch (err) {
      console.error('Header: Logout error:', err);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const selectLanguage = (language: typeof languages[0]) => {
    setCurrentLanguage(language);
    setShowLanguageDropdown(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  // Extract username from email
  const getUsername = (email: string) => {
    return email.split('@')[0];
  };

  // Get anonymous user info
  const getAnonymousUserInfo = () => {
    try {
      const userInfo = localStorage.getItem('anonymous-user-info');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch {
      return null;
    }
  };

  // Generate avatar colors (same as ProfileComponent)
  const generateAvatarColor = (name: string): string => {
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-green-500 to-emerald-600', 
      'from-purple-500 to-violet-600',
      'from-pink-500 to-rose-600',
      'from-orange-500 to-red-600',
      'from-teal-500 to-cyan-600',
      'from-yellow-500 to-amber-600',
      'from-gray-500 to-slate-600'
    ];
    
    const nameHash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[nameHash % colors.length];
  };

  // User dropdown menu items
  const userMenuItems = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: 'Thông tin cá nhân',
      href: '/profile'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: 'Lịch sử test IQ',
      href: '/test-history'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: 'Nâng cấp tài khoản',
      href: '/upgrade',
      highlight: true
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Hỗ trợ',
      href: '/support'
    }
  ];

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">IQ</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Test Pro</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Home
              </a>
              <a href="/test/iq" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                IQ Test
              </a>
              <a href="/test/eq" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                EQ Test
              </a>
              <a href="/leaderboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Bảng xếp hạng
              </a>
              <a href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                Blog
              </a>
              <a href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                About
              </a>
            </nav>

            {/* Right side - Always visible controls */}
            <div className="flex items-center space-x-1">
              {/* Dark Mode Toggle */}
              <motion.button
                onClick={toggleTheme}
                className="group relative p-2 rounded-full focus:outline-none !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent"
                title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
                aria-label={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              >
                <AnimatePresence mode="wait">
                  {isDarkMode ? (
                    <motion.svg
                      key="sun"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                    >
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="moon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600 dark:text-gray-400"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Language Selector */}
              <div className="relative language-dropdown">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Close user dropdown if open before toggling language dropdown
                    if (showUserDropdown) {
                      setShowUserDropdown(false);
                    }
                    setShowLanguageDropdown(!showLanguageDropdown);
                  }}
                  className="group relative flex items-center space-x-1 px-2 py-1.5 rounded-full focus:outline-none !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent"
                  aria-label="Chọn ngôn ngữ"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentLanguage.code}
                  </span>
                  <motion.svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400 dark:text-gray-500"
                    animate={{ rotate: showLanguageDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <polyline points="6,9 12,15 18,9"/>
                  </motion.svg>
                </motion.button>
                
                {/* Language Dropdown */}
                <AnimatePresence>
                  {showLanguageDropdown && (
                    <motion.div
                      className="absolute right-0 top-full mt-3 w-52 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-[70] backdrop-blur-sm"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {languages.map((language, index) => (
                        <motion.button
                          key={language.code}
                          onClick={() => selectLanguage(language)}
                          className={`group w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 hover:transition-colors hover:duration-300 ${
                            index === 0 ? 'rounded-t-xl' : index === languages.length - 1 ? 'rounded-b-xl' : ''
                          } ${
                            currentLanguage.code === language.code
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex flex-col space-y-0.5">
                            <span className="text-sm font-medium">{language.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{language.code}</span>
                          </div>
                          {currentLanguage.code === language.code && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                                <polyline points="20,6 9,17 4,12"/>
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Auth Buttons */}
              {isAuthLoading ? (
                <div className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-lg">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>...</span>
                </div>
              ) : user || getAnonymousUserInfo() ? (
                <div className="hidden lg:flex items-center relative user-dropdown">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close language dropdown if open before toggling user dropdown
                      if (showLanguageDropdown) {
                        setShowLanguageDropdown(false);
                      }
                      setShowUserDropdown(!showUserDropdown);
                    }}
                    className="group relative p-1.5 rounded-full focus:outline-none !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent focus-visible:!bg-transparent"
                    aria-label="Menu người dùng"
                  >
                    {(() => {
                      const anonymousUser = getAnonymousUserInfo();
                      const displayName = user?.email ? getUsername(user.email) : (anonymousUser?.name || 'Người dùng');
                      const avatarLetter = displayName.charAt(0).toUpperCase();
                      const avatarColor = generateAvatarColor(displayName);

                      return (
                        <div className={`relative w-8 h-8 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
                          {avatarLetter}
                        </div>
                      );
                    })()}
                  </motion.button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        className="absolute top-full right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden backdrop-blur-sm"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {/* User Info Header */}
                        <div className="px-6 py-4 bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                          {(() => {
                            const anonymousUser = getAnonymousUserInfo();
                            const displayEmail = user?.email || null;
                            const displayName = anonymousUser?.name || 'Người dùng ẩn danh';
                            const displayInfo = anonymousUser ? `${anonymousUser.age} tuổi, ${anonymousUser.location}` : 'Thông tin không có sẵn';

                            return (
                              <div className="text-center">
                                {user ? (
                                  // Registered user - show email
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {displayEmail}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Tài khoản đã đăng ký
                                    </p>
                                  </div>
                                ) : (
                                  // Anonymous user - show name and info
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {displayInfo}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Anonymous User Warning */}
                        {!user && (
                          <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Dữ liệu tạm thời</p>
                                <p className="text-xs text-amber-700 dark:text-amber-300">Sẽ mất khi xóa dữ liệu trình duyệt</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="py-2">
                          {userMenuItems.map((item, index) => (
                            <motion.a
                              key={item.label}
                              href={item.href}
                              className={`flex items-center px-4 py-3 text-sm ${
                                item.highlight 
                                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                              onClick={() => setShowUserDropdown(false)}
                            >
                              <span className={`mr-3 ${item.highlight ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                {item.icon}
                              </span>
                              {item.label}
                              {item.highlight && (
                                <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                                  Pro
                                </span>
                              )}
                            </motion.a>
                          ))}
                          
                          {/* Separator */}
                          <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                          
                          {/* Logout/Login Button */}
                          <motion.button
                            onClick={() => {
                              if (user) {
                                handleLogout();
                              } else {
                                // For anonymous users, show login popup instead of clearing data
                                setShowLoginPopup(true);
                                setShowUserDropdown(false);
                              }
                            }}
                            className={`flex items-center w-full px-4 py-3 text-sm ${
                              user 
                                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                            whileHover={{ x: 4 }}
                          >
                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {user ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m0 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              )}
                            </svg>
                            {user ? 'Đăng xuất' : 'Đăng nhập'}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button 
                  onClick={() => setShowLoginPopup(true)}
                  className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Đăng nhập</span>
                </motion.button>
              )}

              {/* Mobile Menu Button */}
              <motion.button 
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {showMobileMenu ? (
                    <motion.svg
                      key="close"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600 dark:text-gray-400"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="menu"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600 dark:text-gray-400"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <line x1="3" y1="12" x2="21" y2="12"/>
                      <line x1="3" y1="18" x2="21" y2="18"/>
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-6 space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  <motion.a
                    href="/"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    🏠 Home
                  </motion.a>
                  <motion.a
                    href="/test/iq"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    🧠 IQ Test
                  </motion.a>
                  <motion.a
                    href="/test/eq"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    💝 EQ Test
                  </motion.a>
                  <motion.a
                    href="/leaderboard"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    🏆 Bảng xếp hạng
                  </motion.a>
                  <motion.a
                    href="/blog"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    📝 Blog
                  </motion.a>
                  <motion.a
                    href="/about"
                    onClick={closeMobileMenu}
                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.1 }}
                  >
                    ℹ️ About
                  </motion.a>
                </div>

                {/* Mobile Login Button */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {isAuthLoading ? (
                    <div className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-lg">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang tải...</span>
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      {/* User Info */}
                      <div className="flex justify-center px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                          {user.email ? getUsername(user.email).charAt(0).toUpperCase() : 'U'}
                        </div>
                      </div>

                      {/* Mobile Menu Items */}
                      <div className="space-y-1">
                        {userMenuItems.map((item) => (
                          <motion.a
                            key={item.label}
                            href={item.href}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm ${
                              item.highlight 
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={closeMobileMenu}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className={`mr-3 ${item.highlight ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                              {item.icon}
                            </span>
                            {item.label}
                            {item.highlight && (
                              <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                                Pro
                              </span>
                            )}
                          </motion.a>
                        ))}
                        
                        {/* Primary Action Button - Login or Logout */}
                        <motion.button
                          onClick={() => {
                            handleLogout();
                            closeMobileMenu();
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Đăng xuất
                        </motion.button>
                      </div>
                    </div>
                  ) : getAnonymousUserInfo() ? (
                    <div className="space-y-3">
                      {/* Anonymous User Info */}
                      <div className="flex justify-center px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                        {(() => {
                          const anonymousUser = getAnonymousUserInfo();
                          const displayName = anonymousUser?.name || 'Người dùng';
                          const avatarLetter = displayName.charAt(0).toUpperCase();
                          const avatarColor = generateAvatarColor(displayName);

                          return (
                            <div className={`w-6 h-6 bg-gradient-to-r ${avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-xs`}>
                              {avatarLetter}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Anonymous User Warning */}
                      <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Dữ liệu tạm thời</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">Sẽ mất khi xóa dữ liệu trình duyệt</p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Menu Items */}
                      <div className="space-y-1">
                        {userMenuItems.map((item) => (
                          <motion.a
                            key={item.label}
                            href={item.href}
                            className={`flex items-center px-4 py-3 rounded-lg text-sm ${
                              item.highlight 
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={closeMobileMenu}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className={`mr-3 ${item.highlight ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                              {item.icon}
                            </span>
                            {item.label}
                            {item.highlight && (
                              <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                                Pro
                              </span>
                            )}
                          </motion.a>
                        ))}
                        
                        {/* Primary Action Button - Login or Logout */}
                        <motion.button
                          onClick={() => {
                            setShowLoginPopup(true);
                            closeMobileMenu();
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m0 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Đăng nhập
                        </motion.button>
                        
                        {/* Secondary Action - Clear Data */}
                        <motion.button
                          onClick={() => {
                            // Clear anonymous user data
                            localStorage.removeItem('anonymous-user-info');
                            localStorage.removeItem('iq-test-history');
                            closeMobileMenu();
                            window.location.reload();
                          }}
                          className="w-full flex items-center px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa dữ liệu
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      onClick={() => {
                        setShowLoginPopup(true);
                        closeMobileMenu();
                      }}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>Đăng nhập</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Backdrop for dropdowns */}
      <AnimatePresence>
        {(showLanguageDropdown || showMobileMenu || showUserDropdown) && (
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowLanguageDropdown(false);
              setShowMobileMenu(false);
              setShowUserDropdown(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Login Popup */}
      <LoginPopup 
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onAuthSuccess={checkAuthState}
      />
    </>
  );
} 