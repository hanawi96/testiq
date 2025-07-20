/**
 * 🚀 API ENDPOINT FOR SCHEDULED PUBLISHING
 * Đơn giản, bảo mật, hiệu quả
 */

import type { APIRoute } from 'astro';
import { ScheduledPublishingAPI } from '../../../../backend/admin/articles/scheduled-publishing';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const action = url.searchParams.get('action') || 'stats';
    
    // 🔒 Basic security check (có thể thêm auth sau)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized - Missing auth token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'stats':
        const stats = await ScheduledPublishingAPI.stats();
        return new Response(JSON.stringify({
          success: true,
          data: stats
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'upcoming':
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const upcoming = await ScheduledPublishingAPI.upcoming(limit);
        return new Response(JSON.stringify({
          success: true,
          data: upcoming.data,
          error: upcoming.error
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      case 'health':
        const health = await ScheduledPublishingAPI.health();
        return new Response(JSON.stringify({
          success: true,
          data: health
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          error: 'Invalid action. Use: stats, upcoming, health'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ Scheduled publishing API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // 🔒 Basic security check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized - Missing auth token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'process') {
      // 🚀 Manually trigger scheduled publishing
      console.log('🔄 Manual trigger: Processing scheduled articles...');
      const result = await ScheduledPublishingAPI.process();
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: `Processed ${result.published} articles with ${result.errors.length} errors`
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Invalid action. Use: process'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Scheduled publishing POST error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
