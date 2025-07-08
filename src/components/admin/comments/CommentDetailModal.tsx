import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentsService, type Comment } from '../../../../backend/admin/comments-service';

interface CommentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: Comment | null;
  onCommentUpdate: (updatedComment: Comment) => void;
}

export default function CommentDetailModal({ 
  isOpen, 
  onClose, 
  comment, 
  onCommentUpdate 
}: CommentDetailModalProps) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [showModerationForm, setShowModerationForm] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'reject' | 'spam' | null>(null);

  // Load replies when comment changes
  useEffect(() => {
    if (comment && comment.reply_count > 0) {
      loadReplies();
    } else {
      setReplies([]);
    }
  }, [comment]);

  const loadReplies = async () => {
    if (!comment) return;

    setIsLoadingReplies(true);
    try {
      const { data, error } = await CommentsService.getCommentReplies(comment.id);
      
      if (error) {
        console.error('Error loading replies:', error);
        return;
      }

      setReplies(data || []);
    } catch (err) {
      console.error('Error in loadReplies:', err);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const handleStatusUpdate = async (status: 'approved' | 'rejected' | 'spam') => {
    if (!comment) return;

    setIsUpdating(true);
    try {
      const { data, error } = await CommentsService.updateComment(
        comment.id,
        { 
          status, 
          moderation_reason: moderationReason || undefined 
        },
        'current-user-id'
      );
      
      if (error) {
        console.error('Error updating comment:', error);
        return;
      }

      if (data) {
        onCommentUpdate(data);
        setShowModerationForm(false);
        setModerationReason('');
        setSelectedAction(null);
      }
    } catch (err) {
      console.error('Error in handleStatusUpdate:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleModerationAction = (action: 'approve' | 'reject' | 'spam') => {
    setSelectedAction(action);
    if (action === 'approve') {
      // Auto-approve without reason
      handleStatusUpdate(action);
    } else {
      // Show form for reject/spam
      setShowModerationForm(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'spam': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Chờ duyệt';
      case 'rejected': return 'Từ chối';
      case 'spam': return 'Spam';
      default: return status;
    }
  };

  if (!comment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black bg-opacity-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Chi tiết bình luận
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Comment Info */}
                <div className="space-y-6">
                  {/* Author & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      {comment.author_avatar ? (
                        <img 
                          src={comment.author_avatar} 
                          alt={comment.author_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {comment.author_display_name || comment.author_name}
                        </h3>
                        {comment.author_email && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {comment.author_email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(comment.created_at)}
                          {comment.is_edited && ' (đã chỉnh sửa)'}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(comment.status)}`}>
                      {getStatusText(comment.status)}
                    </span>
                  </div>

                  {/* Article Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Bài viết
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {comment.article_title || 'N/A'}
                    </p>
                  </div>

                  {/* Comment Content */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Nội dung bình luận
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  {/* Moderation Info */}
                  {comment.moderated_by && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Thông tin kiểm duyệt
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Được kiểm duyệt bởi: {comment.moderator_name}
                      </p>
                      {comment.moderated_at && (
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Thời gian: {formatDate(comment.moderated_at)}
                        </p>
                      )}
                      {comment.moderation_reason && (
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                          Lý do: {comment.moderation_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Replies */}
                  {comment.reply_count > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                        Phản hồi ({comment.reply_count})
                      </h4>
                      
                      {isLoadingReplies ? (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang tải phản hồi...</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg ml-6">
                              <div className="flex items-start space-x-3">
                                {reply.author_avatar ? (
                                  <img 
                                    src={reply.author_avatar} 
                                    alt={reply.author_name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {reply.author_display_name || reply.author_name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatDate(reply.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {comment.id}
                </div>

                {/* Moderation Actions */}
                {comment.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleModerationAction('approve')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isUpdating && selectedAction === 'approve' ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                    <button
                      onClick={() => handleModerationAction('reject')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleModerationAction('spam')}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Đánh dấu Spam
                    </button>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>

              {/* Moderation Form */}
              {showModerationForm && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-6">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Lý do {selectedAction === 'reject' ? 'từ chối' : 'đánh dấu spam'}
                  </h4>
                  <textarea
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Nhập lý do (tùy chọn)..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => {
                        setShowModerationForm(false);
                        setModerationReason('');
                        setSelectedAction(null);
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => selectedAction && handleStatusUpdate(selectedAction)}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
