import { supabase } from '../config/supabase.js';

export interface Comment {
  id: string;
  article_id: string;
  user_id?: string;
  author_name: string;
  author_email?: string;
  author_ip?: string;
  author_user_agent?: string;
  content: string;
  content_html?: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  moderated_by?: string;
  moderated_at?: string;
  moderation_reason?: string;
  parent_id?: string;
  thread_depth: number;
  reply_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  article_title?: string;
  author_avatar?: string;
  author_display_name?: string;
  moderator_name?: string;
}

export interface CommentFilters {
  status?: string;
  article_id?: string;
  author_email?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  has_replies?: boolean;
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  spam: number;
  today: number;
  this_week: number;
  this_month: number;
}

export interface CreateCommentData {
  article_id: string;
  user_id?: string;
  author_name: string;
  author_email?: string;
  author_ip?: string;
  author_user_agent?: string;
  content: string;
  parent_id?: string;
  status?: 'pending' | 'approved';
}

export interface UpdateCommentData {
  content?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'spam';
  moderation_reason?: string;
  is_pinned?: boolean;
}

export interface BulkActionData {
  comment_ids: string[];
  action: 'approve' | 'reject' | 'spam' | 'delete';
  moderation_reason?: string;
}

export class CommentsService {
  /**
   * Get comments with pagination and filters
   */
  static async getComments(
    page: number = 1,
    limit: number = 20,
    filters: CommentFilters = {}
  ): Promise<{ data: { comments: Comment[]; total: number; hasNext: boolean; hasPrev: boolean } | null; error: any }> {
    try {
      console.log('CommentsService: Getting comments', { page, limit, filters });

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('comments')
        .select(`
          *,
          articles!inner(title),
          user_profiles(avatar_url, display_name),
          moderator:user_profiles!moderated_by(display_name)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.article_id) {
        query = query.eq('article_id', filters.article_id);
      }

      if (filters.author_email) {
        query = query.ilike('author_email', `%${filters.author_email}%`);
      }

      if (filters.search) {
        query = query.or(`content.ilike.%${filters.search}%,author_name.ilike.%${filters.search}%`);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.has_replies !== undefined) {
        if (filters.has_replies) {
          query = query.gt('reply_count', 0);
        } else {
          query = query.eq('reply_count', 0);
        }
      }

      // Execute query with pagination
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('CommentsService: Error fetching comments:', error);
        return { data: null, error };
      }

      // Transform data
      const comments: Comment[] = (data || []).map(comment => ({
        ...comment,
        article_title: comment.articles?.title,
        author_avatar: comment.user_profiles?.avatar_url,
        author_display_name: comment.user_profiles?.display_name,
        moderator_name: comment.moderator?.display_name
      }));

      const total = count || 0;
      const hasNext = offset + limit < total;
      const hasPrev = page > 1;

      console.log(`CommentsService: Successfully fetched ${comments.length} comments`);
      return {
        data: { comments, total, hasNext, hasPrev },
        error: null
      };

    } catch (err: any) {
      console.error('CommentsService: Error in getComments:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get comment statistics
   */
  static async getCommentStats(): Promise<{ data: CommentStats | null; error: any }> {
    try {
      console.log('CommentsService: Getting comment statistics');

      const { data, error } = await supabase
        .from('comments')
        .select('status, created_at');

      if (error) {
        console.error('CommentsService: Error fetching stats:', error);
        return { data: null, error };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: CommentStats = {
        total: data.length,
        pending: data.filter(c => c.status === 'pending').length,
        approved: data.filter(c => c.status === 'approved').length,
        rejected: data.filter(c => c.status === 'rejected').length,
        spam: data.filter(c => c.status === 'spam').length,
        today: data.filter(c => new Date(c.created_at) >= today).length,
        this_week: data.filter(c => new Date(c.created_at) >= thisWeek).length,
        this_month: data.filter(c => new Date(c.created_at) >= thisMonth).length
      };

      console.log('CommentsService: Successfully calculated stats:', stats);
      return { data: stats, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in getCommentStats:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get single comment with thread
   */
  static async getComment(commentId: string): Promise<{ data: Comment | null; error: any }> {
    try {
      console.log('CommentsService: Getting comment:', commentId);

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          articles(title, slug),
          user_profiles(avatar_url, display_name),
          moderator:user_profiles!moderated_by(display_name)
        `)
        .eq('id', commentId)
        .single();

      if (error) {
        console.error('CommentsService: Error fetching comment:', error);
        return { data: null, error };
      }

      const comment: Comment = {
        ...data,
        article_title: data.articles?.title,
        author_avatar: data.user_profiles?.avatar_url,
        author_display_name: data.user_profiles?.display_name,
        moderator_name: data.moderator?.display_name
      };

      console.log('CommentsService: Successfully fetched comment');
      return { data: comment, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in getComment:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get comment replies (thread)
   */
  static async getCommentReplies(parentId: string): Promise<{ data: Comment[] | null; error: any }> {
    try {
      console.log('CommentsService: Getting comment replies for:', parentId);

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user_profiles(avatar_url, display_name)
        `)
        .eq('parent_id', parentId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('CommentsService: Error fetching replies:', error);
        return { data: null, error };
      }

      const replies: Comment[] = (data || []).map(comment => ({
        ...comment,
        author_avatar: comment.user_profiles?.avatar_url,
        author_display_name: comment.user_profiles?.display_name
      }));

      console.log(`CommentsService: Successfully fetched ${replies.length} replies`);
      return { data: replies, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in getCommentReplies:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Create new comment
   */
  static async createComment(commentData: CreateCommentData): Promise<{ data: Comment | null; error: any }> {
    try {
      console.log('CommentsService: Creating comment:', commentData);

      // Calculate thread depth if it's a reply
      let threadDepth = 0;
      if (commentData.parent_id) {
        const { data: parentComment, error: parentError } = await supabase
          .from('comments')
          .select('thread_depth')
          .eq('id', commentData.parent_id)
          .single();

        if (parentError) {
          console.error('CommentsService: Error fetching parent comment:', parentError);
          return { data: null, error: parentError };
        }

        threadDepth = (parentComment?.thread_depth || 0) + 1;

        // Limit thread depth
        if (threadDepth > 5) {
          return { data: null, error: new Error('Maximum thread depth exceeded') };
        }
      }

      // Auto-approve comments from registered users
      const status = commentData.user_id ? 'approved' : (commentData.status || 'pending');

      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...commentData,
          thread_depth: threadDepth,
          status: status,
          reply_count: 0,
          is_pinned: false,
          is_edited: false
        })
        .select(`
          *,
          articles(title),
          user_profiles(avatar_url, display_name)
        `)
        .single();

      if (error) {
        console.error('CommentsService: Error creating comment:', error);
        return { data: null, error };
      }

      const comment: Comment = {
        ...data,
        article_title: data.articles?.title,
        author_avatar: data.user_profiles?.avatar_url,
        author_display_name: data.user_profiles?.display_name
      };

      console.log('CommentsService: Successfully created comment');
      return { data: comment, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in createComment:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Update comment
   */
  static async updateComment(
    commentId: string,
    updateData: UpdateCommentData,
    moderatorId?: string
  ): Promise<{ data: Comment | null; error: any }> {
    try {
      console.log('CommentsService: Updating comment:', commentId, updateData);

      const updatePayload: any = { ...updateData };

      // Add moderation info if status is being changed
      if (updateData.status && moderatorId) {
        updatePayload.moderated_by = moderatorId;
        updatePayload.moderated_at = new Date().toISOString();
      }

      // Mark as edited if content is being changed
      if (updateData.content) {
        updatePayload.is_edited = true;
        updatePayload.edited_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('comments')
        .update(updatePayload)
        .eq('id', commentId)
        .select(`
          *,
          articles(title),
          user_profiles(avatar_url, display_name),
          moderator:user_profiles!moderated_by(display_name)
        `)
        .single();

      if (error) {
        console.error('CommentsService: Error updating comment:', error);
        return { data: null, error };
      }

      const comment: Comment = {
        ...data,
        article_title: data.articles?.title,
        author_avatar: data.user_profiles?.avatar_url,
        author_display_name: data.user_profiles?.display_name,
        moderator_name: data.moderator?.display_name
      };

      console.log('CommentsService: Successfully updated comment');
      return { data: comment, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in updateComment:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string): Promise<{ data: boolean; error: any }> {
    try {
      console.log('CommentsService: Deleting comment:', commentId);

      // Check if comment has replies
      const { count: replyCount, error: countError } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', commentId);

      if (countError) {
        console.error('CommentsService: Error checking replies:', countError);
        return { data: false, error: countError };
      }

      if (replyCount && replyCount > 0) {
        return {
          data: false,
          error: new Error(`Cannot delete comment with ${replyCount} replies`)
        };
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('CommentsService: Error deleting comment:', error);
        return { data: false, error };
      }

      console.log('CommentsService: Successfully deleted comment');
      return { data: true, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in deleteComment:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Bulk actions on comments
   */
  static async bulkAction(
    actionData: BulkActionData,
    moderatorId: string
  ): Promise<{ data: { success: number; failed: number } | null; error: any }> {
    try {
      console.log('CommentsService: Performing bulk action:', actionData);

      let success = 0;
      let failed = 0;

      for (const commentId of actionData.comment_ids) {
        try {
          if (actionData.action === 'delete') {
            const result = await this.deleteComment(commentId);
            if (result.error) {
              failed++;
              console.error(`Failed to delete comment ${commentId}:`, result.error);
            } else {
              success++;
            }
          } else {
            // Status update actions
            const status = actionData.action === 'approve' ? 'approved' :
                          actionData.action === 'reject' ? 'rejected' : 'spam';

            const result = await this.updateComment(
              commentId,
              {
                status,
                moderation_reason: actionData.moderation_reason
              },
              moderatorId
            );

            if (result.error) {
              failed++;
              console.error(`Failed to update comment ${commentId}:`, result.error);
            } else {
              success++;
            }
          }
        } catch (err) {
          failed++;
          console.error(`Error processing comment ${commentId}:`, err);
        }
      }

      console.log(`CommentsService: Bulk action completed. Success: ${success}, Failed: ${failed}`);
      return { data: { success, failed }, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in bulkAction:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Get pending comments count
   */
  static async getPendingCount(): Promise<{ data: number | null; error: any }> {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('CommentsService: Error getting pending count:', error);
        return { data: null, error };
      }

      return { data: count || 0, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in getPendingCount:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Export comments data
   */
  static async exportComments(filters: CommentFilters = {}): Promise<{ data: Comment[] | null; error: any }> {
    try {
      console.log('CommentsService: Exporting comments with filters:', filters);

      let query = supabase
        .from('comments')
        .select(`
          *,
          articles(title, slug),
          user_profiles(display_name)
        `);

      // Apply same filters as getComments
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.article_id) query = query.eq('article_id', filters.article_id);
      if (filters.author_email) query = query.ilike('author_email', `%${filters.author_email}%`);
      if (filters.search) {
        query = query.or(`content.ilike.%${filters.search}%,author_name.ilike.%${filters.search}%`);
      }
      if (filters.date_from) query = query.gte('created_at', filters.date_from);
      if (filters.date_to) query = query.lte('created_at', filters.date_to);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('CommentsService: Error exporting comments:', error);
        return { data: null, error };
      }

      const comments: Comment[] = (data || []).map(comment => ({
        ...comment,
        article_title: comment.articles?.title,
        author_display_name: comment.user_profiles?.display_name
      }));

      console.log(`CommentsService: Successfully exported ${comments.length} comments`);
      return { data: comments, error: null };

    } catch (err: any) {
      console.error('CommentsService: Error in exportComments:', err);
      return { data: null, error: err };
    }
  }
}
