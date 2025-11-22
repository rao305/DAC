"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/auth/auth-provider";
import { ensureConversationMetadata } from "@/lib/firestore-conversations";

export interface Thread {
  id: string;
  title: string | null;
  last_message_preview: string | null;
  last_provider: string | null;
  last_model: string | null;
  created_at: string;
  updated_at: string | null;
}

interface UseThreadsReturn {
  threads: Thread[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => Promise<void>;
  createThread: (params?: {
    title?: string;
    description?: string;
    user_id?: string;
  }) => Promise<{ thread_id: string; created_at: string }>;
}

const DEFAULT_ORG_ID = "org_demo";

export function useThreads(explicitOrgId?: string): UseThreadsReturn {
  const { orgId: authOrgId, user } = useAuth();
  const orgId = explicitOrgId || authOrgId || DEFAULT_ORG_ID;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiFetch("/threads?limit=50", orgId);
      const data = await response.json();
      setThreads(data);

      // Removed bulk Firestore sync - it was causing slow page loads
      // Individual threads will sync on-demand when needed
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch threads"));
      console.error("Failed to fetch threads:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  const createThread = useCallback(
    async (params?: {
      title?: string;
      description?: string;
      user_id?: string;
    }) => {
      const response = await apiFetch("/threads/", orgId, {
        method: "POST",
        body: JSON.stringify(params || {}),
      });
      const data = await response.json();

      // Try to sync to Firestore asynchronously without blocking
      if (user?.uid && data?.thread_id) {
        // Fire and forget - don't wait for Firestore sync
        ensureConversationMetadata(user.uid, data.thread_id, {
          title: params?.title || "New conversation",
          lastMessagePreview: "",
        }).catch((firestoreError) => {
          console.warn("Failed to sync thread to Firestore:", firestoreError);
        });
      }

      // Don't refresh threads list - it's expensive and unnecessary
      // The sidebar will update via its own subscription or when navigating back

      return data;
    },
    [orgId, user?.uid]
  );

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    threads,
    isLoading,
    error,
    mutate: fetchThreads,
    createThread,
  };
}
