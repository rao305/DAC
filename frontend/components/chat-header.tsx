"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Settings,
  Share2,
  Trash2,
  Pin,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/icon-button";
import { useConversation, type ConversationSettings } from "@/hooks/use-conversation";
import { useAuth } from "@/components/auth/auth-provider";
import { updateConversationMetadata } from "@/lib/firestore-conversations";

interface ChatHeaderProps {
  conversationId: string;
  messageCount?: number;
}

type ConversationMode = "auto" | "single" | "collaborate";

// Available models for selection
const AVAILABLE_MODELS = [
  { id: "gpt-4", provider: "openai", label: "GPT-4" },
  { id: "claude-3-5-sonnet", provider: "anthropic", label: "Claude 3.5 Sonnet" },
  { id: "gemini-2.0-flash", provider: "google", label: "Gemini 2.0 Flash" },
  { id: "sonar", provider: "perplexity", label: "Perplexity Sonar" },
];

const ModeSelector: React.FC<{
  mode: ConversationMode;
  onChange: (mode: ConversationMode) => void;
}> = ({ mode, onChange }) => {
  const modes: ConversationMode[] = ["auto", "single", "collaborate"];
  const modeLabels = {
    auto: "Auto",
    single: "Single",
    collaborate: "Collab",
  };

  return (
    <div className="inline-flex items-center rounded-full border border-[#1f2937] bg-[#020617] p-0.5 text-[11px]">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "px-2.5 py-0.5 rounded-full transition",
            mode === m
              ? "bg-slate-100 text-slate-950"
              : "text-slate-300 hover:bg-[#050b16]"
          )}
        >
          {modeLabels[m]}
        </button>
      ))}
    </div>
  );
};

const ModelPill: React.FC<{
  model: { id: string; provider: string; label: string };
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}> = ({ model, active = true, onClick, onRemove }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-0.5 rounded-full text-[11px] border flex items-center gap-1 transition",
        active
          ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
          : "border-[#1f2937] text-slate-300 hover:bg-[#020617]"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <span className="truncate max-w-[90px]">{model.label}</span>
      {onRemove && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-red-300"
        >
          ×
        </span>
      )}
    </button>
  );
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationId,
  messageCount = 0,
}) => {
  const router = useRouter();
  const { conversation, updateTitle, updateSettings } =
    useConversation(conversationId);
  const { user } = useAuth();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);

  const mode: ConversationMode =
    (conversation?.settings?.mode as ConversationMode) || "auto";
  const primaryModel = conversation?.settings?.primaryModel;
  const models = conversation?.settings?.models || [];

  useEffect(() => {
    if (conversation?.title) {
      setTitleValue(conversation.title);
    }
  }, [conversation?.title]);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (titleValue !== conversation?.title && titleValue.trim()) {
      try {
        await updateTitle(titleValue);
        if (user?.uid) {
          await updateConversationMetadata(user.uid, conversationId, {
            title: titleValue.trim(),
          });
        }
      } catch (error) {
        console.error("Failed to update title:", error);
        setTitleValue(conversation?.title || "");
      }
    }
  };

  const handleModeChange = async (newMode: ConversationMode) => {
    try {
      await updateSettings({ mode: newMode });
    } catch (error) {
      console.error("Failed to update mode:", error);
    }
  };

  const handleTogglePin = async () => {
    try {
      await updateSettings({ pinned: !conversation?.pinned });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      // TODO: Implement delete endpoint
      router.push("/conversations");
    }
  };

  const handleAddModel = async (model: typeof AVAILABLE_MODELS[0]) => {
    try {
      const existingModels = conversation?.settings?.models || [];
      const newModels = [...existingModels, model];
      await updateSettings({ models: newModels });
      setShowModelPicker(false);
    } catch (error) {
      console.error("Failed to add model:", error);
    }
  };

  const handleRemoveModel = async (modelId: string) => {
    try {
      const existingModels = conversation?.settings?.models || [];
      const newModels = existingModels.filter((m) => m.id !== modelId);
      await updateSettings({ models: newModels });
    } catch (error) {
      console.error("Failed to remove model:", error);
    }
  };

  const handleSelectPrimaryModel = async (model: typeof AVAILABLE_MODELS[0]) => {
    try {
      await updateSettings({ primaryModel: model });
      setShowModelPicker(false);
    } catch (error) {
      console.error("Failed to update primary model:", error);
    }
  };

  const relativeTime = conversation?.updated_at
    ? formatDistanceToNow(new Date(conversation.updated_at), {
        addSuffix: true,
      })
    : null;

  if (!conversation) {
    return (
      <header className="h-14 border-b border-[#111827] flex items-center px-6">
        <div className="h-4 w-48 bg-[#0a0d12] animate-pulse rounded" />
      </header>
    );
  }

  return (
    <header className="h-14 border-b border-[#111827] flex items-center justify-between px-6 gap-4 shrink-0">
      {/* Left: title + meta */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <input
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onFocus={() => setIsEditingTitle(true)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="Untitled conversation"
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-100 truncate max-w-[300px]"
          />
          {conversation.pinned && (
            <Pin className="w-3 h-3 text-emerald-400 fill-emerald-400" />
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          {relativeTime && <span>Last updated {relativeTime}</span>}
          {messageCount > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>{messageCount} messages</span>
            </>
          )}
        </div>
      </div>

      {/* Center: mode + model pills */}
      <div className="flex flex-col items-center gap-1.5">
        <ModeSelector mode={mode} onChange={handleModeChange} />

        {/* Model pills based on mode */}
        <div className="flex items-center gap-1">
          {mode === "auto" && (
            <div className="text-[11px] text-slate-400 px-2 py-0.5">
              Smart routing • 4+ models
            </div>
          )}

          {mode === "single" && (
            <div className="relative">
              <ModelPill
                model={
                  primaryModel || {
                    id: "auto",
                    provider: "auto",
                    label: "Auto-select",
                  }
                }
                onClick={() => setShowModelPicker(!showModelPicker)}
              />
              {showModelPicker && (
                <div className="absolute top-full mt-1 left-0 bg-[#0a0d12] border border-[#1f2937] rounded-lg shadow-xl z-50 min-w-[160px]">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectPrimaryModel(model)}
                      className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#050b16] first:rounded-t-lg last:rounded-b-lg"
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === "collaborate" && (
            <>
              {models.map((model) => (
                <ModelPill
                  key={model.id}
                  model={model}
                  onRemove={() => handleRemoveModel(model.id)}
                />
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowModelPicker(!showModelPicker)}
                  className="px-2 py-0.5 rounded-full text-[11px] border border-dashed border-[#1f2937] text-slate-400 hover:border-slate-500 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
                {showModelPicker && (
                  <div className="absolute top-full mt-1 left-0 bg-[#0a0d12] border border-[#1f2937] rounded-lg shadow-xl z-50 min-w-[160px]">
                    {AVAILABLE_MODELS.filter(
                      (m) => !models.find((existing) => existing.id === m.id)
                    ).map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleAddModel(model)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-[#050b16] first:rounded-t-lg last:rounded-b-lg"
                      >
                        {model.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {mode === "collaborate" && models.length > 0 && (
          <div className="text-[10px] text-slate-500">
            {models.length} models collaborating • Unified answer
          </div>
        )}
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-1">
        <IconButton tooltip="Pin conversation" onClick={handleTogglePin}>
          <Pin
            className={cn(
              "w-4 h-4",
              conversation.pinned && "fill-emerald-400 text-emerald-400"
            )}
          />
        </IconButton>
        <IconButton tooltip="Share">
          <Share2 className="w-4 h-4" />
        </IconButton>
        <IconButton tooltip="Settings">
          <Settings className="w-4 h-4" />
        </IconButton>
        <IconButton tooltip="Delete" variant="ghost-danger" onClick={handleDelete}>
          <Trash2 className="w-4 h-4" />
        </IconButton>
      </div>
    </header>
  );
};
