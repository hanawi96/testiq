import { supabase } from '../config/supabase';

export type DashboardStats = {
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
};

const COUNTRY_FLAGS: Record<string, string> = {
  VN: '🇻🇳', US: '🇺🇸', JP: '🇯🇵', KR: '🇰🇷', SG: '🇸🇬', CN: '🇨🇳',
  TW: '🇹🇼', IN: '🇮🇳', BR: '🇧🇷', FI: '🇫🇮', DE: '🇩🇪', GB: '🇬🇧',
  FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸', CA: '🇨🇦', AU: '🇦🇺', RU: '🇷🇺',
  MX: '🇲🇽', AR: '🇦🇷'
};

const AGE_RANGES = [
  { min: 0, max: 20, label: "16-20" },
  { min: 21, max: 25, label: "21-25" },
  { min: 26, max: 30, label: "26-30" },
  { min: 31, max: 35, label: "31-35" },
  { min: 36, max: Infinity, label: "36+" }
];

const IQ_RANGES = [
  { min: 70, max: 85, label: "70-85" },
  { min: 85, max: 100, label: "85-100" },
  { min: 100, max: 115, label: "100-115" },
  { min: 115, max: 130, label: "115-130" },
  { min: 130, max: Infinity, label: "130+" }
];

const CACHE_DURATION = 10_000; // 10s
let dashboardCache: { data: DashboardStats | null; lastFetch: number } = { data: null, lastFetch: 0 };

function log(...args: any[]) {
  if (process.env.NODE_ENV === 'development') console.log(...args);
}

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
    ageDistribution: AGE_RANGES.map(r => ({ age: r.label, percentage: 0 })),
    iqDistribution: IQ_RANGES.map(r => ({ range: r.label, count: 0 }))
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = Date.now();
  if (dashboardCache.data && (now - dashboardCache.lastFetch) < CACHE_DURATION) {
    log('📋 Using cached dashboard stats');
    return dashboardCache.data;
  }

  try {
    const { data: results, error } = await supabase
      .from('user_test_results')
      .select('score, duration_seconds, age, country, country_code, tested_at, email, id');
    if (error) throw error;
    if (!results?.length) return getDefaultStats();

    const stats = calcStats(results);
    dashboardCache = { data: stats, lastFetch: now };
    log('✅ Dashboard stats calculated');
    return stats;
  } catch (e) {
    log('❌ Error:', e);
    return getDefaultStats();
  }
}

function calcStats(results: any[]): DashboardStats {
  const countryStats = new Map<string, {
    name: string;
    emails: Set<string>;
    totalScore: number;
    scores: number[];
  }>();

  let totalScore = 0, totalDuration = 0, durationCount = 0;
  let genius = 0, smart = 0, excellent = 0;
  const uniqueCountries = new Set<string>();
  const ageBuckets = Array(AGE_RANGES.length).fill(0);
  const iqBuckets = Array(IQ_RANGES.length).fill(0);
  const validRecords = results.filter(r => r.score != null && r.score >= 0);

  for (const [i, rec] of validRecords.entries()) {
    const { score, duration_seconds, age, country, country_code, email, id } = rec;
    totalScore += score;

    if (typeof duration_seconds === 'number' && duration_seconds >= 0) {
      totalDuration += duration_seconds; durationCount++;
    }

    if (score >= 140) genius++; else if (score >= 130) smart++; else if (score >= 115) excellent++;

    // IQ buckets
    for (let b = 0; b < IQ_RANGES.length; ++b) {
      if (score >= IQ_RANGES[b].min && score < IQ_RANGES[b].max) { iqBuckets[b]++; break; }
      if (b === IQ_RANGES.length - 1 && score >= IQ_RANGES[b].min) iqBuckets[b]++;
    }
    // Age buckets
    if (age) {
      for (let b = 0; b < AGE_RANGES.length; ++b) {
        if (age >= AGE_RANGES[b].min && age <= AGE_RANGES[b].max) { ageBuckets[b]++; break; }
      }
    }
    // Country stats
    const cKey = country_code || country || 'Unknown';
    const cName = country || country_code || 'Không rõ';
    uniqueCountries.add(cKey);
    if (!countryStats.has(cKey)) {
      countryStats.set(cKey, { name: cName, emails: new Set(), totalScore: 0, scores: [] });
    }
    const stat = countryStats.get(cKey)!;
    stat.emails.add(email || `anonymous_${id || `${score}_${age || 'unknown'}_${i}`}`);
    stat.totalScore += score;
    stat.scores.push(score);
  }

  // Unique participant calculation (same as leaderboard)
  const emailBestScores = new Map<string, any>();
  for (const r of validRecords) {
    if (!r.email) continue;
    const prev = emailBestScores.get(r.email);
    if (!prev || r.score > prev.score) emailBestScores.set(r.email, r);
  }
  const totalParticipants = emailBestScores.size;

  const avgIQ = validRecords.length > 0 ? Math.round(totalScore / validRecords.length) : 100;
  let avgDur = durationCount > 0 ? totalDuration / durationCount : 300;
  avgDur = Math.min(Math.max(avgDur, 30), 1800); // Clamp 30s-30m
  const averageTestTime = `${Math.floor(avgDur / 60)}:${String(Math.round(avgDur % 60)).padStart(2, '0')}`;

  const topCountriesByIQ = Array.from(countryStats.entries())
    .filter(([, stat]) => stat.scores.length >= 3)
    .map(([code, stat]) => ({
      country: stat.name,
      flag: COUNTRY_FLAGS[code] || '🏳️',
      avgIQ: Math.round(stat.totalScore / stat.scores.length)
    }))
    .sort((a, b) => b.avgIQ - a.avgIQ)
    .slice(0, 5);

  const topCountriesByParticipants = Array.from(countryStats.entries())
    .map(([code, stat]) => ({
      country: stat.name,
      flag: COUNTRY_FLAGS[code] || '🏳️',
      participants: stat.emails.size
    }))
    .filter(c => c.participants > 0)
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 5);

  const ageDistribution = AGE_RANGES.map((r, i) => ({
    age: r.label,
    percentage: validRecords.length ? Math.round((ageBuckets[i] / validRecords.length) * 100) : 0
  }));
  const iqDistribution = IQ_RANGES.map((r, i) => ({
    range: r.label,
    count: iqBuckets[i]
  }));

  return {
    totalCountries: uniqueCountries.size,
    totalParticipants,
    globalAverageIQ: avgIQ,
    averageTestTime,
    geniusBadges: genius,
    smartBadges: smart,
    excellentBadges: excellent,
    topCountriesByIQ,
    topCountriesByParticipants,
    ageDistribution,
    iqDistribution
  };
}

export function clearDashboardCache() {
  dashboardCache = { data: null, lastFetch: 0 };
  log('🧹 Dashboard cache cleared');
}

export async function forceRefreshDashboardStats() {
  clearDashboardCache();
  return await getDashboardStats();
}

// DEBUG & TEST functions (giữ nguyên, rút gọn log, không thay đổi logic)

export async function testTopCountriesData(): Promise<void> {
  clearDashboardCache();
  const stats = await getDashboardStats();
  log('🏆 TOP 5 COUNTRIES BY PARTICIPANTS:', stats.topCountriesByParticipants);
  log('🌟 TOP 5 COUNTRIES BY IQ:', stats.topCountriesByIQ);
}

export async function debugDashboardStats(): Promise<DashboardStats & { debug: any }> {
  clearDashboardCache();
  const { data: results, error } = await supabase
    .from('user_test_results')
    .select('score, duration_seconds, age, country, country_code, tested_at, email');
  if (error) throw error;
  const validRecords = results.filter((r: any) => r.score != null && r.score >= 0);
  const uniqueEmails = new Set(validRecords.filter((r: any) => r.email).map((r: any) => r.email));
  const stats = calcStats(results);
  return {
    ...stats,
    debug: {
      rawRecords: results.length,
      validRecords: validRecords.length,
      uniqueEmails: uniqueEmails.size
    }
  };
}
