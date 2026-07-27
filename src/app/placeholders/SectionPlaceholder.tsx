import { Skeleton } from '@/components/ui';

interface SectionPlaceholderProps {
  title: string;
  stage: number;
  description: string;
}

export function SectionPlaceholder({ title, stage, description }: SectionPlaceholderProps) {
  return (
    <div className="p-6">
      <h1 className="font-heading text-xl font-semibold text-ink-primary">{title}</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-secondary">{description}</p>
      <p className="mt-1 font-mono text-2xs uppercase tracking-wide text-accent">Arrives in Stage {stage}</p>
      <div className="mt-6 space-y-2" aria-hidden>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
