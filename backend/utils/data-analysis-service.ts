import { supabase } from '../config/supabase';

export interface DataAnalysisResult {
  // Thống kê tổng quan
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  
  // Phân tích user_test_results
  userTestResults: {
    total: number;
    authenticatedUsers: number;
    anonymousUsers: number;
    withCountryData: number;
    withAgeData: number;
    withGenderData: number;
    withDurationData: number;
    scoreRange: { min: number; max: number; avg: number };
    durationRange: { min: number; max: number; avg: number };
  };
  
  // Phân tích quốc gia
  countryAnalysis: {
    totalUniqueCountries: number;
    countriesWithCountryCode: number;
    topCountriesByCount: Array<{
      country: string;
      country_code: string;
      count: number;
      avgScore: number;
      minScore: number;
      maxScore: number;
      avgDuration: number;
    }>;
  };
  
  // Phân tích điểm số
  scoreAnalysis: {
    distribution: Array<{ range: string; count: number; percentage: number }>;
    byAge: Array<{ ageRange: string; count: number; avgScore: number }>;
    byGender: Array<{ gender: string; count: number; avgScore: number }>;
  };
  
  // Vấn đề dữ liệu
  dataIssues: {
    nullScores: number;
    invalidScores: number;
    nullCountries: number;
    invalidDurations: number;
    duplicateRecords: number;
  };
  
  timestamp: number;
}

/**
 * 🔍 PHÂN TÍCH TOÀN DIỆN DỮ LIỆU DATABASE
 * Kiểm tra tính chính xác của thuật toán dashboard
 */
export async function analyzeCompleteData(): Promise<DataAnalysisResult> {
  try {
    console.log('🔍 Bắt đầu phân tích toàn diện dữ liệu...');
    
    // 1. Lấy tất cả dữ liệu từ user_test_results
    const { data: allRecords, error } = await supabase
      .from('user_test_results')
      .select('*')
      .order('tested_at', { ascending: false });

    if (error) throw error;

    if (!allRecords?.length) {
      return getEmptyAnalysis();
    }

    console.log(`📊 Tổng số records: ${allRecords.length}`);

    // 2. Phân tích dữ liệu chi tiết
    const analysis = performDetailedAnalysis(allRecords);
    
    console.log('✅ Phân tích hoàn tất');
    return analysis;

  } catch (error) {
    console.error('❌ Lỗi phân tích dữ liệu:', error);
    throw error;
  }
}

/**
 * 🧮 THỰC HIỆN PHÂN TÍCH CHI TIẾT
 */
function performDetailedAnalysis(records: any[]): DataAnalysisResult {
  const totalRecords = records.length;
  
  // Phân loại records hợp lệ/không hợp lệ
  const validRecords = records.filter(r => 
    r.score != null && 
    r.score >= 0 && 
    r.score <= 300 && // IQ max reasonable
    r.test_type === 'iq'
  );
  
  const invalidRecords = totalRecords - validRecords.length;

  // 1. Phân tích user_test_results
  const authenticatedUsers = validRecords.filter(r => r.user_id != null).length;
  const anonymousUsers = validRecords.filter(r => r.user_id == null).length;
  const withCountryData = validRecords.filter(r => r.country && r.country_code).length;
  const withAgeData = validRecords.filter(r => r.age != null && r.age > 0).length;
  const withGenderData = validRecords.filter(r => r.gender != null).length;
  const withDurationData = validRecords.filter(r => r.duration_seconds != null && r.duration_seconds > 0).length;

  // Score analysis
  const scores = validRecords.map(r => r.score).filter(s => s != null);
  const durations = validRecords.filter(r => r.duration_seconds > 0).map(r => r.duration_seconds);
  
  const scoreRange = {
    min: Math.min(...scores),
    max: Math.max(...scores),
    avg: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
  };

  const durationRange = durations.length > 0 ? {
    min: Math.min(...durations),
    max: Math.max(...durations),
    avg: Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
  } : { min: 0, max: 0, avg: 0 };

  // 2. Phân tích quốc gia
  const countryStats = new Map<string, {
    country: string;
    country_code: string;
    scores: number[];
    durations: number[];
  }>();

  // Thu thập dữ liệu quốc gia
  validRecords.forEach(record => {
    if (record.country && record.country_code) {
      const key = record.country_code;
      
      if (!countryStats.has(key)) {
        countryStats.set(key, {
          country: record.country,
          country_code: record.country_code,
          scores: [],
          durations: []
        });
      }
      
      const stat = countryStats.get(key)!;
      if (record.score != null) stat.scores.push(record.score);
      if (record.duration_seconds > 0) stat.durations.push(record.duration_seconds);
    }
  });

  const topCountriesByCount = Array.from(countryStats.entries())
    .map(([code, stat]) => ({
      country: stat.country,
      country_code: stat.country_code,
      count: stat.scores.length,
      avgScore: stat.scores.length > 0 ? Math.round(stat.scores.reduce((sum, s) => sum + s, 0) / stat.scores.length) : 0,
      minScore: stat.scores.length > 0 ? Math.min(...stat.scores) : 0,
      maxScore: stat.scores.length > 0 ? Math.max(...stat.scores) : 0,
      avgDuration: stat.durations.length > 0 ? Math.round(stat.durations.reduce((sum, d) => sum + d, 0) / stat.durations.length) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10

  // 3. Phân tích phân bố điểm
  const scoreDistribution = [
    { range: '0-50', count: 0, percentage: 0 },
    { range: '51-70', count: 0, percentage: 0 },
    { range: '71-85', count: 0, percentage: 0 },
    { range: '86-100', count: 0, percentage: 0 },
    { range: '101-115', count: 0, percentage: 0 },
    { range: '116-130', count: 0, percentage: 0 },
    { range: '131-145', count: 0, percentage: 0 },
    { range: '146+', count: 0, percentage: 0 }
  ];

  scores.forEach(score => {
    if (score <= 50) scoreDistribution[0].count++;
    else if (score <= 70) scoreDistribution[1].count++;
    else if (score <= 85) scoreDistribution[2].count++;
    else if (score <= 100) scoreDistribution[3].count++;
    else if (score <= 115) scoreDistribution[4].count++;
    else if (score <= 130) scoreDistribution[5].count++;
    else if (score <= 145) scoreDistribution[6].count++;
    else scoreDistribution[7].count++;
  });

  scoreDistribution.forEach(item => {
    item.percentage = scores.length > 0 ? Math.round((item.count / scores.length) * 100 * 10) / 10 : 0;
  });

  // Phân tích theo tuổi
  const ageGroups = new Map<string, { scores: number[]; count: number }>();
  validRecords.filter(r => r.age > 0 && r.score != null).forEach(record => {
    const ageRange = getAgeRange(record.age);
    
    if (!ageGroups.has(ageRange)) {
      ageGroups.set(ageRange, { scores: [], count: 0 });
    }
    
    ageGroups.get(ageRange)!.scores.push(record.score);
    ageGroups.get(ageRange)!.count++;
  });

  const scoresByAge = Array.from(ageGroups.entries()).map(([ageRange, data]) => ({
    ageRange,
    count: data.count,
    avgScore: data.count > 0 ? Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.count) : 0
  }));

  // Phân tích theo giới tính
  const genderGroups = new Map<string, { scores: number[]; count: number }>();
  validRecords.filter(r => r.gender && r.score != null).forEach(record => {
    const gender = record.gender.toLowerCase();
    
    if (!genderGroups.has(gender)) {
      genderGroups.set(gender, { scores: [], count: 0 });
    }
    
    genderGroups.get(gender)!.scores.push(record.score);
    genderGroups.get(gender)!.count++;
  });

  const scoresByGender = Array.from(genderGroups.entries()).map(([gender, data]) => ({
    gender,
    count: data.count,
    avgScore: data.count > 0 ? Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.count) : 0
  }));

  // 4. Phân tích vấn đề dữ liệu
  const nullScores = records.filter(r => r.score == null).length;
  const invalidScores = records.filter(r => r.score != null && (r.score < 0 || r.score > 300)).length;
  const nullCountries = records.filter(r => !r.country || !r.country_code).length;
  const invalidDurations = records.filter(r => r.duration_seconds != null && r.duration_seconds < 0).length;
  
  // Tính duplicate records (cùng user_id + score + tested_at trong 1 phút)
  const duplicateRecords = calculateDuplicates(records);

  return {
    totalRecords,
    validRecords: validRecords.length,
    invalidRecords,
    
    userTestResults: {
      total: totalRecords,
      authenticatedUsers,
      anonymousUsers,
      withCountryData,
      withAgeData,
      withGenderData,
      withDurationData,
      scoreRange,
      durationRange
    },
    
    countryAnalysis: {
      totalUniqueCountries: countryStats.size,
      countriesWithCountryCode: countryStats.size,
      topCountriesByCount
    },
    
    scoreAnalysis: {
      distribution: scoreDistribution,
      byAge: scoresByAge,
      byGender: scoresByGender
    },
    
    dataIssues: {
      nullScores,
      invalidScores,
      nullCountries,
      invalidDurations,
      duplicateRecords
    },
    
    timestamp: Date.now()
  };
}

/**
 * 📊 Tính toán duplicate records
 */
function calculateDuplicates(records: any[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  
  records.forEach(record => {
    if (record.user_id && record.score && record.tested_at) {
      const key = `${record.user_id}_${record.score}_${record.tested_at}`;
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }
  });
  
  return duplicates;
}

/**
 * 👶 Xác định nhóm tuổi
 */
function getAgeRange(age: number): string {
  if (age <= 18) return '≤18';
  if (age <= 25) return '19-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  return '56+';
}

/**
 * 📋 Phân tích rỗng khi không có dữ liệu
 */
function getEmptyAnalysis(): DataAnalysisResult {
  return {
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    
    userTestResults: {
      total: 0,
      authenticatedUsers: 0,
      anonymousUsers: 0,
      withCountryData: 0,
      withAgeData: 0,
      withGenderData: 0,
      withDurationData: 0,
      scoreRange: { min: 0, max: 0, avg: 0 },
      durationRange: { min: 0, max: 0, avg: 0 }
    },
    
    countryAnalysis: {
      totalUniqueCountries: 0,
      countriesWithCountryCode: 0,
      topCountriesByCount: []
    },
    
    scoreAnalysis: {
      distribution: [],
      byAge: [],
      byGender: []
    },
    
    dataIssues: {
      nullScores: 0,
      invalidScores: 0,
      nullCountries: 0,
      invalidDurations: 0,
      duplicateRecords: 0
    },
    
    timestamp: Date.now()
  };
}

/**
 * 🔍 So sánh với kết quả dashboard hiện tại
 */
export async function compareWithDashboard(): Promise<{
  analysis: DataAnalysisResult;
  dashboard: any;
  differences: {
    totalParticipants: { analysis: number; dashboard: number; diff: number };
    totalCountries: { analysis: number; dashboard: number; diff: number };
    globalAverageIQ: { analysis: number; dashboard: number; diff: number };
    issues: string[];
  };
}> {
  try {
    // Import dashboard service
    const { getDashboardStats } = await import('./dashboard-stats-service');
    
    // Lấy cả hai kết quả
    const [analysis, dashboard] = await Promise.all([
      analyzeCompleteData(),
      getDashboardStats()
    ]);
    
    // So sánh
    const differences = {
      totalParticipants: {
        analysis: analysis.validRecords,
        dashboard: dashboard.totalParticipants,
        diff: Math.abs(analysis.validRecords - dashboard.totalParticipants)
      },
      totalCountries: {
        analysis: analysis.countryAnalysis.totalUniqueCountries,
        dashboard: dashboard.totalCountries,
        diff: Math.abs(analysis.countryAnalysis.totalUniqueCountries - dashboard.totalCountries)
      },
      globalAverageIQ: {
        analysis: analysis.userTestResults.scoreRange.avg,
        dashboard: dashboard.globalAverageIQ,
        diff: Math.abs(analysis.userTestResults.scoreRange.avg - dashboard.globalAverageIQ)
      },
      issues: [] as string[]
    };
    
    // Phát hiện vấn đề
    if (differences.totalParticipants.diff > 0) {
      differences.issues.push(`Khác biệt số participants: ${differences.totalParticipants.diff}`);
    }
    
    if (differences.totalCountries.diff > 0) {
      differences.issues.push(`Khác biệt số countries: ${differences.totalCountries.diff}`);
    }
    
    if (differences.globalAverageIQ.diff > 1) {
      differences.issues.push(`Khác biệt IQ trung bình: ${differences.globalAverageIQ.diff} điểm`);
    }
    
    if (analysis.dataIssues.nullScores > 0) {
      differences.issues.push(`${analysis.dataIssues.nullScores} records có score null`);
    }
    
    if (analysis.dataIssues.invalidScores > 0) {
      differences.issues.push(`${analysis.dataIssues.invalidScores} records có score không hợp lệ`);
    }
    
    return { analysis, dashboard, differences };
    
  } catch (error) {
    console.error('❌ Lỗi so sánh với dashboard:', error);
    throw error;
  }
} 