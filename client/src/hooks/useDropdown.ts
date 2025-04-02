import { RefObject, useState } from 'react';
import { useOnClickOutside } from './useOnClickOutside';

export function useDropdown(ref: RefObject<HTMLElement>) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useOnClickOutside(ref, close);

  return { isOpen, toggle, open, close };
}
