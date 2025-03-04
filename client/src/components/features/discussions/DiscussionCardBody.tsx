import { Attachment } from '@/types/AttachmentTypes';
import { FileText, FileImage, File, FileArchive } from 'lucide-react';
import { useState } from 'react';

interface DiscussionCardBodyProps {
  content: string;
  attachments: Attachment[];
}

const DiscussionCardBody: React.FC<DiscussionCardBodyProps> = ({ content, attachments }) => {
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null);

  const imageAttachments = attachments.filter((attachment) => attachment.isImage);
  const fileAttachments = attachments.filter((attachment) => !attachment.isImage);

  const sortedImages = imageAttachments.sort((a, b) => a.displayOrder - b.displayOrder);
  const sortedFiles = fileAttachments.sort((a, b) => a.displayOrder - b.displayOrder);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="text-blue-500" />;
    if (mimeType === 'application/pdf') return <FileText className="text-red-500" />;
    if (
      mimeType === 'application/msword' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
      return <FileText className="text-blue-600" />;
    if (
      mimeType === 'application/vnd.ms-excel' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
      return <FileText className="text-green-600" />;
    if (
      mimeType === 'application/vnd.ms-powerpoint' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
      return <FileText className="text-orange-500" />;
    if (mimeType === 'application/zip' || mimeType === 'application/x-rar-compressed')
      return <FileArchive className="text-yellow-600" />;
    return <File className="text-gray-500" />;
  };

  const getFileSizeText = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get friendly file type display
  const getFileTypeDisplay = (mimeType: string): string => {
    // Handle common types with a mapping
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.ms-powerpoint': 'PPT',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'application/zip': 'ZIP',
      'application/x-rar-compressed': 'RAR',
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
    };

    // If we have a direct mapping, use it
    if (mimeType in typeMap) {
      return typeMap[mimeType];
    }

    // Otherwise try to extract from MIME type
    const parts = mimeType.split('/');
    if (parts.length === 2) {
      // Get the second part and convert to uppercase
      let extension = parts[1].toUpperCase();

      // Handle special cases with multiple dots
      if (extension.includes('.')) {
        const subParts = extension.split('.');
        extension = subParts[subParts.length - 1];
      }

      // If the extension is too long, use just the first part
      return extension.length > 5 ? parts[0].toUpperCase() : extension;
    }

    // Fallback
    return 'FILE';
  };

  const getFileUrl = (url: string) => {
    return import.meta.env.VITE_API_URL + url;
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-gray-700">{content}</p>
      </div>

      {/* Image attachments grid */}
      {sortedImages.length > 0 && (
        <div
          className={`grid gap-1 overflow-hidden rounded-lg ${sortedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
        >
          {sortedImages.map((image) => (
            <button
              key={image.id}
              className="group relative cursor-pointer"
              onClick={() => setExpandedImageUrl(getFileUrl(image.url))}
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
          ))}
        </div>
      )}

      {/* Document attachments list */}
      {sortedFiles.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {sortedFiles.map((file) => (
            <a
              key={file.id}
              href={getFileUrl(file.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-md border border-gray-200 p-2 transition-colors hover:bg-gray-50"
            >
              <div className="mr-3">{getFileIcon(file.mimeType)}</div>
              <div className="min-w-0 flex-grow">
                <p className="truncate text-sm font-medium text-gray-700">{file.originalName}</p>
                <p className="text-xs text-gray-500">{getFileSizeText(file.size)}</p>
              </div>
              <div className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {getFileTypeDisplay(file.mimeType)}
              </div>
            </a>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default DiscussionCardBody;
