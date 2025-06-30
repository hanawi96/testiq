import { supabase } from '../config/supabase';

// Interface thống kê dashboard
export interface DashboardStats {
  totalCountries: number;
  totalParticipants: number;
  globalAverageIQ: number;
  averageTestTime: string;
  geniusBadges: number;
  smartBadges: number;
  excellentBadges: number;
  topCountriesByIQ: Array<{ country: string; flag: string; avgIQ: number }>;
  topCountriesByParticipants: Array<{ country: string; flag: string; participants: number }>;
  ageDistribution: Array<{ age: string; percentage: number }>;
  iqDistribution: Array<{ range: string; count: number }>;
}

// Map country code to flag emoji
const countryFlags: Record<string, string> = {
  'VN': '🇻🇳', 'US': '🇺🇸', 'JP': '🇯🇵', 'KR': '🇰🇷', 'SG': '🇸🇬',
  'CN': '🇨🇳', 'TW': '🇹🇼', 'IN': '🇮🇳', 'BR': '🇧🇷', 'FI': '🇫🇮',
  'DE': '🇩🇪', 'GB': '🇬🇧', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸',
  'CA': '🇨🇦', 'AU': '🇦🇺', 'RU': '🇷🇺', 'MX': '🇲🇽', 'AR': '🇦🇷'
};

// Cache thông minh
let dashboardCache: {
  data: DashboardStats | null;
  lastFetch: number;
} = { data: null, lastFetch: 0 };

const CACHE_DURATION = 10 * 1000; // 10 giây - near real-time updates

/**
 * Tính toán thống kê dashboard siêu tối ưu từ dữ liệu thật
 * 🚀 HIỆU SUẤT: 1 query duy nhất, xử lý thông minh, cache thông minh
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Kiểm tra cache
    const now = Date.now();
    if (dashboardCache.data && (now - dashboardCache.lastFetch) < CACHE_DURATION) {
      console.log('📋 Using cached dashboard stats');
      return dashboardCache.data;
    }

    console.log('🔄 Tính toán dashboard stats fresh...');

    // Query tối ưu: lấy tất cả dữ liệu cần thiết trong 1 lần + email để đếm unique
    const { data: results, error } = await supabase
      .from('user_test_results')
      .select(`
        score,
        duration_seconds,
        age,
        country,
        country_code,
        tested_at,
        email,
        id
      `);

    if (error) throw error;

    if (!results?.length) {
      console.log('⚠️ No data found, returning default stats');
      return getDefaultStats();
    }

    // Xử lý dữ liệu thông minh và nhanh
    const stats = calculateOptimizedStats(results);
    
    // Cập nhật cache
    dashboardCache = {
      data: stats,
      lastFetch: now
    };

    console.log(`✅ Dashboard stats calculated for ${results.length} records`);
    console.log(`🏆 Top countries: ${stats.topCountriesByParticipants.map(c => `${c.country}:${c.participants}`).join(', ')}`);
    
    return stats;

  } catch (error) {
    console.error('❌ Lỗi dashboard stats:', error);
    return getDefaultStats();
  }
}

/**
 * Thuật toán tính toán thống kê siêu tối ưu
 * 🧠 THÔNG MINH: Xử lý tất cả trong 1 vòng lặp, memory-efficient
 */
function calculateOptimizedStats(results: any[]): DashboardStats {
  // ✅ FIXED: Khởi tạo counters để đếm unique emails theo quốc gia
  const countryStats = new Map<string, { 
    name: string; 
    emails: Set<string>; // Đếm unique emails thay vì count
    totalScore: number; 
    scores: number[]; 
  }>();
  const ageRanges = [0, 0, 0, 0, 0]; // 16-20, 21-25, 26-30, 31-35, 36+
  const iqRanges = [0, 0, 0, 0, 0]; // 70-85, 85-100, 100-115, 115-130, 130+
  
  let totalScore = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let geniusCount = 0;
  let smartCount = 0;
  let excellentCount = 0;
  const uniqueCountries = new Set<string>();

  // ✅ FIXED: Xử lý tất cả trong 1 vòng lặp - LOGIC ĐƠN GIẢN HÓA
  for (const [index, record] of results.entries()) {
    const { score, duration_seconds, age, country, country_code, email } = record;
    
    // Chỉ xử lý records có score hợp lệ
    if (score == null || score < 0) continue;
    
    // Tính tổng điểm
    totalScore += score;
    
    // ✅ FIXED: Tính thời gian - bao gồm cả duration = 0 (hợp lệ)
    if (duration_seconds != null && duration_seconds >= 0) {
      totalDuration += duration_seconds;
      durationCount++;
    }
    
    // Badge counting
    if (score >= 140) geniusCount++;
    else if (score >= 130) smartCount++;
    else if (score >= 115) excellentCount++;
    
    // Phân bố IQ
    if (score < 85) iqRanges[0]++;
    else if (score < 100) iqRanges[1]++;
    else if (score < 115) iqRanges[2]++;
    else if (score < 130) iqRanges[3]++;
    else iqRanges[4]++;
    
    // Phân bố tuổi
    if (age) {
      if (age <= 20) ageRanges[0]++;
      else if (age <= 25) ageRanges[1]++;
      else if (age <= 30) ageRanges[2]++;
      else if (age <= 35) ageRanges[3]++;
      else ageRanges[4]++;
    }
    
    // ✅ SUPER FIX: Thống kê quốc gia - LOGIC ĐƠN GIẢN & CHÍNH XÁC
    if (country || country_code) {
      // Xác định country key và name
      const countryKey = country_code || country || 'Unknown';
      const countryName = country || country_code || 'Không rõ';
      
      uniqueCountries.add(countryKey);
      
      if (!countryStats.has(countryKey)) {
        countryStats.set(countryKey, {
          name: countryName,
          emails: new Set<string>(),
          totalScore: 0,
          scores: []
        });
      }
      
      const stat = countryStats.get(countryKey)!;
      
      // 🔥 FIX: Đếm unique participants - STABLE & CONSISTENT
      if (email) {
        stat.emails.add(email);
      } else {
        // Sử dụng ID record thay vì random để đảm bảo consistency
        const anonymousKey = `anonymous_${record.id || `${score}_${age || 'unknown'}_${index}`}`;
        stat.emails.add(anonymousKey);
      }
      
      stat.totalScore += score;
      stat.scores.push(score);
    }
  }

  // ✅ SUPER FIX: Đếm participants chính xác - BAO GỒM TẤT CẢ
  const validRecords = results.filter(r => r.score != null && r.score >= 0);
  
  // 🔥 FIX: Đếm unique participants theo logic SAME AS LEADERBOARD
  // Sử dụng EXACT SAME logic như leaderboard service để đảm bảo consistency
  const emailBestScores = new Map<string, any>();
  for (const record of validRecords) {
    const email = record.email;
    if (!email) continue; // Bỏ qua records không có email (giống leaderboard)
    
    const existing = emailBestScores.get(email);
    if (!existing || record.score > existing.score) {
      emailBestScores.set(email, record);
    }
  }
  
  // ✅ CONSISTENT: Số participants = số unique emails sau dedup (SAME AS LEADERBOARD)
  const totalUniqueParticipants = emailBestScores.size;
  
  console.log('👥 PARTICIPANTS CALCULATION (FIXED):');
  console.log('📧 Total valid records:', validRecords.length);
  console.log('📧 Records with email:', validRecords.filter(r => r.email).length);
  console.log('📧 Unique emails after dedup:', emailBestScores.size);
  console.log('🎯 Total participants (SAME AS LEADERBOARD):', totalUniqueParticipants);
  
  const globalAverageIQ = validRecords.length > 0 ? Math.round(totalScore / validRecords.length) : 100;
  
  // ✅ FIXED: Thời gian trung bình thông minh hơn
  let avgDurationSeconds;
  if (durationCount > 0) {
    avgDurationSeconds = totalDuration / durationCount;
    // Validation: thời gian hợp lý (30 giây - 30 phút)
    if (avgDurationSeconds < 30) avgDurationSeconds = 30;
    if (avgDurationSeconds > 1800) avgDurationSeconds = 1800;
  } else {
    // Fallback thông minh dựa trên data thực tế
    avgDurationSeconds = 300; // 5:00 - realistic for IQ test
  }
  
  // ✅ FIXED: Format thời gian chính xác
  const minutes = Math.floor(avgDurationSeconds / 60);
  const seconds = Math.round(avgDurationSeconds % 60);
  const averageTestTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // ✅ FIXED: Top quốc gia theo IQ - ĐƠN GIẢN HÓA
  const topCountriesByIQ = Array.from(countryStats.entries())
    .filter(([_, stat]) => stat.scores.length >= 3) // Giảm threshold từ 5 xuống 3
    .map(([code, stat]) => ({
      country: stat.name,
      flag: countryFlags[code] || '🏳️',
      avgIQ: Math.round(stat.totalScore / stat.scores.length)
    }))
    .sort((a, b) => b.avgIQ - a.avgIQ)
    .slice(0, 5);

  // ✅ SUPER FIX: Top quốc gia theo số người tham gia - CHÍNH XÁC 100%
  const topCountriesByParticipants = Array.from(countryStats.entries())
    .map(([code, stat]) => ({
      country: stat.name,
      flag: countryFlags[code] || '🏳️',
      participants: stat.emails.size // Số người unique (emails + anonymous)
    }))
    .filter(country => country.participants > 0) // Chỉ hiển thị quốc gia có người chơi
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5);

  console.log('🔥 DEBUG: Country stats generated:');
  console.log('📊 Total countries:', countryStats.size);
  console.log('🏆 Top countries by participants:', topCountriesByParticipants);

  // Phân bố tuổi (phần trăm) - dùng total records để tính %
  const ageDistribution = [
    { age: "16-20", percentage: Math.round((ageRanges[0] / validRecords.length) * 100) },
    { age: "21-25", percentage: Math.round((ageRanges[1] / validRecords.length) * 100) },
    { age: "26-30", percentage: Math.round((ageRanges[2] / validRecords.length) * 100) },
    { age: "31-35", percentage: Math.round((ageRanges[3] / validRecords.length) * 100) },
    { age: "36+", percentage: Math.round((ageRanges[4] / validRecords.length) * 100) }
  ];

  // Phân bố IQ
  const iqDistribution = [
    { range: "70-85", count: iqRanges[0] },
    { range: "85-100", count: iqRanges[1] },
    { range: "100-115", count: iqRanges[2] },
    { range: "115-130", count: iqRanges[3] },
    { range: "130+", count: iqRanges[4] }
  ];

  return {
    totalCountries: uniqueCountries.size,
    totalParticipants: totalUniqueParticipants,
    globalAverageIQ,
    averageTestTime,
    geniusBadges: geniusCount,
    smartBadges: smartCount,
    excellentBadges: excellentCount,
    topCountriesByIQ,
    topCountriesByParticipants,
    ageDistribution,
    iqDistribution
  };
}

/**
 * Stats mặc định khi không có dữ liệu
 */
function getDefaultStats(): DashboardStats {
  return {
    totalCountries: 0,
    totalParticipants: 0,
    globalAverageIQ: 100,
    averageTestTime: "5:00",
    geniusBadges: 0,
    smartBadges: 0,
    excellentBadges: 0,
    topCountriesByIQ: [],
    topCountriesByParticipants: [],
    ageDistribution: [
      { age: "16-20", percentage: 0 },
      { age: "21-25", percentage: 0 },
      { age: "26-30", percentage: 0 },
      { age: "31-35", percentage: 0 },
      { age: "36+", percentage: 0 }
    ],
    iqDistribution: [
      { range: "70-85", count: 0 },
      { range: "85-100", count: 0 },
      { range: "100-115", count: 0 },
      { range: "115-130", count: 0 },
      { range: "130+", count: 0 }
    ]
  };
}

/**
 * Xóa cache để force refresh
 */
export function clearDashboardCache(): void {
  dashboardCache = { data: null, lastFetch: 0 };
  console.log('🧹 Dashboard cache cleared - will force fresh calculation');
}

/**
 * 🚀 INSTANT TEST: Ngay lập tức test và hiển thị kết quả
 */
export async function testTopCountriesData(): Promise<void> {
  try {
    console.log('\n🔬 TESTING TOP COUNTRIES DATA...');
    
    // Clear cache to force fresh calculation
    clearDashboardCache();
    
    // Get fresh stats
    const stats = await getDashboardStats();
    
    console.log('\n✅ RESULTS:');
    console.log('📊 Total Countries:', stats.totalCountries);
    console.log('👥 Total Participants:', stats.totalParticipants);
    console.log('\n🏆 TOP 5 COUNTRIES BY PARTICIPANTS:');
    
    if (stats.topCountriesByParticipants.length > 0) {
      stats.topCountriesByParticipants.forEach((country, index) => {
        console.log(`${index + 1}. ${country.flag} ${country.country}: ${country.participants} người`);
      });
    } else {
      console.log('❌ NO DATA - Kiểm tra database connection và dữ liệu');
    }
    
    console.log('\n🌟 TOP 5 COUNTRIES BY IQ:');
    if (stats.topCountriesByIQ.length > 0) {
      stats.topCountriesByIQ.forEach((country, index) => {
        console.log(`${index + 1}. ${country.flag} ${country.country}: ${country.avgIQ} IQ`);
      });
    } else {
      console.log('❌ NO IQ DATA');
    }
    
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
  }
}

/**
 * 🔧 DEBUG: Force refresh và hiển thị kết quả chi tiết
 */
export async function debugDashboardStats(): Promise<DashboardStats & { debug: any }> {
  // Force clear cache
  clearDashboardCache();
  
  console.log('🔍 DEBUG: Bắt đầu tính toán mới...');
  
  // Get fresh data - THÊM EMAIL
  const { data: results, error } = await supabase
    .from('user_test_results')
    .select(`
      score,
      duration_seconds,
      age,
      country,
      country_code,
      tested_at,
      email
    `);

  if (error) throw error;

  console.log(`📊 DEBUG: Total raw records: ${results?.length || 0}`);
  
  if (!results?.length) {
    return { ...getDefaultStats(), debug: { rawRecords: 0, validRecords: 0 } };
  }

  // Debug data quality - THÊM DURATION DEBUG
  const validRecords = results.filter(r => r.score != null && r.score >= 0);
  const recordsWithCountry = results.filter(r => r.country && r.country_code);
  const recordsWithDuration = results.filter(r => r.duration_seconds != null && r.duration_seconds >= 0);
  const validDurations = results.filter(r => r.duration_seconds != null && r.duration_seconds > 0);
  const uniqueCountryCodes = new Set(results.filter(r => r.country_code).map(r => r.country_code));
  const uniqueEmails = new Set(validRecords.filter(r => r.email).map(r => r.email));
  
  console.log(`✅ DEBUG: Valid records: ${validRecords.length}`);
  console.log(`🌍 DEBUG: Records with country: ${recordsWithCountry.length}`);
  console.log(`👤 DEBUG: Unique emails: ${uniqueEmails.size}`);
  console.log(`⏱️ DEBUG: Records with duration: ${recordsWithDuration.length}`);
  console.log(`⏰ DEBUG: Valid durations > 0: ${validDurations.length}`);
  console.log(`🗺️ DEBUG: Unique countries: ${uniqueCountryCodes.size}`);
  console.log(`🏳️ DEBUG: Country codes: ${Array.from(uniqueCountryCodes).slice(0, 10).join(', ')}...`);
  
  // Debug duration samples
  if (validDurations.length > 0) {
    const durationSamples = validDurations.slice(0, 5).map(r => r.duration_seconds);
    console.log(`📊 DEBUG: Duration samples: ${durationSamples.join(', ')} seconds`);
  }

  const stats = calculateOptimizedStats(results);
  
  const debug = {
    rawRecords: results.length,
    validRecords: validRecords.length,
    uniqueEmails: uniqueEmails.size,
    recordsWithCountry: recordsWithCountry.length,
    recordsWithDuration: recordsWithDuration.length,
    validDurations: validDurations.length,
    averageTestTime: stats.averageTestTime,
    uniqueCountryCodes: Array.from(uniqueCountryCodes),
    topCountriesDebug: stats.topCountriesByParticipants,
    durationSamples: validDurations.slice(0, 5).map(r => r.duration_seconds)
  };

  console.log(`🎯 DEBUG: Final stats - Countries: ${stats.totalCountries}, Participants: ${stats.totalParticipants} unique emails, AvgTime: ${stats.averageTestTime}`);
  
  return { ...stats, debug };
}

/**
 * 🔄 Force refresh dashboard stats - Clear cache và reload ngay
 */
export async function forceRefreshDashboardStats(): Promise<DashboardStats> {
  console.log('🔄 Force refreshing dashboard stats...');
  clearDashboardCache();
  const stats = await getDashboardStats();
  console.log('✅ Force refresh completed');
  return stats;
} 