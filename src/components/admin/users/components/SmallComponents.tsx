/**
 * SMALL COMPONENTS - TỐI ƯU HÓA
 * Gộp các component nhỏ để giảm số file
 */

import React from 'react';
import { formatGender } from '../utils/formatters';
import countryData from '../../../../../Country.json';

// === GENDER DISPLAY ===
interface GenderDisplayProps {
  gender: string | null | undefined;
  className?: string;
}

export const GenderDisplay: React.FC<GenderDisplayProps> = React.memo(({ gender, className = '' }) => {
  const genderInfo = formatGender(gender);
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {genderInfo.icon && <span className="text-base">{genderInfo.icon}</span>}
      <span>{genderInfo.text}</span>
    </div>
  );
});

// === COUNTRY FLAG ===
interface CountryFlagProps {
  countryName: string;
  countryCode?: string;
  size?: 'sm' | 'md';
  className?: string;
}

// Pre-compute mapping
const COUNTRY_MAP = new Map<string, string>();
countryData.forEach((country: any) => COUNTRY_MAP.set(country.name.toLowerCase(), country.code));
['viet nam', 'vietnam'].forEach(name => COUNTRY_MAP.set(name, 'VN'));
COUNTRY_MAP.set('united states', 'US');
COUNTRY_MAP.set('united kingdom', 'GB');

const getCountryCode = (countryName: string): string | null => 
  COUNTRY_MAP.get(countryName.toLowerCase()) || null;

export const CountryFlag: React.FC<CountryFlagProps> = React.memo(({ 
  countryName, countryCode, size = 'md', className = '' 
}) => {
  const code = countryCode || getCountryCode(countryName);
  const sizeClasses = size === 'sm' ? 'w-4 h-3' : 'w-5 h-4';

  if (!code) return <span className="text-sm text-gray-400">🏳️</span>;

  return (
    <img
      src={`/flag/${code}.svg`}
      alt={`${countryName} flag`}
      className={`${sizeClasses} object-cover rounded-sm ${className}`}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
});

// === USER AVATAR ===
interface UserAvatarProps {
  user: any;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = React.memo(({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm', 
    lg: 'w-10 h-10 text-base'
  };

  const displayName = user.full_name || user.username || user.email || 'U';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={displayName}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-gray-600 dark:text-gray-300 ${className}`}>
      {initials}
    </div>
  );
});

// Set display names
GenderDisplay.displayName = 'GenderDisplay';
CountryFlag.displayName = 'CountryFlag';
UserAvatar.displayName = 'UserAvatar';
