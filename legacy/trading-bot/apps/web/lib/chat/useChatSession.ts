import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

import { sendMediatorMessage } from '@/lib/api/client';
import type { SendMessageResponse } from '@/lib/api/client';
import type { SendMessageRequest, StreamEvent } from '@/lib/api/validators';
import { createMediatorStream } from '@/lib/api/stream';
import { useToasts } from '@/lib/state/useToasts';

import {
  applyStreamEvent,
  createInitialChatState,
  listMessages,
  markRequestCancelled,
  markRequestFailed,
  remapRequestId,
  seedConversation,
  ChatMessageRecord,
  ChatState
} from './state';

export interface SendMessageOptions extends SendMessageRequest {
  clientRequestId?: string;
}

interface UseChatSessionResult {
  messages: ChatMessageRecord[];
  sendMessage: (options: SendMessageOptions) => Promise<string | null>;
  cancelRequest: (requestId: string) => void;
  reset: () => void;
  pendingCount: number;
  isStreaming: boolean;
}

export function useChatSession(): UseChatSessionResult {
  const [state, setState] = useState<ChatState>(() => createInitialChatState());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const toasts = useToasts();
  const hasStreamRef = useRef(false);

  useEffect(() => {
    if (hasStreamRef.current) return;
    hasStreamRef.current = true;

    const dispose = createMediatorStream({
      onMessage: (event: StreamEvent) => {
        setConnectionError(null);
        setState((prev) => applyStreamEvent(prev, event));
      },
      onError: (error) => {
        setConnectionError(error?.message ?? 'Stream disconnected');
        toasts.push({
          title: 'انقطع الاتصال بالبث',
          description: error?.message ?? 'سيتم إعادة المحاولة تلقائياً.',
          variant: 'warning'
        });
      }
    });

    return () => {
      dispose();
      hasStreamRef.current = false;
    };
  }, [toasts]);

  const sendMessage = useCallback(
    async (options: SendMessageOptions) => {
      const clientRequestId = options.clientRequestId ?? nanoid();
      setState((prev) =>
        seedConversation(prev, {
          requestId: clientRequestId,
          text: options.text,
          channel: options.channel,
          userId: options.userId,
          trace: options.trace ?? false
        })
      );

      try {
        const response = await sendMediatorMessage({
          ...options,
          clientRequestId
        });
        const requestId =
          (response as SendMessageResponse)?.requestId ?? clientRequestId;
        if (requestId !== clientRequestId) {
          setState((prev) => remapRequestId(prev, clientRequestId, requestId));
        }
        return requestId;
      } catch (error) {
        const message =
          (error as Error)?.message ?? 'تعذّر إرسال الرسالة إلى الوسيط.';
        setState((prev) => markRequestFailed(prev, clientRequestId, message));
        toasts.push({
          title: 'فشل الإرسال',
          description: message,
          variant: 'error'
        });
        return null;
      }
    },
    [toasts]
  );

  const cancelRequest = useCallback((requestId: string) => {
    setState((prev) => markRequestCancelled(prev, requestId));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialChatState());
    setConnectionError(null);
  }, []);

  const messages = useMemo(() => listMessages(state), [state]);
  const pendingCount = messages.filter((message) =>
    ['pending', 'streaming'].includes(message.status)
  ).length;
  const isStreaming = pendingCount > 0 && !connectionError;

  return {
    messages,
    sendMessage,
    cancelRequest,
    reset,
    pendingCount,
    isStreaming
  };
}
