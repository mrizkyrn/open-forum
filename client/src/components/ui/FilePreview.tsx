import React from 'react';

import { FileText, Image, XCircle } from 'lucide-react';

interface FilePreviewProps {
  fileName: string;
  isImage: boolean;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ fileName, isImage, onRemove }) => {
  return (
    <div className="relative flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      {isImage ? <Image size={18} className="text-blue-500" /> : <FileText size={18} className="text-orange-500" />}
      <span className="max-w-xs truncate text-sm">{fileName}</span>
      <button type="button" onClick={onRemove} className="rounded-full text-gray-500 hover:text-red-500">
        <XCircle size={18} />
      </button>
    </div>
  );
};

export default FilePreview;
