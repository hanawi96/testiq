import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// Inline Supabase config
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

const BUCKET_NAME = 'images';

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
}

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

export const PUT: APIRoute = async ({ request }) => {
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

    const { oldPath, newName } = await request.json();

    if (!oldPath || !newName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Thiếu thông tin đường dẫn file cũ hoặc tên mới'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get folder from old path
    const pathParts = oldPath.split('/');
    const folder = pathParts.slice(0, -1).join('/');
    const newPath = folder ? `${folder}/${newName}` : newName;

    // Copy to new location
    const { error: copyError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .copy(oldPath, newPath);

    if (copyError) {
      return new Response(JSON.stringify({
        success: false,
        error: copyError.message || 'Lỗi khi đổi tên file'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete old file
    const { error: deleteError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([oldPath]);

    if (deleteError) {
      console.warn('Failed to delete old file after rename:', deleteError);
    }

    // Get new file info
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(newPath);

    const mediaFile: MediaFile = {
      id: newPath,
      name: newName,
      size: 0,
      type: getMimeTypeFromExtension(newName),
      url: urlData.publicUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return new Response(JSON.stringify({
      success: true,
      data: mediaFile,
      message: 'Đổi tên file thành công'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Media rename API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Lỗi server khi đổi tên file'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
