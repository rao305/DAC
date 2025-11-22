"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip,
  ChevronDown,
  ArrowUp,
} from "lucide-react";

interface RectangularChatInputProps {
  onSubmit: (message: string) => void;
  isSending?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export const RectangularChatInput: React.FC<RectangularChatInputProps> = ({
  onSubmit,
  isSending = false,
  disabled = false,
  value: externalValue,
  onChange: externalOnChange,
  placeholder = "How can I help you today?",
}) => {
  const [internalValue, setInternalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    if (isControlled) {
      externalOnChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || disabled) return;
    onSubmit(trimmed);
    if (!isControlled) {
      setInternalValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getContainerClasses = () => {
    let classes = "relative flex items-end rounded-3xl border-2 transition-all duration-200 bg-white dark:bg-gray-900 shadow-lg min-h-14";
    
    if (isFocused) {
      classes += " border-blue-500 shadow-blue-200 dark:shadow-blue-900";
    } else {
      classes += " border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500";
    }
    
    if (disabled) {
      classes += " opacity-50";
    }
    
    return classes;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={getContainerClasses()}
        >
          <div className="flex items-center pl-4">
            <button
              type="button"
              disabled={disabled}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
            </button>
          </div>

          <div className="flex-1 px-3 py-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isSending}
              placeholder={placeholder}
              className="w-full resize-none bg-transparent outline-none text-base leading-6 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 min-h-6 max-h-32 disabled:cursor-not-allowed overflow-y-auto"
            />
          </div>

          <div className="flex items-center gap-2 pr-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                GPT-OSS 20B
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>

            <AnimatePresence>
              {value.trim() && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={handleSubmit}
                  disabled={!value.trim() || isSending || disabled}
                  className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <ArrowUp className="h-5 w-5 text-white" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence>
          {isFocused && !value && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
            >
              <div className="flex flex-wrap gap-2">
                {[
                  "✨ Help me brainstorm ideas",
                  "📊 Analyze this data", 
                  "✍️ Write a professional email",
                  "🔍 Explain this concept",
                ].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleChange(suggestion.split(' ').slice(1).join(' '))}
                    className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};