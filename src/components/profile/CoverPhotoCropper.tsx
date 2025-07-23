import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check, RotateCcw } from 'lucide-react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoverPhotoCropperProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
  onStartCrop?: () => void;
}

export default function CoverPhotoCropper({ imageUrl, onCrop, onCancel, onStartCrop }: CoverPhotoCropperProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, width: 400, height: 133 }); // 3:1 ratio
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageLoaded && imageRef.current) {
      const img = imageRef.current;

      // FIXED: Use getBoundingClientRect for accurate rendered size
      const imgRect = img.getBoundingClientRect();
      const displayWidth = imgRect.width;
      const displayHeight = imgRect.height;

      // Set crop area to center rectangle (3:1 ratio, 80% of width)
      const width = displayWidth * 0.8;
      const height = width / 3; // 3:1 ratio
      const x = (displayWidth - width) / 2;
      const y = (displayHeight - height) / 2;

      console.log('🎯 Cover Crop Area Initialization:', {
        naturalSize: { width: imageDimensions.width, height: imageDimensions.height },
        displaySize: { width: displayWidth, height: displayHeight },
        cropArea: { x, y, width, height },
        imgRect: imgRect
      });

      setCropArea({ x, y, width, height });
    }
  }, [imageLoaded, imageDimensions]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      });
      setImageLoaded(true);
    }
  }, []);

  // Handle crop area drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dragStartPos = {
      x: e.clientX - rect.left - cropArea.x,
      y: e.clientY - rect.top - cropArea.y
    };

    console.log('🖱️ Cover Drag Start:', {
      mousePos: { x: e.clientX, y: e.clientY },
      imageRect: rect,
      cropArea: cropArea,
      dragStart: dragStartPos
    });

    setDragStart(dragStartPos);
  }, [cropArea]);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      // FIXED: Use rect.width/height instead of offsetWidth/offsetHeight for consistency
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragStart.x, rect.width - cropArea.width));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragStart.y, rect.height - cropArea.height));

      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, cropArea.width, cropArea.height]);

  // Handle crop execution
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    console.log('🎯 Starting cover photo crop...');

    // FIXED: Capture all needed data BEFORE closing modal
    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();
    const currentCropArea = { ...cropArea };
    const currentImageDimensions = { ...imageDimensions };

    // Trigger loading IMMEDIATELY
    onStartCrop?.();

    // Close modal immediately for better UX
    onCancel();

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onCrop(imageUrl);
        return;
      }

      // Set canvas size for cover photo (1200x400)
      canvas.width = 1200;
      canvas.height = 400;

      // Create a new image for CORS handling
      const corsImage = new Image();
      corsImage.crossOrigin = 'anonymous';

      corsImage.onload = async () => {
        try {
          // FIXED: Use captured data instead of accessing imageRef
          const scaleX = currentImageDimensions.width / imgRect.width;
          const scaleY = currentImageDimensions.height / imgRect.height;



          // Calculate source coordinates for canvas using captured data
          const sourceX = currentCropArea.x * scaleX;
          const sourceY = currentCropArea.y * scaleY;
          const sourceWidth = currentCropArea.width * scaleX;
          const sourceHeight = currentCropArea.height * scaleY;

          console.log('🎨 Cover Canvas Crop Execution:', {
            cropAreaOnDisplay: currentCropArea,
            imageDimensions: currentImageDimensions,
            displayRect: { width: imgRect.width, height: imgRect.height },
            scale: { x: scaleX, y: scaleY },
            sourceCoords: { x: sourceX, y: sourceY, width: sourceWidth, height: sourceHeight },
            canvasSize: { width: 1200, height: 400 }
          });

          // Draw cropped image (3:1 ratio) with correct coordinates
          ctx.drawImage(
            corsImage,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            1200,
            400
          );

          // Convert to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error('❌ Failed to create blob');
              onCrop(imageUrl);
              return;
            }

            try {
              // Create blob URL directly
              const croppedUrl = URL.createObjectURL(blob);
              onCrop(croppedUrl);
            } catch (error) {
              console.error('❌ Error creating blob URL:', error);
              onCrop(imageUrl);
            }
          }, 'image/jpeg', 0.95);
        } catch (canvasError) {
          console.error('❌ Canvas operation failed:', canvasError);
          onCrop(imageUrl);
        }
      };

      corsImage.onerror = () => {
        console.error('❌ CORS image load failed');
        onCrop(imageUrl);
      };

      corsImage.src = imageUrl;

    } catch (error) {
      console.error('❌ Crop operation failed:', error);
      onCrop(imageUrl);
    }
  }, [imageUrl, cropArea, imageDimensions, onCrop, onCancel, onStartCrop]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cắt ảnh bìa
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kéo vùng chữ nhật để chọn phần ảnh bạn muốn làm ảnh bìa (tỷ lệ 3:1)
            </p>
          </div>

          <div className="flex justify-center">
            <div
              ref={containerRef}
              className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden inline-block"
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="block max-w-full max-h-96"
                onLoad={handleImageLoad}
                style={{ userSelect: 'none' }}
              />

              {/* Crop Overlay */}
              {imageLoaded && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>

                  {/* Center indicator */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>

                  {/* Ratio indicator */}
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    3:1
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Hủy
          </button>
          <button
            onClick={handleCrop}
            disabled={!imageLoaded}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Cắt & Lưu
          </button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </motion.div>
    </motion.div>
  );
}
