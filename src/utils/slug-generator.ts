/**
 * Slug Generator Utility
 * Converts Vietnamese text to URL-friendly slugs
 */

/**
 * Remove Vietnamese diacritics (dấu tiếng Việt)
 */
function removeVietnameseDiacritics(str: string): string {
  const vietnameseMap: { [key: string]: string } = {
    // Lowercase vowels
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    
    // Uppercase vowels
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    
    // Consonants
    'đ': 'd', 'Đ': 'D'
  };

  return str.replace(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, (match) => {
    return vietnameseMap[match] || match;
  });
}

/**
 * Generate URL-friendly slug from text
 * Supports Vietnamese diacritics removal
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .trim()                           // Remove leading/trailing spaces
    .toLowerCase()                    // Convert to lowercase
    .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
    .split(' ')                      // Split by spaces
    .map(word => removeVietnameseDiacritics(word)) // Remove diacritics from each word
    .join(' ')                       // Join back
    .replace(/[^\w\s-]/g, '')        // Remove special characters except word chars, spaces, hyphens
    .replace(/[\s_-]+/g, '-')        // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');        // Remove leading/trailing hyphens
}

/**
 * Test cases for development
 */
export const slugTestCases = [
  { input: 'Yên', expected: 'yen' },
  { input: 'NẾU', expected: 'neu' },
  { input: 'Lập trình JavaScript', expected: 'lap-trinh-javascript' },
  { input: 'Hướng dẫn React & Vue.js', expected: 'huong-dan-react-vue-js' },
  { input: 'Đào tạo Node.js', expected: 'dao-tao-node-js' },
  { input: 'Phát triển ứng dụng', expected: 'phat-trien-ung-dung' },
  { input: 'Công nghệ thông tin', expected: 'cong-nghe-thong-tin' },
  { input: 'Tối ưu hóa SEO', expected: 'toi-uu-hoa-seo' },
  { input: 'Thiết kế giao diện', expected: 'thiet-ke-giao-dien' },
  { input: 'Cơ sở dữ liệu', expected: 'co-so-du-lieu' }
];

/**
 * Run tests (for development only)
 */
export function testSlugGenerator(): void {
  console.log('🧪 Testing Vietnamese Slug Generator:');
  slugTestCases.forEach(({ input, expected }) => {
    const result = generateSlug(input);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} "${input}" → "${result}" (expected: "${expected}")`);
  });
}
