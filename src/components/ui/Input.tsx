import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-9 w-full rounded-md border border-hairline bg-surface-base px-3 text-sm text-ink-primary placeholder:text-ink-secondary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid && 'border-status-danger focus-visible:ring-status-danger',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
