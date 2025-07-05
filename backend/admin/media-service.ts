export interface MediaFile {
  id: string;
  name: string;
  original_name: string;
  file_type: 'image' | 'document' | 'video' | 'audio';
  mime_type: string;
  extension: string;
  size: number; // in bytes
  width?: number; // for images/videos
  height?: number; // for images/videos
  duration?: number; // for videos/audio in seconds
  url: string;
  thumbnail_url?: string;
  folder_id?: string;
  alt_text?: string; // for SEO
  description?: string;
  usage_count: number;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  tags: string[];
}

export interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  file_count: number;
  created_at: string;
  updated_at: string;
}

export interface MediaStats {
  totalFiles: number;
  totalSize: number; // in bytes
  storageUsed: string; // formatted string
  storageQuota: string; // formatted string
  usagePercentage: number;
  filesByType: {
    images: number;
    documents: number;
    videos: number;
    audio: number;
  };
  recentUploads: number; // files uploaded in last 7 days
}

export interface MediaFilters {
  search?: string;
  file_type?: 'image' | 'document' | 'video' | 'audio' | 'all';
  folder_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'name' | 'uploaded_at' | 'size' | 'usage_count';
  sort_order?: 'asc' | 'desc';
  view_mode?: 'grid' | 'list';
}

export interface MediaListResponse {
  files: MediaFile[];
  folders: MediaFolder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class MediaService {
  // Demo folders
  private static demoFolders: MediaFolder[] = [
    {
      id: '1',
      name: 'Hero Images',
      description: 'Hình ảnh banner và hero section',
      file_count: 8,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-15T14:30:00Z'
    },
    {
      id: '2',
      name: 'Article Images',
      description: 'Hình ảnh featured cho bài viết',
      file_count: 12,
      created_at: '2024-01-02T11:00:00Z',
      updated_at: '2024-01-16T15:45:00Z'
    },
    {
      id: '3',
      name: 'User Avatars',
      description: 'Ảnh đại diện người dùng',
      file_count: 6,
      created_at: '2024-01-03T12:00:00Z',
      updated_at: '2024-01-17T16:20:00Z'
    },
    {
      id: '4',
      name: 'Documents',
      description: 'PDF và tài liệu',
      file_count: 4,
      created_at: '2024-01-04T13:00:00Z',
      updated_at: '2024-01-18T17:10:00Z'
    },
    {
      id: '5',
      name: 'Icons & Graphics',
      description: 'Icons, logos và graphics',
      file_count: 5,
      created_at: '2024-01-05T14:00:00Z',
      updated_at: '2024-01-19T18:00:00Z'
    }
  ];

  // Demo files - 30 realistic media files
  private static demoFiles: MediaFile[] = [
    // Hero Images
    {
      id: '1',
      name: 'hero-iq-test-main.jpg',
      original_name: 'IQ Test Hero Banner.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 2048576, // 2MB
      width: 1920,
      height: 1080,
      url: '/media/hero-iq-test-main.jpg',
      thumbnail_url: '/media/thumbs/hero-iq-test-main-thumb.jpg',
      folder_id: '1',
      alt_text: 'IQ Test Hero Banner - Test your intelligence',
      description: 'Main hero banner for IQ test landing page',
      usage_count: 15,
      uploaded_by: 'Admin',
      uploaded_at: '2024-01-10T10:30:00Z',
      updated_at: '2024-01-15T14:20:00Z',
      tags: ['hero', 'banner', 'iq-test', 'main']
    },
    {
      id: '2',
      name: 'hero-brain-illustration.png',
      original_name: 'Brain Illustration Hero.png',
      file_type: 'image',
      mime_type: 'image/png',
      extension: 'png',
      size: 1536000, // 1.5MB
      width: 1600,
      height: 900,
      url: '/media/hero-brain-illustration.png',
      thumbnail_url: '/media/thumbs/hero-brain-illustration-thumb.png',
      folder_id: '1',
      alt_text: 'Brain illustration for IQ testing',
      description: 'Colorful brain illustration for hero sections',
      usage_count: 8,
      uploaded_by: 'Designer',
      uploaded_at: '2024-01-12T11:15:00Z',
      updated_at: '2024-01-16T15:30:00Z',
      tags: ['hero', 'brain', 'illustration', 'colorful']
    },
    {
      id: '3',
      name: 'hero-statistics-chart.jpg',
      original_name: 'Statistics Chart Hero.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 1843200, // 1.8MB
      width: 1800,
      height: 1200,
      url: '/media/hero-statistics-chart.jpg',
      thumbnail_url: '/media/thumbs/hero-statistics-chart-thumb.jpg',
      folder_id: '1',
      alt_text: 'IQ statistics and analytics chart',
      description: 'Statistical chart showing IQ distribution',
      usage_count: 12,
      uploaded_by: 'Admin',
      uploaded_at: '2024-01-14T09:45:00Z',
      updated_at: '2024-01-18T16:10:00Z',
      tags: ['hero', 'statistics', 'chart', 'analytics']
    },

    // Article Images
    {
      id: '4',
      name: 'article-iq-guide-featured.jpg',
      original_name: 'IQ Guide Featured Image.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 1024000, // 1MB
      width: 1200,
      height: 800,
      url: '/media/article-iq-guide-featured.jpg',
      thumbnail_url: '/media/thumbs/article-iq-guide-featured-thumb.jpg',
      folder_id: '2',
      alt_text: 'IQ test guide featured image',
      description: 'Featured image for IQ test guide article',
      usage_count: 25,
      uploaded_by: 'Content Writer',
      uploaded_at: '2024-01-08T14:20:00Z',
      updated_at: '2024-01-12T10:15:00Z',
      tags: ['article', 'featured', 'guide', 'iq-test']
    },
    {
      id: '5',
      name: 'article-brain-training.png',
      original_name: 'Brain Training Article.png',
      file_type: 'image',
      mime_type: 'image/png',
      extension: 'png',
      size: 896000, // 896KB
      width: 1000,
      height: 667,
      url: '/media/article-brain-training.png',
      thumbnail_url: '/media/thumbs/article-brain-training-thumb.png',
      folder_id: '2',
      alt_text: 'Brain training exercises illustration',
      description: 'Illustration for brain training article',
      usage_count: 18,
      uploaded_by: 'Content Writer',
      uploaded_at: '2024-01-09T15:30:00Z',
      updated_at: '2024-01-13T11:45:00Z',
      tags: ['article', 'brain', 'training', 'exercises']
    },

    // User Avatars
    {
      id: '6',
      name: 'avatar-admin-default.jpg',
      original_name: 'Admin Avatar.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 204800, // 200KB
      width: 400,
      height: 400,
      url: '/media/avatar-admin-default.jpg',
      thumbnail_url: '/media/thumbs/avatar-admin-default-thumb.jpg',
      folder_id: '3',
      alt_text: 'Admin user avatar',
      description: 'Default avatar for admin user',
      usage_count: 50,
      uploaded_by: 'System',
      uploaded_at: '2024-01-01T08:00:00Z',
      updated_at: '2024-01-01T08:00:00Z',
      tags: ['avatar', 'admin', 'user', 'profile']
    },

    // Documents
    {
      id: '7',
      name: 'iq-test-guide.pdf',
      original_name: 'Complete IQ Test Guide.pdf',
      file_type: 'document',
      mime_type: 'application/pdf',
      extension: 'pdf',
      size: 5242880, // 5MB
      url: '/media/iq-test-guide.pdf',
      thumbnail_url: '/media/thumbs/pdf-icon.png',
      folder_id: '4',
      description: 'Comprehensive guide to IQ testing',
      usage_count: 35,
      uploaded_by: 'Content Manager',
      uploaded_at: '2024-01-05T16:00:00Z',
      updated_at: '2024-01-10T12:30:00Z',
      tags: ['document', 'guide', 'pdf', 'iq-test']
    },

    // Icons & Graphics
    {
      id: '8',
      name: 'logo-iq-test-main.svg',
      original_name: 'IQ Test Main Logo.svg',
      file_type: 'image',
      mime_type: 'image/svg+xml',
      extension: 'svg',
      size: 51200, // 50KB
      width: 300,
      height: 100,
      url: '/media/logo-iq-test-main.svg',
      thumbnail_url: '/media/thumbs/logo-iq-test-main-thumb.png',
      folder_id: '5',
      alt_text: 'IQ Test website main logo',
      description: 'Main logo for IQ Test website',
      usage_count: 100,
      uploaded_by: 'Designer',
      uploaded_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T09:00:00Z',
      tags: ['logo', 'brand', 'svg', 'main']
    },

    // More Hero Images
    {
      id: '9',
      name: 'hero-puzzle-brain.jpg',
      original_name: 'Puzzle Brain Hero.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 1920000, // 1.9MB
      width: 1800,
      height: 1200,
      url: '/media/hero-puzzle-brain.jpg',
      thumbnail_url: '/media/thumbs/hero-puzzle-brain-thumb.jpg',
      folder_id: '1',
      alt_text: 'Puzzle brain illustration for IQ tests',
      description: 'Creative puzzle brain design for hero sections',
      usage_count: 6,
      uploaded_by: 'Designer',
      uploaded_at: '2024-01-16T10:00:00Z',
      updated_at: '2024-01-20T14:15:00Z',
      tags: ['hero', 'puzzle', 'brain', 'creative']
    },
    {
      id: '10',
      name: 'hero-test-results.png',
      original_name: 'Test Results Hero.png',
      file_type: 'image',
      mime_type: 'image/png',
      extension: 'png',
      size: 1654000, // 1.6MB
      width: 1600,
      height: 1000,
      url: '/media/hero-test-results.png',
      thumbnail_url: '/media/thumbs/hero-test-results-thumb.png',
      folder_id: '1',
      alt_text: 'IQ test results visualization',
      description: 'Hero image showing test results and analytics',
      usage_count: 9,
      uploaded_by: 'Content Team',
      uploaded_at: '2024-01-18T11:30:00Z',
      updated_at: '2024-01-22T16:45:00Z',
      tags: ['hero', 'results', 'analytics', 'visualization']
    },

    // More Article Images
    {
      id: '11',
      name: 'article-cognitive-skills.jpg',
      original_name: 'Cognitive Skills Article.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 987000, // 987KB
      width: 1200,
      height: 675,
      url: '/media/article-cognitive-skills.jpg',
      thumbnail_url: '/media/thumbs/article-cognitive-skills-thumb.jpg',
      folder_id: '2',
      alt_text: 'Cognitive skills development illustration',
      description: 'Featured image for cognitive skills article',
      usage_count: 22,
      uploaded_by: 'Content Writer',
      uploaded_at: '2024-01-11T13:20:00Z',
      updated_at: '2024-01-15T09:30:00Z',
      tags: ['article', 'cognitive', 'skills', 'development']
    },
    {
      id: '12',
      name: 'article-memory-training.png',
      original_name: 'Memory Training Article.png',
      file_type: 'image',
      mime_type: 'image/png',
      extension: 'png',
      size: 1123000, // 1.1MB
      width: 1000,
      height: 600,
      url: '/media/article-memory-training.png',
      thumbnail_url: '/media/thumbs/article-memory-training-thumb.png',
      folder_id: '2',
      alt_text: 'Memory training exercises illustration',
      description: 'Visual guide for memory training techniques',
      usage_count: 16,
      uploaded_by: 'Content Writer',
      uploaded_at: '2024-01-13T14:45:00Z',
      updated_at: '2024-01-17T11:20:00Z',
      tags: ['article', 'memory', 'training', 'exercises']
    },
    {
      id: '13',
      name: 'article-iq-myths.jpg',
      original_name: 'IQ Myths Article.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 856000, // 856KB
      width: 1100,
      height: 733,
      url: '/media/article-iq-myths.jpg',
      thumbnail_url: '/media/thumbs/article-iq-myths-thumb.jpg',
      folder_id: '2',
      alt_text: 'IQ myths and misconceptions',
      description: 'Article image debunking common IQ myths',
      usage_count: 14,
      uploaded_by: 'Content Writer',
      uploaded_at: '2024-01-15T16:10:00Z',
      updated_at: '2024-01-19T12:40:00Z',
      tags: ['article', 'myths', 'misconceptions', 'facts']
    },

    // More User Avatars
    {
      id: '14',
      name: 'avatar-user-placeholder.png',
      original_name: 'User Placeholder Avatar.png',
      file_type: 'image',
      mime_type: 'image/png',
      extension: 'png',
      size: 156000, // 156KB
      width: 300,
      height: 300,
      url: '/media/avatar-user-placeholder.png',
      thumbnail_url: '/media/thumbs/avatar-user-placeholder-thumb.png',
      folder_id: '3',
      alt_text: 'Default user avatar placeholder',
      description: 'Generic placeholder for user avatars',
      usage_count: 120,
      uploaded_by: 'System',
      uploaded_at: '2024-01-01T08:30:00Z',
      updated_at: '2024-01-01T08:30:00Z',
      tags: ['avatar', 'placeholder', 'default', 'user']
    },
    {
      id: '15',
      name: 'avatar-expert-profile.jpg',
      original_name: 'Expert Profile Avatar.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      extension: 'jpg',
      size: 234000, // 234KB
      width: 400,
      height: 400,
      url: '/media/avatar-expert-profile.jpg',
      thumbnail_url: '/media/thumbs/avatar-expert-profile-thumb.jpg',
      folder_id: '3',
      alt_text: 'Expert psychologist profile avatar',
      description: 'Professional avatar for expert contributors',
      usage_count: 8,
      uploaded_by: 'Content Manager',
      uploaded_at: '2024-01-07T09:15:00Z',
      updated_at: '2024-01-11T14:25:00Z',
      tags: ['avatar', 'expert', 'professional', 'psychologist']
    },

    // More Documents
    {
      id: '16',
      name: 'iq-research-report.pdf',
      original_name: 'IQ Research Report 2024.pdf',
      file_type: 'document',
      mime_type: 'application/pdf',
      extension: 'pdf',
      size: 8388608, // 8MB
      url: '/media/iq-research-report.pdf',
      thumbnail_url: '/media/thumbs/pdf-icon.png',
      folder_id: '4',
      description: 'Latest research findings on IQ testing methodologies',
      usage_count: 42,
      uploaded_by: 'Research Team',
      uploaded_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-24T15:30:00Z',
      tags: ['document', 'research', 'report', '2024']
    },
    {
      id: '17',
      name: 'user-manual.pdf',
      original_name: 'IQ Test User Manual.pdf',
      file_type: 'document',
      mime_type: 'application/pdf',
      extension: 'pdf',
      size: 3145728, // 3MB
      url: '/media/user-manual.pdf',
      thumbnail_url: '/media/thumbs/pdf-icon.png',
      folder_id: '4',
      description: 'Complete user manual for IQ testing platform',
      usage_count: 67,
      uploaded_by: 'Documentation Team',
      uploaded_at: '2024-01-03T14:20:00Z',
      updated_at: '2024-01-08T11:45:00Z',
      tags: ['document', 'manual', 'guide', 'user']
    },

    // More Icons & Graphics
    {
      id: '18',
      name: 'icon-brain-gear.svg',
      original_name: 'Brain Gear Icon.svg',
      file_type: 'image',
      mime_type: 'image/svg+xml',
      extension: 'svg',
      size: 28000, // 28KB
      width: 64,
      height: 64,
      url: '/media/icon-brain-gear.svg',
      thumbnail_url: '/media/thumbs/icon-brain-gear-thumb.png',
      folder_id: '5',
      alt_text: 'Brain with gear icon for cognitive processing',
      description: 'Icon representing cognitive processing and thinking',
      usage_count: 45,
      uploaded_by: 'Designer',
      uploaded_at: '2024-01-06T11:00:00Z',
      updated_at: '2024-01-10T16:30:00Z',
      tags: ['icon', 'brain', 'gear', 'cognitive']
    },
    {
      id: '19',
      name: 'icon-lightbulb.svg',
      original_name: 'Lightbulb Icon.svg',
      file_type: 'image',
      mime_type: 'image/svg+xml',
      extension: 'svg',
      size: 18000, // 18KB
      width: 48,
      height: 48,
      url: '/media/icon-lightbulb.svg',
      thumbnail_url: '/media/thumbs/icon-lightbulb-thumb.png',
      folder_id: '5',
      alt_text: 'Lightbulb icon for ideas and intelligence',
      description: 'Classic lightbulb icon representing bright ideas',
      usage_count: 38,
      uploaded_by: 'Designer',
      uploaded_at: '2024-01-08T12:30:00Z',
      updated_at: '2024-01-12T17:15:00Z',
      tags: ['icon', 'lightbulb', 'idea', 'intelligence']
    },
    {
      id: '20',
      name: 'graphic-test-progress.png',
      original_name: 'Test Progress Graphic.png',
      file_type: 'image',
      mime_type: 'image/png',
      extension: 'png',
      size: 445000, // 445KB
      width: 800,
      height: 400,
      url: '/media/graphic-test-progress.png',
      thumbnail_url: '/media/thumbs/graphic-test-progress-thumb.png',
      folder_id: '5',
      alt_text: 'Test progress visualization graphic',
      description: 'Graphic showing test completion progress',
      usage_count: 28,
      uploaded_by: 'Designer',
      uploaded_at: '2024-01-14T13:45:00Z',
      updated_at: '2024-01-18T10:20:00Z',
      tags: ['graphic', 'progress', 'test', 'visualization']
    }
  ];

  /**
   * Format file size to human readable string
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get media statistics
   */
  static async getStats(): Promise<{ data: MediaStats | null; error: any }> {
    try {
      console.log('MediaService: Calculating statistics');

      const files = this.demoFiles;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const storageQuota = 10 * 1024 * 1024 * 1024; // 10GB
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: MediaStats = {
        totalFiles: files.length,
        totalSize,
        storageUsed: this.formatFileSize(totalSize),
        storageQuota: this.formatFileSize(storageQuota),
        usagePercentage: Math.round((totalSize / storageQuota) * 100),
        filesByType: {
          images: files.filter(f => f.file_type === 'image').length,
          documents: files.filter(f => f.file_type === 'document').length,
          videos: files.filter(f => f.file_type === 'video').length,
          audio: files.filter(f => f.file_type === 'audio').length
        },
        recentUploads: files.filter(f => new Date(f.uploaded_at) > weekAgo).length
      };

      console.log('MediaService: Stats calculated successfully');
      return { data: stats, error: null };

    } catch (err) {
      console.error('MediaService: Error calculating stats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get media files with pagination and filters
   */
  static async getMediaFiles(
    page: number = 1,
    limit: number = 20,
    filters: MediaFilters = {}
  ): Promise<{ data: MediaListResponse | null; error: any }> {
    try {
      console.log('MediaService: Fetching media files', { page, limit, filters });

      let files = [...this.demoFiles];
      let folders = [...this.demoFolders];

      // Apply filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        files = files.filter(file =>
          file.name.toLowerCase().includes(searchTerm) ||
          file.original_name.toLowerCase().includes(searchTerm) ||
          file.alt_text?.toLowerCase().includes(searchTerm) ||
          file.description?.toLowerCase().includes(searchTerm) ||
          file.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (filters.file_type && filters.file_type !== 'all') {
        files = files.filter(file => file.file_type === filters.file_type);
      }

      if (filters.folder_id) {
        files = files.filter(file => file.folder_id === filters.folder_id);
      }

      if (filters.date_from) {
        files = files.filter(file => new Date(file.uploaded_at) >= new Date(filters.date_from!));
      }

      if (filters.date_to) {
        files = files.filter(file => new Date(file.uploaded_at) <= new Date(filters.date_to!));
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'uploaded_at';
      const sortOrder = filters.sort_order || 'desc';

      files.sort((a, b) => {
        let aValue: any = a[sortBy as keyof MediaFile];
        let bValue: any = b[sortBy as keyof MediaFile];

        if (sortBy === 'uploaded_at' || sortBy === 'updated_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedFiles = files.slice(offset, offset + limit);

      const total = files.length;
      const totalPages = Math.ceil(total / limit);

      const response: MediaListResponse = {
        files: paginatedFiles,
        folders: filters.folder_id ? [] : folders, // Only show folders in root view
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      console.log('MediaService: Media files fetched successfully:', {
        returned: paginatedFiles.length,
        total,
        page,
        totalPages
      });

      return { data: response, error: null };

    } catch (err) {
      console.error('MediaService: Error fetching media files:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Upload new file (simulation)
   */
  static async uploadFile(fileData: {
    name: string;
    file_type: 'image' | 'document' | 'video' | 'audio';
    mime_type: string;
    size: number;
    width?: number;
    height?: number;
    folder_id?: string;
    alt_text?: string;
    description?: string;
    tags?: string[];
  }): Promise<{ data: MediaFile | null; error: any }> {
    try {
      console.log('MediaService: Uploading file:', fileData);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const extension = fileData.name.split('.').pop() || '';
      const nameWithoutExt = fileData.name.replace(`.${extension}`, '');

      const newFile: MediaFile = {
        id: (this.demoFiles.length + 1).toString(),
        name: `${nameWithoutExt}-${Date.now()}.${extension}`,
        original_name: fileData.name,
        file_type: fileData.file_type,
        mime_type: fileData.mime_type,
        extension,
        size: fileData.size,
        width: fileData.width,
        height: fileData.height,
        url: `/media/${nameWithoutExt}-${Date.now()}.${extension}`,
        thumbnail_url: fileData.file_type === 'image' ? `/media/thumbs/${nameWithoutExt}-${Date.now()}-thumb.${extension}` : undefined,
        folder_id: fileData.folder_id,
        alt_text: fileData.alt_text,
        description: fileData.description,
        usage_count: 0,
        uploaded_by: 'Current User',
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        tags: fileData.tags || []
      };

      this.demoFiles.push(newFile);

      // Update folder file count
      if (fileData.folder_id) {
        const folder = this.demoFolders.find(f => f.id === fileData.folder_id);
        if (folder) {
          folder.file_count++;
          folder.updated_at = new Date().toISOString();
        }
      }

      console.log('MediaService: File uploaded successfully');
      return { data: newFile, error: null };

    } catch (err) {
      console.error('MediaService: Error uploading file:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update file metadata
   */
  static async updateFile(
    fileId: string,
    data: Partial<{
      name: string;
      alt_text: string;
      description: string;
      tags: string[];
      folder_id: string;
    }>
  ): Promise<{ data: MediaFile | null; error: any }> {
    try {
      console.log('MediaService: Updating file:', { fileId, data });

      const fileIndex = this.demoFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        return { data: null, error: new Error('Không tìm thấy file') };
      }

      const updatedFile = {
        ...this.demoFiles[fileIndex],
        ...data,
        updated_at: new Date().toISOString()
      };

      this.demoFiles[fileIndex] = updatedFile;

      console.log('MediaService: File updated successfully');
      return { data: updatedFile, error: null };

    } catch (err) {
      console.error('MediaService: Error updating file:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('MediaService: Deleting file:', fileId);

      const fileIndex = this.demoFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        return { data: false, error: new Error('Không tìm thấy file') };
      }

      const file = this.demoFiles[fileIndex];

      // Check if file is being used
      if (file.usage_count > 0) {
        return { data: false, error: new Error(`File đang được sử dụng ở ${file.usage_count} nơi`) };
      }

      this.demoFiles.splice(fileIndex, 1);

      // Update folder file count
      if (file.folder_id) {
        const folder = this.demoFolders.find(f => f.id === file.folder_id);
        if (folder && folder.file_count > 0) {
          folder.file_count--;
          folder.updated_at = new Date().toISOString();
        }
      }

      console.log('MediaService: File deleted successfully');
      return { data: true, error: null };

    } catch (err) {
      console.error('MediaService: Error deleting file:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Bulk delete files
   */
  static async bulkDeleteFiles(fileIds: string[]): Promise<{ data: number; error: any }> {
    try {
      console.log('MediaService: Bulk deleting files:', fileIds);

      let deletedCount = 0;
      const errors: string[] = [];

      for (const fileId of fileIds) {
        const { data: success, error } = await this.deleteFile(fileId);
        if (success) {
          deletedCount++;
        } else {
          errors.push(error.message);
        }
      }

      if (errors.length > 0) {
        return { data: deletedCount, error: new Error(`Một số file không thể xóa: ${errors.join(', ')}`) };
      }

      console.log('MediaService: Bulk delete completed:', deletedCount, 'files deleted');
      return { data: deletedCount, error: null };

    } catch (err) {
      console.error('MediaService: Error in bulk delete:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Get folders
   */
  static async getFolders(): Promise<{ data: MediaFolder[] | null; error: any }> {
    try {
      return { data: this.demoFolders, error: null };
    } catch (err) {
      console.error('MediaService: Error getting folders:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Create folder
   */
  static async createFolder(data: {
    name: string;
    description?: string;
    parent_id?: string;
  }): Promise<{ data: MediaFolder | null; error: any }> {
    try {
      console.log('MediaService: Creating folder:', data);

      // Check if name already exists
      const existingFolder = this.demoFolders.find(f =>
        f.name.toLowerCase() === data.name.toLowerCase()
      );

      if (existingFolder) {
        return { data: null, error: new Error('Tên thư mục đã tồn tại') };
      }

      const newFolder: MediaFolder = {
        id: (this.demoFolders.length + 1).toString(),
        name: data.name.trim(),
        description: data.description?.trim(),
        parent_id: data.parent_id,
        file_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.demoFolders.push(newFolder);

      console.log('MediaService: Folder created successfully');
      return { data: newFolder, error: null };

    } catch (err) {
      console.error('MediaService: Error creating folder:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get recent uploads (last 7 days)
   */
  static async getRecentUploads(): Promise<{ data: MediaFile[] | null; error: any }> {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentFiles = this.demoFiles
        .filter(file => new Date(file.uploaded_at) > weekAgo)
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
        .slice(0, 10); // Last 10 recent uploads

      return { data: recentFiles, error: null };

    } catch (err) {
      console.error('MediaService: Error getting recent uploads:', err);
      return { data: null, error: err };
    }
  }
}
