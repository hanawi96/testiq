import React, { useState } from 'react';

export default function SupabaseUserTestResultsTest() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');
  const [authTestStatus, setAuthTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [authTestResult, setAuthTestResult] = useState<string>('');
  const [comprehensiveTestStatus, setComprehensiveTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [comprehensiveTestResult, setComprehensiveTestResult] = useState<string>('');

  // Test for anonymous users
  const runAnonymousTest = async () => {
    setTestStatus('testing');
    setTestResult('');

    try {
      // Dynamic import to avoid build issues
      const { saveTestResult } = await import('../../../backend');
      
      // Test saving test result data (anonymous user)
      console.log('💾 Testing save test result (anonymous user)...');
      const testData = {
        user_id: null, // Anonymous user
        test_type: 'iq',
        score: 125, // IQ score
        accuracy: 80,
        duration_seconds: 1800,
        test_data: {
          score: 8,
          iq: 125,
          classification: 'superior',
          percentile: 85,
          answers: [1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
          categoryScores: {
            logic: 80,
            math: 90,
            verbal: 70
          },
          detailed: {
            correct: 8,
            incorrect: 2,
            accuracy: 80
          }
        },
        guest_name: 'Test Anonymous User',
        guest_age: 28,
        guest_location: 'Ho Chi Minh City'
      };

      const saveResult = await saveTestResult(testData);

      if (saveResult.success) {
        setTestResult(`✅ Anonymous test passed! Test result saved with ID: ${saveResult.data.id}\n` +
                      `📊 IQ Score: ${testData.score}\n` +
                      `👤 Guest: ${testData.guest_name}, Age: ${testData.guest_age}\n` +
                      `📍 Location: ${testData.guest_location}\n` +
                      `⏱️ Duration: ${testData.duration_seconds}s`);
        setTestStatus('success');
      } else {
        setTestResult(`❌ Failed to save anonymous test result: ${JSON.stringify(saveResult.error)}`);
        setTestStatus('error');
      }

    } catch (error) {
      console.error('Anonymous test error:', error);
      setTestResult(`❌ Anonymous test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestStatus('error');
    }
  };

  // Test for authenticated users
  const runAuthenticatedTest = async () => {
    setAuthTestStatus('testing');
    setAuthTestResult('');

    try {
      // Dynamic import to avoid build issues
      const { saveTestResult, AuthService } = await import('../../../backend');
      
      // Check if user is authenticated
      const { user } = await AuthService.getCurrentUser();
      
      if (!user) {
        setAuthTestResult('❌ No authenticated user found. Please login first to test authenticated user functionality.');
        setAuthTestStatus('error');
        return;
      }

      console.log('💾 Testing save test result (authenticated user)...', user.id);
      const testData = {
        user_id: user.id, // Authenticated user
        test_type: 'iq',
        score: 135, // IQ score
        accuracy: 90,
        duration_seconds: 1500,
        test_data: {
          score: 9,
          iq: 135,
          classification: 'very_superior',
          percentile: 95,
          answers: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
          categoryScores: {
            logic: 95,
            math: 85,
            verbal: 90
          },
          detailed: {
            correct: 9,
            incorrect: 1,
            accuracy: 90
          }
        }
        // No guest_* fields for authenticated users
      };

      const saveResult = await saveTestResult(testData);

      if (saveResult.success) {
        setAuthTestResult(`✅ Authenticated test passed! Test result saved with ID: ${saveResult.data.id}\n` +
                         `📊 IQ Score: ${testData.score}\n` +
                         `👤 User ID: ${user.id}\n` +
                         `📧 Email: ${user.email}\n` +
                         `⏱️ Duration: ${testData.duration_seconds}s`);
        setAuthTestStatus('success');
      } else {
        setAuthTestResult(`❌ Failed to save authenticated test result: ${JSON.stringify(saveResult.error)}`);
        setAuthTestStatus('error');
      }

    } catch (error) {
      console.error('Authenticated test error:', error);
      setAuthTestResult(`❌ Authenticated test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAuthTestStatus('error');
    }
  };

  // Comprehensive test using frontend utils
  const runComprehensiveTest = async () => {
    setComprehensiveTestStatus('testing');
    setComprehensiveTestResult('');

    try {
      // Dynamic import to avoid build issues
      const { testUnifiedSaveSystem } = await import('../../utils/test-helpers');
      
      console.log('🧪 Running comprehensive test...');
      const { authTest, anonTest } = await testUnifiedSaveSystem();
      
      const result = `🔍 Comprehensive Test Results:\n\n` +
                    `🔐 Authenticated User Test:\n${authTest.message}\n\n` +
                    `👤 Anonymous User Test:\n${anonTest.message}\n\n` +
                    `📊 Overall: ${authTest.success && anonTest.success ? '✅ All tests passed!' : '⚠️ Some tests failed'}`;

      setComprehensiveTestResult(result);
      setComprehensiveTestStatus(authTest.success && anonTest.success ? 'success' : 'error');

    } catch (error) {
      console.error('Comprehensive test error:', error);
      setComprehensiveTestResult(`❌ Comprehensive test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setComprehensiveTestStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📊 User Test Results Test (Unified Approach)</h3>
      
      <div className="space-y-6">
        {/* Comprehensive Test */}
        <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-purple-800 mb-3">🧪 Comprehensive Frontend Test</h4>
          <p className="text-sm text-purple-700 mb-3">Tests both authenticated and anonymous flows using frontend logic</p>
          <button
            onClick={runComprehensiveTest}
            disabled={comprehensiveTestStatus === 'testing'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors mr-4 ${
              comprehensiveTestStatus === 'testing'
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {comprehensiveTestStatus === 'testing' ? '🔄 Testing...' : '🚀 Run Comprehensive Test'}
          </button>

          {comprehensiveTestResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              comprehensiveTestStatus === 'success' 
                ? 'bg-purple-100 border-l-4 border-purple-400 text-purple-800'
                : comprehensiveTestStatus === 'error'
                ? 'bg-red-50 border-l-4 border-red-400 text-red-800'
                : 'bg-gray-50 border-l-4 border-gray-400 text-gray-800'
            }`}>
              <pre className="whitespace-pre-wrap text-sm">{comprehensiveTestResult}</pre>
            </div>
          )}
        </div>

        {/* Anonymous User Test */}
        <div className="border-b pb-4">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">👤 Anonymous User Test (Backend Direct)</h4>
          <button
            onClick={runAnonymousTest}
            disabled={testStatus === 'testing'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors mr-4 ${
              testStatus === 'testing'
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {testStatus === 'testing' ? '🔄 Testing...' : '▶️ Test Anonymous User'}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              testStatus === 'success' 
                ? 'bg-blue-50 border-l-4 border-blue-400 text-blue-800'
                : testStatus === 'error'
                ? 'bg-red-50 border-l-4 border-red-400 text-red-800'
                : 'bg-gray-50 border-l-4 border-gray-400 text-gray-800'
            }`}>
              <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
            </div>
          )}
        </div>

        {/* Authenticated User Test */}
        <div className="border-b pb-4">
          <h4 className="text-lg font-semibold text-gray-700 mb-3">🔐 Authenticated User Test (Backend Direct)</h4>
          <button
            onClick={runAuthenticatedTest}
            disabled={authTestStatus === 'testing'}
            className={`px-4 py-2 rounded-lg font-medium transition-colors mr-4 ${
              authTestStatus === 'testing'
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {authTestStatus === 'testing' ? '🔄 Testing...' : '▶️ Test Authenticated User'}
          </button>

          {authTestResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              authTestStatus === 'success' 
                ? 'bg-green-50 border-l-4 border-green-400 text-green-800'
                : authTestStatus === 'error'
                ? 'bg-red-50 border-l-4 border-red-400 text-red-800'
                : 'bg-gray-50 border-l-4 border-gray-400 text-gray-800'
            }`}>
              <pre className="whitespace-pre-wrap text-sm">{authTestResult}</pre>
            </div>
          )}
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">🚀 Unified Test Results System:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>Single table</strong> user_test_results for all tests</li>
            <li>• <strong>Authenticated users:</strong> user_id set, guest_* fields null</li>
            <li>• <strong>Anonymous users:</strong> user_id null, guest_* fields populated</li>
            <li>• <strong>Auto-detection</strong> of user authentication status</li>
            <li>• <strong>Optimized performance</strong> with single service</li>
            <li>• <strong>Frontend integration</strong> seamlessly handles both scenarios</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 