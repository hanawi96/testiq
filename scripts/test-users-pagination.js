/**
 * 🧪 TEST USERS PAGINATION
 * Script để test chức năng phân trang users với limit tùy chỉnh
 */

console.log('🧪 Testing Users Pagination with Custom Limit...');

// Test data simulation
const testLimits = [5, 10, 20, 50, 100];
const totalUsers = 247; // Giả sử có 247 users

console.log('📊 Pagination Test Results:');
console.log('Total Users:', totalUsers);
console.log('');

testLimits.forEach(limit => {
  const totalPages = Math.ceil(totalUsers / limit);
  const lastPageItems = totalUsers % limit || limit;
  
  console.log(`📄 Limit: ${limit} users/page`);
  console.log(`   Total Pages: ${totalPages}`);
  console.log(`   Last Page Items: ${lastPageItems}`);
  console.log(`   Page 1: 1-${Math.min(limit, totalUsers)}`);
  console.log(`   Page 2: ${limit + 1}-${Math.min(limit * 2, totalUsers)}`);
  console.log(`   Last Page: ${totalUsers - lastPageItems + 1}-${totalUsers}`);
  console.log('');
});

console.log('✅ Pagination logic test completed!');
console.log('🚀 Ready to test with real UI at http://localhost:4322/admin/users');
