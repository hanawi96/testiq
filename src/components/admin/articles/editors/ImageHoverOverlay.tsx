import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Crop, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import ImageCropper from '../../../ui/ImageCropper';
import ImageAltEditPopup from '../../../ui/ImageAltEditPopup';
import ImageUpload from './ImageUpload';
import { ImageStorageService } from '../../../../../backend/storage/image-storage';

interface ImageHoverOverlayProps {
  imageElement: HTMLImageElement;
  editor: any;
  onClose: () => void;
}

interface OverlayState {
  showCropper: boolean;
  showAltEdit: boolean;
  showReplace: boolean;
  isProcessing: boolean;
  processingType: 'crop' | 'replace' | 'delete' | 'alt-edit' | null;
}

export default function ImageHoverOverlay({ 
  imageElement, 
  editor, 
  onClose 
}: ImageHoverOverlayProps) {
  const [overlayState, setOverlayState] = useState<OverlayState>({
    showCropper: false,
    showAltEdit: false,
    showReplace: false,
    isProcessing: false,
    processingType: null
  });

  // Tìm vị trí image trong TipTap document
  const getImagePosition = () => {
    const { state } = editor;
    const { doc } = state;
    let imagePos = -1;

    doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'image' && node.attrs.src === imageElement.src) {
        imagePos = pos;
        return false;
      }
    });

    return imagePos;
  };

  // Handle crop
  const handleCrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverlayState(prev => ({ ...prev, showCropper: true }));
  };

  // Handle crop save
  const handleCropSave = async (croppedImageUrl: string) => {
    setOverlayState(prev => ({
      ...prev,
      showCropper: false,
      isProcessing: true,
      processingType: 'crop'
    }));

    try {
      // Convert blob to file and upload
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });

      const { data, error } = await ImageStorageService.replaceImage(
        imageElement.src,
        file,
        { folder: 'articles', maxWidth: 1920, maxHeight: 1080 }
      );

      if (data && !error) {
        // Update image trong editor
        const imagePos = getImagePosition();
        if (imagePos !== -1) {
          editor.chain()
            .focus()
            .setNodeSelection(imagePos)
            .updateAttributes('image', { src: data.url })
            .run();
        }

        // Cleanup blob URL
        if (croppedImageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(croppedImageUrl);
        }
      }
    } catch (error) {
      console.error('Crop error:', error);
    } finally {
      setOverlayState(prev => ({ ...prev, isProcessing: false, processingType: null }));
      // FIXED: Đóng overlay sau khi hoàn thành
      setTimeout(() => onClose(), 100);
    }
  };

  // Handle alt text edit
  const handleAltEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverlayState(prev => ({ ...prev, showAltEdit: true }));
  };

  // Handle alt text and filename save
  const handleAltSave = async (newAlt: string, newFileName?: string) => {
    const currentFileName = ImageStorageService.extractFileNameFromUrl(imageElement.src);
    const hasFileNameChanged = newFileName && currentFileName && newFileName !== currentFileName;

    try {
      let finalUrl = imageElement.src;

      // If filename changed, rename the file
      if (hasFileNameChanged) {
        const renameResult = await ImageStorageService.renameImage(imageElement.src, newFileName, {
          folder: 'articles'
        });

        if (renameResult.error || !renameResult.data) {
          throw new Error(renameResult.error?.message || 'Lỗi khi đổi tên file');
        }

        finalUrl = renameResult.data.url;

        // Preload ảnh mới để đảm bảo hiển thị ngay lập tức
        await new Promise((resolve, reject) => {
          const img = document.createElement('img');
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = finalUrl;
        });
      }

      // Update image attributes in editor
      const imagePos = getImagePosition();
      if (imagePos !== -1) {
        editor.chain()
          .focus()
          .setNodeSelection(imagePos)
          .updateAttributes('image', {
            src: finalUrl,
            alt: newAlt
          })
          .run();
      }

      // Đóng overlay sau khi hoàn thành
      setOverlayState(prev => ({ ...prev, showAltEdit: false }));
      setTimeout(() => onClose(), 100);

    } catch (error: any) {
      console.error('Save error:', error);
      throw error; // Re-throw để popup có thể handle
    }
  };

  // Handle replace
  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverlayState(prev => ({ ...prev, showReplace: true }));
  };

  // Handle replace upload
  const handleReplaceUpload = (url: string, alt: string) => {
    const imagePos = getImagePosition();
    if (imagePos !== -1) {
      editor.chain()
        .focus()
        .setNodeSelection(imagePos)
        .updateAttributes('image', { src: url, alt: alt })
        .run();
    }
    setOverlayState(prev => ({ ...prev, showReplace: false }));
    // FIXED: Đóng overlay sau khi hoàn thành
    setTimeout(() => onClose(), 100);
  };

  // Handle delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

    setOverlayState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      processingType: 'delete' 
    }));

    try {
      // Delete from storage
      const filePath = ImageStorageService.extractPathFromUrl(imageElement.src);
      if (filePath) {
        ImageStorageService.deleteImage(filePath).catch(console.warn);
      }

      // Remove from editor
      const imagePos = getImagePosition();
      if (imagePos !== -1) {
        editor.chain()
          .focus()
          .setNodeSelection(imagePos)
          .deleteSelection()
          .run();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setOverlayState(prev => ({ ...prev, isProcessing: false, processingType: null }));
      // FIXED: Đóng overlay sau khi hoàn thành
      setTimeout(() => onClose(), 100);
    }
  };

  // Tính toán vị trí overlay
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageElement) {
      const updatePosition = () => {
        const rect = imageElement.getBoundingClientRect();
        setOverlayPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [imageElement]);

  return (
    <>
      {/* SIÊU NHANH: Hover Overlay - giống MediaUpload */}
      <div
        className="image-hover-overlay fixed pointer-events-none z-50"
        style={{
          left: overlayPosition.x,
          top: overlayPosition.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }} // SIÊU NHANH
          className="bg-black/80 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 shadow-2xl pointer-events-auto"
          onMouseEnter={() => {}} // Prevent overlay from disappearing
          onMouseLeave={(e) => {
            // INSTANT: Đóng ngay lập tức nếu không có modal
            const hasOpenModal = overlayState.showCropper || overlayState.showAltEdit || overlayState.showReplace;
            if (!hasOpenModal) {
              onClose();
            }
          }}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCrop}
            disabled={overlayState.isProcessing}
            className="p-3 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 transition-all duration-150 shadow-lg disabled:opacity-50"
            title="Crop ảnh"
          >
            <Crop size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAltEdit}
            disabled={overlayState.isProcessing}
            className="p-3 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 transition-all duration-150 shadow-lg disabled:opacity-50"
            title="Chỉnh sửa Alt text"
          >
            <Edit3 size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleReplace}
            disabled={overlayState.isProcessing}
            className="p-3 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 transition-all duration-150 shadow-lg disabled:opacity-50"
            title="Thay thế ảnh"
          >
            <RefreshCw size={16} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDelete}
            disabled={overlayState.isProcessing}
            className="p-3 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-red-500/50 transition-all duration-150 shadow-lg disabled:opacity-50"
            title="Xóa ảnh"
          >
            <Trash2 size={16} />
          </motion.button>
        </motion.div>
      </div>



      {/* Modals */}
      <AnimatePresence>
        {overlayState.showCropper && (
          <ImageCropper
            imageUrl={imageElement.src}
            onCrop={handleCropSave}
            onCancel={() => {
              setOverlayState(prev => ({ ...prev, showCropper: false }));
              // Không đóng overlay ngay, để user có thể chọn action khác
            }}
            initialAspectRatio={null}
          />
        )}

        {overlayState.showAltEdit && (
          <ImageAltEditPopup
            currentAlt={imageElement.alt || ''}
            onSave={handleAltSave}
            onCancel={() => {
              setOverlayState(prev => ({ ...prev, showAltEdit: false }));
              // Không đóng overlay ngay, để user có thể chọn action khác
            }}
            isModal={true} // Sử dụng modal mode cho TipTap
            imageElement={imageElement}
            enableFileNameEdit={true} // Enable filename editing for TipTap images
          />
        )}

        {overlayState.showReplace && (
          <ImageUpload
            onImageUpload={handleReplaceUpload}
            onClose={() => {
              setOverlayState(prev => ({ ...prev, showReplace: false }));
              // Không đóng overlay ngay, để user có thể chọn action khác
            }}
            existingImageUrl={imageElement.src}
          />
        )}
      </AnimatePresence>
    </>
  );
}
