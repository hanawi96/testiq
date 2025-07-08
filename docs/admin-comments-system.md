# Admin Comments Management System

## 🎯 Tổng quan

Hệ thống quản lý bình luận hoàn chỉnh cho admin interface với đầy đủ tính năng moderation, threading, và bulk actions.

## 📊 System Architecture

### **Database Schema**
```sql
-- Comments table với full threading support
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  article_id UUID REFERENCES articles(id),
  user_id UUID REFERENCES user_profiles(id),
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  parent_id UUID REFERENCES comments(id),
  thread_depth INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Backend Service**
- **File**: `backend/admin/comments-service.ts`
- **Size**: Comprehensive service với 590 lines
- **Features**: CRUD, moderation, bulk actions, threading

### **Frontend Components**
```
src/components/admin/comments/
├── AdminComments.tsx           // Main component (35.64 kB)
├── CommentDetailModal.tsx      // Detail modal với threading
└── index.ts                    // Exports
```

## 🎨 UI/UX Features

### **Admin Sidebar Integration**
- ✅ **Menu Item**: "Bình luận" với chat icon
- ✅ **Dropdown**: 2 sub-items
  - "Quản lý bình luận" (`/admin/comments`)
  - "Bình luận chờ duyệt" (`/admin/comments/pending`)
- ✅ **Icon**: Unique chat bubble (không trùng với menu khác)

### **Stats Dashboard**
```
[Total: 1,247] [Pending: 23] [Approved: 1,180] [Rejected/Spam: 44]
```
- ✅ Real-time statistics
- ✅ Today/week/month breakdown
- ✅ Color-coded status indicators

### **Advanced Filtering**
- ✅ **Search**: Content + author name
- ✅ **Status Filter**: All/Pending/Approved/Rejected/Spam
- ✅ **Date Range**: From/To date pickers
- ✅ **Clear Filters**: Reset all filters

### **Table Features**
- ✅ **Responsive Design**: Mobile-optimized
- ✅ **Bulk Selection**: Checkbox selection
- ✅ **Author Info**: Avatar + name + email
- ✅ **Content Preview**: Truncated với "..." 
- ✅ **Article Association**: Link to original post
- ✅ **Status Badges**: Color-coded status
- ✅ **Reply Count**: Thread indicator

## 🔧 Moderation Workflow

### **Comment Status Flow**
```
Anonymous User → pending → (moderator) → approved/rejected/spam
Registered User → approved (auto)
```

### **Moderation Actions**
- ✅ **Individual Actions**: Approve/Reject/Spam/Delete
- ✅ **Bulk Actions**: Select multiple + batch process
- ✅ **Quick Actions**: One-click approve/reject
- ✅ **Moderation Reason**: Optional reason field

### **Comment Detail Modal**
- ✅ **Full Content**: Complete comment text
- ✅ **Author Details**: Avatar, name, email, registration status
- ✅ **Article Context**: Which article the comment belongs to
- ✅ **Reply Threading**: View all replies in thread
- ✅ **Moderation History**: Who moderated + when + reason
- ✅ **Quick Moderation**: Approve/reject from modal

## 📱 Responsive Design

### **Desktop (≥1024px)**
- Full table layout với all columns
- Sidebar navigation
- Modal dialogs

### **Tablet (768px-1024px)**
- Optimized table columns
- Touch-friendly buttons
- Collapsible sidebar

### **Mobile (<768px)**
- Stacked card layout
- Mobile-optimized filters
- Touch gestures

## 🚀 Performance Features

### **Bundle Optimization**
- **AdminComments**: 35.64 kB (optimized)
- **Code Splitting**: Component-level splitting
- **Lazy Loading**: Modal components
- **Caching**: API response caching

### **Real-time Updates**
- ✅ **Optimistic UI**: Instant feedback
- ✅ **Background Sync**: API calls in background
- ✅ **Error Recovery**: Revert on API failure
- ✅ **Auto-refresh**: Pending comments auto-update

### **Search & Pagination**
- ✅ **Debounced Search**: 150ms delay
- ✅ **Smart Pagination**: 20 items per page
- ✅ **Total Count**: Real-time count display
- ✅ **Navigation**: Previous/Next với page info

## 🎯 Admin Pages

### **Main Comments Page** (`/admin/comments`)
```astro
// Uses AdminLayout for consistent header/sidebar
- All status filters
- Complete CRUD operations
- Bulk actions
- Export functionality
```

### **Pending Comments Page** (`/admin/comments/pending`)
```astro
// Uses AdminLayout with custom header
- Breadcrumb navigation
- Pending status warning banner
- Only pending comments filter
- Quick approve/reject actions
- Bulk moderation tools
```

## 🔐 Security & Permissions

### **Role-based Access**
- ✅ **Admin**: Full access
- ✅ **Editor**: Full access
- ✅ **Author**: View + moderate own articles
- ✅ **Reviewer**: View + moderate
- ❌ **Regular Users**: No access

### **Data Validation**
- ✅ **Input Sanitization**: XSS protection
- ✅ **Content Filtering**: Spam detection
- ✅ **Rate Limiting**: API throttling
- ✅ **CSRF Protection**: Token validation

## 📊 Analytics & Reporting

### **Comment Statistics**
```javascript
{
  total: 1247,
  pending: 23,
  approved: 1180,
  rejected: 32,
  spam: 12,
  today: 15,
  this_week: 89,
  this_month: 234
}
```

### **Export Functionality**
- ✅ **CSV Export**: All comment data
- ✅ **Filtered Export**: Based on current filters
- ✅ **Date Range Export**: Custom time periods
- ✅ **Bulk Export**: Multiple selections

## 🎨 Design System

### **Color Coding**
- **Pending**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Approved**: Green (`bg-green-100 text-green-800`)
- **Rejected**: Red (`bg-red-100 text-red-800`)
- **Spam**: Gray (`bg-gray-100 text-gray-800`)

### **Icons & Visual Elements**
- **Comments Menu**: Chat bubble icon
- **Status Indicators**: Color-coded badges
- **Action Buttons**: Consistent với admin design
- **Loading States**: Spinner animations

### **Accessibility**
- ✅ **WCAG Compliant**: AA standard
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Screen Reader**: Proper ARIA labels
- ✅ **Focus Management**: Logical tab order

## 🔄 API Endpoints

### **Comments Service Methods**
```typescript
// CRUD Operations
getComments(page, limit, filters)
getComment(commentId)
createComment(commentData)
updateComment(commentId, updateData)
deleteComment(commentId)

// Moderation
bulkAction(actionData, moderatorId)
getCommentStats()
getPendingCount()

// Threading
getCommentReplies(parentId)

// Export
exportComments(filters)
```

## 📈 Performance Metrics

### **Load Times**
- **Initial Load**: <2s
- **Filter Changes**: <500ms
- **Modal Open**: <200ms
- **Bulk Actions**: <1s per 10 items

### **Bundle Sizes**
- **AdminComments**: 35.64 kB
- **CommentDetailModal**: Included in main bundle
- **comments-service**: Server-side only

## 🎯 Future Enhancements

### **Planned Features**
- **Email Notifications**: Notify on new comments
- **Auto-moderation**: AI-powered spam detection
- **Comment Analytics**: Engagement metrics
- **Advanced Threading**: Deeper nesting support

### **Integration Points**
- **Article Management**: Link to article editor
- **User Management**: Link to user profiles
- **Notification System**: Real-time alerts
- **Audit Logs**: Track all moderation actions

This comprehensive comment management system provides a professional, scalable solution for content moderation with excellent UX and performance! 🎊
