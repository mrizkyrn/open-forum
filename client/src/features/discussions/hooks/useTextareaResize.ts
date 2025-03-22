import { RefObject, useCallback } from 'react';

export function useTextareaResize(textareaRef: RefObject<HTMLTextAreaElement>) {
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Store cursor position
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    // Adjust height
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    // Restore cursor position
    if (document.activeElement === textarea) {
      textarea.selectionStart = selectionStart;
      textarea.selectionEnd = selectionEnd;
    }
  }, [textareaRef]);

  return { adjustTextareaHeight };
}
