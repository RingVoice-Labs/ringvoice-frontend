/**
 * Utilities for formatting and appending streaming or historical caption chunks.
 */

/**
 * Appends a new chunk of caption text to an accumulated string, ensuring proper
 * word separation while correctly preserving punctuation and existing whitespace.
 */
export function appendChunkText(current: string, nextChunkText: string): string {
  if (!current) {
    return nextChunkText;
  }
  if (!nextChunkText) {
    return current;
  }

  // If current already ends with whitespace or next chunk already starts with whitespace, just concatenate
  if (/\s$/.test(current) || /^\s/.test(nextChunkText)) {
    return current + nextChunkText;
  }

  // If next chunk starts with punctuation (e.g. ',', '.', '!', '?', ':', ';', "'", '"', closing brackets),
  // do not add a space before it
  if (/^[,.?!:;’'”")\]}]/.test(nextChunkText)) {
    return current + nextChunkText;
  }

  // Otherwise, insert a single space between words
  return `${current} ${nextChunkText}`;
}

/**
 * Formats an array of caption chunks into a coherent full transcript string.
 */
export function formatTranscript(chunks: Array<{ text: string }>): string {
  return chunks.reduce((acc, chunk) => appendChunkText(acc, chunk.text), '').trim();
}
