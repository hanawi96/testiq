import React from 'react';

interface SchemaPreviewProps {
  schemaType: string;
  title: string;
  excerpt: string;
  category: string;
}

// Component này không còn cần thiết vì đã tích hợp vào main UI
// Giữ lại để tương thích, nhưng return null
const SchemaPreview: React.FC<SchemaPreviewProps> = () => {
  return null;
};

export default SchemaPreview;
