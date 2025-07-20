#!/usr/bin/env node

/**
 * 🧪 TEST SCRIPT FOR SCHEDULED PUBLISHING
 * Kiểm tra toàn bộ workflow từ A-Z
 */

const { runScheduledPublishing } = require('../backend/admin/articles/scheduled-publishing.ts');

async function testScheduledPublishing() {
  console.log('🧪 Testing Scheduled Publishing...\n');
  
  try {
    // Test 1: Process scheduled articles
    console.log('📋 Test 1: Processing scheduled articles...');
    const result = await runScheduledPublishing();
    console.log('✅ Result:', result);
    console.log('');
    
    // Test 2: Check stats
    console.log('📊 Test 2: Getting stats...');
    const { ScheduledPublishingAPI } = require('../backend/admin/articles/scheduled-publishing.ts');
    const stats = await ScheduledPublishingAPI.stats();
    console.log('✅ Stats:', stats);
    console.log('');
    
    // Test 3: Get upcoming articles
    console.log('📅 Test 3: Getting upcoming articles...');
    const upcoming = await ScheduledPublishingAPI.upcoming(5);
    console.log('✅ Upcoming:', upcoming);
    console.log('');
    
    // Test 4: Health check
    console.log('🏥 Test 4: Health check...');
    const health = await ScheduledPublishingAPI.health();
    console.log('✅ Health:', health);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testScheduledPublishing();
}
