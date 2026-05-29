import { describe, expect, it } from 'vitest';

import { applyStreamEvent, createInitialChatState, listMessages, markRequestCancelled, seedConversation } from '@/lib/chat/state';

const mockTs = () => new Date().toISOString();

describe('chat streaming reducer', () => {
  it('aggregates incoming tokens into message content', () => {
    const requestId = 'req-token';
    let state = createInitialChatState();
    state = seedConversation(state, {
      requestId,
      text: 'اختبار',
      channel: 'mock'
    });

    state = applyStreamEvent(state, {
      type: 'token',
      data: { token: 'A' },
      ts: mockTs(),
      requestId
    });
    state = applyStreamEvent(state, {
      type: 'token',
      data: { token: 'B' },
      ts: mockTs(),
      requestId
    });
    state = applyStreamEvent(state, {
      type: 'message',
      data: { content: 'AB' },
      ts: mockTs(),
      requestId
    });

    const [, botMessage] = listMessages(state);
    expect(botMessage.content).toBe('AB');
    expect(botMessage.tokenCount).toBe(2);
    expect(botMessage.status).toBe('success');
  });

  it('marks request as cancelled', () => {
    const requestId = 'req-cancel';
    let state = createInitialChatState();
    state = seedConversation(state, {
      requestId,
      text: 'hello',
      channel: 'mock'
    });

    state = markRequestCancelled(state, requestId);
    const [, botMessage] = listMessages(state);
    expect(botMessage.status).toBe('cancelled');
    expect(botMessage.error).toBeDefined();
  });
});
