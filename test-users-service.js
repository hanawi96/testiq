// Test script để kiểm tra UsersService
import { UsersService } from './backend/admin/users-service.js';

async function testUsersService() {
  console.log('🧪 Testing UsersService...');
  
  try {
    // Test getUserStats
    console.log('\n📊 Testing getUserStats...');
    const statsResult = await UsersService.getUserStats();
    if (statsResult.error) {
      console.error('❌ getUserStats error:', statsResult.error);
    } else {
      console.log('✅ getUserStats success:', statsResult.data);
    }
    
    // Test getUsers
    console.log('\n👥 Testing getUsers...');
    const usersResult = await UsersService.getUsers(1, 5);
    if (usersResult.error) {
      console.error('❌ getUsers error:', usersResult.error);
    } else {
      console.log('✅ getUsers success:', {
        total: usersResult.data?.total,
        returned: usersResult.data?.users?.length,
        page: usersResult.data?.page
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testUsersService();
