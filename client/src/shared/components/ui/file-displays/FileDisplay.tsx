import { File, FileArchive, FileImage, FileText } from 'lucide-react';

import { Attachment } from '@/shared/types/AttachmentTypes';
import { getFileUrl } from '@/utils/helpers';

interface FileDisplayProps {
  file: Attachment;
}

const MIME_TYPE_MAP: Record<string, string> = {
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

const OFFICE_DOCUMENT_TYPES = {
  WORD: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  EXCEL: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  POWERPOINT: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  ARCHIVE: ['application/zip', 'application/x-rar-compressed'],
};

const FileDisplay = ({ file }: FileDisplayProps) => {
  const getFileIcon = (mimeType: string): React.ReactNode => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="text-blue-500" />;
    }

    if (mimeType === 'application/pdf') {
      return <FileText className="text-red-500" />;
    }

    if (OFFICE_DOCUMENT_TYPES.WORD.includes(mimeType)) {
      return <FileText className="text-blue-600" />;
    }

    if (OFFICE_DOCUMENT_TYPES.EXCEL.includes(mimeType)) {
      return <FileText className="text-green-600" />;
    }

    if (OFFICE_DOCUMENT_TYPES.POWERPOINT.includes(mimeType)) {
      return <FileText className="text-orange-500" />;
    }

    if (OFFICE_DOCUMENT_TYPES.ARCHIVE.includes(mimeType)) {
      return <FileArchive className="text-yellow-600" />;
    }

    return <File className="text-gray-500" />;
  };

  const getFileSizeText = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeDisplay = (mimeType: string): string => {
    if (mimeType in MIME_TYPE_MAP) {
      return MIME_TYPE_MAP[mimeType];
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

  const handleFileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  return (
    <a
      key={file.id}
      href={getFileUrl(file.url)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleFileClick}
      className="flex items-center rounded-md border border-gray-200 p-2 transition-colors hover:bg-gray-50"
    >
      {/* File Icon */}
      <div className="mr-3">{getFileIcon(file.mimeType)}</div>

      {/* File Details */}
      <div className="min-w-0 flex-grow">
        <p className="line-clamp-1 text-sm font-medium text-gray-700">{file.originalName}</p>
        <p className="text-xs text-gray-500">{getFileSizeText(file.size)}</p>
      </div>

      {/* File Type Badge */}
      <div className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
        {getFileTypeDisplay(file.mimeType)}
      </div>
    </a>
  );
};

export default FileDisplay;
