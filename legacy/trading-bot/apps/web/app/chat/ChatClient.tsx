'use client';

import { FormEvent, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { useTranslations } from 'next-intl';

import { ChatDock } from '@/components/ChatDock/ChatDock';
import { DataEmpty } from '@/components/Shared/DataEmpty';
import { useChatSession } from '@/lib/chat/useChatSession';
import type { ChatMessageRecord } from '@/lib/chat/state';
import { usePersistentState } from '@/lib/hooks/usePersistentState';
import type { SendMessageRequest } from '@/lib/api/validators';
import { useToasts } from '@/lib/state/useToasts';

type AttachmentInput = {
  id: string;
  name: string;
  url: string;
  type?: string;
};

interface FormState {
  channel: string;
  userId: string;
  text: string;
  variables: string;
  trace: boolean;
  attachments: AttachmentInput[];
}

const STORAGE_KEY = 'chat:last-form';

const AttachmentsSchema = z
  .array(
    z.object({
      name: z.string().min(1),
      url: z.string().url(),
      type: z.string().optional()
    })
  )
  .optional();

const VariablesSchema = z.union([z.string(), z.record(z.unknown()).nullish()]);

const defaultFormState: FormState = {
  channel: 'telegram',
  userId: '',
  text: '',
  variables: '',
  trace: false,
  attachments: []
};

function parseVariables(input: string) {
  if (!input.trim()) return undefined;
  const maybeJson = input.trim();
  try {
    const parsed = JSON.parse(maybeJson);
    const validated = VariablesSchema.parse(parsed);
    if (validated === null) return undefined;
    if (typeof validated === 'string') {
      return JSON.parse(validated);
    }
    return validated;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'تعذّر تحليل المتغيرات. تأكد من صحة صيغة JSON.'
    );
  }
}

function serializeAttachments(attachments: AttachmentInput[]): SendMessageRequest['attachments'] {
  const filtered = attachments.filter((item) => item.name && item.url);
  if (!filtered.length) return undefined;
  const parsed = AttachmentsSchema.parse(
    filtered.map(({ name, url, type }) => ({ name, url, type: type || undefined }))
  );
  return parsed ?? undefined;
}

function formatLatency(message: ChatMessageRecord, t: ReturnType<typeof useTranslations>) {
  if (!message.latencyMs) return t('metrics.latencyUnknown');
  if (message.latencyMs < 1000) {
    return `${message.latencyMs.toFixed(0)} ms`;
  }
  return `${(message.latencyMs / 1000).toFixed(2)} s`;
}

function StatusBadge({
  status,
  t
}: {
  status: ChatMessageRecord['status'];
  t: ReturnType<typeof useTranslations>;
}) {
  const map: Record<typeof status, string> = {
    pending: t('status.pending'),
    streaming: t('status.streaming'),
    success: t('status.success'),
    error: t('status.error'),
    cancelled: t('status.cancelled')
  };
  const styles: Record<typeof status, string> = {
    pending: 'bg-muted text-muted-foreground',
    streaming: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    error: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
    cancelled: 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {map[status] ?? status}
    </span>
  );
}

function MessageCard({
  message,
  onCancel,
  t
}: {
  message: ChatMessageRecord;
  onCancel: (requestId: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const canCancel =
    message.requestId && (message.status === 'pending' || message.status === 'streaming');
  const roleMap: Record<ChatMessageRecord['role'], string> = {
    user: t('roles.user'),
    bot: t('roles.bot'),
    tool: t('roles.tool'),
    system: t('roles.system')
  };

  return (
    <article className="rounded-lg border border-border bg-background/40 p-4 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
            {roleMap[message.role] ?? message.role}
          </span>
          <StatusBadge status={message.status} t={t} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            {t('metrics.tokens')}: {message.tokenCount}
          </span>
          <span>{formatLatency(message, t)}</span>
          {typeof message.cost === 'number' ? (
            <span>
              {t('metrics.cost')}: {message.cost.toFixed(6)}
            </span>
          ) : null}
        </div>
      </header>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.content || t('placeholders.waiting')}</div>
      {message.error ? (
        <p className="mt-2 rounded-md bg-rose-500/10 p-2 text-xs text-rose-200">{message.error}</p>
      ) : null}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-col gap-1">
          {message.meta?.channel ? (
            <span>
              {t('meta.channel')}: {String(message.meta.channel)}
            </span>
          ) : null}
          {message.meta?.userId ? (
            <span>
              {t('meta.userId')}: {String(message.meta.userId)}
            </span>
          ) : null}
          {message.requestId ? (
            <span>
              {t('meta.requestId')}: {message.requestId}
            </span>
          ) : null}
        </div>
        {canCancel ? (
          <button
            type="button"
            className="rounded border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            onClick={() => onCancel(message.requestId!)}
          >
            {t('actions.cancel')}
          </button>
        ) : null}
      </footer>

      <details className="mt-4 rounded-md border border-dashed border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none text-sm font-medium text-foreground">
          {t('developer.title')}
        </summary>
        <div className="mt-3 space-y-3">
          <section>
            <h4 className="mb-1 font-semibold text-foreground">{t('developer.raw')}</h4>
            <pre className="max-h-48 overflow-auto rounded bg-muted/20 p-2 text-[11px] leading-relaxed text-muted-foreground">
              {JSON.stringify(message, null, 2)}
            </pre>
          </section>
          <section>
            <h4 className="mb-1 font-semibold text-foreground">{t('developer.events')}</h4>
            <ol className="max-h-48 list-decimal space-y-1 overflow-auto pl-4">
              {message.events.map((event, index) => (
                <li key={`${event.type}-${index}`} className="space-y-1">
                  <p className="font-medium text-foreground">
                    {event.type} <span className="text-muted-foreground">· {event.ts}</span>
                  </p>
                  <pre className="overflow-auto rounded bg-muted/20 p-2 text-[11px] leading-relaxed text-muted-foreground">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </details>
    </article>
  );
}

export function ChatClient() {
  const t = useTranslations('chat');
  const toasts = useToasts();
  const { messages, sendMessage, cancelRequest, pendingCount } = useChatSession();
  const [form, setForm] = usePersistentState<FormState>(STORAGE_KEY, defaultFormState);

  const isSendDisabled = !form.text.trim();

  const sortedMessages = useMemo(
    () => messages.sort((a, b) => a.startedAt - b.startedAt),
    [messages]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSendDisabled) return;

    let vars: SendMessageRequest['vars'];
    try {
      vars = parseVariables(form.variables);
    } catch (error) {
      toasts.push({
        title: t('errors.invalidVariablesTitle'),
        description:
          error instanceof Error ? error.message : t('errors.invalidVariablesDescription'),
        variant: 'error'
      });
      return;
    }

    const attachments = serializeAttachments(form.attachments);
    const payload: SendMessageRequest = {
      channel: form.channel,
      userId: form.userId || undefined,
      text: form.text,
      vars,
      attachments,
      trace: form.trace,
      clientRequestId: nanoid()
    };

    try {
      await sendMessage(payload);
      setForm((prev) => ({
        ...prev,
        text: '',
        attachments: prev.attachments.filter((attachment) => attachment.url || attachment.name)
      }));
    } catch (error) {
      toasts.push({
        title: t('errors.sendFailedTitle'),
        description: error instanceof Error ? error.message : t('errors.sendFailedDescription'),
        variant: 'error'
      });
    }
  };

  const updateAttachment = (index: number, patch: Partial<AttachmentInput>) => {
    setForm((prev) => {
      const nextAttachments = [...prev.attachments];
      nextAttachments[index] = { ...nextAttachments[index], ...patch };
      return { ...prev, attachments: nextAttachments };
    });
  };

  const addAttachment = () => {
    setForm((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        { id: nanoid(), name: '', url: '', type: '' }
      ]
    }));
  };

  const removeAttachment = (index: number) => {
    setForm((prev) => {
      const nextAttachments = [...prev.attachments];
      nextAttachments.splice(index, 1);
      return { ...prev, attachments: nextAttachments };
    });
  };

  return (
    <ChatDock
      header={
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>{t('header.description')}</span>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-200">
              {t('header.pending', { count: pendingCount })}
            </span>
          ) : null}
        </div>
      }
      composer={
        <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t('composer.channel')}</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.channel}
                onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value }))}
                placeholder="telegram"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{t('composer.userId')}</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.userId}
                onChange={(event) => setForm((prev) => ({ ...prev, userId: event.target.value }))}
                placeholder={t('composer.userIdPlaceholder')}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">{t('composer.message')}</span>
            <textarea
              className="min-h-[160px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={t('composer.messagePlaceholder')}
              value={form.text}
              onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('composer.variables')} <span className="text-[11px] text-muted-foreground/70">({t('composer.optional')})</span>
            </span>
            <textarea
              className="min-h-[120px] w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder='{"symbol": "AAPL"}'
              value={form.variables}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  variables: event.target.value
                }))
              }
            />
            <span className="text-[11px] text-muted-foreground">{t('composer.variablesHint')}</span>
          </label>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {t('composer.attachments')} <span className="text-[11px] text-muted-foreground/70">({t('composer.optional')})</span>
              </span>
              <button
                type="button"
                className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                onClick={addAttachment}
              >
                {t('composer.addAttachment')}
              </button>
            </div>
            {form.attachments.length ? (
              <div className="space-y-2">
                {form.attachments.map((attachment, index) => (
                  <div key={attachment.id} className="grid gap-2 rounded-md border border-dashed border-border/60 p-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <input
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t('composer.attachmentNamePlaceholder')}
                      value={attachment.name}
                      onChange={(event) =>
                        updateAttachment(index, { name: event.target.value })
                      }
                    />
                    <input
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="https://..."
                      value={attachment.url}
                      onChange={(event) => updateAttachment(index, { url: event.target.value })}
                    />
                    <input
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="mime/type"
                      value={attachment.type ?? ''}
                      onChange={(event) =>
                        updateAttachment(index, { type: event.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                      onClick={() => removeAttachment(index)}
                    >
                      {t('composer.removeAttachment')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">
                {t('composer.noAttachments')}
              </p>
            )}
          </section>

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={form.trace}
                onChange={(event) => setForm((prev) => ({ ...prev, trace: event.target.checked }))}
              />
              {t('composer.trace')}
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSendDisabled}
            >
              {t('composer.send')}
            </button>
          </div>
        </form>
      }
    >
      {sortedMessages.length === 0 ? (
        <DataEmpty
          title={t('empty.title')}
          description={t('empty.description')}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sortedMessages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onCancel={cancelRequest}
              t={t}
            />
          ))}
        </div>
      )}
    </ChatDock>
  );
}
