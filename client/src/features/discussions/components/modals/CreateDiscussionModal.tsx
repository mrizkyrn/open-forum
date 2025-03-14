import { useState } from 'react';
import { toast } from 'react-toastify';
import { X, Loader2, Tag as TagIcon, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_DISCUSSION_FILES } from '@/utils/constants';
import { useFileHandling } from '@/hooks/useFileHandling';
import FilePreview from '@/components/ui/file-displays/FilePreview';
import Modal from '@/components/modals/Modal';

interface CreateDiscussionModalProps {
  preselectedSpaceId?: number;
  isOpen: boolean;
  onClose: () => void;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({ preselectedSpaceId, isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [content, setContent] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [contentError, setContentError] = useState<string | null>(null);

  const { files, fileErrors, fileInputRef, handleFileChange, removeFile, clearFiles, validateFiles } = useFileHandling(
    MAX_DISCUSSION_FILES,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
  );

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

    if (!content.trim() || content.trim().length < 10) {
      setContentError('Discussion content must be at least 10 characters long');
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

    // Add space ID if present
    if (preselectedSpaceId) {
      formData.append('spaceId', String(preselectedSpaceId));
    } else {
      formData.append('spaceId', '1');
    }

    createDiscussion(formData);
  };

  const handleClose = () => {
    setContent('');
    setIsAnonymous(false);
    setTags([]);
    setTagInput('');
    clearFiles();
    setContentError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <div className="flex max-h-[85vh] flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Create New Discussion</h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-grow overflow-y-auto pt-4 px-1">
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
                  className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-wrap text-green-800"
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
                <FilePreview
                  key={index}
                  fileName={file.name}
                  isImage={file.type.includes('image')}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
            {files.length < MAX_DISCUSSION_FILES && (
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
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 pt-4">
          <div className="flex items-center justify-end gap-2">
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
    </Modal>
  );
};

export default CreateDiscussionModal;
