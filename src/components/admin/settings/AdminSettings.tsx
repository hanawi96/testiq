import React, { useState, useEffect } from 'react';
import { SettingsService, AuthService } from '../../../../backend';
import type { SiteSettings, SettingsUpdateData } from '../../../../backend';
import SiteSettingsForm from './SiteSettingsForm';
import LoadingSpinner from '../common/LoadingSpinner';

interface SettingsState {
  data: SiteSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasChanges: boolean;
}

export default function AdminSettings() {
  const [settingsState, setSettingsState] = useState<SettingsState>({
    data: null,
    isLoading: true,
    isSaving: false,
    error: null,
    hasChanges: false
  });

  const [activeTab, setActiveTab] = useState('site');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAdmin, error } = await AuthService.verifyAdminAccess();
        if (!isAdmin || error) {
          console.log('AdminSettings: Access denied, redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
      } catch (err) {
        console.log('AdminSettings: Auth error, redirecting to login');
        window.location.href = '/admin/login';
        return;
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthChecking) {
      loadSettings();
    }
  }, [isAuthChecking]);

  const loadSettings = async () => {
    try {
      console.log('AdminSettings: Loading settings...');
      setSettingsState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data, error } = await SettingsService.getSiteSettings();

      if (error) {
        console.error('AdminSettings: Error loading settings:', error);
        setSettingsState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Không thể tải cài đặt. Vui lòng thử lại.'
        }));
        return;
      }

      console.log('AdminSettings: Settings loaded successfully');
      setSettingsState(prev => ({
        ...prev,
        data,
        isLoading: false,
        error: null
      }));
    } catch (err) {
      console.error('AdminSettings: Unexpected error:', err);
      setSettingsState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Có lỗi không mong muốn xảy ra'
      }));
    }
  };

  const handleSettingsChange = (changes: Partial<SiteSettings>) => {
    setSettingsState(prev => ({
      ...prev,
      data: prev.data ? { ...prev.data, ...changes } : null,
      hasChanges: true
    }));
  };

  const handleSaveSettings = async (updates: SettingsUpdateData) => {
    try {
      console.log('AdminSettings: Saving settings...');
      setSettingsState(prev => ({ ...prev, isSaving: true, error: null }));

      const { data, error } = await SettingsService.updateSiteSettings(updates, 'admin');

      if (error) {
        console.error('AdminSettings: Error saving settings:', error);
        setSettingsState(prev => ({
          ...prev,
          isSaving: false,
          error: 'Không thể lưu cài đặt. Vui lòng thử lại.'
        }));
        return;
      }

      console.log('AdminSettings: Settings saved successfully');
      setSettingsState(prev => ({
        ...prev,
        data,
        isSaving: false,
        hasChanges: false,
        error: null
      }));

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('AdminSettings: Unexpected error:', err);
      setSettingsState(prev => ({
        ...prev,
        isSaving: false,
        error: 'Có lỗi không mong muốn xảy ra'
      }));
    }
  };

  const handleResetChanges = () => {
    loadSettings();
    setSettingsState(prev => ({ ...prev, hasChanges: false }));
  };

  if (isAuthChecking || settingsState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (settingsState.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Lỗi tải cài đặt</h3>
        <p className="text-red-700 dark:text-red-300 mb-4">{settingsState.error}</p>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Quản lý cấu hình và thiết lập của hệ thống
          </p>
        </div>
        
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800 dark:text-green-200 font-medium">Đã lưu thành công!</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('site')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'site'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
              Cài đặt trang web
            </div>
          </button>
          

          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            disabled
          >
            <div className="flex items-center opacity-50">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bảo mật (Sắp có)
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'site' && (
          <SiteSettingsForm
            settings={settingsState.data!}
            isLoading={settingsState.isSaving}
            hasChanges={settingsState.hasChanges}
            onChange={handleSettingsChange}
            onSave={handleSaveSettings}
            onReset={handleResetChanges}
          />
        )}
      </div>
    </div>
  );
}
