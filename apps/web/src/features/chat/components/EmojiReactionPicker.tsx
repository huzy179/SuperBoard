'use client';

import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['👍', '🔥', '🚀', '👀', '💯', '✅', '❤️', '🙌'];

interface EmojiReactionPickerProps {
  onSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function EmojiReactionPicker({ onSelect, isOpen, onClose }: EmojiReactionPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full mb-2 right-0 z-50 p-1.5 bg-slate-950/95 border border-white/10 rounded-sm shadow-luxe backdrop-blur-3xl flex gap-0.5"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="w-9 h-9 flex items-center justify-center text-lg hover:bg-white/[0.05] rounded-xs transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-white/5"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
