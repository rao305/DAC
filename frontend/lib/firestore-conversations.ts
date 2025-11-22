"use client";

import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  Unsubscribe,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface ConversationMetadata {
  id: string;
  title: string;
  lastMessagePreview: string | null;
  lastProvider?: string | null;
  lastModel?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export function subscribeToUserConversations(
  userId: string,
  handler: (conversations: ConversationMetadata[]) => void
): Unsubscribe {
  if (typeof window === "undefined" || !db) {
    handler([]);
    return () => {};
  }

  const conversationsRef = collection(db, "users", userId, "conversations");
  const q = query(conversationsRef, orderBy("updatedAt", "desc"));

  // Immediately return empty array to avoid blocking UI
  handler([]);

  // Set a much shorter timeout - Firestore data is optional
  const timeoutId = setTimeout(() => {
    console.warn("Firestore subscription timed out, using backend data only");
  }, 1000);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      clearTimeout(timeoutId);
      const items: ConversationMetadata[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<ConversationMetadata, "id">;
        items.push({
          id: docSnap.id,
          title: data.title || "Untitled conversation",
          lastMessagePreview: data.lastMessagePreview || null,
          lastProvider: data.lastProvider,
          lastModel: data.lastModel,
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
        });
      });
      handler(items);
    },
    (error) => {
      clearTimeout(timeoutId);
      console.warn("Firestore subscription error:", error);
      // Don't call handler again on error - keep the initial empty array
    }
  );

  return () => {
    clearTimeout(timeoutId);
    unsubscribe();
  };
}

export async function ensureConversationMetadata(
  userId: string,
  conversationId: string,
  data: Partial<Omit<ConversationMetadata, "id">>
) {
  if (!userId || !conversationId || typeof window === "undefined" || !db) return;

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Firestore timeout")), 3000);
    });

    const conversationRef = doc(db, "users", userId, "conversations", conversationId);
    const writePromise = setDoc(
      conversationRef,
      {
        title: data.title ?? "New conversation",
        lastMessagePreview: data.lastMessagePreview ?? "",
        lastProvider: data.lastProvider ?? null,
        lastModel: data.lastModel ?? null,
        createdAt: data.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await Promise.race([writePromise, timeoutPromise]);
  } catch (error: any) {
    // Silently fail - don't block the app
    if (error?.message?.includes("timeout")) {
      console.warn("Firestore sync timed out (database may not be created)");
    } else {
      console.warn("Failed to ensure conversation metadata", error);
    }
  }
}

export async function updateConversationMetadata(
  userId: string,
  conversationId: string,
  data: Partial<Omit<ConversationMetadata, "id">>
) {
  if (!userId || !conversationId || typeof window === "undefined" || !db) return;
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Firestore timeout")), 3000);
    });

    const conversationRef = doc(db, "users", userId, "conversations", conversationId);
    const writePromise = setDoc(
      conversationRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await Promise.race([writePromise, timeoutPromise]);
  } catch (error: any) {
    // Silently fail - don't block the app
    if (error?.message?.includes("timeout")) {
      console.warn("Firestore sync timed out");
    } else {
      console.warn("Failed to update conversation metadata", error);
    }
  }
}

export async function getConversationMetadata(
  userId: string,
  conversationId: string
): Promise<ConversationMetadata | null> {
  if (!userId || !conversationId || typeof window === "undefined" || !db) {
    return null;
  }
  try {
    const ref = doc(db, "users", userId, "conversations", conversationId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as Omit<ConversationMetadata, "id">;
    return {
      id: snapshot.id,
      title: data.title || "Untitled conversation",
      lastMessagePreview: data.lastMessagePreview || null,
      lastProvider: data.lastProvider,
      lastModel: data.lastModel,
      createdAt: data.createdAt || null,
      updatedAt: data.updatedAt || null,
    };
  } catch (error: any) {
    if (error?.code === "unavailable" || error?.message?.includes("offline")) {
      console.warn("Firestore offline; skipping metadata fetch");
      return null;
    }
    console.warn("Failed to fetch conversation metadata", error);
    return null;
  }
}

export async function deleteConversation(
  userId: string,
  conversationId: string
) {
  if (!userId || !conversationId || typeof window === "undefined" || !db) {
    // If Firestore is not available, just return successfully
    // The conversation will be deleted from local state
    return;
  }
  try {
    // Add timeout to prevent hanging (5 seconds for delete)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Firestore timeout")), 5000);
    });

    const conversationRef = doc(db, "users", userId, "conversations", conversationId);
    const deletePromise = deleteDoc(conversationRef);

    await Promise.race([deletePromise, timeoutPromise]);
  } catch (error: any) {
    // Silently handle Firestore errors for delete operations
    // The conversation will still be removed from local state
    if (error?.message?.includes("timeout")) {
      console.warn("Firestore delete timed out - conversation removed from local state");
      return;
    }
    if (error?.code === "unavailable" || error?.code === "permission-denied") {
      console.warn("Firestore unavailable for delete - conversation removed from local state");
      return;
    }
    // For other errors, log but don't throw
    console.warn("Failed to delete conversation from Firestore:", error);
  }
}

export async function deleteAllConversations(
  userId: string,
  conversationIds: string[]
) {
  if (!userId || !conversationIds.length || typeof window === "undefined" || !db) {
    // If Firestore is not available, just return successfully
    return;
  }

  try {
    // Delete all conversations in parallel
    const deletePromises = conversationIds.map(async (conversationId) => {
      try {
        const conversationRef = doc(db, "users", userId, "conversations", conversationId);
        await deleteDoc(conversationRef);
      } catch (error) {
        console.warn(`Failed to delete conversation ${conversationId}:`, error);
        // Continue with other deletions
      }
    });

    // Add timeout for the entire batch operation (10 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Firestore timeout")), 10000);
    });

    await Promise.race([Promise.all(deletePromises), timeoutPromise]);
  } catch (error: any) {
    // Silently handle Firestore errors for delete operations
    if (error?.message?.includes("timeout")) {
      console.warn("Firestore delete all timed out - conversations removed from local state");
      return;
    }
    console.warn("Failed to delete all conversations from Firestore:", error);
  }
}
