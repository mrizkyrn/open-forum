import { Attachment } from '@/types/AttachmentTypes';
import { getFileUrl } from '@/utils/helpers';
import { useState } from 'react';

interface ImageDisplayProps {
  image: Attachment;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ image }) => {
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setExpandedImageUrl(getFileUrl(image.url));
  }

  return (
    <>
      <button
        key={image.id}
        className="group relative cursor-pointer"
        onClick={handleImageClick}
      >
        <img
          src={getFileUrl(image.url)}
          alt={image.originalName}
          className="h-40 w-full cursor-pointer object-cover transition-transform hover:scale-105"
        />
        <div className="bg-opacity-0 group-hover:bg-opacity-0 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-all group-hover:opacity-50">
          <span className="text-xs text-white">Click to expand</span>
        </div>
      </button>

      {/* Image preview modal */}
      {expandedImageUrl && (
        <div
          className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
          onClick={() => setExpandedImageUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <img src={expandedImageUrl} alt="Expanded view" className="max-h-[90vh] max-w-full object-contain" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedImageUrl(null);
              }}
              className="absolute -top-4 -right-4 rounded-full bg-white p-1 shadow-md hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-700"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageDisplay;
