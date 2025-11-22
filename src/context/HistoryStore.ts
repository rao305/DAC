/**
 * HistoryStore: Manages conversation history per session
 * 
 * For now, uses in-memory Map. Can be swapped to Redis/DB later.
 */

import { Message, ConversationHistory } from "../types";

export class HistoryStore {
  private store: Map<string, ConversationHistory> = new Map();

  /**
   * Append a message to a conversation history
   */
  appendMessage(
    sessionId: string,
    message: Message,
    userId?: string
  ): void {
    let history = this.store.get(sessionId);

    if (!history) {
      history = {
        sessionId,
        userId,
        messages: [],
      };
      this.store.set(sessionId, history);
    }

    // Update userId if provided
    if (userId) {
      history.userId = userId;
    }

    history.messages.push(message);
  }

  /**
   * Get recent messages (last N messages)
   */
  getRecentMessages(sessionId: string, limit: number = 20): Message[] {
    const history = this.store.get(sessionId);
    if (!history) {
      return [];
    }

    const messages = history.messages;

    // Always return a shallow copy so callers don't accidentally observe
    // future mutations to the underlying history array.
    // If there are fewer than `limit` messages, return all of them.
    if (messages.length <= limit) {
      return messages.slice();
    }

    // Return the last N messages
    return messages.slice(-limit);
  }

  /**
   * Get full conversation history (for debugging or summarization)
   */
  getFullHistory(sessionId: string): Message[] {
    const history = this.store.get(sessionId);
    return history?.messages || [];
  }

  /**
   * Get conversation metadata
   */
  getConversation(sessionId: string): ConversationHistory | undefined {
    return this.store.get(sessionId);
  }

  /**
   * Clear history for a session (useful for testing or reset)
   */
  clearHistory(sessionId: string): void {
    this.store.delete(sessionId);
  }

  /**
   * Check if a session exists
   */
  hasSession(sessionId: string): boolean {
    return this.store.has(sessionId);
  }
}

// Singleton instance
export const historyStore = new HistoryStore();

