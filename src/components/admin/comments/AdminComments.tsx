import React, { useState, useEffect } from 'react';
import { CommentsService, type Comment, type CommentStats, type CommentFilters } from '../../../../backend/admin/comments-service';
import CommentDetailModal from './CommentDetailModal';

interface AdminCommentsProps {
  initialFilter?: 'all' | 'pending' | 'approved' | 'rejected' | 'spam';
}

export default function AdminComments({ initialFilter = 'all' }: AdminCommentsProps) {
  // State management
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<CommentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  // Pagination & filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<CommentFilters>({
    status: initialFilter === 'all' ? undefined : initialFilter,
    search: '',
    date_from: '',
    date_to: '',
    has_replies: undefined
  });

  // Selection & bulk actions
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Modals
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  // Fetch comments data
  const fetchComments = async (page: number = 1) => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await CommentsService.getComments(page, 20, filters);
      
      if (error) {
        setError('Không thể tải danh sách bình luận');
        console.error('Error fetching comments:', error);
        return;
      }

      if (data) {
        setComments(data.comments);
        setTotal(data.total);
        setHasNext(data.hasNext);
        setHasPrev(data.hasPrev);
        setTotalPages(Math.ceil(data.total / 20));
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error in fetchComments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const { data, error } = await CommentsService.getCommentStats();
      
      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      setStats(data);
    } catch (err) {
      console.error('Error in fetchStats:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchComments(1);
    fetchStats();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (currentPage === 1) {
      fetchComments(1);
    } else {
      setCurrentPage(1);
    }
  }, [filters]);

  // Reload when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchComments(currentPage);
    }
  }, [currentPage]);

  // Handle filter changes
  const handleFilterChange = (key: keyof CommentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSelectedComments([]);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  // Handle comment selection
  const handleSelectComment = (commentId: string) => {
    setSelectedComments(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(c => c.id));
    }
  };

  // Handle comment status update
  const handleStatusUpdate = async (commentId: string, status: 'approved' | 'rejected' | 'spam') => {
    setIsUpdating(true);
    try {
      const { error } = await CommentsService.updateComment(commentId, { status }, 'current-user-id');
      
      if (error) {
        setError('Không thể cập nhật trạng thái bình luận');
        return;
      }

      // Optimistic update
      setComments(prev => prev.map(comment => 
        comment.id === commentId ? { ...comment, status } : comment
      ));

      // Refresh stats
      await fetchStats();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa bình luận này?`)) return;

    setIsUpdating(true);
    try {
      const { error } = await CommentsService.deleteComment(commentId);
      
      if (error) {
        setError('Không thể xóa bình luận');
        return;
      }

      // Remove from UI
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotal(prev => prev - 1);

      // Refresh stats
      await fetchStats();
    } catch (err) {
      setError('Có lỗi xảy ra khi xóa');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'spam' | 'delete') => {
    if (selectedComments.length === 0) return;

    const confirmMessage = action === 'delete' 
      ? `Bạn có chắc chắn muốn xóa ${selectedComments.length} bình luận?`
      : `Bạn có chắc chắn muốn ${action === 'approve' ? 'duyệt' : action === 'reject' ? 'từ chối' : 'đánh dấu spam'} ${selectedComments.length} bình luận?`;

    if (!confirm(confirmMessage)) return;

    setIsUpdating(true);
    try {
      const { data, error } = await CommentsService.bulkAction(
        { comment_ids: selectedComments, action },
        'current-user-id'
      );
      
      if (error) {
        setError('Không thể thực hiện thao tác hàng loạt');
        return;
      }

      if (data) {
        // Refresh data
        await fetchComments(currentPage);
        await fetchStats();
        setSelectedComments([]);
        setShowBulkActions(false);

        if (data.failed > 0) {
          setError(`Hoàn thành với ${data.failed} lỗi`);
        }
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi thực hiện thao tác');
    } finally {
      setIsUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Truncate content
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'spam': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      case 'spam': return 'Spam';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Quản lý Bình luận
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Quản lý và kiểm duyệt bình luận từ người dùng
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tổng bình luận</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Hôm nay: {stats.today}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Chờ duyệt</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Tuần này: {stats.this_week}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Đã duyệt</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Tháng này: {stats.this_month}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected + stats.spam}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Từ chối/Spam</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Spam: {stats.spam}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm theo nội dung, tác giả..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="spam">Spam</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setFilters({ search: '', status: undefined, date_from: '', date_to: '', has_replies: undefined })}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedComments.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-400">
              Đã chọn {selectedComments.length} bình luận
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Duyệt
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Từ chối
              </button>
              <button
                onClick={() => handleBulkAction('spam')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Spam
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                disabled={isUpdating}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Danh sách bình luận ({total})
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchComments(currentPage)}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Làm mới"
              >
                <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Đang tải...</span>
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Không có bình luận nào
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="w-12 px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedComments.length === comments.length && comments.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tác giả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nội dung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Bài viết
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedComments.includes(comment.id)}
                          onChange={() => handleSelectComment(comment.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                        />
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {comment.author_avatar ? (
                            <img
                              src={comment.author_avatar}
                              alt={comment.author_name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {comment.author_display_name || comment.author_name}
                            </div>
                            {comment.author_email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {comment.author_email}
                              </div>
                            )}
                            {comment.reply_count > 0 && (
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {comment.reply_count} phản hồi
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {truncateContent(comment.content, 80)}
                          </p>
                          {comment.is_edited && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              (đã chỉnh sửa)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Article */}
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {truncateContent(comment.article_title || 'N/A', 40)}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                          {getStatusText(comment.status)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(comment.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {comment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(comment.id, 'approved')}
                                disabled={isUpdating}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 p-1"
                                title="Duyệt"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(comment.id, 'rejected')}
                                disabled={isUpdating}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                                title="Từ chối"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => {
                              setSelectedComment(comment);
                              setShowCommentModal(true);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                            title="Xem chi tiết"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isUpdating || comment.reply_count > 0}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                            title={comment.reply_count > 0 ? 'Không thể xóa bình luận có phản hồi' : 'Xóa'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Hiển thị {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, total)} trong {total} bình luận
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={!hasPrev || isLoading}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Trước
                    </button>

                    <span className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
                      Trang {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={!hasNext || isLoading}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comment Detail Modal */}
      <CommentDetailModal
        isOpen={showCommentModal}
        onClose={() => {
          setShowCommentModal(false);
          setSelectedComment(null);
        }}
        comment={selectedComment}
        onCommentUpdate={(updatedComment) => {
          // Update comment in the list
          setComments(prev => prev.map(comment =>
            comment.id === updatedComment.id ? updatedComment : comment
          ));
          // Refresh stats
          fetchStats();
        }}
      />
    </div>
  );
}
