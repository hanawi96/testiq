import countryData from '../../Country.json';

interface Country {
  name: string;
  code: string;
  emoji: string;
  unicode: string;
  image: string;
  dial_code: string;
}

// Cache for country lookup
const countryMap = new Map<string, Country>();
const countryCodeMap = new Map<string, Country>();

// Initialize maps
countryData.forEach((country: Country) => {
  countryMap.set(country.name.toLowerCase(), country);
  countryCodeMap.set(country.code.toLowerCase(), country);
});

/**
 * Get country flag emoji by country name
 */
export function getCountryFlag(countryName: string): string {
  if (!countryName) return '';
  
  const country = countryMap.get(countryName.toLowerCase());
  return country?.emoji || '';
}

/**
 * Get country flag emoji by country code
 */
export function getCountryFlagByCode(countryCode: string): string {
  if (!countryCode) return '';
  
  const country = countryCodeMap.get(countryCode.toLowerCase());
  return country?.emoji || '';
}

/**
 * Get country flag SVG URL by country name
 */
export function getCountryFlagSvg(countryName: string): string {
  if (!countryName) return '';
  
  const country = countryMap.get(countryName.toLowerCase());
  if (!country) return '';
  
  return `https://country-code-au6g.vercel.app/${country.code}.svg`;
}

/**
 * Get country flag SVG URL by country code
 */
export function getCountryFlagSvgByCode(countryCode: string): string {
  if (!countryCode) return '';
  
  return `https://country-code-au6g.vercel.app/${countryCode.toUpperCase()}.svg`;
}

/**
 * Get country info by name
 */
export function getCountryInfo(countryName: string): Country | null {
  if (!countryName) return null;
  
  return countryMap.get(countryName.toLowerCase()) || null;
}

/**
 * Get country info by code
 */
export function getCountryInfoByCode(countryCode: string): Country | null {
  if (!countryCode) return null;
  
  return countryCodeMap.get(countryCode.toLowerCase()) || null;
}

/**
 * Format country display with flag
 */
export function formatCountryWithFlag(countryName: string, useEmoji: boolean = true): string {
  if (!countryName) return '';
  
  const flag = useEmoji ? getCountryFlag(countryName) : '';
  return flag ? `${flag} ${countryName}` : countryName;
}

/**
 * Search countries by name (for autocomplete)
 */
export function searchCountries(query: string): Country[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return countryData.filter(country => 
    country.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}
