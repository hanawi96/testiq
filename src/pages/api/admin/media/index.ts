import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Inline Supabase config để tránh import issues
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://qovhiztkfgjppfiqtake.supabase.co';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvdmhpenRrZmdqcHBmaXF0YWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDkwMjMyNiwiZXhwIjoyMDY2NDc4MzI2fQ.OcrF64On2jtMwvZqJsSyXRN8EAawwPg9FmAe5MIWy60';

// Create admin client
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
  },
}) : null;

// Inline MediaService logic
const BUCKET_NAME = 'images';

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    width?: number;
    height?: number;
  };
}

interface MediaListResponse {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Helper functions
const getFileType = (mimeType: string): 'image' | 'video' | 'document' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
};

const getMimeTypeFromExtension = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    webm: 'video/webm',
    pdf: 'application/pdf',
    txt: 'text/plain'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

const transformFileData = (file: any): MediaFile => {
  // Sử dụng fullPath nếu có, nếu không thì dùng name
  const filePath = file.fullPath || file.name;
  const displayName = file.name.split('/').pop() || file.name; // Chỉ hiển thị tên file, không có path

  const { data: urlData } = supabaseAdmin!.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  // Add cache busting based on file's last modified time
  const lastModified = file.updated_at || file.created_at || new Date().toISOString();
  const cacheTimestamp = new Date(lastModified).getTime();
  const urlWithCacheBusting = `${urlData.publicUrl}?t=${cacheTimestamp}`;

  return {
    id: filePath, // Sử dụng full path làm ID để unique
    name: displayName, // Hiển thị tên file ngắn gọn
    size: file.metadata?.size || 0,
    type: file.metadata?.mimetype || getMimeTypeFromExtension(displayName),
    url: urlWithCacheBusting, // URL with cache busting
    created_at: file.created_at || new Date().toISOString(),
    updated_at: file.updated_at || new Date().toISOString(),
    metadata: file.metadata
  };
};

export const GET: APIRoute = async ({ request, url }) => {
  try {
    console.log('Media API GET called');

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase admin client not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Supabase admin client available');

    // Parse query parameters
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('Request params:', { page, limit, search, type, sortBy, sortOrder });

    // Lấy danh sách file từ storage - bao gồm cả files trong folders
    console.log(`Calling Supabase storage.from('${BUCKET_NAME}').list()`);

    let allFiles: any[] = [];

    // Lấy files ở root level
    const { data: rootFiles, error: rootError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 1000,
        sortBy: { column: sortBy === 'created_at' ? 'created_at' : 'name', order: sortOrder }
      });

    if (rootError) {
      console.error('Root files error:', rootError);
    } else if (rootFiles) {
      // Thêm files (không phải folders) từ root
      const actualFiles = rootFiles.filter(file => file.metadata && !file.id);
      allFiles.push(...actualFiles);

      // Lấy files từ các folders
      const folders = rootFiles.filter(file => !file.metadata && file.id === null);
      console.log('Found folders:', folders.map(f => f.name));

      for (const folder of folders) {
        const { data: folderFiles, error: folderError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .list(folder.name, {
            limit: 1000,
            sortBy: { column: sortBy === 'created_at' ? 'created_at' : 'name', order: sortOrder }
          });

        if (!folderError && folderFiles) {
          // Thêm folder path vào file name
          const filesWithPath = folderFiles
            .filter(file => file.metadata) // Chỉ lấy files, không lấy sub-folders
            .map(file => ({
              ...file,
              name: `${folder.name}/${file.name}`,
              fullPath: `${folder.name}/${file.name}`
            }));
          allFiles.push(...filesWithPath);
        }
      }
    }

    console.log('Total files found:', allFiles.length);

    if (allFiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        data: { files: [], total: 0, page, limit, hasMore: false }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Filter và transform data
    let filteredFiles = allFiles
      .filter(file => {
        // Filter theo search
        if (search && !file.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }

        // Filter theo type
        if (type !== 'all') {
          const fileType = getFileType(file.metadata?.mimetype || '');
          if (fileType !== type) {
            return false;
          }
        }

        return true;
      })
      .map(file => transformFileData(file));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex);

    const result: MediaListResponse = {
      files: paginatedFiles,
      total: filteredFiles.length,
      page,
      limit,
      hasMore: endIndex < filteredFiles.length
    };

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Media API GET error:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message}` || 'Lỗi server khi lấy danh sách media'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase admin client not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || '';
    const replacePath = formData.get('replacePath') as string; // For replacing existing files

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Không có file được upload'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let filePath: string;
    let fileName: string;
    let uploadResult;

    if (replacePath) {
      // Replace existing file - use the same path
      filePath = replacePath;
      fileName = replacePath.split('/').pop() || file.name;

      // Upload with upsert to replace existing file
      uploadResult = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite when replacing
        });
    } else {
      // Generate filename with original name preserved
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      // Try to upload with original name first, then add suffix if needed
      fileName = cleanName;
      filePath = folder ? `${folder}/${fileName}` : fileName;
      let uploadAttempt = 0;

      do {
        uploadResult = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        // If file exists, try with suffix
        if (uploadResult.error && uploadResult.error.message.includes('already exists')) {
          uploadAttempt++;
          const nameWithoutExt = cleanName.substring(0, cleanName.lastIndexOf('.'));
          const extension = cleanName.substring(cleanName.lastIndexOf('.'));
          fileName = `${nameWithoutExt}_${uploadAttempt}${extension}`;
          filePath = folder ? `${folder}/${fileName}` : fileName;
        }
      } while (uploadResult.error && uploadResult.error.message.includes('already exists') && uploadAttempt < 100);
    }

    const { data, error } = uploadResult;

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Lỗi khi upload file'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const mediaFile: MediaFile = {
      id: data.path,
      name: fileName,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      data: mediaFile
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Media API POST error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Lỗi server khi upload file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase admin client not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { filePaths } = await request.json();

    if (!filePaths || !Array.isArray(filePaths) || filePaths.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Danh sách file không hợp lệ'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message || 'Lỗi khi xóa file'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Đã xóa ${filePaths.length} file thành công`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Media API DELETE error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Lỗi server khi xóa file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
