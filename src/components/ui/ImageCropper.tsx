import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  RotateCcw,
  Crop,
  Maximize2,
  Square,
  Monitor,
  Smartphone
} from 'lucide-react';
import { optimizeImage, suggestOptimalRatio } from '../../utils/image-optimization';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AspectRatio {
  label: string;
  value: number | null; // null for free crop
  icon: React.ReactNode;
  description: string;
}

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string, cropData?: CropArea) => void;
  onCancel: () => void;
  initialAspectRatio?: number | null;
}

const ASPECT_RATIOS: AspectRatio[] = [
  {
    label: 'Tự do',
    value: null,
    icon: <Maximize2 size={16} />,
    description: 'Crop tự do'
  },
  {
    label: '3:1',
    value: 3,
    icon: <Monitor size={16} />,
    description: 'Cover photo, Banner'
  },
  {
    label: '16:9',
    value: 16/9,
    icon: <Monitor size={16} />,
    description: 'Social media, YouTube'
  },
  {
    label: '4:3',
    value: 4/3,
    icon: <Square size={16} />,
    description: 'Blog standard'
  },
  {
    label: '1:1',
    value: 1,
    icon: <Square size={16} />,
    description: 'Instagram, Avatar'
  },
  {
    label: '9:16',
    value: 9/16,
    icon: <Smartphone size={16} />,
    description: 'Stories, Mobile'
  }
];

export default function ImageCropper({
  imageUrl,
  onCrop,
  onCancel,
  initialAspectRatio = null // Mặc định chế độ crop "tự do"
}: ImageCropperProps) {
  const [selectedRatio, setSelectedRatio] = useState<number | null>(initialAspectRatio);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when imageUrl changes
  useEffect(() => {
    setImageLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  }, [imageUrl]);

  // Performance optimization: Cache display info
  const displayInfoRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageLoaded && imageDimensions.width > 0) {
      initializeCropArea();
    }
  }, [imageLoaded, imageDimensions, selectedRatio]);

  const initializeCropArea = useCallback(() => {
    if (!imageDimensions.width || !imageDimensions.height) return;

    const { width: imgWidth, height: imgHeight } = imageDimensions;
    const minSize = 50; // Minimum crop size
    const maxRatio = 0.9; // Maximum 90% of image

    let cropWidth, cropHeight;

    if (selectedRatio) {
      // Calculate crop size based on aspect ratio with bounds checking
      if (imgWidth / imgHeight > selectedRatio) {
        cropHeight = Math.min(imgHeight * maxRatio, imgHeight - minSize);
        cropWidth = cropHeight * selectedRatio;

        // Ensure width doesn't exceed image bounds
        if (cropWidth > imgWidth - minSize) {
          cropWidth = imgWidth - minSize;
          cropHeight = cropWidth / selectedRatio;
        }
      } else {
        cropWidth = Math.min(imgWidth * maxRatio, imgWidth - minSize);
        cropHeight = cropWidth / selectedRatio;

        // Ensure height doesn't exceed image bounds
        if (cropHeight > imgHeight - minSize) {
          cropHeight = imgHeight - minSize;
          cropWidth = cropHeight * selectedRatio;
        }
      }
    } else {
      // Free crop - use 80% of image with minimum constraints
      cropWidth = Math.max(minSize, imgWidth * 0.8);
      cropHeight = Math.max(minSize, imgHeight * 0.8);
    }

    // Ensure crop area is within bounds
    cropWidth = Math.min(cropWidth, imgWidth);
    cropHeight = Math.min(cropHeight, imgHeight);

    setCropArea({
      x: Math.max(0, (imgWidth - cropWidth) / 2),
      y: Math.max(0, (imgHeight - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight
    });
  }, [imageDimensions, selectedRatio]);

  // OPTIMIZED: Cache display info to avoid expensive getBoundingClientRect calls
  const getDisplayInfo = useCallback(() => {
    if (!imageRef.current || !imageDimensions.width || !imageDimensions.height) {
      return null;
    }

    // Use cached info if available and recent (within 16ms = 60fps)
    const now = performance.now();
    if (displayInfoRef.current && (now - lastUpdateRef.current) < 16) {
      return displayInfoRef.current;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const imageAspectRatio = imageDimensions.width / imageDimensions.height;
    const displayAspectRatio = rect.width / rect.height;

    let displayWidth, displayHeight, offsetX = 0, offsetY = 0;

    if (imageAspectRatio > displayAspectRatio) {
      displayWidth = rect.width;
      displayHeight = rect.width / imageAspectRatio;
      offsetY = (rect.height - displayHeight) / 2;
    } else {
      displayHeight = rect.height;
      displayWidth = rect.height * imageAspectRatio;
      offsetX = (rect.width - displayWidth) / 2;
    }

    const displayInfo = {
      rect,
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
      scaleX: imageDimensions.width / displayWidth,
      scaleY: imageDimensions.height / displayHeight
    };

    // Cache the result
    displayInfoRef.current = displayInfo;
    lastUpdateRef.current = now;

    return displayInfo;
  }, [imageDimensions]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const width = imageRef.current.naturalWidth;
      const height = imageRef.current.naturalHeight;

      setImageDimensions({ width, height });
      setImageLoaded(true);

      // Reset crop area to center for new image
      const centerX = width * 0.25;
      const centerY = height * 0.25;
      const cropWidth = width * 0.5;
      const cropHeight = height * 0.5;

      setCropArea({
        x: centerX,
        y: centerY,
        width: cropWidth,
        height: cropHeight
      });

      // Giữ chế độ "tự do" làm mặc định khi initialAspectRatio = null
      // Không auto-suggest ratio để user có thể crop tự do
      if (initialAspectRatio === null) {
        setSelectedRatio(null); // Luôn giữ chế độ "tự do"
      }
    }
  }, [initialAspectRatio]);

  // Handle crop area drag - SIMPLIFIED
  const handleCropAreaMouseDown = useCallback((e: React.MouseEvent) => {
    const displayInfo = getDisplayInfo();
    if (!displayInfo) return;

    const { rect, offsetX, offsetY, scaleX, scaleY } = displayInfo;

    // Convert mouse position to image coordinates
    const imageX = (e.clientX - rect.left - offsetX) * scaleX;
    const imageY = (e.clientY - rect.top - offsetY) * scaleY;

    setIsDragging(true);
    setDragStart({
      x: imageX - cropArea.x,
      y: imageY - cropArea.y
    });
  }, [cropArea, getDisplayInfo]);

  // Handle resize handle mouse down
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation(); // Prevent crop area drag
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // OPTIMIZED: Throttled mouse move with requestAnimationFrame
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if ((!isDragging && !isResizing)) return;

    e.preventDefault();

    // Throttle updates to 60fps using requestAnimationFrame
    requestAnimationFrame(() => {
      if (isDragging) {
        const displayInfo = getDisplayInfo();
        if (!displayInfo) return;

        const { rect, offsetX, offsetY, scaleX, scaleY } = displayInfo;

        const imageX = (e.clientX - rect.left - offsetX) * scaleX;
        const imageY = (e.clientY - rect.top - offsetY) * scaleY;

        const newX = Math.max(0, Math.min(
          imageX - dragStart.x,
          imageDimensions.width - cropArea.width
        ));
        const newY = Math.max(0, Math.min(
          imageY - dragStart.y,
          imageDimensions.height - cropArea.height
        ));

        // Increased threshold to reduce unnecessary updates
        if (Math.abs(newX - cropArea.x) > 1 || Math.abs(newY - cropArea.y) > 1) {
          setCropArea(prev => ({ ...prev, x: newX, y: newY }));
        }
      } else if (isResizing && resizeHandle) {
        // Handle crop area resizing with proper aspect ratio maintenance
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        let newCropArea = { ...cropArea };

        if (selectedRatio) {
          // FIXED: Maintain aspect ratio during resize
          // Use the primary dimension based on handle direction and calculate the other
          let newWidth, newHeight;

          switch (resizeHandle) {
            case 'se': // Southeast - expand from top-left anchor
              // Use the larger delta to determine primary dimension
              if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                newWidth = Math.max(50, cropArea.width + deltaX);
                newHeight = newWidth / selectedRatio;
              } else {
                newHeight = Math.max(50, cropArea.height + deltaY);
                newWidth = newHeight * selectedRatio;
              }
              break;

            case 'nw': // Northwest - expand from bottom-right anchor
              if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                newWidth = Math.max(50, cropArea.width - deltaX);
                newHeight = newWidth / selectedRatio;
              } else {
                newHeight = Math.max(50, cropArea.height - deltaY);
                newWidth = newHeight * selectedRatio;
              }
              newCropArea.x = cropArea.x + cropArea.width - newWidth;
              newCropArea.y = cropArea.y + cropArea.height - newHeight;
              break;

            case 'ne': // Northeast - expand from bottom-left anchor
              if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                newWidth = Math.max(50, cropArea.width + deltaX);
                newHeight = newWidth / selectedRatio;
              } else {
                newHeight = Math.max(50, cropArea.height - deltaY);
                newWidth = newHeight * selectedRatio;
              }
              newCropArea.y = cropArea.y + cropArea.height - newHeight;
              break;

            case 'sw': // Southwest - expand from top-right anchor
              if (Math.abs(deltaX) >= Math.abs(deltaY)) {
                newWidth = Math.max(50, cropArea.width - deltaX);
                newHeight = newWidth / selectedRatio;
              } else {
                newHeight = Math.max(50, cropArea.height + deltaY);
                newWidth = newHeight * selectedRatio;
              }
              newCropArea.x = cropArea.x + cropArea.width - newWidth;
              break;
          }

          // Apply calculated dimensions
          newCropArea.width = newWidth;
          newCropArea.height = newHeight;

          // Ensure crop area stays within image bounds and adjust if needed
          if (newCropArea.x < 0) {
            newCropArea.x = 0;
            newCropArea.width = Math.min(newCropArea.width, imageDimensions.width);
            newCropArea.height = newCropArea.width / selectedRatio;
          }
          if (newCropArea.y < 0) {
            newCropArea.y = 0;
            newCropArea.height = Math.min(newCropArea.height, imageDimensions.height);
            newCropArea.width = newCropArea.height * selectedRatio;
          }
          if (newCropArea.x + newCropArea.width > imageDimensions.width) {
            newCropArea.width = imageDimensions.width - newCropArea.x;
            newCropArea.height = newCropArea.width / selectedRatio;
          }
          if (newCropArea.y + newCropArea.height > imageDimensions.height) {
            newCropArea.height = imageDimensions.height - newCropArea.y;
            newCropArea.width = newCropArea.height * selectedRatio;
          }

        } else {
          // Free crop - original logic
          switch (resizeHandle) {
            case 'nw':
              newCropArea.x = Math.max(0, cropArea.x + deltaX);
              newCropArea.y = Math.max(0, cropArea.y + deltaY);
              newCropArea.width = Math.max(50, cropArea.width - deltaX);
              newCropArea.height = Math.max(50, cropArea.height - deltaY);
              break;
            case 'ne':
              newCropArea.y = Math.max(0, cropArea.y + deltaY);
              newCropArea.width = Math.max(50, cropArea.width + deltaX);
              newCropArea.height = Math.max(50, cropArea.height - deltaY);
              break;
            case 'sw':
              newCropArea.x = Math.max(0, cropArea.x + deltaX);
              newCropArea.width = Math.max(50, cropArea.width - deltaX);
              newCropArea.height = Math.max(50, cropArea.height + deltaY);
              break;
            case 'se':
              newCropArea.width = Math.max(50, cropArea.width + deltaX);
              newCropArea.height = Math.max(50, cropArea.height + deltaY);
              break;
          }

          // Ensure crop area stays within image bounds
          newCropArea.width = Math.min(newCropArea.width, imageDimensions.width - newCropArea.x);
          newCropArea.height = Math.min(newCropArea.height, imageDimensions.height - newCropArea.y);
        }

        setCropArea(newCropArea);
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    });
  }, [isDragging, isResizing, resizeHandle, dragStart, cropArea, imageDimensions, selectedRatio, getDisplayInfo]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      // Use passive: false to ensure we can preventDefault if needed
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });

      // Prevent text selection during drag
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle crop execution with instant popup close
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    // INSTANT UX: Close popup immediately and start background processing
    onCancel(); // Close popup first for instant feedback

    // Background processing: Create cropped image
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback: Pass crop data to parent
        onCrop(imageUrl, cropArea);
        return;
      }

      // Set canvas size to crop area
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Create a new image with proper CORS handling
      const corsImage = new Image();
      corsImage.crossOrigin = 'anonymous';

      corsImage.onload = async () => {
        try {
          // Draw cropped image using CORS-safe image
          ctx.drawImage(
            corsImage,
            cropArea.x, cropArea.y, cropArea.width, cropArea.height,
            0, 0, cropArea.width, cropArea.height
          );

          // Convert to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              onCrop(imageUrl, cropArea);
              return;
            }

            try {
              // Optimize the cropped image
              const optimized = await optimizeImage(blob, {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.9,
                format: 'jpeg'
              });

              onCrop(optimized.url);
            } catch (error) {
              console.error('Optimization failed, using original:', error);
              // Fallback to original blob
              const croppedUrl = URL.createObjectURL(blob);
              onCrop(croppedUrl);
            }
          }, 'image/jpeg', 0.95);
        } catch (canvasError) {
          console.error('Canvas operation failed:', canvasError);
          onCrop(imageUrl, cropArea);
        }
      };

      corsImage.onerror = () => {
        console.error('CORS image load failed, using fallback approach');
        onCrop(imageUrl, cropArea);
      };

      // Load image with CORS
      corsImage.src = imageUrl;

    } catch (error) {
      console.error('Crop failed:', error);
      onCrop(imageUrl, cropArea);
    }
  }, [cropArea, onCrop, onCancel, imageUrl]);

  const getCropStyle = () => {
    const displayInfo = getDisplayInfo();
    if (!displayInfo) return {};

    const { offsetX, offsetY } = displayInfo;
    const scaleX = displayInfo.displayWidth / imageDimensions.width;
    const scaleY = displayInfo.displayHeight / imageDimensions.height;

    return {
      left: `${offsetX + cropArea.x * scaleX}px`,
      top: `${offsetY + cropArea.y * scaleY}px`,
      width: `${cropArea.width * scaleX}px`,
      height: `${cropArea.height * scaleY}px`,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Crop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Crop ảnh đại diện
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chọn tỷ lệ và vùng crop phù hợp
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Tỷ lệ khung hình
          </h4>
          <div className="flex flex-wrap gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setSelectedRatio(ratio.value)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200
                  ${selectedRatio === ratio.value
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {ratio.icon}
                <div className="text-left">
                  <div className="text-sm font-medium">{ratio.label}</div>
                  <div className="text-xs opacity-75">{ratio.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Crop Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 text-center flex-shrink-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kéo để di chuyển vùng crop • Kéo góc để thay đổi kích thước
            </p>
          </div>
          <div className="flex-1 px-6 pb-6 flex items-center justify-center min-h-0 overflow-hidden">
            <div
              ref={containerRef}
              className="relative mx-auto bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 max-w-full max-h-full"
              style={{
                width: 'fit-content',
                height: 'fit-content'
              }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                crossOrigin="anonymous"
                className="block object-contain"
                style={{
                  maxWidth: '100%',
                  maxHeight: '50vh', // Giới hạn chiều cao cụ thể
                  width: 'auto',
                  height: 'auto',
                  display: 'block'
                }}
                draggable={false}
              />
            
            {imageLoaded && (
              <>
                {/* Overlay - covers entire container */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                {/* Crop Area */}
                <div
                  className="absolute border-2 border-white shadow-lg cursor-move bg-transparent"
                  style={{
                    ...getCropStyle(),
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)'
                  }}
                  onMouseDown={handleCropAreaMouseDown}
                >
                  {/* Crop area content - completely transparent to show image */}
                  <div className="w-full h-full" />

                  {/* Corner handles with proper event handlers */}
                  <div
                    className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize shadow-lg hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                  />
                  <div
                    className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize shadow-lg hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                  />
                  <div
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize shadow-lg hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                  />
                  <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize shadow-lg hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                  />

                  {/* Center drag handle */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white/20 border border-white rounded-full flex items-center justify-center cursor-move">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => initializeCropArea()}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleCrop}
              disabled={!imageLoaded}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Check size={16} />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Hidden canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
