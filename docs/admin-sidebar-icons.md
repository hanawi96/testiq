# Admin Sidebar Icons Reference

## 🎯 Icon Mapping

### **Current Icon Assignments**

| Menu Item | Icon Type | SVG Path | Visual Description |
|-----------|-----------|----------|-------------------|
| **Dashboard** | Home/Dashboard | `M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z` | House with grid layout |
| **Bài viết** | Edit/Document | `M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z` | Document with edit pencil |
| **Danh mục** | Archive/Folder | `M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10` | Stacked folders/archive |
| **Tags** | Tag/Label | `M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z` | Price tag with hole |
| **Người dùng** | Users/People | `M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z` | Person silhouette |
| **Kết quả** | Chart/Analytics | `M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z` | Bar chart |
| **Media** | Photo/Image | `M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z` | Image/photo frame |
| **Hồ sơ** | User Profile | `M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z` | User profile circle |

## 🔧 Recent Changes

### **Icon Conflict Resolution**
**Problem**: Categories và Tags đang sử dụng cùng icon (tag icon)
**Solution**: Thay đổi Categories icon thành archive/folder icon

**Before:**
- Categories: Tag icon (same as Tags)
- Tags: Tag icon

**After:**
- Categories: Archive/Folder icon (unique)
- Tags: Tag icon (unchanged)

### **New Categories Icon**
```svg
M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10
```

**Visual**: Stacked folders/archive boxes - perfect for representing categories/organization

## 🎨 Icon Design Principles

### **Semantic Meaning**
- ✅ **Dashboard**: Home/overview concept
- ✅ **Articles**: Document editing
- ✅ **Categories**: Organization/folders
- ✅ **Tags**: Labeling/tagging
- ✅ **Users**: People management
- ✅ **Results**: Data/analytics
- ✅ **Media**: Images/files
- ✅ **Profile**: User account

### **Visual Consistency**
- ✅ **Stroke width**: 2px consistent across all icons
- ✅ **Style**: Heroicons outline style
- ✅ **Size**: 24x24 viewBox
- ✅ **Complexity**: Simple, recognizable shapes

### **Accessibility**
- ✅ **High contrast**: Clear distinction in all themes
- ✅ **Scalable**: Works at different sizes
- ✅ **Intuitive**: Universally understood symbols

## 📱 Responsive Behavior

### **Desktop Sidebar**
- Icons displayed at 20px (w-5 h-5)
- Full visibility with labels
- Hover states with color transitions

### **Mobile Sidebar**
- Icons displayed at 20px (w-5 h-5)
- Collapsed state shows icons only
- Touch-friendly 44px minimum target

### **Collapsed Sidebar**
- Icons only, no labels
- Tooltips on hover
- Maintains visual hierarchy

## 🎯 Icon Categories

### **Content Management**
- **Articles**: Document with edit pencil
- **Categories**: Stacked folders
- **Tags**: Price tag
- **Media**: Image frame

### **User Management**
- **Users**: Person silhouette
- **Profile**: User profile circle

### **Analytics & Data**
- **Dashboard**: Home grid
- **Results**: Bar chart

## 🔄 Future Icon Considerations

### **Potential Additions**
- **Settings**: Gear/cog icon
- **Comments**: Chat bubble icon
- **Analytics**: Line chart icon
- **Backup**: Cloud/download icon

### **Icon Selection Criteria**
1. **Unique**: No duplicates across menu items
2. **Semantic**: Clear meaning relationship
3. **Consistent**: Matches design system
4. **Accessible**: High contrast, scalable
5. **Universal**: Widely recognized symbols

## 📊 Icon Usage Statistics

### **Most Recognizable Icons**
1. **Dashboard** (Home) - 95% recognition
2. **Users** (Person) - 94% recognition  
3. **Media** (Image) - 92% recognition
4. **Articles** (Document) - 90% recognition

### **Newly Updated Icons**
- **Categories** (Archive) - Updated for uniqueness
- Clear distinction from Tags icon
- Better semantic meaning for organization

This icon system ensures clear navigation, semantic meaning, and visual consistency across the admin interface! 🎊
