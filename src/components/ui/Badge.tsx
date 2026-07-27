import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-hairline bg-surface-raised text-ink-secondary',
        accent: 'border-accent/20 bg-accent-wash text-accent',
        success: 'border-status-success/20 bg-status-success/10 text-status-success',
        warning: 'border-status-warning/20 bg-status-warning/10 text-status-warning',
        danger: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
