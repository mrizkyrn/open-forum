import MainButton from '@/components/ui/buttons/MainButton';
import FilePreview from '@/components/ui/file-displays/FilePreview';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { commentApi } from '@/features/comments/services';
import UserAvatar from '@/features/users/components/UserAvatar';
import { userApi } from '@/features/users/services';
import { User } from '@/features/users/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useFileHandling } from '@/hooks/useFileHandling';
import { Attachment } from '@/types/AttachmentTypes';
import { ALLOWED_FILE_TYPES, MAX_COMMENT_FILES, MAX_FILE_SIZE } from '@/utils/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface CommentFormProps {
  discussionId: number;
  commentId?: number;
  parentId?: number | null;
  isReply?: boolean;
  isEditing?: boolean;
  initialFocus?: boolean;
  initialValue?: string;
  existingAttachments?: Attachment[];
  onClickOutside?: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({
  discussionId,
  isReply = false,
  parentId,
  onClickOutside,
  initialFocus = false,
  onSuccess,
  isEditing = false,
  commentId,
  initialValue = '',
  existingAttachments = [],
  onCancel,
}) => {
  const [value, onChange] = useState(initialValue);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<number[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const debouncedMentionQuery = useDebounce(mentionQuery, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { files, fileErrors, fileInputRef, handleFileChange, removeFile, clearFiles } = useFileHandling(
    MAX_COMMENT_FILES,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
  );

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Query for username mentions
  const { data: mentionUsers, isLoading: loadingMentions } = useQuery({
    queryKey: ['userMentions', debouncedMentionQuery],
    queryFn: () =>
      userApi.getUsers({
        page: 1,
        limit: 5,
        search: debouncedMentionQuery,
      }),
    enabled: showMentionDropdown && debouncedMentionQuery.length > 0,
  });

  // Set initial value and adjust textarea height
  useEffect(() => {
    onChange(initialValue);
    setTimeout(adjustTextareaHeight, 0);
  }, [initialValue]);

  useEffect(() => {
    if (initialFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
  
        // If there's a prefilled mention, place cursor at the end
        const length = initialValue.length;
        textareaRef.current?.setSelectionRange(length, length);
  
        adjustTextareaHeight();
      }, 50);
    }
  }, [initialFocus, initialValue]);

  // Handle clicks outside the form to remove focus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (e.target as Element).closest('button') ||
        (e.target as Element).closest('a') ||
        (e.target as Element).closest('[role="button"]')
      ) {
        return;
      }

      // Close mention dropdown when clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false);
      }

      setIsFocused(false);

      if (onClickOutside && !value.trim()) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside, value]);

  // Function to check for @ character and handle mention dropdown
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);
    onChange(newValue);

    // Check if we need to show mention dropdown
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);

      // Calculate position for dropdown
      if (textareaRef.current) {
        const { top, left, height } = textareaRef.current.getBoundingClientRect();
        // Create a temporary element to measure text width
        const tempEl = document.createElement('div');
        tempEl.style.position = 'absolute';
        tempEl.style.visibility = 'hidden';
        tempEl.style.whiteSpace = 'pre';
        tempEl.style.font = window.getComputedStyle(textareaRef.current).font;
        tempEl.textContent = textBeforeCursor;
        document.body.appendChild(tempEl);

        const textWidth = tempEl.getBoundingClientRect().width;
        document.body.removeChild(tempEl);

        // Position dropdown below the @ symbol
        setMentionPosition({
          top: top + height + window.scrollY,
          left: left + textWidth - mentionMatch[0].length + window.scrollX,
        });
      }

      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }

    adjustTextareaHeight();
  };

  // Function to handle selection of a username from dropdown
  const handleSelectMention = (username: string) => {
    if (textareaRef.current) {
      const textBeforeCursor = value.substring(0, cursorPosition);
      const textAfterCursor = value.substring(cursorPosition);

      // Find the last @ before cursor
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

      if (mentionMatch) {
        const startPos = cursorPosition - mentionMatch[0].length;
        const newValue = textBeforeCursor.substring(0, startPos) + `@${username} ` + textAfterCursor;

        onChange(newValue);

        // Set cursor position after the inserted username
        const newCursorPos = startPos + username.length + 2; // +2 for @ and space
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }

    setShowMentionDropdown(false);
    adjustTextareaHeight();
  };

  const { mutate: submitComment, isPending } = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing && commentId) {
        if (attachmentsToRemove.length > 0) {
          attachmentsToRemove.forEach((attachmentId) => {
            data.append('attachmentsToRemove', attachmentId.toString());
          });
        }
        return await commentApi.updateComment(commentId, data);
      } else {
        return await commentApi.createComment(discussionId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussion', discussionId] });
      queryClient.invalidateQueries({ queryKey: ['discussions'], exact: false });

      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['commentReplies', parentId] });
      }

      onChange('');
      clearFiles();
      setAttachmentsToRemove([]);
      setIsFocused(false);

      if (onSuccess) {
        onSuccess();
      }

      toast.success(isEditing ? 'Comment updated' : 'Comment posted');
    },
    onError: (error) => {
      console.error('Error with comment:', error);
      toast.error(isEditing ? 'Failed to update comment' : 'Failed to post comment');
    },
  });

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const removeExistingAttachment = (attachmentId: number) => {
    setAttachmentsToRemove((prev) => [...prev, attachmentId]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isPending) {
      const formData = new FormData();
      formData.append('content', value.trim());

      if (parentId && !isEditing) {
        formData.append('parentId', parentId.toString());
      }

      files.forEach((file) => {
        formData.append('files', file);
      });

      submitComment(formData);
    }
  };

  const getActionText = () => {
    if (isEditing) return 'Save Changes';
    if (isReply) return `Reply`;
    return 'Post Comment';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg bg-white">
      <div className="flex items-start gap-2">
        {isReply || isEditing ? null : <UserAvatar fullName={user?.fullName} avatarUrl={user?.avatarUrl} size="md" />}
        <div className="flex w-full flex-col gap-3">
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextChange}
              onFocus={() => setIsFocused(true)}
              placeholder={isReply ? `Write a reply...` : 'Write a comment...'}
              className={`focus:ring-primary-lighter w-full resize-none overflow-hidden rounded-md border border-gray-300 px-3 py-1 transition-all focus:ring-1 focus:outline-none ${
                isReply ? 'min-h-[30px] text-sm' : 'min-h-[38px]'
              }`}
              rows={1}
            />

            {/* Mention dropdown */}
            {showMentionDropdown && (
              <div
                ref={dropdownRef}
                className="fixed z-10 max-h-60 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg"
                style={{
                  top: `${mentionPosition.top}px`,
                  left: `${mentionPosition.left}px`,
                }}
              >
                {loadingMentions ? (
                  <div className="p-2 text-sm text-gray-500">Loading...</div>
                ) : mentionUsers && mentionUsers.items.length > 0 ? (
                  mentionUsers.items.map((user: User) => (
                    <div
                      key={user.id}
                      className="flex cursor-pointer items-center gap-2 p-2 hover:bg-gray-100"
                      onClick={() => handleSelectMention(user.username)}
                    >
                      <UserAvatar fullName={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
                      <div>
                        <div className="text-sm font-medium">{user.fullName}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No users found</div>
                )}
              </div>
            )}
          </div>

          {/* Show existing attachments that haven't been marked for removal */}
          {isEditing && existingAttachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {existingAttachments
                .filter((attachment) => !attachmentsToRemove.includes(attachment.id))
                .map((attachment) => (
                  <FilePreview
                    key={attachment.id}
                    fileName={attachment.originalName}
                    isImage={attachment.isImage}
                    onRemove={() => removeExistingAttachment(attachment.id)}
                  />
                ))}
            </div>
          )}

          {/* File attachment previews - always show if files exist */}
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <FilePreview
                  key={file.name}
                  fileName={file.name}
                  isImage={file.type.includes('image')}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          {/* Error messages - always show if there are errors */}
          {fileErrors && <p className="mt-1 text-xs text-red-600">{fileErrors}</p>}

          {/* File input and submit/cancel buttons */}
          <div
            className={`flex items-start justify-between transition-opacity duration-200 ${
              isFocused || value.trim().length > 0 ? 'opacity-100' : 'h-0 overflow-hidden opacity-0'
            }`}
          >
            {/* File input button - unchanged */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_COMMENT_FILES}
                className={`flex rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 ${
                  files.length >= MAX_COMMENT_FILES ? 'bg-gray-100' : 'cursor-pointer bg-white'
                }`}
              >
                <ImagePlus size={16} className="text-primary mr-2" />
                <p className="text-xs text-gray-500">Add Files</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Add Cancel button when editing */}
              {isEditing && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              )}

              <MainButton type="submit" variant="primary" isLoading={isPending} disabled={isPending || !value.trim()}>
                {getActionText()}
              </MainButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

CommentForm.displayName = 'CommentForm';

export default CommentForm;
