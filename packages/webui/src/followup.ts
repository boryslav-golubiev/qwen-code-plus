/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Prompt Suggestion Subpath Entry
 *
 * Separated from the root entry to avoid forcing all @boryslav-golubiev/webui
 * consumers to install @boryslav-golubiev/qwen-code-plus-core as a dependency.
 *
 * Usage: import { useFollowupSuggestions } from '@boryslav-golubiev/webui/followup';
 */

export { useFollowupSuggestions } from './hooks/useFollowupSuggestions';
export type {
  FollowupState,
  UseFollowupSuggestionsOptions,
  UseFollowupSuggestionsReturn,
} from './hooks/useFollowupSuggestions';
