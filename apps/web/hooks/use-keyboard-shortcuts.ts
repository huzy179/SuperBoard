'use client';

import { useEffect, useCallback } from 'react';

type ShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: ShortcutHandler;
  enableInInput?: boolean; // allow in text inputs
}

const MOD_KEY =
  typeof navigator !== 'undefined' && /Mac/.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handler = useCallback(
    (event: KeyboardEvent) => {
      const isInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable);

      for (const shortcut of shortcuts) {
        const modKey = MOD_KEY === 'metaKey' ? event.metaKey : event.ctrlKey;
        const needsMod = shortcut.metaKey || shortcut.ctrlKey;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const modMatch = needsMod ? modKey : !modKey;
        const shiftMatch = (shortcut.shiftKey ?? false) === event.shiftKey;
        const altMatch = (shortcut.altKey ?? false) === event.altKey;

        if (keyMatch && modMatch && shiftMatch && altMatch) {
          if (!isInput || shortcut.enableInInput) {
            event.preventDefault();
            shortcut.handler(event);
            return;
          }
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
