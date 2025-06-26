import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  testSupabaseConnection, 
  checkDatabaseSetup, 
  quickSetupDatabase, 
  createTestAdmin 
} from '../../../backend';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [databaseStatus, setDatabaseStatus] = useState<any>(null);
  const [setupStatus, setSetupStatus] = useState<any>(null);
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setIsLoading(true);
    
    console.log('🧪 Starting Supabase tests...');
    
    // Test connection
    const connResult = await testSupabaseConnection();
    setConnectionStatus(connResult);
    
    if (connResult.success && !connResult.needsSetup) {
      // Test database setup
      const dbResult = await checkDatabaseSetup();
      setDatabaseStatus(dbResult);
    }
    
    setIsLoading(false);
  };

  const handleSetupDatabase = async () => {
    setIsSettingUp(true);
    setSetupStatus(null);
    
    try {
      console.log('🚀 Starting database setup...');
      const result = await quickSetupDatabase();
      setSetupStatus(result);
      
      if (result.success) {
        // Re-test connection after setup
        setTimeout(() => {
          runTests();
        }, 1000);
      }
    } catch (err) {
      console.error('Setup error:', err);
      setSetupStatus({ success: false, error: 'Setup failed' });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleCreateAdmin = async () => {
    setIsCreatingAdmin(true);
    setAdminStatus(null);
    
    try {
      console.log('👤 Creating admin user...');
      const result = await createTestAdmin();
      setAdminStatus(result);
    } catch (err) {
      console.error('Admin creation error:', err);
      setAdminStatus({ success: false, error: 'Admin creation failed' });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status === undefined) return <div className="w-6 h-6 bg-gray-400 rounded-full animate-pulse"></div>;
    return status ? (
      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ) : (
      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  };

  const sqlSetupScript = `-- Supabase Database Setup Script
-- Copy và paste vào Supabase SQL Editor

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🔧 Supabase Setup & Test</h1>
            <p className="text-slate-300">Thiết lập và kiểm tra hệ thống admin</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Tests */}
            <div className="space-y-6">
              {/* Connection Test */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">🔗 Kết nối Supabase</h3>
                  <StatusIcon status={connectionStatus?.success} />
                </div>
                
                {isLoading ? (
                  <div className="text-slate-400">Đang kiểm tra...</div>
                ) : connectionStatus ? (
                  <div className="space-y-2 text-sm">
                    <div className="text-slate-300">
                      <span className="font-medium">Trạng thái:</span> {connectionStatus.success ? '✅ Thành công' : '❌ Thất bại'}
                    </div>
                    {connectionStatus.error && (
                      <div className="text-red-400">
                        <span className="font-medium">Lỗi:</span> {connectionStatus.error}
                      </div>
                    )}
                    {connectionStatus.needsSetup && (
                      <div className="text-yellow-400">
                        <span className="font-medium">⚠️ Cần setup:</span> {connectionStatus.message}
                      </div>
                    )}
                    {connectionStatus.profilesCount !== undefined && (
                      <div className="text-green-400">
                        <span className="font-medium">👥 Users:</span> {connectionStatus.profilesCount}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Database Setup Test */}
              {connectionStatus?.success && !connectionStatus?.needsSetup && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">🗄️ Database Schema</h3>
                    <StatusIcon status={databaseStatus?.isSetup} />
                  </div>
                  
                  {databaseStatus ? (
                    <div className="space-y-2 text-sm">
                      <div className="text-slate-300">
                        <span className="font-medium">Schema:</span> {databaseStatus.isSetup ? '✅ Đã setup' : '❌ Chưa setup'}
                      </div>
                      {databaseStatus.error && (
                        <div className="text-red-400">
                          <span className="font-medium">Lỗi:</span> {databaseStatus.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Đang kiểm tra...</div>
                  )}
                </div>
              )}

              {/* Manual Setup Instructions */}
              {(connectionStatus?.needsSetup || setupStatus?.needsManualSetup) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                  <h3 className="text-yellow-400 font-semibold mb-4">📋 Hướng dẫn Setup Database</h3>
                  <div className="space-y-3 text-sm text-yellow-300">
                    <p className="font-medium">Bước 1: Vào Supabase Dashboard</p>
                    <p>• Truy cập: <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-400 underline">https://supabase.com/dashboard</a></p>
                    <p>• Chọn project của bạn</p>
                    
                    <p className="font-medium mt-4">Bước 2: Chạy SQL Script</p>
                    <p>• Vào <strong>SQL Editor</strong> (sidebar trái)</p>
                    <p>• Copy script dưới đây và paste vào editor</p>
                    <p>• Nhấn <strong>RUN</strong> để thực thi</p>
                    
                    <div className="bg-black/30 rounded-lg p-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">SQL Setup Script</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(sqlSetupScript)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <pre className="text-xs text-green-300 overflow-x-auto max-h-40">
                        {sqlSetupScript}
                      </pre>
                    </div>
                    
                    <p className="font-medium mt-4">Bước 3: Test lại</p>
                    <p>• Sau khi chạy script thành công, nhấn "🧪 Test lại"</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">⚡ Thao tác nhanh</h3>
                <div className="space-y-3">
                  <motion.button
                    onClick={runTests}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? '🔄 Đang test...' : '🧪 Test lại'}
                  </motion.button>

                  {connectionStatus?.success && !connectionStatus?.needsSetup && (
                    <motion.button
                      onClick={handleCreateAdmin}
                      disabled={isCreatingAdmin}
                      className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isCreatingAdmin ? '👤 Đang tạo...' : '👑 Tạo Admin'}
                    </motion.button>
                  )}

                  {connectionStatus?.success && (
                    <motion.a
                      href="/admin/login"
                      className="block w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-center text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      🎯 Đến Admin Login
                    </motion.a>
                  )}
                </div>
              </div>

              {/* Admin Creation Results */}
              {adminStatus && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">👤 Admin User</h3>
                  <div className="space-y-2 text-sm">
                    <div className={`${adminStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="font-medium">Trạng thái:</span> {adminStatus.success ? '✅ Đã tạo' : '❌ Thất bại'}
                    </div>
                    {adminStatus.success && adminStatus.credentials && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mt-3">
                        <div className="text-green-300 font-medium mb-3">🔑 Thông tin đăng nhập Admin:</div>
                        <div className="space-y-2">
                          <div className="bg-black/30 rounded px-3 py-2">
                            <div className="text-green-200 text-sm">
                              <strong>Email:</strong> {adminStatus.credentials.email}
                            </div>
                          </div>
                          <div className="bg-black/30 rounded px-3 py-2">
                            <div className="text-green-200 text-sm">
                              <strong>Password:</strong> {adminStatus.credentials.password}
                            </div>
                          </div>
                        </div>
                        <div className="text-green-300 text-xs mt-3">
                          💡 Lưu lại thông tin này để đăng nhập admin
                        </div>
                      </div>
                    )}
                    {adminStatus.error && (
                      <div className="text-red-400">
                        <span className="font-medium">Lỗi:</span> {adminStatus.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🔗 Links hữu ích</h3>
                <div className="space-y-2 text-sm">
                  <a 
                    href="https://supabase.com/dashboard" 
                    target="_blank"
                    className="block text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    🌐 Supabase Dashboard
                  </a>
                  <a 
                    href="/admin/login" 
                    className="block text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    🔐 Admin Login
                  </a>
                  <a 
                    href="/" 
                    className="block text-green-400 hover:text-green-300 transition-colors"
                  >
                    🏠 Trang chủ IQ Test
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 