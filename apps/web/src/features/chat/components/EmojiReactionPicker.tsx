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
            className="absolute bottom-full mb-2 right-0 z-50 p-2 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex gap-1"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onSelect(emoji);
                  onClose();
                }}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-all hover:scale-125 hover:-translate-y-1 active:scale-95"
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
