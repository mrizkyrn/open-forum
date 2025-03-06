import { useState, useRef } from 'react';

export function useFileHandling(maxFiles: number, allowedTypes: string[], maxSize: number) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (filesToCheck: File[]): boolean => {
    if (filesToCheck.length > maxFiles) {
      setFileErrors(`Maximum ${maxFiles} files allowed`);
      return false;
    }

    for (const file of filesToCheck) {
      if (file.size > maxSize) {
        setFileErrors(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        setFileErrors(`${file.name} has an unsupported file type`);
        return false;
      }
    }

    setFileErrors(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (validateFiles([...files, ...selectedFiles])) {
      if (files.length + selectedFiles.length <= maxFiles) {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileErrors(null);
  };

  const clearFiles = () => {
    setFiles([]);
    setFileErrors(null);
  };

  return {
    files,
    fileErrors,
    fileInputRef,
    handleFileChange,
    removeFile,
    clearFiles,
    validateFiles,
  };
}
