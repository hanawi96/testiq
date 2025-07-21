/**
 * SmartLink Configuration
 * Cấu hình domains và rules cho SmartLink extension
 */

export interface SmartLinkConfig {
  internalDomains: string[];
  forceNofollow: boolean;
  openInNewTab: boolean;
  additionalAttributes?: Record<string, string>;
}

/**
 * Default configuration cho SmartLink
 */
export const DEFAULT_SMART_LINK_CONFIG: SmartLinkConfig = {
  internalDomains: [
    'localhost',
    '127.0.0.1',
    'astro-iq-test.vercel.app', // Thay bằng domain thật của bạn
    // Thêm các domain/subdomain khác nếu cần
  ],
  forceNofollow: true, // Tự động thêm nofollow cho external links
  openInNewTab: true,  // Tự động mở external links trong tab mới
  additionalAttributes: {
    // Có thể thêm các attributes khác nếu cần
  }
};

/**
 * Utility class để quản lý SmartLink configuration
 */
export class SmartLinkConfigManager {
  private static config: SmartLinkConfig = { ...DEFAULT_SMART_LINK_CONFIG };

  /**
   * Cập nhật danh sách internal domains
   */
  static updateInternalDomains(domains: string[]): void {
    this.config.internalDomains = [...domains];
  }

  /**
   * Thêm domain vào danh sách internal
   */
  static addInternalDomain(domain: string): void {
    if (!this.config.internalDomains.includes(domain)) {
      this.config.internalDomains.push(domain);
    }
  }

  /**
   * Xóa domain khỏi danh sách internal
   */
  static removeInternalDomain(domain: string): void {
    this.config.internalDomains = this.config.internalDomains.filter(d => d !== domain);
  }

  /**
   * Kiểm tra xem domain có phải internal không
   */
  static isInternalDomain(url: string): boolean {
    if (!url) return false;
    
    // Internal links (relative paths)
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return true;
    }
    
    // Anchor links
    if (url.startsWith('#')) {
      return true;
    }
    
    // Email và tel links
    if (url.startsWith('mailto:') || url.startsWith('tel:')) {
      return true;
    }
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      return this.config.internalDomains.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
    } catch {
      // URL không hợp lệ, coi như internal
      return true;
    }
  }

  /**
   * Lấy attributes cho link dựa trên URL
   */
  static getLinkAttributes(url: string): Record<string, string> {
    const isInternal = this.isInternalDomain(url);
    const attributes: Record<string, string> = {};

    if (!isInternal) {
      // External link attributes
      if (this.config.forceNofollow) {
        attributes.rel = 'nofollow noopener noreferrer';
      } else {
        attributes.rel = 'noopener noreferrer';
      }
      
      if (this.config.openInNewTab) {
        attributes.target = '_blank';
      }
    }

    // Thêm additional attributes nếu có
    if (this.config.additionalAttributes) {
      Object.assign(attributes, this.config.additionalAttributes);
    }

    return attributes;
  }

  /**
   * Cập nhật toàn bộ config
   */
  static updateConfig(newConfig: Partial<SmartLinkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Lấy config hiện tại
   */
  static getConfig(): SmartLinkConfig {
    return { ...this.config };
  }

  /**
   * Reset về config mặc định
   */
  static resetToDefault(): void {
    this.config = { ...DEFAULT_SMART_LINK_CONFIG };
  }

  /**
   * Tự động detect domain hiện tại và thêm vào internal list
   */
  static autoDetectCurrentDomain(): void {
    if (typeof window !== 'undefined') {
      const currentDomain = window.location.hostname;
      this.addInternalDomain(currentDomain);
    }
  }
}

/**
 * Hook để sử dụng SmartLink config trong React components
 */
export function useSmartLinkConfig() {
  return {
    config: SmartLinkConfigManager.getConfig(),
    updateInternalDomains: SmartLinkConfigManager.updateInternalDomains,
    addInternalDomain: SmartLinkConfigManager.addInternalDomain,
    removeInternalDomain: SmartLinkConfigManager.removeInternalDomain,
    isInternalDomain: SmartLinkConfigManager.isInternalDomain,
    getLinkAttributes: SmartLinkConfigManager.getLinkAttributes,
    updateConfig: SmartLinkConfigManager.updateConfig,
    resetToDefault: SmartLinkConfigManager.resetToDefault,
    autoDetectCurrentDomain: SmartLinkConfigManager.autoDetectCurrentDomain,
  };
}
