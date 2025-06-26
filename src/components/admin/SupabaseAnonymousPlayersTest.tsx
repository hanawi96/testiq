import React, { useState } from 'react';

export default function SupabaseAnonymousPlayersTest() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');

  const runTest = async () => {
    setTestStatus('testing');
    setTestResult('');

    try {
      // Dynamic import to avoid build issues
      const { saveAnonymousPlayer, checkAnonymousPlayersTable } = await import('../../../backend');
      
      // 1. Check if table exists
      console.log('🔍 Checking if anonymous_players table exists...');
      const tableExists = await checkAnonymousPlayersTable();
      
      if (!tableExists) {
        setTestResult('❌ Table anonymous_players does not exist. Please run the SQL setup script first.');
        setTestStatus('error');
        return;
      }

      // 2. Test saving anonymous player data
      console.log('💾 Testing save anonymous player...');
      const testData = {
        name: 'Test User',
        age: 25,
        location: 'Ho Chi Minh City',
        test_result: {
          score: 8,
          iq: 115,
          classification: 'high_average',
          percentile: 75,
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
        test_score: 115,
        test_duration: 1800
      };

      const saveResult = await saveAnonymousPlayer(testData);

      if (saveResult.success) {
        setTestResult(`✅ Test passed! Anonymous player saved with ID: ${saveResult.data.id}`);
        setTestStatus('success');
      } else {
        setTestResult(`❌ Failed to save anonymous player: ${JSON.stringify(saveResult.error)}`);
        setTestStatus('error');
      }

    } catch (error) {
      console.error('Test error:', error);
      setTestResult(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTestStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">🧪 Anonymous Players Test</h3>
      
      <div className="space-y-4">
        <button
          onClick={runTest}
          disabled={testStatus === 'testing'}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            testStatus === 'testing'
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {testStatus === 'testing' ? '🔄 Testing...' : '▶️ Run Anonymous Players Test'}
        </button>

        {testResult && (
          <div className={`p-4 rounded-lg ${
            testStatus === 'success' 
              ? 'bg-green-50 border-l-4 border-green-400 text-green-800'
              : testStatus === 'error'
              ? 'bg-red-50 border-l-4 border-red-400 text-red-800'
              : 'bg-gray-50 border-l-4 border-gray-400 text-gray-800'
          }`}>
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">📋 Test Details:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Checks if anonymous_players table exists</li>
            <li>• Tests saving a sample test result with user info</li>
            <li>• Verifies data structure and constraints</li>
            <li>• Returns success/error status</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">💡 Note:</h4>
          <p className="text-sm text-blue-700">
            Make sure you've run the SQL setup script in Supabase before testing.
            The script creates the anonymous_players table with proper structure and RLS policies.
          </p>
        </div>
      </div>
    </div>
  );
} 