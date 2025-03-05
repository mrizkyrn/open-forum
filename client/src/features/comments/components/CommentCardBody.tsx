import { useState } from 'react';
import { FileText, FileImage, File } from 'lucide-react';
import { Attachment } from '@/types/AttachmentTypes';

interface CommentCardBodyProps {
  content: string;
  attachments: Attachment[];
}

const CommentCardBody: React.FC<CommentCardBodyProps> = ({ content, attachments = [] }) => {
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
    return <File className="text-gray-500" />;
  };

  // const getFileSizeText = (bytes: number) => {
  //   if (bytes < 1024) return `${bytes} B`;
  //   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  //   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  // };

  const getFileTypeDisplay = (mimeType: string): string => {
    const typeMap: Record<string, string> = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
    };

    if (mimeType in typeMap) {
      return typeMap[mimeType];
    }

    const parts = mimeType.split('/');
    if (parts.length === 2) {
      let extension = parts[1].toUpperCase();
      if (extension.includes('.')) {
        const subParts = extension.split('.');
        extension = subParts[subParts.length - 1];
      }
      return extension.length > 5 ? parts[0].toUpperCase() : extension;
    }
    return 'FILE';
  };

  const getFileUrl = (url: string) => {
    return import.meta.env.VITE_API_URL + url;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Comment text */}
      <p className="text-gray-700 text-sm">{content}</p>

      {/* Image attachments - more compact for comments */}
      {sortedImages.length > 0 && (
        <div className={`grid gap-1 overflow-hidden rounded-lg ${sortedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {sortedImages.map((image) => (
            <button
              key={image.id}
              className="group relative cursor-pointer"
              onClick={() => setExpandedImageUrl(getFileUrl(image.url))}
            >
              <img
                src={getFileUrl(image.url)}
                alt={image.originalName}
                className="h-24 w-full cursor-pointer object-cover transition-transform hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {/* File attachments - more compact for comments */}
      {sortedFiles.length > 0 && (
        <div className="flex flex-col gap-1">
          {sortedFiles.map((file) => (
            <a
              key={file.id}
              href={getFileUrl(file.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-md border border-gray-200 p-1.5 text-xs transition-colors hover:bg-gray-50"
            >
              <div className="mr-2">{getFileIcon(file.mimeType)}</div>
              <span className="truncate flex-grow font-medium text-gray-700">{file.originalName}</span>
              <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                {getFileTypeDisplay(file.mimeType)}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Image preview modal */}
      {expandedImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
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

export default CommentCardBody;