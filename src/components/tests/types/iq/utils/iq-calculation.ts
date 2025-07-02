/**
 * Hàm tiện ích cho việc tính toán và phân loại kết quả IQ
 */

/**
 * Xác định cấp độ phân loại IQ dựa trên kết quả
 */
export function getClassificationLevel(classification: string): string {
  const levels: Record<string, string> = {
    'genius': 'Thiên tài',
    'very_superior': 'Rất cao',
    'superior': 'Cao',
    'high_average': 'Khá cao',
    'average': 'Trung bình',
    'low_average': 'Dưới trung bình',
    'borderline': 'Thấp',
    'low': 'Rất thấp'
  };
  return levels[classification] || 'Trung bình';
}

/**
 * Xác định màu sắc cho kết quả IQ dựa trên phân loại
 */
export function getClassificationColor(classification: string): string {
  const colors: Record<string, string> = {
    'genius': 'purple',
    'very_superior': 'blue',
    'superior': 'green',
    'high_average': 'green',
    'average': 'yellow',
    'low_average': 'orange',
    'borderline': 'red',
    'low': 'red'
  };
  return colors[classification] || 'yellow';
}

/**
 * Xác định mô tả cho kết quả IQ dựa trên phân loại
 */
export function getClassificationDescription(classification: string): string {
  const descriptions: Record<string, string> = {
    'genius': 'Chỉ số IQ vượt trội',
    'very_superior': 'Trí thông minh vượt trội',
    'superior': 'Trên mức trung bình cao',
    'high_average': 'Trên mức trung bình',
    'average': 'Mức trung bình',
    'low_average': 'Dưới mức trung bình',
    'borderline': 'Cần cải thiện',
    'low': 'Cần cải thiện nhiều'
  };
  return descriptions[classification] || 'Mức trung bình';
} 