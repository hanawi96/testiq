import React, { useState, useEffect } from 'react';
import LocalRankingView from './LocalRankingView';

export default function LocalRankingWrapper() {
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const backend = await import('../../backend');
        const { user } = await backend.AuthService.getCurrentUser();
        if (user && user.id && user.email) {
          setCurrentUser({ id: user.id, email: user.email });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-gray-300 rounded"></div>
            <div className="w-20 h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-200">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔐</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Đăng nhập để xem vị trí của bạn</h3>
        <p className="text-gray-600 mb-6">Khám phá vị trí của bạn trong bảng xếp hạng và so sánh với những người xung quanh</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="/test/iq" 
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">🧠</span>
            Làm Test IQ
          </a>
          <button 
            onClick={() => {
              // Trigger login modal or redirect
              const loginEvent = new CustomEvent('showLogin');
              window.dispatchEvent(loginEvent);
            }}
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <span className="mr-2">🔑</span>
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return <LocalRankingView userId={currentUser.id} />;
} 