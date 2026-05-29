'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { useEffect } from 'react';

import { useToasts } from '../../lib/state/useToasts';
import { cn } from '../../lib/utils/cn';

export function Toaster() {
  const toasts = useToasts((state) => state.toasts);
  const dismiss = useToasts((state) => state.dismiss);
  const clear = useToasts((state) => state.clear);

  useEffect(() => {
    return () => clear();
  }, [clear]);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => (
        <ToastPrimitive.Root
          key={toast.id}
          className={cn(
            'pointer-events-auto relative w-[360px] rounded-lg border border-border bg-card p-4 text-sm shadow-lg',
            toast.variant === 'success' && 'border-green-500/60',
            toast.variant === 'error' && 'border-red-500/60',
            toast.variant === 'warning' && 'border-yellow-500/60'
          )}
          duration={toast.duration ?? 5000}
          onOpenChange={(open) => {
            if (!open) dismiss(toast.id);
          }}
        >
          <ToastPrimitive.Title className="text-base font-semibold">{toast.title}</ToastPrimitive.Title>
          {toast.description ? (
            <ToastPrimitive.Description className="mt-1 text-muted-foreground">
              {toast.description}
            </ToastPrimitive.Description>
          ) : null}
          <ToastPrimitive.Close className="absolute inset-inline-end-2 inset-block-start-2 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition hover:bg-muted">
            ×
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed inset-inline-end-4 inset-block-end-4 z-[100] flex w-full max-w-[360px] flex-col gap-2" />
    </ToastPrimitive.Provider>
  );
}
