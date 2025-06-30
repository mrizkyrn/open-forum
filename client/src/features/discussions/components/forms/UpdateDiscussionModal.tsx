import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, FileText, Image, Tag as TagIcon, Upload, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { discussionApi } from '@/features/discussions/services';
import { Discussion, UpdateDiscussionRequest } from '@/features/discussions/types';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/shared/components/modals/Modal';
import MainButton from '@/shared/components/ui/buttons/MainButton';
import { useFileHandling } from '@/shared/hooks/useFileHandling';
import { Attachment } from '@/shared/types/AttachmentTypes';
import { ALLOWED_FILE_TYPES, MAX_DISCUSSION_FILES, MAX_FILE_SIZE } from '@/utils/constants';
import { getFileUrl } from '@/utils/helpers';

interface UpdateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussion: Discussion | null;
}

const UpdateDiscussionModal = ({ isOpen, onClose, discussion }: UpdateDiscussionModalProps) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<UpdateDiscussionRequest>({
    content: '',
    isAnonymous: false,
    tags: [],
    files: [],
    attachmentsToRemove: [],
  });
  const [tagInput, setTagInput] = useState<string>('');
  const [contentError, setContentError] = useState<string | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);

  const { files, fileErrors, setFileErrors, fileInputRef, handleFileChange, removeFile, clearFiles, validateFiles } =
    useFileHandling({
      allowedTypes: ALLOWED_FILE_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: MAX_DISCUSSION_FILES,
    });

  useEffect(() => {
    if (discussion && isOpen) {
      setFormData({
        content: discussion.content,
        isAnonymous: discussion.isAnonymous,
        tags: discussion.tags || [],
        files: [],
        attachmentsToRemove: [],
      });
      setExistingAttachments(discussion.attachments || []);
      clearFiles();
      setTagInput('');
      setContentError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussion, isOpen]);

  useEffect(() => {
    updateFormField('files', files);
  }, [files]);

  const { mutate: updateDiscussion, isPending } = useMutation({
    mutationFn: async ({ discussionId, data }: { discussionId: number; data: UpdateDiscussionRequest }) => {
      return await discussionApi.updateDiscussion(discussionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      if (discussion) {
        queryClient.invalidateQueries({ queryKey: ['discussion', discussion.id] });
      }
      toast.success('Discussion updated successfully');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to update discussion:', error);
      toast.error('Failed to update discussion');
    },
  });

  const updateFormField = <K extends keyof UpdateDiscussionRequest>(field: K, value: UpdateDiscussionRequest[K]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const markExistingAttachmentForRemoval = (id: number) => {
    const currentExistingCount = existingAttachments.length - formData.attachmentsToRemove.length;
    const wouldExceedLimit = currentExistingCount - 1 + files.length > MAX_DISCUSSION_FILES;

    if (!wouldExceedLimit) {
      updateFormField('attachmentsToRemove', [...formData.attachmentsToRemove, id]);
    } else {
      setFileErrors(`Maximum ${MAX_DISCUSSION_FILES} files allowed`);
    }
  };

  const undoMarkForRemoval = (id: number) => {
    const remainingExistingAttachments = existingAttachments.filter(
      (a) => !formData.attachmentsToRemove.filter((removeId) => removeId !== id).includes(a.id),
    ).length;

    const totalFilesAfterUndo = remainingExistingAttachments + files.length;

    if (totalFilesAfterUndo > MAX_DISCUSSION_FILES) {
      setFileErrors(`Cannot restore this attachment: maximum ${MAX_DISCUSSION_FILES} files allowed`);
      return;
    }

    updateFormField(
      'attachmentsToRemove',
      formData.attachmentsToRemove.filter((attachmentId) => attachmentId !== id),
    );
    setFileErrors(null);
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && formData.tags && !formData.tags.includes(trimmedTag)) {
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
    const newTags = [...(formData.tags || [])];
    newTags.splice(index, 1);
    updateFormField('tags', newTags);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!formData.content?.trim()) {
      setContentError('Discussion content is required');
      isValid = false;
    } else {
      setContentError(null);
    }

    const remainingExistingAttachments = existingAttachments.filter(
      (a) => !formData.attachmentsToRemove.includes(a.id),
    ).length;

    const totalFiles = remainingExistingAttachments + files.length;

    if (totalFiles > MAX_DISCUSSION_FILES) {
      setFileErrors(`Maximum ${MAX_DISCUSSION_FILES} files allowed (you have ${totalFiles})`);
      isValid = false;
    } else {
      if (!validateFiles(files)) {
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (!discussion || !validateForm()) return;

    updateDiscussion({
      discussionId: discussion.id,
      data: formData,
    });
  };

  const handleClose = () => {
    setFormData({
      content: '',
      isAnonymous: false,
      tags: [],
      files: [],
      attachmentsToRemove: [],
    });
    setTagInput('');
    setExistingAttachments([]);
    clearFiles();
    setContentError(null);
    onClose();
  };

  const getEffectiveFileCount = () => {
    const remainingExistingAttachments = existingAttachments.filter(
      (a) => !formData.attachmentsToRemove.includes(a.id),
    ).length;

    return remainingExistingAttachments + files.length;
  };

  if (!isOpen || !discussion) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalHeader title="Update Discussion" onClose={handleClose} />

      <ModalBody>
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
          {formData.tags && formData.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
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

        {/* File upload section */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Attachments <span className="text-xs text-gray-500">(max 4 files, 10MB each)</span>
          </label>

          {/* Existing attachments */}
          {existingAttachments.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2">
                {existingAttachments.map((attachment) => {
                  const isMarkedForRemoval = formData.attachmentsToRemove.includes(attachment.id);

                  return (
                    <div
                      key={attachment.id}
                      className={`relative flex items-center gap-2 rounded-md border px-3 py-2 ${
                        isMarkedForRemoval ? 'border-red-200 bg-red-50 text-red-700' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {attachment.isImage ? (
                        <div className="h-6 w-6 overflow-hidden rounded">
                          <img
                            src={getFileUrl(attachment.url)}
                            alt={attachment.originalName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <FileText size={18} className="text-orange-500" />
                      )}

                      <span className="max-w-xs truncate text-sm">{attachment.originalName}</span>

                      {isMarkedForRemoval ? (
                        <button
                          type="button"
                          onClick={() => undoMarkForRemoval(attachment.id)}
                          className="rounded-full font-medium text-red-600 hover:text-red-800"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markExistingAttachmentForRemoval(attachment.id)}
                          className="rounded-full text-gray-500 hover:text-red-500"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New files */}
          <div className="flex flex-wrap gap-2">
            {files.map((file: File, index: number) => (
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

          {/* File upload button */}
          {getEffectiveFileCount() < MAX_DISCUSSION_FILES && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  // Check total files before processing
                  const selectedFiles = Array.from(e.target.files || []);

                  if (getEffectiveFileCount() + selectedFiles.length > MAX_DISCUSSION_FILES) {
                    setFileErrors(`Maximum ${MAX_DISCUSSION_FILES} files allowed`);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    return;
                  }

                  handleFileChange(e);
                }}
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
                  {getEffectiveFileCount()} of {MAX_DISCUSSION_FILES} files added | Accepted formats: PDF, images,
                  documents
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
          disabled={isPending || !formData.content?.trim()}
          isLoading={isPending}
          leftIcon={<CheckCircle size={18} />}
        >
          Update Discussion
        </MainButton>
      </ModalFooter>
    </Modal>
  );
};

export default UpdateDiscussionModal;
