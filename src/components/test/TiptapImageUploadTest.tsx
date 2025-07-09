import React, { useState, useEffect } from 'react';
import TiptapEditor from '../admin/articles/editors/TiptapEditor';

interface ImageAnalysis {
  index: number;
  src: string;
  alt: string;
  width: string | number;
  height: string | number;
  isBase64: boolean;
  isSupabase: boolean;
  isExternal: boolean;
  size?: number;
}

export default function TiptapImageUploadTest() {
  const [content, setContent] = useState('<p>🧪 <strong>Test Tiptap Image Upload</strong></p><p>Click vào nút <strong>Image</strong> trong toolbar để test upload ảnh.</p>');
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis[]>([]);
  const [testResults, setTestResults] = useState({
    totalImages: 0,
    productionImages: 0,
    base64Images: 0,
    externalImages: 0
  });

  // Analyze content for images
  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const images = doc.querySelectorAll('img');
    
    const analysis: ImageAnalysis[] = Array.from(images).map((img, index) => {
      const isBase64 = img.src.startsWith('data:');
      const isSupabase = img.src.includes('supabase') || img.src.includes('qovhiztkfgjppfiqtake');
      const isExternal = !isBase64 && !isSupabase;
      
      return {
        index: index + 1,
        src: img.src,
        alt: img.alt || 'No alt text',
        width: img.width || 'auto',
        height: img.height || 'auto',
        isBase64,
        isSupabase,
        isExternal,
        size: isBase64 ? Math.round(img.src.length * 0.75) : undefined
      };
    });

    setImageAnalysis(analysis);
    setTestResults({
      totalImages: analysis.length,
      productionImages: analysis.filter(img => img.isSupabase).length,
      base64Images: analysis.filter(img => img.isBase64).length,
      externalImages: analysis.filter(img => img.isExternal).length
    });
  }, [content]);

  const clearEditor = () => {
    setContent('<p>🧪 Editor đã được clear. Thử upload ảnh mới...</p>');
  };

  const insertSampleContent = () => {
    setContent(`
      <h2>🧪 Sample Content với Ảnh Test</h2>
      <p>Đây là nội dung mẫu để test:</p>
      <ul>
        <li>Upload ảnh từ máy tính</li>
        <li>Paste ảnh từ clipboard</li>
        <li>Drag & drop ảnh vào editor</li>
      </ul>
      <p>Hãy thử upload một ảnh để kiểm tra!</p>
    `);
  };

  const exportContent = () => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tiptap-test-content-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="space-y-8">
      {/* Test Results */}
      {testResults.totalImages > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            📊 Kết quả Test Upload
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {testResults.totalImages}
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Tổng số ảnh</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {testResults.productionImages}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">Supabase Storage</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {testResults.base64Images}
              </div>
              <div className="text-sm text-red-800 dark:text-red-200">Base64 (Demo)</div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {testResults.externalImages}
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">External URLs</div>
            </div>
          </div>

          {/* Status Messages */}
          {testResults.productionImages > 0 && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg mb-4">
              <p className="text-green-800 dark:text-green-200">
                <strong>✅ Thành công!</strong> {testResults.productionImages} ảnh đã được upload lên Supabase Storage (Production mode).
              </p>
            </div>
          )}
          
          {testResults.base64Images > 0 && testResults.productionImages === 0 && (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg mb-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Chú ý!</strong> {testResults.base64Images} ảnh đang sử dụng Base64 (Demo mode). Cần kiểm tra cấu hình Supabase.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tiptap Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ✏️ Tiptap Editor Test
        </h2>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 Hướng dẫn test:
          </h3>
          <ol className="list-decimal list-inside text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>Click vào nút <strong>"Image"</strong> trong toolbar của editor</li>
            <li>Chọn một ảnh để upload (drag & drop hoặc click chọn file)</li>
            <li>Kiểm tra xem ảnh có hiển thị trong editor không</li>
            <li>Xem kết quả phân tích bên dưới để biết loại upload</li>
            <li>Nếu thấy "Supabase Storage" = thành công!</li>
          </ol>
        </div>

        <TiptapEditor
          value={content}
          onChange={setContent}
          height="400px"
        />
      </div>

      {/* Image Analysis */}
      {imageAnalysis.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            🔍 Phân tích chi tiết ảnh
          </h2>
          
          <div className="space-y-4">
            {imageAnalysis.map((img) => (
              <div key={img.index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <img 
                    src={img.src} 
                    alt={img.alt} 
                    className="w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEw1MCAzMEw2MCA0MEw1MCA1MEw0MCA0MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Ảnh {img.index}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div>
                        <strong>URL:</strong> 
                        <span className="ml-2 font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {img.src.length > 80 ? `${img.src.substring(0, 80)}...` : img.src}
                        </span>
                      </div>
                      <div><strong>Alt text:</strong> {img.alt}</div>
                      <div><strong>Kích thước:</strong> {img.width} x {img.height}</div>
                      <div className="flex items-center gap-2">
                        <strong>Loại upload:</strong>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          img.isSupabase 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : img.isBase64 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {img.isSupabase ? '✅ Supabase Storage (Production)' : 
                           img.isBase64 ? '❌ Base64 (Demo)' : 
                           '🔗 External URL'}
                        </span>
                      </div>
                      {img.size && (
                        <div><strong>File size:</strong> ~{Math.round(img.size / 1024)} KB</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📝 HTML Content
        </h2>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-auto max-h-64">
            {content}
          </pre>
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          🎛️ Test Controls
        </h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={clearEditor}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            🗑️ Clear Editor
          </button>
          <button 
            onClick={insertSampleContent}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            📝 Insert Sample Content
          </button>
          <button
            onClick={exportContent}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            📤 Export Content
          </button>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            🌙 Toggle Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
}
