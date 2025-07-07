/**
 * Link Analyzer Service
 * Phân tích và tính toán internal/external links trong nội dung bài viết
 */

export interface LinkInfo {
  url: string;
  text: string;
  title?: string;
  isExternal: boolean;
  domain?: string;
}

export interface LinkAnalysis {
  internal_links: LinkInfo[];
  external_links: LinkInfo[];
  total_internal: number;
  total_external: number;
  broken_links?: string[];
}

export class LinkAnalyzer {
  private static readonly INTERNAL_DOMAINS = [
    'localhost',
    'yoursite.com', // Thay bằng domain thật của bạn
    'astro-iq-test.vercel.app' // Thay bằng domain production
  ];

  /**
   * Phân tích tất cả links trong HTML content
   */
  static analyzeContent(htmlContent: string, baseDomain?: string): LinkAnalysis {
    console.log('🔗 LinkAnalyzer: Analyzing content for links...');

    // Parse HTML để tìm tất cả thẻ <a>
    const linkRegex = /<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>(.*?)<\/a>/gi;
    const links: LinkInfo[] = [];
    let match;

    while ((match = linkRegex.exec(htmlContent)) !== null) {
      const url = match[1];
      const text = match[2].replace(/<[^>]*>/g, ''); // Remove HTML tags from link text
      
      // Extract title attribute if exists
      const titleMatch = match[0].match(/title\s*=\s*["']([^"']*)["']/i);
      const title = titleMatch ? titleMatch[1] : undefined;

      const linkInfo = this.analyzeSingleLink(url, text, title, baseDomain);
      if (linkInfo) {
        links.push(linkInfo);
      }
    }

    // Phân loại links
    const internal_links = links.filter(link => !link.isExternal);
    const external_links = links.filter(link => link.isExternal);

    const analysis: LinkAnalysis = {
      internal_links,
      external_links,
      total_internal: internal_links.length,
      total_external: external_links.length
    };

    console.log(`🔗 LinkAnalyzer: Found ${analysis.total_internal} internal and ${analysis.total_external} external links`);
    return analysis;
  }

  /**
   * Phân tích một link đơn lẻ
   */
  private static analyzeSingleLink(url: string, text: string, title?: string, baseDomain?: string): LinkInfo | null {
    if (!url || url.trim() === '') return null;

    // Skip anchor links, mailto, tel, etc.
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      return null;
    }

    let isExternal = false;
    let domain: string | undefined;

    try {
      // Handle relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        isExternal = false;
        domain = baseDomain || 'internal';
      } else if (url.startsWith('http://') || url.startsWith('https://')) {
        // Absolute URLs
        const urlObj = new URL(url);
        domain = urlObj.hostname;
        isExternal = !this.isInternalDomain(domain);
      } else {
        // Relative URLs without leading slash
        isExternal = false;
        domain = baseDomain || 'internal';
      }
    } catch (error) {
      console.warn('🔗 LinkAnalyzer: Invalid URL:', url);
      return null;
    }

    return {
      url: url.trim(),
      text: text.trim(),
      title,
      isExternal,
      domain
    };
  }

  /**
   * Kiểm tra xem domain có phải là internal không
   */
  private static isInternalDomain(domain: string): boolean {
    return this.INTERNAL_DOMAINS.some(internalDomain => 
      domain === internalDomain || domain.endsWith(`.${internalDomain}`)
    );
  }

  /**
   * Cập nhật danh sách internal domains
   */
  static updateInternalDomains(domains: string[]): void {
    this.INTERNAL_DOMAINS.length = 0;
    this.INTERNAL_DOMAINS.push(...domains);
  }

  /**
   * Kiểm tra broken links (optional - cần implement riêng)
   */
  static async checkBrokenLinks(links: LinkInfo[]): Promise<string[]> {
    const brokenLinks: string[] = [];
    
    // TODO: Implement actual link checking
    // for (const link of links) {
    //   if (link.isExternal) {
    //     try {
    //       const response = await fetch(link.url, { method: 'HEAD' });
    //       if (!response.ok) {
    //         brokenLinks.push(link.url);
    //       }
    //     } catch (error) {
    //       brokenLinks.push(link.url);
    //     }
    //   }
    // }

    return brokenLinks;
  }

  /**
   * Tạo báo cáo link analysis
   */
  static generateReport(analysis: LinkAnalysis): string {
    const report = [
      '📊 LINK ANALYSIS REPORT',
      '========================',
      `🔗 Total Links: ${analysis.total_internal + analysis.total_external}`,
      `🏠 Internal Links: ${analysis.total_internal}`,
      `🌐 External Links: ${analysis.total_external}`,
      '',
      '🏠 INTERNAL LINKS:',
      ...analysis.internal_links.map(link => `  • ${link.text} → ${link.url}`),
      '',
      '🌐 EXTERNAL LINKS:',
      ...analysis.external_links.map(link => `  • ${link.text} → ${link.url} (${link.domain})`),
    ];

    return report.join('\n');
  }

  /**
   * Tối ưu hóa links cho SEO
   */
  static optimizeForSEO(analysis: LinkAnalysis): {
    recommendations: string[];
    score: number;
  } {
    const recommendations: string[] = [];
    let score = 100;

    // Kiểm tra tỷ lệ internal vs external
    const totalLinks = analysis.total_internal + analysis.total_external;
    if (totalLinks > 0) {
      const internalRatio = analysis.total_internal / totalLinks;
      
      if (internalRatio < 0.3) {
        recommendations.push('Nên thêm nhiều internal links hơn để cải thiện SEO');
        score -= 10;
      }
      
      if (analysis.total_external > 10) {
        recommendations.push('Quá nhiều external links có thể làm giảm link juice');
        score -= 5;
      }
    }

    // Kiểm tra link text
    const emptyTextLinks = [...analysis.internal_links, ...analysis.external_links]
      .filter(link => !link.text || link.text.trim() === '');
    
    if (emptyTextLinks.length > 0) {
      recommendations.push('Một số links thiếu anchor text');
      score -= emptyTextLinks.length * 2;
    }

    return {
      recommendations,
      score: Math.max(0, score)
    };
  }
}
