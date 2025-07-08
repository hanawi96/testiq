# Comments Database Schema

## 📊 Database Design

### **Comments Table Structure**

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- Author info (for both registered and anonymous users)
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255),
  author_ip INET,
  author_user_agent TEXT,
  
  -- Comment content
  content TEXT NOT NULL,
  content_html TEXT, -- Processed HTML version
  
  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  moderated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMP WITH TIME ZONE,
  moderation_reason TEXT,
  
  -- Threading (nested comments)
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  thread_depth INTEGER DEFAULT 0 CHECK (thread_depth >= 0 AND thread_depth <= 5),
  reply_count INTEGER DEFAULT 0,
  
  -- Metadata
  is_pinned BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Indexes for Performance**

```sql
-- Primary indexes
CREATE INDEX idx_comments_article_id ON comments(article_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Composite indexes
CREATE INDEX idx_comments_article_status ON comments(article_id, status);
CREATE INDEX idx_comments_status_created ON comments(status, created_at DESC);
CREATE INDEX idx_comments_thread ON comments(parent_id, created_at ASC);

-- Search indexes
CREATE INDEX idx_comments_author_name ON comments USING gin(to_tsvector('english', author_name));
CREATE INDEX idx_comments_content ON comments USING gin(to_tsvector('english', content));
```

### **Triggers for Auto-updates**

```sql
-- Update timestamps
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

-- Update reply count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count - 1 
    WHERE id = OLD.parent_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_reply_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reply_count();
```

## 🔗 Relationships

### **Foreign Key Relationships**
- `article_id` → `articles.id` (CASCADE DELETE)
- `user_id` → `user_profiles.id` (SET NULL on delete)
- `parent_id` → `comments.id` (CASCADE DELETE)
- `moderated_by` → `user_profiles.id` (SET NULL on delete)

### **Data Integrity Rules**
- Maximum thread depth: 5 levels
- Status must be one of: pending, approved, rejected, spam
- Content cannot be empty
- Author name is required
- Thread depth auto-calculated

## 📋 Comment Status Workflow

### **Status Transitions**
```
pending → approved (by moderator)
pending → rejected (by moderator)
pending → spam (by moderator/auto-detection)
approved → rejected (by moderator)
approved → spam (by moderator)
rejected → approved (by moderator)
spam → rejected (by moderator)
```

### **Auto-moderation Rules**
- Comments from registered users: auto-approved
- Comments from anonymous users: pending review
- Comments with spam keywords: auto-marked as spam
- Comments with excessive links: pending review

## 🎯 Comment Threading System

### **Thread Structure**
```
Comment (depth: 0)
├── Reply 1 (depth: 1)
│   ├── Reply 1.1 (depth: 2)
│   └── Reply 1.2 (depth: 2)
├── Reply 2 (depth: 1)
└── Reply 3 (depth: 1)
    └── Reply 3.1 (depth: 2)
        └── Reply 3.1.1 (depth: 3)
```

### **Threading Rules**
- Maximum depth: 5 levels
- Parent comment must exist and be approved
- Replies inherit article_id from parent
- Thread depth auto-calculated on insert

## 📊 Sample Data Structure

### **Comment Types**

**1. Top-level Comment (Anonymous)**
```json
{
  "id": "uuid-1",
  "article_id": "article-uuid",
  "user_id": null,
  "author_name": "Nguyễn Văn A",
  "author_email": "user@example.com",
  "content": "Bài viết rất hay!",
  "status": "approved",
  "parent_id": null,
  "thread_depth": 0,
  "reply_count": 2
}
```

**2. Reply Comment (Registered User)**
```json
{
  "id": "uuid-2", 
  "article_id": "article-uuid",
  "user_id": "user-uuid",
  "author_name": "Admin User",
  "author_email": "admin@example.com",
  "content": "Cảm ơn bạn đã đọc!",
  "status": "approved",
  "parent_id": "uuid-1",
  "thread_depth": 1,
  "reply_count": 0
}
```

## 🔍 Query Patterns

### **Get Comments for Article**
```sql
-- Get top-level comments with reply count
SELECT c.*, u.avatar_url, u.display_name
FROM comments c
LEFT JOIN user_profiles u ON c.user_id = u.id
WHERE c.article_id = $1 AND c.parent_id IS NULL AND c.status = 'approved'
ORDER BY c.created_at DESC;
```

### **Get Comment Thread**
```sql
-- Get full comment thread (recursive)
WITH RECURSIVE comment_tree AS (
  -- Root comments
  SELECT c.*, 0 as level
  FROM comments c
  WHERE c.parent_id = $1 AND c.status = 'approved'
  
  UNION ALL
  
  -- Child comments
  SELECT c.*, ct.level + 1
  FROM comments c
  JOIN comment_tree ct ON c.parent_id = ct.id
  WHERE c.status = 'approved' AND ct.level < 5
)
SELECT * FROM comment_tree ORDER BY level, created_at ASC;
```

### **Admin Statistics**
```sql
-- Comment stats for admin dashboard
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'spam') as spam,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as today
FROM comments;
```

This schema provides a robust foundation for the comment management system with proper relationships, indexing, and threading support! 🎊
