/**
 * Test script để kiểm tra metrics admin dashboard
 * Chạy script này để test các sửa đổi cho tính toán phần trăm so sánh
 */

import { AdminService } from './backend/index.js';

async function testAdminMetrics() {
  console.log('🧪 Testing Admin Dashboard Metrics...\n');

  try {
    // Clear cache để đảm bảo dữ liệu mới
    console.log('🧹 Clearing all admin caches...');
    AdminService.clearAllCaches();
    
    // Test getDailyComparisonStats
    console.log('📊 Testing getDailyComparisonStats...');
    const { data, error } = await AdminService.getDailyComparisonStats();
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (!data) {
      console.error('❌ No data returned');
      return;
    }
    
    console.log('✅ Daily Comparison Stats retrieved successfully!\n');
    
    // Display results
    console.log('📈 RESULTS:');
    console.log('=' .repeat(50));
    
    // Tests Today
    console.log(`📝 Tests Today:`);
    console.log(`   Today: ${data.testsToday.today}`);
    console.log(`   Yesterday: ${data.testsToday.yesterday}`);
    console.log(`   Change: ${data.testsToday.change} (${data.testsToday.changePercent}%)`);
    console.log(`   Total: ${data.testsToday.total}\n`);
    
    // Registered Users
    console.log(`👤 Registered Users Today:`);
    console.log(`   Today: ${data.registeredUsersToday.today}`);
    console.log(`   Yesterday: ${data.registeredUsersToday.yesterday}`);
    console.log(`   Change: ${data.registeredUsersToday.change} (${data.registeredUsersToday.changePercent}%)`);
    console.log(`   Total: ${data.registeredUsersToday.total}\n`);
    
    // Anonymous Users
    console.log(`👥 Anonymous Users Today:`);
    console.log(`   Today: ${data.anonymousUsersToday.today}`);
    console.log(`   Yesterday: ${data.anonymousUsersToday.yesterday}`);
    console.log(`   Change: ${data.anonymousUsersToday.change} (${data.anonymousUsersToday.changePercent}%)`);
    console.log(`   Total: ${data.anonymousUsersToday.total}\n`);
    
    // Average Score
    console.log(`🎯 Average Score Today:`);
    console.log(`   Today: ${data.averageScoreToday.today}`);
    console.log(`   Yesterday: ${data.averageScoreToday.yesterday}`);
    console.log(`   Change: ${data.averageScoreToday.change} (${data.averageScoreToday.changePercent}%)\n`);
    
    console.log('=' .repeat(50));
    
    // Validate calculations
    console.log('🔍 VALIDATION:');
    
    // Check if percentage calculations are correct
    const validatePercentage = (today, yesterday, changePercent, label) => {
      let expectedPercent = 0;
      if (yesterday > 0) {
        expectedPercent = Math.round(((today - yesterday) / yesterday) * 100);
      } else if (yesterday === 0 && today > 0) {
        expectedPercent = 100;
      }
      
      const isCorrect = expectedPercent === changePercent;
      console.log(`   ${label}: ${isCorrect ? '✅' : '❌'} Expected: ${expectedPercent}%, Got: ${changePercent}%`);
      return isCorrect;
    };
    
    let allValid = true;
    allValid &= validatePercentage(
      data.testsToday.today, 
      data.testsToday.yesterday, 
      data.testsToday.changePercent, 
      'Tests'
    );
    
    allValid &= validatePercentage(
      data.registeredUsersToday.today, 
      data.registeredUsersToday.yesterday, 
      data.registeredUsersToday.changePercent, 
      'Registered Users'
    );
    
    allValid &= validatePercentage(
      data.anonymousUsersToday.today, 
      data.anonymousUsersToday.yesterday, 
      data.anonymousUsersToday.changePercent, 
      'Anonymous Users'
    );
    
    allValid &= validatePercentage(
      data.averageScoreToday.today, 
      data.averageScoreToday.yesterday, 
      data.averageScoreToday.changePercent, 
      'Average Score'
    );
    
    console.log(`\n🎯 Overall validation: ${allValid ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (err) {
    console.error('❌ Test failed with error:', err);
  }
}

// Run the test
testAdminMetrics();
