import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { AuthService } from '../../../backend';

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
}

type AuthMode = 'login' | 'register';

export default function LoginPopup({ isOpen, onClose, onAuthSuccess }: LoginPopupProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('LoginPopup: Attempting login for:', data.email);
      
      const { user, error: authError } = await AuthService.signIn(data);
      
      if (authError) {
        console.error('LoginPopup: Login error:', authError);
        
        // Handle specific error cases
        if (authError.message?.includes('Email not confirmed')) {
          setError('Email chưa được xác nhận. Vui lòng kiểm tra hộp thư và click vào link xác nhận, hoặc liên hệ admin để được hỗ trợ.');
        } else if (authError.message?.includes('Invalid login credentials')) {
          setError('Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.');
        } else {
          setError(authError.message || 'Đăng nhập thất bại');
        }
        return;
      }

      if (!user) {
        console.error('LoginPopup: No user returned from login');
        setError('Đăng nhập thất bại - không có thông tin user');
        return;
      }

      console.log('LoginPopup: Login successful for user:', user.id);
      onClose();
      // Call auth success callback to refresh auth state
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      console.error('LoginPopup: Unexpected login error:', err);
      setError('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (data: { email: string; password: string; confirmPassword: string }) => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('LoginPopup: Starting registration for:', data.email);
      console.log('LoginPopup: Password length:', data.password.length);
      console.log('LoginPopup: Passwords match:', data.password === data.confirmPassword);
      
      const { user, error: authError } = await AuthService.signUp(data);
      
      if (authError) {
        console.error('LoginPopup: Registration error:', authError);
        console.error('LoginPopup: Error details:', {
          message: authError.message,
          status: authError.status,
          statusText: authError.statusText
        });
        setError(authError.message || 'Đăng ký thất bại');
        return;
      }

      if (!user) {
        console.error('LoginPopup: No user returned from registration');
        setError('Đăng ký thất bại - không có thông tin user');
        return;
      }

      console.log('LoginPopup: Registration successful for user:', user.id);
      console.log('LoginPopup: User email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      setError('');
      
      // Show appropriate success message based on email confirmation status
      if (user.email_confirmed_at) {
        alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
      } else {
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập. Nếu không nhận được email, liên hệ admin để được hỗ trợ.');
      }
      setMode('login');
    } catch (err) {
      console.error('LoginPopup: Unexpected registration error:', err);
      setError('Có lỗi xảy ra khi đăng ký, vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Login with ${provider}`);
    // TODO: Implement social login
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const resetAndClose = () => {
    setMode('login');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetAndClose}
          />
          
          {/* Modal Content */}
          <div className="relative z-10 flex items-center justify-center min-h-full p-4">
            <motion.div
              className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Close Button */}
              <button 
                onClick={resetAndClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              
              {/* Modal Header */}
              <div className="text-center pt-8 pb-6 px-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                  {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {mode === 'login' ? 'Chào mừng bạn quay trở lại!' : 'Tham gia cùng chúng tôi ngay hôm nay!'}
                </p>
              </div>
              
              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'register' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === 'register' ? -20 : 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === 'login' ? (
                    <LoginForm 
                      onSubmit={handleLoginSubmit}
                      isLoading={isLoading}
                      error={error}
                    />
                  ) : (
                    <RegisterForm 
                      onSubmit={handleRegisterSubmit}
                      isLoading={isLoading}
                      error={error}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
                
              {/* Divider */}
              <div className="relative my-6 px-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                    {mode === 'login' ? 'Hoặc đăng nhập bằng' : 'Hoặc đăng ký bằng'}
                  </span>
                </div>
              </div>
              
              {/* Social Login Buttons */}
              <div className="space-y-3 px-8">
                {/* Google */}
                <motion.button 
                  type="button" 
                  onClick={() => handleSocialLogin('google')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-3">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {mode === 'login' ? 'Đăng nhập bằng Google' : 'Đăng ký bằng Google'}
                </motion.button>
                
                {/* Facebook */}
                <motion.button 
                  type="button" 
                  onClick={() => handleSocialLogin('facebook')}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" className="mr-3">
                    <path fill="#1877f2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  {mode === 'login' ? 'Đăng nhập bằng Facebook' : 'Đăng ký bằng Facebook'}
                </motion.button>
              </div>
              
              {/* Footer */}
              <div className="text-center px-8 pb-8 mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                  <button 
                    onClick={switchMode}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium ml-1 transition-colors"
                  >
                    {mode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 