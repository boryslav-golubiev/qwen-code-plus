/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Text } from 'ink';
import type { PartListUnion } from '@google/genai';

const MAX_DISPLAYED_QUEUED_MESSAGES = 3;

export interface QueuedMessageDisplayProps {
  messageQueue: PartListUnion[];
}

export const QueuedMessageDisplay = ({
  messageQueue,
}: QueuedMessageDisplayProps) => {
  if (messageQueue.length === 0) {
    return null;
  }

  // Convert PartListUnion to display text
  const messageTexts = messageQueue.map((msg) => {
    if (typeof msg === 'string') {
      return msg;
    } else if (Array.isArray(msg)) {
      // Extract text from parts
      return msg.map((p) => (p as any).text || '[image]').join(' ');
    }
    return '';
  });

  return (
    <Box flexDirection="column" marginTop={1}>
      {messageTexts
        .slice(0, MAX_DISPLAYED_QUEUED_MESSAGES)
        .map((message, index) => {
          const preview = message.replace(/\s+/g, ' ');

          return (
            <Box key={index} paddingLeft={2} width="100%">
              <Text dimColor wrap="truncate">
                {preview}
              </Text>
            </Box>
          );
        })}
      {messageTexts.length > MAX_DISPLAYED_QUEUED_MESSAGES && (
        <Box paddingLeft={2}>
          <Text dimColor>
            ... (+
            {messageTexts.length - MAX_DISPLAYED_QUEUED_MESSAGES} more)
          </Text>
        </Box>
      )}
    </Box>
  );
};
