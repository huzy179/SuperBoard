'use client';

const EMOJIS = ['👍', '🔥', '🚀', '👀', '💯', '✅', '❤️', '🙌'];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function EmojiReactionPicker({ onSelect, isOpen, onClose }: EmojiReactionPickerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute bottom-full mb-2 right-0 z-50 rounded-lg border border-surface-border bg-surface-card shadow-luxe p-1.5 flex gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="h-9 w-9 rounded-md border border-transparent hover:border-surface-border hover:bg-black/[0.03] transition-colors flex items-center justify-center text-lg"
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
