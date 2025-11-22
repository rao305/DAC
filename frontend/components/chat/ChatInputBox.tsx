"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Paperclip,
  Search,
  ChevronDown,
  ArrowUp,
  Sparkles,
} from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import { getModelById, ModelId } from "./modelOptions";

interface ChatInputBoxProps {
  onSubmit: (message: string) => void;
  currentModelId: ModelId;
  onModelChange: (modelId: ModelId) => void;
  isSending?: boolean;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const ChatInputBox: React.FC<ChatInputBoxProps> = ({
  onSubmit,
  currentModelId,
  onModelChange,
  isSending = false,
  disabled = false,
  value: externalValue,
  onChange: externalOnChange,
}) => {
  const [internalValue, setInternalValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const modelAnchorRef = useRef<HTMLDivElement | null>(null);
  const [anchorWidth, setAnchorWidth] = useState<number | undefined>();

  const model = getModelById(currentModelId);
  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;

  useEffect(() => {
    if (modelAnchorRef.current) {
      setAnchorWidth(modelAnchorRef.current.offsetWidth);
    }
  }, [modelAnchorRef.current, model.name]);

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

  return (
    <div className="w-full">
      <div className="relative max-w-4xl mx-auto">
        <div
          className={[
            "relative flex items-center rounded-3xl",
            "border border-[#565869] bg-[#2f2f2f]",
            "px-4 py-3",
            "shadow-lg",
            isFocused ? "border-[#666]" : "border-[#565869]",
            disabled ? "opacity-50" : "",
          ].join(" ")}
        >
          {/* Attachment button */}
          <button
            type="button"
            disabled={disabled}
            className="mr-3 p-1 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Text area */}
          <textarea
            rows={1}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            placeholder="How can I help you today?"
            className="flex-1 resize-none bg-transparent outline-none text-[16px] leading-[24px] text-white placeholder:text-[#9ca3af] min-h-[24px] max-h-32 disabled:cursor-not-allowed"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
            }}
          />

          {/* Model selector */}
          <div ref={modelAnchorRef} className="relative mr-3">
            <button
              type="button"
              onClick={() => setIsModelOpen((v) => !v)}
              disabled={disabled}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-gray-400">GPT-OSS 20B</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            <ModelSelector
              isOpen={isModelOpen}
              onClose={() => setIsModelOpen(false)}
              anchorWidth={anchorWidth}
              currentModelId={currentModelId}
              onModelChange={onModelChange}
            />
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim() || isSending || disabled}
            className="p-2 rounded-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-500 disabled:text-gray-300 transition-colors"
          >
            {isSending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-gray-300 border-t-black rounded-full"
              />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};