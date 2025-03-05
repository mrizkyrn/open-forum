import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { X, FileText, Image, Loader2, XCircle, Tag as TagIcon, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILES } from '../constants/DiscusisonConstants';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  // Create discussion mutation
  const { mutate: createDiscussion, isPending } = useMutation({
    mutationFn: async (formData: FormData) => {
      return await discussionApi.createDiscussion(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      toast.success('Discussion created successfully');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to create discussion:', error);
      toast.error('Failed to create discussion');
    },
  });

  const validateFiles = (filesToCheck: File[]): boolean => {
    if (filesToCheck.length > MAX_FILES) {
      setFileErrors(`Maximum ${MAX_FILES} files allowed`);
      return false;
    }

    for (const file of filesToCheck) {
      if (file.size > MAX_FILE_SIZE) {
        setFileErrors(`${file.name} is too large (max 10MB)`);
        return false;
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
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
      if (files.length + selectedFiles.length <= MAX_FILES) {
        setFiles((prev) => [...prev, ...selectedFiles]);
      }
    }

    // Reset input so the same file can be selected again if removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileErrors(null);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!content.trim()) {
      setContentError('Discussion content is required');
      isValid = false;
    } else {
      setContentError(null);
    }

    if (!validateFiles(files)) {
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const formData = new FormData();

    // Add text fields
    formData.append('content', content.trim());
    formData.append('isAnonymous', String(isAnonymous));

    // Add tags if present
    if (tags.length > 0) {
      tags.forEach((tag) => {
        formData.append('tags', tag);
      });
    }

    // Add files
    files.forEach((file) => {
      formData.append('files', file);
    });

    createDiscussion(formData);
  };

  const handleClose = () => {
    setContent('');
    setIsAnonymous(false);
    setTags([]);
    setTagInput('');
    setFiles([]);
    setFileErrors(null);
    setContentError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">Create New Discussion</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4">
          {/* Content textarea */}
          <div className="mb-2">
            <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
              Discussion Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to discuss?"
              className={`w-full rounded-md border ${
                contentError ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 focus:ring-1 focus:ring-gray-500 focus:outline-none`}
              rows={6}
            />
            {contentError && <p className="mt-1 text-sm text-red-600">{contentError}</p>}
          </div>

          {/* Anonymous toggle */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
              Post anonymously
            </label>
          </div>

          {/* Tags input */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tags <span className="text-xs text-gray-500">(comma or enter to add)</span>
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                >
                  <TagIcon size={14} />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 rounded-full text-green-700 hover:bg-green-200"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-1 focus:ring-gray-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="ml-2 flex-1/4 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* File upload */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Attachments <span className="text-xs text-gray-500">(max 4 files, 10MB each)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  {file.type.startsWith('image/') ? (
                    <Image size={18} className="text-blue-500" />
                  ) : (
                    <FileText size={18} className="text-orange-500" />
                  )}
                  <span className="max-w-xs truncate text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded-full text-gray-500 hover:text-red-500"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
            {files.length < MAX_FILES && (
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Upload Files
                </button>
              </div>
            )}
            {fileErrors && <p className="mt-1 text-sm text-red-600">{fileErrors}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-3">
          <button
            onClick={handleClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="disabled:bg-opacity-70 flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700"
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Create Discussion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDiscussionModal;
