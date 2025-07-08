/**
 * Utility functions for exporting data to various formats
 */

export interface ExportData {
  [key: string]: any;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: ExportData[], headers?: string[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create header row
  const headerRow = csvHeaders.join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Handle values that might contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format date for filename
 */
export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Export new users data to CSV
 */
export function exportNewUsersToCSV(data: {
  totalNewUsers: number;
  dailyData: Array<{
    date: string;
    registeredUsers: number;
    anonymousUsers: number;
    total: number;
  }>;
}): void {
  if (!data || !data.dailyData || data.dailyData.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Prepare data for CSV
  const csvData = data.dailyData.map(day => ({
    'Ngày': new Date(day.date).toLocaleDateString('vi-VN'),
    'Người dùng đăng ký': day.registeredUsers,
    'Người dùng ẩn danh': day.anonymousUsers,
    'Tổng cộng': day.total
  }));

  // Add summary row
  csvData.push({
    'Ngày': 'TỔNG CỘNG',
    'Người dùng đăng ký': data.dailyData.reduce((sum, day) => sum + day.registeredUsers, 0),
    'Người dùng ẩn danh': data.dailyData.reduce((sum, day) => sum + day.anonymousUsers, 0),
    'Tổng cộng': data.totalNewUsers
  });

  const csvContent = arrayToCSV(csvData);
  const filename = `nguoi-dung-moi-7-ngay-${formatDateForFilename()}.csv`;
  
  downloadCSV(csvContent, filename);
}

/**
 * Export data to JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export new users data to JSON
 */
export function exportNewUsersToJSON(data: {
  totalNewUsers: number;
  dailyData: Array<{
    date: string;
    registeredUsers: number;
    anonymousUsers: number;
    total: number;
  }>;
}): void {
  if (!data) {
    console.warn('No data to export');
    return;
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    period: '7 ngày qua',
    summary: {
      totalNewUsers: data.totalNewUsers,
      totalRegistered: data.dailyData.reduce((sum, day) => sum + day.registeredUsers, 0),
      totalAnonymous: data.dailyData.reduce((sum, day) => sum + day.anonymousUsers, 0)
    },
    dailyData: data.dailyData.map(day => ({
      ...day,
      dateFormatted: new Date(day.date).toLocaleDateString('vi-VN')
    }))
  };

  const filename = `nguoi-dung-moi-7-ngay-${formatDateForFilename()}.json`;
  downloadJSON(exportData, filename);
}
