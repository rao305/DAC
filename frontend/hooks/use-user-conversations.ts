"use client";

import { useEffect, useState } from "react";
import {
  ConversationMetadata,
  subscribeToUserConversations,
} from "@/lib/firestore-conversations";

export function useUserConversations(userId?: string | null) {
  const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
  const [loading, setLoading] = useState(false); // Start with false - Firestore is optional

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToUserConversations(userId, (items) => {
      setConversations(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { conversations, loading };
}
