"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Plus, Sparkles, MoreHorizontal, Pencil, Trash2, PanelLeftClose, PanelLeft, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Thread {
  id: string;
  title: string | null;
  last_message_preview: string | null;
  last_provider: string | null;
  last_model: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ChatSidebarProps {
  threads: Thread[];
  activeId?: string;
  onNewChat: () => void;
  isLoading?: boolean;
  onRenameChat?: (threadId: string, newTitle: string) => Promise<void>;
  onDeleteChat?: (threadId: string) => Promise<void>;
  onDeleteAllChats?: () => Promise<void>;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const getProviderDisplayName = (provider: string | null): string => {
  if (!provider) return "";
  const names: Record<string, string> = {
    openai: "ChatGPT",
    gemini: "Gemini",
    perplexity: "Perplexity",
    openrouter: "OpenRouter",
    kimi: "Kimi",
  };
  return names[provider] || provider;
};

const getModelDisplayName = (model: string | null): string => {
  if (!model) return "";
  // Shorten model names for display
  if (model.includes("gpt-4")) return "GPT-4";
  if (model.includes("gpt-3.5")) return "GPT-3.5";
  if (model.includes("claude-3.5-sonnet")) return "Claude 3.5 Sonnet";
  if (model.includes("claude")) return "Claude";
  if (model.includes("gemini-2.0")) return "Gemini 2.0";
  if (model.includes("gemini-1.5")) return "Gemini 1.5";
  if (model.includes("sonar")) return "Sonar";
  return model;
};

const ConversationListItem: React.FC<{
  thread: Thread;
  active: boolean;
  onClick: () => void;
  onRename?: (threadId: string, newTitle: string) => Promise<void>;
  onDelete?: (threadId: string) => Promise<void>;
}> = ({ thread, active, onClick, onRename, onDelete }) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showRenameDialog, setShowRenameDialog] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const title = thread.title || thread.last_message_preview || "New conversation";
  const relativeTime = thread.updated_at
    ? formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })
    : formatDistanceToNow(new Date(thread.created_at), { addSuffix: true });

  const primaryModel = getModelDisplayName(thread.last_model);
  const subtitle = primaryModel
    ? `${relativeTime} • ${primaryModel}`
    : relativeTime;

  const handleRename = async () => {
    if (!onRename || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      await onRename(thread.id, renameValue.trim());
      setShowRenameDialog(false);
    } catch (error) {
      console.error("Failed to rename chat:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(thread.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "w-full text-left px-3 py-2 rounded-xl mb-1 transition",
          "flex items-center gap-2 group",
          active
            ? "bg-[#0f172a] border border-[#1f2937]"
            : "hover:bg-[#050b16] border border-transparent"
        )}
      >
        <button onClick={onClick} className="flex-1 flex flex-col gap-0.5 min-w-0">
          <span className="text-[13px] font-medium truncate text-slate-100">
            {title}
          </span>
          <span className="text-[11px] text-slate-500 truncate">{subtitle}</span>
        </button>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center",
                "hover:bg-[#1f2937] transition opacity-0 group-hover:opacity-100",
                active && "opacity-100"
              )}
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setRenameValue(title);
                setShowRenameDialog(true);
              }}
              className="cursor-pointer"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="cursor-pointer text-red-400 focus:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Conversation name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={isRenaming || !renameValue.trim()}>
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{title}" and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  threads,
  activeId,
  onNewChat,
  isLoading = false,
  onRenameChat,
  onDeleteChat,
  onDeleteAllChats,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const router = useRouter();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);

  const handleThreadClick = (threadId: string) => {
    router.push(`/conversations/${threadId}`);
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAllChats) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllChats();
      setShowDeleteAllDialog(false);
    } catch (error) {
      console.error("Failed to delete all chats:", error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 border-r border-[#1b1f2a] bg-[#050910] flex flex-col h-full overflow-hidden">
        <div className="h-14 px-2 py-3 flex items-center justify-center border-b border-[#1b1f2a]">
          <button
            onClick={onToggleCollapse}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#0f172a] transition"
          >
            <PanelLeft className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[300px] border-r border-[#1b1f2a] bg-[#050910] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 px-4 py-3 flex items-center gap-2 border-b border-[#1b1f2a]">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[14px] font-bold text-slate-100">Syntra</span>
          <span className="text-[11px] text-slate-500">Multi-LLM Assistant</span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[#0f172a] transition"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNewChat}
          className={cn(
            "w-full h-10 rounded-xl text-sm font-medium",
            "border border-[#1f2937] bg-[#020617]",
            "hover:bg-[#020617]/90 transition",
            "flex items-center justify-center gap-2",
            "text-slate-100"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>New chat</span>
        </button>
      </div>

      {/* Recent Section */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
          Recent
        </p>
        {threads.length > 0 && onDeleteAllChats && (
          <button
            onClick={() => setShowDeleteAllDialog(true)}
            className="text-[11px] text-slate-500 hover:text-red-400 transition flex items-center gap-1"
            title="Delete all chats"
          >
            <Trash className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-1">
        {isLoading ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-full h-14 rounded-xl bg-[#050b16] animate-pulse"
              />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <div className="px-3 py-8 text-center text-slate-500 text-sm">
            No conversations yet.
            <br />
            Start a new chat to begin.
          </div>
        ) : (
          threads.map((thread) => (
            <ConversationListItem
              key={thread.id}
              thread={thread}
              active={thread.id === activeId}
              onClick={() => handleThreadClick(thread.id)}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
            />
          ))
        )}
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all conversations?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {threads.length} conversation{threads.length !== 1 ? 's' : ''} and their messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingAll ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
