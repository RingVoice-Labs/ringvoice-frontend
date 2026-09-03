import { useState, useEffect, useCallback, useRef } from 'react';
import type { CaptionChunk } from '../types/api';
import { subscribeMockCaptionStream } from '../mock/mockCaptionStream';

// ============================================================
// useCaptionStream hook
// ============================================================
// Accumulates caption chunks into state as they arrive.
//
// SWAPPING IN THE REAL BACKEND (Week 3):
//   In startStream(), replace subscribeMockCaptionStream() with
//   your WebSocket/SSE "caption_chunk" message handler.
//   Call onChunk for each chunk, onDone on "session_end".
//   The hook return shape stays exactly the same.
// ============================================================

interface UseCaptionStreamReturn {
  /** All chunks received so far for the current visit. */
  chunks: CaptionChunk[];
  /** The full concatenated transcript text. */
  fullText: string;
  /** True while chunks are still being received. */
  isStreaming: boolean;
  /** Start / restart the caption stream for a given visit. */
  startStream: (visitId: string) => void;
  /** Reset state (clears chunks). */
  reset: () => void;
}

export function useCaptionStream(): UseCaptionStreamReturn {
  const [chunks, setChunks] = useState<CaptionChunk[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const reset = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setChunks([]);
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(
    (visitId: string) => {
      // Cancel any existing stream first
      reset();
      setIsStreaming(true);

      const unsubscribe = subscribeMockCaptionStream(
        visitId,
        (chunk) => {
          setChunks((prev) => [...prev, chunk]);
        },
        () => {
          setIsStreaming(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    },
    [reset]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  const fullText = chunks.map((c) => c.text).join('');

  return { chunks, fullText, isStreaming, startStream, reset };
}
