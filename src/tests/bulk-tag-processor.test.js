/**
 * Unit tests cho bulk tag processing functionality
 * Test các edge cases và requirements đã nêu
 */

// Mock function để simulate processBulkTags logic
function processBulkTags(input, existingTags = []) {
  const rawTags = input.split(',');
  const validTags = [];
  const duplicates = [];
  
  rawTags.forEach(tag => {
    // Trim whitespace và chuyển thành lowercase
    const cleanTag = tag.trim().toLowerCase();
    
    // Bỏ qua tag trống hoặc chỉ chứa khoảng trắng
    if (!cleanTag) return;
    
    // Kiểm tra độ dài tag (giới hạn 50 ký tự)
    if (cleanTag.length > 50) return;
    
    // Kiểm tra duplicate trong existing tags
    if (existingTags.includes(cleanTag)) {
      duplicates.push(cleanTag);
      return;
    }
    
    // Kiểm tra duplicate trong batch hiện tại
    if (validTags.includes(cleanTag)) {
      return;
    }
    
    validTags.push(cleanTag);
  });
  
  return { validTags, duplicates };
}

// Test cases
const testCases = [
  {
    name: "Basic comma separation",
    input: "tag1,tag2,tag3",
    existingTags: [],
    expected: {
      validTags: ["tag1", "tag2", "tag3"],
      duplicates: []
    }
  },
  {
    name: "Whitespace handling",
    input: " tag 1 , tag 2 , tag 3 ",
    existingTags: [],
    expected: {
      validTags: ["tag 1", "tag 2", "tag 3"],
      duplicates: []
    }
  },
  {
    name: "Empty tags and consecutive commas",
    input: "tag1,,tag2,,,tag3,",
    existingTags: [],
    expected: {
      validTags: ["tag1", "tag2", "tag3"],
      duplicates: []
    }
  },
  {
    name: "Duplicate handling (case insensitive)",
    input: "TAG1, tag1, Tag1, tag2",
    existingTags: [],
    expected: {
      validTags: ["tag1", "tag2"],
      duplicates: []
    }
  },
  {
    name: "Mixed with existing tags",
    input: "existing1, new1, existing2, new2",
    existingTags: ["existing1", "existing2"],
    expected: {
      validTags: ["new1", "new2"],
      duplicates: ["existing1", "existing2"]
    }
  },
  {
    name: "Long tags (>50 chars)",
    input: "short, verylongtagthatexceedsfiftycharacterslimitandshouldbeignored, normal",
    existingTags: [],
    expected: {
      validTags: ["short", "normal"],
      duplicates: []
    }
  },
  {
    name: "Only whitespace",
    input: "   ,  ,   ",
    existingTags: [],
    expected: {
      validTags: [],
      duplicates: []
    }
  },
  {
    name: "Single tag with spaces",
    input: "  single tag  ",
    existingTags: [],
    expected: {
      validTags: ["single tag"],
      duplicates: []
    }
  },
  {
    name: "Mixed case duplicates with existing",
    input: "TAG1, tag1",
    existingTags: ["tag1"],
    expected: {
      validTags: [],
      duplicates: ["tag1", "tag1"]
    }
  },
  {
    name: "Special characters in tags",
    input: "tag-1, tag_2, tag.3, tag@4",
    existingTags: [],
    expected: {
      validTags: ["tag-1", "tag_2", "tag.3", "tag@4"],
      duplicates: []
    }
  }
];

// Run tests
function runTests() {
  console.log("🧪 Running Bulk Tag Processor Tests\n");
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Existing tags: [${testCase.existingTags.join(', ')}]`);
    
    const result = processBulkTags(testCase.input, testCase.existingTags);
    
    // Check validTags
    const validTagsMatch = JSON.stringify(result.validTags.sort()) === JSON.stringify(testCase.expected.validTags.sort());
    const duplicatesMatch = JSON.stringify(result.duplicates.sort()) === JSON.stringify(testCase.expected.duplicates.sort());
    
    if (validTagsMatch && duplicatesMatch) {
      console.log("✅ PASSED");
      passed++;
    } else {
      console.log("❌ FAILED");
      console.log(`Expected validTags: [${testCase.expected.validTags.join(', ')}]`);
      console.log(`Got validTags: [${result.validTags.join(', ')}]`);
      console.log(`Expected duplicates: [${testCase.expected.duplicates.join(', ')}]`);
      console.log(`Got duplicates: [${result.duplicates.join(', ')}]`);
      failed++;
    }
    
    console.log("---");
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️ Some tests failed. Please review the implementation.");
  }
}

// Performance test
function performanceTest() {
  console.log("\n⚡ Performance Test");
  
  const largeInput = Array.from({length: 1000}, (_, i) => `tag${i}`).join(',');
  const startTime = performance.now();
  
  processBulkTags(largeInput, []);
  
  const endTime = performance.now();
  console.log(`Processing 1000 tags took ${(endTime - startTime).toFixed(2)}ms`);
}

// Run all tests
if (typeof window !== 'undefined') {
  // Browser environment
  window.runBulkTagTests = () => {
    runTests();
    performanceTest();
  };
  
  console.log("Bulk tag tests loaded. Run window.runBulkTagTests() to execute.");
} else {
  // Node.js environment
  runTests();
  performanceTest();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { processBulkTags, runTests, testCases };
}
