import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Crop, RefreshCw, Trash2 } from 'lucide-react';
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
  processingType: 'crop' | 'replace' | 'delete' | null;
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

  const overlayRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate overlay position
  useEffect(() => {
    if (imageElement) {
      const rect = imageElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPosition({
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop + rect.height / 2
      });
    }
  }, [imageElement]);

  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        if (!overlayState.showCropper && !overlayState.showAltEdit && !overlayState.showReplace) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, overlayState]);

  // Get image position in editor
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
  const handleCrop = () => {
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
        // Update image in editor
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
      onClose();
    }
  };

  // Handle alt text edit
  const handleAltEdit = () => {
    setOverlayState(prev => ({ ...prev, showAltEdit: true }));
  };

  // Handle alt text save
  const handleAltSave = (newAlt: string) => {
    const imagePos = getImagePosition();
    if (imagePos !== -1) {
      editor.chain()
        .focus()
        .setNodeSelection(imagePos)
        .updateAttributes('image', { alt: newAlt })
        .run();
    }
    setOverlayState(prev => ({ ...prev, showAltEdit: false }));
    onClose();
  };

  // Handle replace
  const handleReplace = () => {
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
    onClose();
  };

  // Handle delete
  const handleDelete = async () => {
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
      onClose();
    }
  };

  const overlayStyle = {
    position: 'absolute' as const,
    left: position.x,
    top: position.y,
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
  };

  return (
    <>
      {/* Main Overlay */}
      <motion.div
        ref={overlayRef}
        style={overlayStyle}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="bg-gray-800/90 backdrop-blur-md rounded-xl p-2 flex items-center gap-2 shadow-2xl border border-gray-600"
      >
        <button
          onClick={handleAltEdit}
          disabled={overlayState.isProcessing}
          className="p-2 text-white hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
          title="Edit Alt Text"
        >
          <Edit3 size={16} />
        </button>

        <button
          onClick={handleCrop}
          disabled={overlayState.isProcessing}
          className="p-2 text-white hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
          title="Crop Image"
        >
          <Crop size={16} />
        </button>

        <button
          onClick={handleReplace}
          disabled={overlayState.isProcessing}
          className="p-2 text-white hover:bg-yellow-600 rounded-lg transition-colors disabled:opacity-50"
          title="Replace Image"
        >
          <RefreshCw size={16} />
        </button>

        <button
          onClick={handleDelete}
          disabled={overlayState.isProcessing}
          className="p-2 text-white hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
          title="Delete Image"
        >
          <Trash2 size={16} />
        </button>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {overlayState.showCropper && (
          <ImageCropper
            imageUrl={imageElement.src}
            onCrop={handleCropSave}
            onCancel={() => setOverlayState(prev => ({ ...prev, showCropper: false }))}
            initialAspectRatio={null}
          />
        )}

        {overlayState.showAltEdit && (
          <ImageAltEditPopup
            currentAlt={imageElement.alt || ''}
            onSave={handleAltSave}
            onCancel={() => setOverlayState(prev => ({ ...prev, showAltEdit: false }))}
            position={position}
            imageElement={imageElement}
          />
        )}

        {overlayState.showReplace && (
          <ImageUpload
            onImageUpload={handleReplaceUpload}
            onClose={() => setOverlayState(prev => ({ ...prev, showReplace: false }))}
            existingImageUrl={imageElement.src}
          />
        )}
      </AnimatePresence>
    </>
  );
}
