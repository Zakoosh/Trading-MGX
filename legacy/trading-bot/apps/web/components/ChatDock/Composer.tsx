'use client';

import { useState } from 'react';

interface ComposerProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
}

export function Composer({ placeholder, onSubmit }: ComposerProps) {
  const [value, setValue] = useState('');

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        onSubmit?.(value);
        setValue('');
      }}
    >
      <textarea
        className="min-h-[120px] w-full resize-y rounded-md border border-border bg-background p-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          إرسال
        </button>
      </div>
    </form>
  );
}
