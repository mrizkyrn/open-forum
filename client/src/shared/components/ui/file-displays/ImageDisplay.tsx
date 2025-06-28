import { X } from 'lucide-react';
import { useState } from 'react';

import { Attachment } from '@/shared/types/AttachmentTypes';
import { getFileUrl } from '@/utils/helpers';

interface ImageDisplayProps {
  image: Attachment;
}

const ImageDisplay = ({ image }: ImageDisplayProps) => {
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setExpandedImageUrl(getFileUrl(image.url));
  };

  const handleCloseModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedImageUrl(null);
  };

  return (
    <>
      {/* Image Thumbnail */}
      <button
        key={image.id}
        className="group relative cursor-pointer overflow-hidden rounded-md"
        onClick={handleImageClick}
        type="button"
        aria-label={`View full size image: ${image.originalName}`}
      >
        <img
          src={getFileUrl(image.url)}
          alt={image.originalName}
          className="h-40 w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
          <span className="text-xs font-medium text-white">Click to expand</span>
        </div>
      </button>

      {/* Image Preview Modal */}
      {expandedImageUrl && (
        <div
          className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          tabIndex={-1}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <img
              src={expandedImageUrl}
              alt={`Full size view of ${image.originalName}`}
              className="max-h-[90vh] max-w-full object-contain shadow-2xl"
            />

            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute -top-4 -right-4 rounded-full bg-white p-2 text-gray-700 shadow-lg transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-white focus:outline-none"
              aria-label="Close image preview"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageDisplay;
