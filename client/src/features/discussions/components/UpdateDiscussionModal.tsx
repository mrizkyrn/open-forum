import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, FileText, Image, Loader2, XCircle, Tag as TagIcon, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { discussionApi } from '@/features/discussions/services/discussionApi';
import { Discussion } from '@/features/discussions/types';
import { Attachment } from '@/types/AttachmentTypes';
import { ALLOWED_FILE_TYPES, MAX_DISCUSSION_FILES, MAX_FILE_SIZE } from '@/constants/fileConstants';
import { useFileHandling } from '../hooks/useFileHandling';

interface UpdateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  discussion: Discussion | null;
}

const UpdateDiscussionModal: React.FC<UpdateDiscussionModalProps> = ({ isOpen, onClose, discussion }) => {
  const queryClient = useQueryClient();

  const [content, setContent] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<number[]>([]);
  const [contentError, setContentError] = useState<string | null>(null);

  const { files, fileErrors, fileInputRef, handleFileChange, removeFile, clearFiles, validateFiles } = useFileHandling(
    MAX_DISCUSSION_FILES,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
  );

  useEffect(() => {
    if (discussion && isOpen) {
      setContent(discussion.content);
      setIsAnonymous(discussion.isAnonymous);
      setTags(discussion.tags || []);
      setExistingAttachments(discussion.attachments || []);
      setAttachmentsToRemove([]);
      clearFiles();
      setContentError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussion, isOpen]);

  const { mutate: updateDiscussion, isPending } = useMutation({
    mutationFn: async ({ discussionId, formData }: { discussionId: number; formData: FormData }) => {
      return await discussionApi.updateDiscussion(discussionId, formData);
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

  const markExistingAttachmentForRemoval = (id: number) => {
    setAttachmentsToRemove((prev) => [...prev, id]);
    clearFiles();
  };

  const undoMarkForRemoval = (id: number) => {
    setAttachmentsToRemove((prev) => prev.filter((attachmentId) => attachmentId !== id));
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
    if (!discussion || !validateForm()) return;

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

    // Add attachments to remove
    if (attachmentsToRemove.length > 0) {
      attachmentsToRemove.forEach((id) => {
        formData.append('attachmentsToRemove', id.toString());
      });
    }

    // Add new files
    files.forEach((file: File) => {
      formData.append('files', file);
    });

    updateDiscussion({ discussionId: discussion.id, formData });
  };

  const handleClose = () => {
    setContent('');
    setIsAnonymous(false);
    setTags([]);
    setTagInput('');
    setExistingAttachments([]);
    setAttachmentsToRemove([]);
    clearFiles();
    setContentError(null);
    onClose();
  };

  const getFileUrl = (url: string) => {
    return import.meta.env.VITE_API_URL + url;
  };

  if (!isOpen || !discussion) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold">Update Discussion</h2>
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

          {/* File upload section */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Attachments <span className="text-xs text-gray-500">(max 4 files, 3MB each)</span>
            </label>

            {/* Existing attachments */}
            {existingAttachments.length > 0 && (
              <div className="mb-3">
                <h4 className="mb-1 text-sm font-medium text-gray-600">Current Attachments:</h4>
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((attachment) => {
                    const isMarkedForRemoval = attachmentsToRemove.includes(attachment.id);

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

            {/* Upload button - only show if we haven't reached the max files yet */}
            {existingAttachments.filter((a) => !attachmentsToRemove.includes(a.id)).length + files.length <
              MAX_DISCUSSION_FILES && (
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
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
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
                Updating...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Update Discussion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDiscussionModal;
