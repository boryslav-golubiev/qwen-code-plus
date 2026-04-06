/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { StreamingState } from '../types.js';
import type { Part, PartListUnion } from '@google/genai';

export interface UseMessageQueueOptions {
  isConfigInitialized: boolean;
  streamingState: StreamingState;
  submitQuery: (query: PartListUnion) => void;
}

export interface UseMessageQueueReturn {
  messageQueue: PartListUnion[];
  addMessage: (message: PartListUnion) => void;
  clearQueue: () => void;
  getQueuedMessagesText: () => string;
}

/**
 * Hook for managing message queuing during streaming responses.
 * Allows users to queue messages while the AI is responding and automatically
 * sends them when streaming completes.
 */
export function useMessageQueue({
  isConfigInitialized,
  streamingState,
  submitQuery,
}: UseMessageQueueOptions): UseMessageQueueReturn {
  const [messageQueue, setMessageQueue] = useState<PartListUnion[]>([]);

  // Add a message to the queue
  const addMessage = useCallback((message: PartListUnion) => {
    if (typeof message === 'string') {
      const trimmedMessage = message.trim();
      if (trimmedMessage.length > 0) {
        setMessageQueue((prev) => [...prev, trimmedMessage]);
      }
    } else {
      // It's a Part array
      if (Array.isArray(message) && message.length > 0) {
        setMessageQueue((prev) => [...prev, message]);
      }
    }
  }, []);

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  // Get all queued messages as a single text string (for display purposes)
  const getQueuedMessagesText = useCallback(() => {
    if (messageQueue.length === 0) return '';
    return messageQueue
      .map((msg) => {
        if (typeof msg === 'string') {
          return msg;
        } else if (Array.isArray(msg)) {
          // Extract text from parts
          return msg.map((p) => (p as any).text || '[image]').join(' ');
        }
        return '';
      })
      .join('\n\n');
  }, [messageQueue]);

  // Process queued messages when streaming becomes idle
  useEffect(() => {
    if (
      isConfigInitialized &&
      streamingState === StreamingState.Idle &&
      messageQueue.length > 0
    ) {
      // Combine all messages - need to handle both strings and Part arrays
      let combinedMessage: PartListUnion;
      
      // Check if all messages are strings
      const allStrings = messageQueue.every((msg) => typeof msg === 'string');
      
      if (allStrings) {
        // All strings - join them
        combinedMessage = (messageQueue as string[]).join('\n\n');
      } else {
        // Mix of strings and parts - flatten into single Part array
        const allParts: Part[] = [];
        
        for (const msg of messageQueue) {
          if (typeof msg === 'string') {
            if (msg.trim()) {
              allParts.push({ text: msg });
            }
          } else if (Array.isArray(msg)) {
            // It's a Part array - add all parts
            allParts.push(...(msg as Part[]));
          }
        }
        
        combinedMessage = allParts;
      }
      
      // Clear the queue and submit
      setMessageQueue([]);
      submitQuery(combinedMessage);
    }
  }, [isConfigInitialized, streamingState, messageQueue, submitQuery]);

  return {
    messageQueue,
    addMessage,
    clearQueue,
    getQueuedMessagesText,
  };
}
