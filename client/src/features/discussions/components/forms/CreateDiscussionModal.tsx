import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Layers, Tag as TagIcon, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { discussionApi } from '@/features/discussions/services';
import { CreateDiscussionRequest } from '@/features/discussions/types';
import { spaceApi } from '@/features/spaces/services';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import FilePreview from '@/shared/components/ui/file-displays/FilePreview';
import { useFileHandling } from '@/shared/hooks/useFileHandling';
import { ALLOWED_FILE_TYPES, MAX_DISCUSSION_FILES, MAX_FILE_SIZE } from '@/utils/constants';
import { getFileUrl } from '@/utils/helpers';

interface CreateDiscussionModalProps {
  preselectedSpaceId?: number;
  isOpen: boolean;
  onClose: () => void;
}

const CreateDiscussionModal = ({ preselectedSpaceId = 1, isOpen, onClose }: CreateDiscussionModalProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<CreateDiscussionRequest>({
    content: '',
    isAnonymous: false,
    tags: [],
    spaceId: preselectedSpaceId || 1,
  });
  const [tagInput, setTagInput] = useState<string>('');
  const [contentError, setContentError] = useState<string | null>(null);

  const { files, fileErrors, fileInputRef, handleFileChange, removeFile, clearFiles, validateFiles } = useFileHandling({
    maxFiles: MAX_DISCUSSION_FILES,
    allowedTypes: ALLOWED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const { data: spaceInfo, isLoading: isSpaceLoading } = useQuery({
    queryKey: ['space', preselectedSpaceId],
    queryFn: () => spaceApi.getSpaceById(preselectedSpaceId),
    enabled: isOpen && !!preselectedSpaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  useEffect(() => {
    updateFormField('files', files);
  }, [files]);

  const { mutate: createDiscussion, isPending } = useMutation({
    mutationFn: async (formData: CreateDiscussionRequest) => {
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

  const updateFormField = <K extends keyof CreateDiscussionRequest>(field: K, value: CreateDiscussionRequest[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      updateFormField('tags', [...formData.tags, trimmedTag]);
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
    const newTags = [...formData.tags];
    newTags.splice(index, 1);
    updateFormField('tags', newTags);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!formData.content.trim() || formData.content.trim().length < 10) {
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
    createDiscussion(formData);
  };

  const handleClose = () => {
    setFormData({
      content: '',
      isAnonymous: false,
      tags: [],
      files: [],
      spaceId: preselectedSpaceId || 1,
    });
    setTagInput('');
    clearFiles();
    setContentError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalHeader title="Create New Discussion" onClose={handleClose} />

      <ModalBody>
        {/* Space Information */}
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            {isSpaceLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-md bg-gray-200"></div>
            ) : spaceInfo ? (
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-green-100">
                {spaceInfo.iconUrl ? (
                  <img
                    src={getFileUrl(spaceInfo.iconUrl)}
                    alt={spaceInfo.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Layers className="h-5 w-5 text-green-600" />
                )}
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                <Layers className="h-5 w-5 text-gray-500" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-medium text-gray-800">
                  {isSpaceLoading ? (
                    <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  ) : spaceInfo ? (
                    spaceInfo.name
                  ) : (
                    'Unknown Space'
                  )}
                </h3>
              </div>
              {isSpaceLoading ? (
                <div className="mt-1 h-3 w-40 animate-pulse rounded bg-gray-200"></div>
              ) : spaceInfo ? (
                <p className="text-sm text-gray-500">{spaceInfo.description}</p>
              ) : (
                <p className="text-sm text-gray-500">No description available</p>
              )}
            </div>
          </div>
        </div>

        {/* Content textarea */}
        <div className="mb-1">
          <label htmlFor="content" className="mb-2 block text-sm font-medium text-gray-700">
            Discussion Content
          </label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => updateFormField('content', e.target.value)}
            placeholder="What would you like to discuss?"
            className={`w-full rounded-md border ${
              contentError ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 focus:ring-1 focus:ring-gray-500 focus:outline-none`}
            rows={6}
          />
          {contentError && <p className="text-sm text-red-600">{contentError}</p>}
        </div>

        {/* Anonymous toggle */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={(e) => updateFormField('isAnonymous', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
            Post anonymously
          </label>
        </div>

        {/* Tags input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tags <span className="text-xs text-gray-500">(comma or enter to add)</span>
          </label>
          {formData.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
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
          )}
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags..."
                className="h-10 w-full rounded-md border border-gray-300 px-3 focus:ring-1 focus:ring-gray-500 focus:outline-none"
              />
              {tagInput && (
                <button
                  type="button"
                  onClick={() => setTagInput('')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear tag input"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <MainButton
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              className="h-10 flex-shrink-0"
              leftIcon={<TagIcon size={16} />}
            >
              Add Tag
            </MainButton>
          </div>
        </div>

        {/* File upload */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Attachments <span className="text-xs text-gray-500">(max 4 files, 10MB each)</span>
          </label>

          {/* File previews */}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <FilePreview
                  key={index}
                  fileName={file.name}
                  isImage={file.type.includes('image')}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          {/* File upload button */}
          {files.length < MAX_DISCUSSION_FILES && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
              <div className="flex flex-col gap-1">
                <MainButton
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  leftIcon={<Upload size={16} />}
                  className="w-full sm:w-auto"
                >
                  Upload Files
                </MainButton>
                <p className="text-xs text-gray-500">
                  {files.length} of {MAX_DISCUSSION_FILES} files added | Accepted formats: PDF, images, documents
                </p>
              </div>
            </div>
          )}
          {fileErrors && <p className="mt-1 text-sm text-red-600">{fileErrors}</p>}
        </div>
      </ModalBody>

      <ModalFooter>
        <MainButton onClick={handleClose} disabled={isPending} variant="outline">
          Cancel
        </MainButton>
        <MainButton
          onClick={handleSubmit}
          disabled={isPending || !formData.content.trim()}
          isLoading={isPending}
          leftIcon={<CheckCircle size={18} />}
        >
          Create Discussion
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default CreateDiscussionModal;
