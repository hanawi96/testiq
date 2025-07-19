import type { APIRoute } from 'astro';
import { ViewTrackingService } from '../../../backend/utils/view-tracking-service';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { articleId } = body;

    // Validate input
    if (!articleId || typeof articleId !== 'string') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Article ID is required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user agent and IP for tracking (optional)
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined;

    // Track the view
    const result = await ViewTrackingService.trackArticleView(
      articleId,
      userAgent,
      ipAddress
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || 'Failed to track view' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'View tracked successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('API: Error in track-view endpoint:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Handle preflight requests for CORS
export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
