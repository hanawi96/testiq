/**
 * Unit tests cho bulk tag processing functionality
 * Test các edge cases và requirements đã nêu
 * Updated to test both ArticleEditor (lowercase) and QuickTagsEditor (smart capitalization) styles
 */

// Import utility functions if available, otherwise use mock
let processBulkTags, defaultNormalizeTag, lowercaseNormalizeTag;

if (typeof require !== 'undefined') {
  try {
    const tagUtils = require('../utils/tag-processing');
    processBulkTags = tagUtils.processBulkTags;
    defaultNormalizeTag = tagUtils.defaultNormalizeTag;
    lowercaseNormalizeTag = tagUtils.lowercaseNormalizeTag;
  } catch (e) {
    console.log('Using mock functions for testing');
  }
}

// Mock functions if imports failed
if (!processBulkTags) {
  lowercaseNormalizeTag = (tag) => tag.trim().toLowerCase();

  defaultNormalizeTag = (tag) => {
    const trimmed = tag.trim();
    const upperCaseTags = ['SEO', 'API', 'UI', 'UX', 'CSS', 'HTML', 'SQL', 'JSON', 'XML', 'HTTP', 'HTTPS', 'REST', 'GraphQL', 'JWT', 'OAuth', 'AI', 'ML', 'IoT', 'VR', 'AR', 'PHP', 'JS', 'TS', 'AWS', 'GCP', 'CDN'];
    const upperTag = trimmed.toUpperCase();

    if (upperCaseTags.includes(upperTag)) {
      return upperTag;
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  processBulkTags = (input, existingTags = [], options = {}) => {
    const {
      maxLength = 50,
      caseSensitive = false,
      normalizeFunction = lowercaseNormalizeTag,
      separator = ','
    } = options;

    const rawTags = input.split(separator);
    const validTags = [];
    const duplicates = [];
    const tooLong = [];
    let emptyCount = 0;

    const existingTagsForComparison = caseSensitive
      ? existingTags
      : existingTags.map(tag => tag.toLowerCase());

    rawTags.forEach(tag => {
      const trimmedTag = tag.trim();

      if (!trimmedTag) {
        emptyCount++;
        return;
      }

      if (trimmedTag.length > maxLength) {
        tooLong.push(trimmedTag);
        return;
      }

      const normalizedTag = normalizeFunction(trimmedTag);
      const tagForComparison = caseSensitive ? normalizedTag : normalizedTag.toLowerCase();

      if (existingTagsForComparison.includes(tagForComparison)) {
        duplicates.push(normalizedTag);
        return;
      }

      const validTagsForComparison = caseSensitive
        ? validTags
        : validTags.map(t => t.toLowerCase());

      if (validTagsForComparison.includes(tagForComparison)) {
        return;
      }

      validTags.push(normalizedTag);
    });

    return { validTags, duplicates, tooLong, empty: emptyCount };
  };
}

// Test cases for ArticleEditor style (lowercase)
const articleEditorTestCases = [
  {
    name: "ArticleEditor: Basic comma separation",
    input: "tag1,tag2,tag3",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["tag1", "tag2", "tag3"],
      duplicates: []
    }
  },
  {
    name: "ArticleEditor: Tech tags normalization",
    input: "react, API, ui, seo",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["react", "api", "ui", "seo"],
      duplicates: []
    }
  },
  {
    name: "ArticleEditor: Mixed case duplicates",
    input: "REACT, react, React",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["react"],
      duplicates: []
    }
  }
];

// Test cases for QuickTagsEditor style (smart capitalization)
const quickTagsEditorTestCases = [
  {
    name: "QuickTagsEditor: Basic comma separation",
    input: "react,vue,angular",
    existingTags: [],
    options: { normalizeFunction: defaultNormalizeTag },
    expected: {
      validTags: ["React", "Vue", "Angular"],
      duplicates: []
    }
  },
  {
    name: "QuickTagsEditor: Tech tags normalization",
    input: "react, api, ui, seo, html, css",
    existingTags: [],
    options: { normalizeFunction: defaultNormalizeTag },
    expected: {
      validTags: ["React", "API", "UI", "SEO", "HTML", "CSS"],
      duplicates: []
    }
  },
  {
    name: "QuickTagsEditor: Mixed case duplicates",
    input: "REACT, react, React",
    existingTags: [],
    options: { normalizeFunction: defaultNormalizeTag },
    expected: {
      validTags: ["React"],
      duplicates: []
    }
  },
  {
    name: "QuickTagsEditor: Mixed with existing tags",
    input: "React, new tag, API",
    existingTags: ["React", "Vue"],
    options: { normalizeFunction: defaultNormalizeTag },
    expected: {
      validTags: ["New tag", "API"],
      duplicates: ["React"]
    }
  }
];

// Common test cases (work for both styles)
const commonTestCases = [
  {
    name: "Common: Whitespace handling",
    input: " tag 1 , tag 2 , tag 3 ",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["tag 1", "tag 2", "tag 3"],
      duplicates: []
    }
  },
  {
    name: "Common: Empty tags and consecutive commas",
    input: "tag1,,tag2,,,tag3,",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["tag1", "tag2", "tag3"],
      duplicates: []
    }
  },
  {
    name: "Common: Long tags (>50 chars)",
    input: "short, verylongtagthatexceedsfiftycharacterslimitandshouldbeignored, normal",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["short", "normal"],
      duplicates: []
    }
  },
  {
    name: "Common: Only whitespace",
    input: "   ,  ,   ",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: [],
      duplicates: []
    }
  },
  {
    name: "Common: Special characters in tags",
    input: "tag-1, tag_2, tag.3, tag@4",
    existingTags: [],
    options: { normalizeFunction: lowercaseNormalizeTag },
    expected: {
      validTags: ["tag-1", "tag_2", "tag.3", "tag@4"],
      duplicates: []
    }
  }
];

// Combine all test cases
const testCases = [...articleEditorTestCases, ...quickTagsEditorTestCases, ...commonTestCases];

// Run tests
function runTests() {
  console.log("🧪 Running Bulk Tag Processor Tests\n");
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Existing tags: [${testCase.existingTags.join(', ')}]`);
    console.log(`Options: ${JSON.stringify(testCase.options || {})}`);

    const result = processBulkTags(testCase.input, testCase.existingTags, testCase.options || {});

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
