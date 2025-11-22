"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";

export interface ConversationSettings {
  mode?: "auto" | "single" | "collaborate";
  primaryModel?: {
    id: string;
    provider: string;
    label: string;
  };
  models?: {
    id: string;
    provider: string;
    label: string;
    weight?: number;
  }[];
  temperature?: number;
}

export interface Conversation {
  id: string;
  title: string | null;
  last_message_preview: string | null;
  last_provider: string | null;
  last_model: string | null;
  created_at: string;
  updated_at: string | null;
  pinned: boolean;
  settings: ConversationSettings | null;
}

interface UseConversationReturn {
  conversation: Conversation | null;
  isLoading: boolean;
  error: Error | null;
  updateTitle: (title: string) => Promise<void>;
  updateSettings: (settings: Partial<ConversationSettings> & { pinned?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_ORG_ID = "org_demo";

export function useConversation(
  conversationId: string | undefined,
  explicitOrgId?: string
): UseConversationReturn {
  const { orgId: authOrgId } = useAuth();
  const orgId = explicitOrgId || authOrgId || DEFAULT_ORG_ID;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!conversationId) {
      setConversation(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch from threads list instead of individual endpoint
      const response = await apiFetch("/threads?limit=50", orgId);
      const threads = await response.json();

      // Find the specific thread
      const thread = threads.find((t: Conversation) => t.id === conversationId);

      if (thread) {
        setConversation(thread);
      } else {
        setError(new Error("Conversation not found"));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch conversation"));
      console.error("Failed to fetch conversation:", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, orgId]);

  const updateTitle = useCallback(
    async (title: string) => {
      if (!conversationId) return;

      try {
        await apiFetch(`/threads/${conversationId}`, orgId, {
          method: "PATCH",
          body: JSON.stringify({ title }),
        });

        // Update local state
        setConversation((prev) =>
          prev ? { ...prev, title } : null
        );
      } catch (err) {
        console.error("Failed to update title:", err);
        throw err;
      }
    },
    [conversationId, orgId]
  );

  const updateSettings = useCallback(
    async (updates: Partial<ConversationSettings> & { pinned?: boolean }) => {
      if (!conversationId) return;

      try {
        const payload: Record<string, any> = {};

        if (updates.mode !== undefined) payload.mode = updates.mode;
        if (updates.primaryModel !== undefined) payload.primary_model = updates.primaryModel;
        if (updates.models !== undefined) payload.models = updates.models;
        if (updates.temperature !== undefined) payload.temperature = updates.temperature;
        if (updates.pinned !== undefined) payload.pinned = updates.pinned;

        const response = await apiFetch(`/threads/${conversationId}/settings`, orgId, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Update local state
        setConversation((prev) =>
          prev
            ? {
                ...prev,
                settings: data.settings,
                pinned: data.pinned !== undefined ? data.pinned : prev.pinned,
              }
            : null
        );
      } catch (err) {
        console.error("Failed to update settings:", err);
        throw err;
      }
    },
    [conversationId, orgId]
  );

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  return {
    conversation,
    isLoading,
    error,
    updateTitle,
    updateSettings,
    refresh: fetchConversation,
  };
}
