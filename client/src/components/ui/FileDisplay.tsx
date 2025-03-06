import { Attachment } from '@/types/AttachmentTypes';
import { getFileUrl } from '@/utils/helpers';
import { FileText, FileImage, File, FileArchive } from 'lucide-react';

interface FileDisplayProps {
  file: Attachment;
}

const FileDisplay: React.FC<FileDisplayProps> = ({ file }) => {
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

  const getFileTypeDisplay = (mimeType: string): string => {
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

    // Check if MIME type is in the map
    if (mimeType in typeMap) {
      return typeMap[mimeType];
    }

    // Split the MIME type by '/'
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
      <div className="mr-3">{getFileIcon(file.mimeType)}</div>
      <div className="min-w-0 flex-grow">
        <p className="truncate text-sm font-medium text-gray-700">{file.originalName}</p>
        <p className="text-xs text-gray-500">{getFileSizeText(file.size)}</p>
      </div>
      <div className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
        {getFileTypeDisplay(file.mimeType)}
      </div>
    </a>
  );
};

export default FileDisplay;
