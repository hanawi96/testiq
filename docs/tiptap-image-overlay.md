# TipTap Image Hover Overlay

## 📋 Tổng quan

Chức năng hover overlay cho ảnh trong TipTap editor, cung cấp 4 tính năng chính:
- **Edit Alt Text** - Chỉnh sửa mô tả ảnh
- **Crop** - Cắt ảnh với tool crop
- **Replace** - Thay thế ảnh bằng ảnh khác  
- **Delete** - Xóa ảnh khỏi editor

## 🎯 Implementation Approach

### ✅ **Tái sử dụng 100% Components hiện có:**
- `ImageCropper` - Tool crop ảnh
- `ImageAltEditPopup` - Popup chỉnh sửa alt text
- `ImageUpload` - Modal upload/replace ảnh
- `ImageStorageService` - Service xử lý upload/delete

### 🏗️ **Architecture:**

```
TiptapEditor
├── ImageHoverOverlay (NEW)
│   ├── ImageCropper (REUSED)
│   ├── ImageAltEditPopup (REUSED)
│   └── ImageUpload (REUSED)
└── Existing components...
```

## 🔧 **Technical Details**

### **1. Hover Detection:**
```typescript
// Mouse enter với delay 300ms
const handleImageHover = (event: Event) => {
  hoverTimeout = setTimeout(() => {
    setImageHoverOverlay({
      isOpen: true,
      imageElement: img
    });
  }, 300);
};
```

### **2. Overlay Positioning:**
```typescript
// Tự động tính toán vị trí overlay
const rect = imageElement.getBoundingClientRect();
const position = {
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2
};
```

### **3. TipTap Integration:**
```typescript
// Sử dụng TipTap API để manipulate images
const imagePos = getImagePosition();
editor.chain()
  .focus()
  .setNodeSelection(imagePos)
  .updateAttributes('image', { src: newUrl })
  .run();
```

## 🎨 **UI/UX Features**

### **Hover Behavior:**
- Delay 300ms trước khi hiển thị overlay
- Auto-hide khi mouse leave
- Click outside để đóng overlay

### **Visual Design:**
- Overlay với backdrop blur
- 4 button icons rõ ràng
- Hover effects cho từng button
- Consistent với MediaUpload styling

### **Performance:**
- Chỉ render overlay khi cần thiết
- Cleanup timeout và event listeners
- Optimized positioning calculations

## 📁 **Files Modified**

### **New Files:**
- `src/components/admin/articles/editors/ImageHoverOverlay.tsx`

### **Modified Files:**
- `src/components/admin/articles/editors/TiptapEditor.tsx`
  - Added hover event handlers
  - Added ImageHoverOverlay component
  - Updated CSS for better hover effects

### **Test Files:**
- `src/pages/test/tiptap-crop.astro` (updated for overlay testing)

## 🧪 **Testing**

### **Test URL:**
```
http://localhost:4321/test/tiptap-crop
```

### **Test Steps:**
1. Upload ảnh vào TipTap editor
2. Hover lên ảnh để hiển thị overlay
3. Test từng chức năng:
   - Edit Alt Text
   - Crop ảnh
   - Replace ảnh
   - Delete ảnh
4. Verify overlay auto-hide behavior

## ✅ **Benefits**

### **Code Reuse:**
- 100% tái sử dụng existing components
- Không duplicate logic
- Consistent UX across app

### **Performance:**
- Minimal overhead
- Efficient event handling
- Smart positioning

### **Maintainability:**
- Clear separation of concerns
- Easy to extend với new features
- Follows existing patterns

## 🔮 **Future Enhancements**

- **Keyboard shortcuts** cho overlay actions
- **Batch operations** cho multiple images
- **Image filters** integration
- **Responsive overlay** cho mobile devices
