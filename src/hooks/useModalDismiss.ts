import React, { useEffect, useRef, useCallback } from 'react';

// Global modal stack for nested escape key handling
const modalStack: { id: string; close: () => void }[] = [];

let isGlobalEscapeAttached = false;

function ensureGlobalEscapeListener() {
  if (isGlobalEscapeAttached) return;
  isGlobalEscapeAttached = true;

  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalStack.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          const top = modalStack[modalStack.length - 1];
          if (top && typeof top.close === 'function') {
            top.close();
          }
        }
      }
    },
    true // capture phase so top modal gets it first
  );
}

export function notifySectionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('applet:section-change'));
  }
}

export interface UseModalDismissOptions {
  isOpen: boolean;
  onClose: () => void;
  isDirty?: boolean | (() => boolean);
  confirmMessage?: string;
  dirtyMessage?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  onCleanup?: () => void;
}

export interface UseModalDismissReturn {
  handleClose: () => void;
  handleBackdropClick: (e: React.MouseEvent) => void;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}

export function useModalDismiss({
  isOpen,
  onClose,
  isDirty = false,
  confirmMessage = '¿Deseas descartar los cambios sin guardar?',
  dirtyMessage,
  closeOnBackdrop = true,
  closeOnEscape = true,
  onCleanup,
}: UseModalDismissOptions): UseModalDismissReturn {
  const idRef = useRef<string>(`modal-${Math.random().toString(36).substring(2, 9)}`);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const onCleanupRef = useRef(onCleanup);
  onCleanupRef.current = onCleanup;

  const activeMessage = dirtyMessage || confirmMessage;
  const confirmMessageRef = useRef(activeMessage);
  confirmMessageRef.current = activeMessage;

  // Track previous focused element when modal opens & lock/unlock body scroll
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement instanceof HTMLElement) {
        previousActiveElementRef.current = document.activeElement;
      }
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Main close function with dirty check & cleanup
  const handleClose = useCallback(() => {
    const dirty =
      typeof isDirtyRef.current === 'function'
        ? isDirtyRef.current()
        : Boolean(isDirtyRef.current);

    if (dirty) {
      let confirmDiscard = true;
      try {
        confirmDiscard = window.confirm(confirmMessageRef.current);
      } catch {
        confirmDiscard = true;
      }
      if (!confirmDiscard) {
        return;
      }
    }

    // Run custom cleanup (stop camera, clear timers, clear errors, etc.)
    if (onCleanupRef.current) {
      try {
        onCleanupRef.current();
      } catch (err) {
        console.error('Error executing modal cleanup callback:', err);
      }
    }

    // Ensure body scroll is unlocked
    document.body.style.overflow = '';

    // Invoke close
    onCloseRef.current();

    // Restore focus to opener element
    if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
      setTimeout(() => {
        try {
          previousActiveElementRef.current?.focus();
        } catch {
          // ignore focus errors
        }
      }, 50);
    }
  }, []);

  // Listen for section navigation changes to dismiss modal cleanly
  useEffect(() => {
    if (!isOpen) return;

    const handleSectionChange = () => {
      if (onCleanupRef.current) {
        try {
          onCleanupRef.current();
        } catch (err) {
          console.error('Error executing section change cleanup:', err);
        }
      }
      document.body.style.overflow = '';
      onCloseRef.current();
    };

    window.addEventListener('applet:section-change', handleSectionChange);
    return () => {
      window.removeEventListener('applet:section-change', handleSectionChange);
    };
  }, [isOpen]);

  // Register in global modal stack for Escape key
  useEffect(() => {
    ensureGlobalEscapeListener();

    if (isOpen && closeOnEscape) {
      const id = idRef.current;
      modalStack.push({ id, close: handleClose });

      return () => {
        const index = modalStack.findIndex((item) => item.id === id);
        if (index !== -1) {
          modalStack.splice(index, 1);
        }
      };
    }
  }, [isOpen, closeOnEscape, handleClose]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (!closeOnBackdrop) return;
      if (e.target === e.currentTarget) {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    },
    [closeOnBackdrop, handleClose]
  );

  return {
    handleClose,
    handleBackdropClick,
    dialogRef,
  };
}
