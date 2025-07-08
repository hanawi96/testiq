/**
 * Test file for Vietnamese Slug Generator
 * Run this in browser console to test the functionality
 */

import { generateSlug, testSlugGenerator, slugTestCases } from './slug-generator';

// Run tests
console.log('🧪 Testing Vietnamese Slug Generator:');
testSlugGenerator();

// Additional test cases
const additionalTests = [
  { input: 'Yên', expected: 'yen' },
  { input: 'NẾU', expected: 'neu' },
  { input: 'Đào tạo lập trình', expected: 'dao-tao-lap-trinh' },
  { input: 'Hướng dẫn sử dụng', expected: 'huong-dan-su-dung' },
  { input: 'Công nghệ & Đổi mới', expected: 'cong-nghe-doi-moi' },
  { input: 'Phần mềm tự do', expected: 'phan-mem-tu-do' },
  { input: 'Trí tuệ nhân tạo', expected: 'tri-tue-nhan-tao' },
  { input: 'Học máy & AI', expected: 'hoc-may-ai' },
  { input: 'Cơ sở dữ liệu MySQL', expected: 'co-so-du-lieu-mysql' },
  { input: 'Framework Vue.js', expected: 'framework-vue-js' }
];

console.log('\n🧪 Additional Vietnamese Tests:');
additionalTests.forEach(({ input, expected }) => {
  const result = generateSlug(input);
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} "${input}" → "${result}" (expected: "${expected}")`);
});

// Export for use in other files
export { generateSlug, testSlugGenerator };
