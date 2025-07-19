import { supabase, supabaseAdmin, TABLES } from '../config/supabase';

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  timezone: string;
  updated_at: string;
  updated_by: string;
}

export interface SettingsUpdateData {
  site_name?: string;
  site_tagline?: string;
  site_description?: string;
  logo_url?: string;
  favicon_url?: string;
  timezone?: string;
}

export class SettingsService {
  private static readonly SETTINGS_KEY = 'site_settings';
  private static cache: SiteSettings | null = null;
  private static cacheExpiry: number = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes



  /**
   * Get current site settings
   */
  static async getSiteSettings(): Promise<{ data: SiteSettings | null; error: any }> {
    try {
      // Check cache first
      if (this.cache && Date.now() < this.cacheExpiry) {
        console.log('SettingsService: Returning cached settings');
        return { data: this.cache, error: null };
      }

      console.log('SettingsService: Fetching site settings from database');

      // Try to get from database first using admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('system_settings')
        .select('*')
        .eq('key', this.SETTINGS_KEY)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('SettingsService: Error fetching settings:', error);
        return { data: null, error };
      }

      let settings: SiteSettings;

      if (!data) {
        // Create default settings if none exist
        console.log('SettingsService: No settings found, creating defaults');
        settings = this.getDefaultSettings();
        await this.createDefaultSettings(settings);
      } else {
        settings = data.value as SiteSettings;
      }

      // Update cache
      this.cache = settings;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      console.log('SettingsService: Settings retrieved successfully');
      return { data: settings, error: null };
    } catch (err) {
      console.error('SettingsService: Unexpected error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update site settings
   */
  static async updateSiteSettings(
    updates: SettingsUpdateData,
    updatedBy: string
  ): Promise<{ data: SiteSettings | null; error: any }> {
    try {
      console.log('SettingsService: Updating site settings');

      // Get current settings
      const { data: currentSettings, error: fetchError } = await this.getSiteSettings();
      if (fetchError) {
        return { data: null, error: fetchError };
      }

      // Merge updates with current settings
      const updatedSettings: SiteSettings = {
        ...currentSettings!,
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy
      };

      // Update in database using admin client to bypass RLS
      const client = supabaseAdmin || supabase;

      // Try update first, then insert if not exists
      let { data, error } = await client
        .from('system_settings')
        .update({
          value: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('key', this.SETTINGS_KEY)
        .select()
        .single();

      // If no rows updated, try insert
      if (error && error.code === 'PGRST116') {
        const insertResult = await client
          .from('system_settings')
          .insert({
            key: this.SETTINGS_KEY,
            value: updatedSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        data = insertResult.data;
        error = insertResult.error;
      }

      if (error) {
        console.error('SettingsService: Error updating settings:', error);
        return { data: null, error };
      }

      // Clear cache to force refresh
      this.clearCache();

      console.log('SettingsService: Settings updated successfully');
      return { data: updatedSettings, error: null };
    } catch (err) {
      console.error('SettingsService: Unexpected error:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get default settings
   */
  private static getDefaultSettings(): SiteSettings {
    return {
      site_name: 'IQ Test Platform',
      site_tagline: 'Discover Your Intelligence',
      site_description: 'Professional IQ testing platform with comprehensive analytics and insights.',
      logo_url: '',
      favicon_url: '',
      timezone: 'Asia/Ho_Chi_Minh',
      updated_at: new Date().toISOString(),
      updated_by: 'system'
    };
  }

  /**
   * Create default settings in database
   */
  private static async createDefaultSettings(settings: SiteSettings): Promise<void> {
    try {
      const client = supabaseAdmin || supabase;
      await client
        .from('system_settings')
        .insert({
          key: this.SETTINGS_KEY,
          value: settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('SettingsService: Error creating default settings:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
    console.log('SettingsService: Cache cleared');
  }

  /**
   * Get available timezones
   */
  static getTimezones(): Array<{ value: string; label: string; offset: string }> {
    return [
      { value: 'Asia/Ho_Chi_Minh', label: 'Việt Nam (GMT+7)', offset: '+07:00' },
      { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)', offset: '+07:00' },
      { value: 'Asia/Singapore', label: 'Singapore (GMT+8)', offset: '+08:00' },
      { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)', offset: '+09:00' },
      { value: 'Asia/Seoul', label: 'Seoul (GMT+9)', offset: '+09:00' },
      { value: 'UTC', label: 'UTC (GMT+0)', offset: '+00:00' },
      { value: 'America/New_York', label: 'New York (GMT-5)', offset: '-05:00' },
      { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)', offset: '-08:00' },
      { value: 'Europe/London', label: 'London (GMT+0)', offset: '+00:00' },
      { value: 'Europe/Paris', label: 'Paris (GMT+1)', offset: '+01:00' },
      { value: 'Australia/Sydney', label: 'Sydney (GMT+11)', offset: '+11:00' }
    ];
  }
}
