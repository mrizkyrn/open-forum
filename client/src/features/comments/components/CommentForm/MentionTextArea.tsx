import UserAvatar from '@/features/users/components/UserAvatar';
import { userApi } from '@/features/users/services';
import { User } from '@/features/users/types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  isReply?: boolean;
  initialFocus?: boolean;
}

const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  onFocus,
  isReply = false,
  initialFocus = false,
}) => {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0, placement: 'bottom' });
  const [cursorPosition, setCursorPosition] = useState(0);
  const debouncedMentionQuery = useDebounce(mentionQuery, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Constants for dropdown size and spacing
  const DROPDOWN_HEIGHT = 250; // Estimated max height
  const DROPDOWN_WIDTH = 256; // From w-64
  const SAFETY_MARGIN = 10; // Extra margin to avoid touching edges

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

  // Set initial focus if needed
  useEffect(() => {
    if (initialFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
        const length = value.length;
        textareaRef.current?.setSelectionRange(length, length);
        adjustTextareaHeight();
      }, 50);
    }
  }, [initialFocus, value]);

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);
    onChange(newValue);

    // Check if need to show mention dropdown
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);

      // Calculate position for dropdown
      if (textareaRef.current) {
        // Get the position of the textarea and the text before cursor
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

        // Calculate horizontal position
        let dropdownLeft = left + textWidth - mentionMatch[0].length + window.scrollX;

        // Ensure dropdown doesn't go off screen horizontally
        if (dropdownLeft + DROPDOWN_WIDTH > window.innerWidth) {
          dropdownLeft = window.innerWidth - DROPDOWN_WIDTH - SAFETY_MARGIN;
        }

        // Determine if should show dropdown above or below
        const viewportHeight = window.innerHeight;
        // Remove unused 'dropdownBottom' variable
        const spaceBelow = viewportHeight - (top + height);

        let dropdownTop;
        let placement;

        if (spaceBelow < DROPDOWN_HEIGHT + SAFETY_MARGIN && top > DROPDOWN_HEIGHT + SAFETY_MARGIN) {
          // Not enough space below, but enough space above, so place it above
          dropdownTop = top - DROPDOWN_HEIGHT + window.scrollY;
          placement = 'top';
        } else {
          // Default: place below
          dropdownTop = top + height + window.scrollY;
          placement = 'bottom';
        }

        setMentionPosition({
          top: dropdownTop,
          left: dropdownLeft,
          placement,
        });
      }

      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }

    adjustTextareaHeight();
  };

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
        const newCursorPos = startPos + username.length + 2;
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

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onFocus={onFocus}
        placeholder={isReply ? 'Reply...' : 'Write a comment...'}
        className={`focus:ring-primary-lighter w-full resize-none overflow-hidden rounded-md border border-gray-300 px-3 py-1 transition-all focus:ring-1 focus:outline-none ${
          isReply ? 'min-h-[30px] text-sm' : 'min-h-[38px]'
        }`}
        rows={1}
      />

      {/* Mention dropdown */}
      {showMentionDropdown && (
        <div
          ref={dropdownRef}
          className={`fixed z-10 max-h-60 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg ${
            mentionPosition.placement === 'top' ? 'origin-bottom' : 'origin-top'
          }`}
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
  );
};

export default MentionTextarea;
