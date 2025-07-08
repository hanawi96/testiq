# Article Edit System - Bug Fix Documentation

## 🐛 **Vấn đề gặp phải:**

### **Lỗi 1: 404 Not Found**
```
URL: /admin/articles/edit/650e8400-e29b-41d4-a716-446655440006
Error: 404 Not Found
```

### **Lỗi 2: Foreign Key Relationship**
```
Error: PGRST200 - Could not find a relationship between 'articles' and 'user_profiles'
Hint: articles_author_id_fkey
```

## 🔍 **Phân tích nguyên nhân gốc:**

### **Vấn đề 1: Dynamic Route Issue**
**❌ Nguyên nhân:**
- Dynamic route `[id].astro` với `getStaticPaths()` chỉ generate 3 sample paths
- Real article IDs không được generate → 404 Error

**✅ Giải pháp:**
- Thay đổi từ dynamic route sang static page với URL params
- URL: `/admin/articles/edit?id=650e8400-e29b-41d4-a716-446655440006`

### **Vấn đề 2: Foreign Key Reference Sai**
**❌ Nguyên nhân:**
```sql
-- Database schema thực tế:
articles.author_id → auth.users.id (NOT user_profiles.id)

-- Query sai:
user_profiles!articles_author_id_fkey
```

**✅ Giải pháp:**
- Bỏ foreign key hint sai
- Sử dụng manual join để lấy user profile

## 🚀 **Giải pháp đã implement:**

### **1. URL Structure Change**
```typescript
// Before (Dynamic Route)
/admin/articles/edit/[id].astro → getStaticPaths() → 404

// After (Static Page + URL Params)  
/admin/articles/edit.astro → ?id=article-id → ✅ Success
```

### **2. Edit Button Update**
```tsx
// AdminArticles.tsx - Before
<a href={`/admin/articles/edit/${article.id}`}>

// AdminArticles.tsx - After  
<a href={`/admin/articles/edit?id=${article.id}`}>
```

### **3. ArticleEdit Component Update**
```tsx
// Get article ID from URL params
useEffect(() => {
  if (propArticleId) {
    setArticleId(propArticleId);
  } else if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if (idFromUrl) {
      setArticleId(idFromUrl);
    }
  }
}, [propArticleId]);
```

### **4. Backend Service Fix**
```typescript
// Before (Sai foreign key)
.select(`
  *,
  user_profiles!articles_author_id_fkey (
    id, full_name, email, role
  )
`)

// After (Manual join)
.select('*')

// Thêm manual join
if (articleData.author_id) {
  const { data: authorProfile } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role')
    .eq('id', articleData.author_id)
    .single();
  
  if (authorProfile) {
    articleData.user_profiles = authorProfile;
  }
}
```

## 📊 **Kết quả sau khi fix:**

### **✅ Build Success:**
- **28 pages** built successfully
- **ArticleEdit**: 13.67 kB (optimized)
- **articles-service**: 25.27 kB (updated)

### **✅ URL Flow hoạt động:**
```
AdminArticles → Edit Button → /admin/articles/edit?id=650e8400-e29b-41d4-a716-446655440006
                                        ↓
                                JavaScript lấy ID từ URL params
                                        ↓
                                ArticleEdit component load article
                                        ↓
                                Backend query với manual join
                                        ↓
                                ✅ Success - Article loaded
```

### **✅ Technical Benefits:**
1. **Đơn giản hóa**: Không cần dynamic routes phức tạp
2. **Tương thích**: Hoạt động với static generation
3. **Performance**: Không cần SSR adapter
4. **Maintainable**: Code rõ ràng, dễ debug
5. **Scalable**: Hỗ trợ unlimited article IDs

## 🎯 **Database Schema Clarification:**

### **Articles Table Foreign Keys:**
```sql
-- articles.author_id references auth.users.id
constraint articles_author_id_fkey foreign KEY (author_id) references auth.users (id)

-- NOT user_profiles.id
-- user_profiles.id references auth.users.id
constraint user_profiles_id_fkey foreign KEY (id) references auth.users (id)
```

### **Correct Join Pattern:**
```sql
-- To get user profile for article author:
articles.author_id → auth.users.id → user_profiles.id
```

## 🔧 **Files Modified:**

### **Backend:**
- `backend/admin/articles-service.ts` - Fixed getArticleForEdit() method

### **Frontend:**
- `src/pages/admin/articles/edit.astro` - Static page với URL params
- `src/components/admin/articles/editors/ArticleEdit.tsx` - URL params handling
- `src/components/admin/articles/AdminArticles.tsx` - Edit button URL

### **Removed:**
- `src/pages/admin/articles/edit/[id].astro` - Dynamic route không cần thiết

## 🎊 **Kết luận:**

Cả 2 vấn đề đã được khắc phục hoàn toàn với giải pháp **ĐƠN GIẢN VÀ TỐI ƯU NHẤT**:

1. **URL params** thay vì dynamic routes
2. **Manual join** thay vì foreign key hints sai
3. **Static generation** tương thích hoàn toàn
4. **Performance tốt** và dễ maintain

Hệ thống edit bài viết bây giờ hoạt động hoàn hảo! 🚀
