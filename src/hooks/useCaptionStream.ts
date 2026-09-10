import { useState, useEffect, useCallback, useRef } from 'react';
import type { CaptionChunk } from '../types/api';
import { apiService } from '../services/apiService';
import type { AppDataStatus } from '../services/apiService';

// ============================================================
// useCaptionStream hook
// ============================================================
// Accumulates caption chunks into state as they arrive.
// ============================================================

interface UseCaptionStreamReturn {
  /** All chunks received so far for the current visit. */
  chunks: CaptionChunk[];
  /** The full concatenated transcript text. */
  fullText: string;
  /** True while chunks are still being received. */
  isStreaming: boolean;
  /** True when the mock stream has finished. */
  isFinished: boolean;
  /** Connection status for the stream. */
  status: AppDataStatus;
  /** Start / restart the caption stream for a given visit. */
  startStream: (visitId: string) => void;
  /** Reset state (clears chunks). */
  reset: () => void;
}

export function useCaptionStream(): UseCaptionStreamReturn {
  const [chunks, setChunks] = useState<CaptionChunk[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [status, setStatus] = useState<AppDataStatus>('idle');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const reset = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setChunks([]);
    setIsStreaming(false);
    setIsFinished(false);
    setStatus('idle');
  }, []);

  const startStream = useCallback(
    (visitId: string) => {
      // Cancel any existing stream first
      reset();
      setIsStreaming(true);
      setIsFinished(false);
      setStatus('connecting');

      const unsubscribe = apiService.subscribeCaptionStream(
        visitId,
        (chunk) => {
          setChunks((prev) => [...prev, chunk]);
        },
        () => {
          setIsStreaming(false);
          setIsFinished(true);
        },
        (newStatus) => {
          setStatus(newStatus);
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

  return { chunks, fullText, isStreaming, isFinished, status, startStream, reset };
}
