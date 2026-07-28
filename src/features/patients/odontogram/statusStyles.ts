import type { TreatmentStatus } from '@/data/types';

export const TREATMENT_STATUS_FILL: Record<TreatmentStatus, string> = {
  planned: 'fill-status-warning/25',
  in_progress: 'fill-accent/30',
  completed: 'fill-status-success/35',
  cancelled: 'fill-ink-secondary/15',
  on_hold: 'fill-status-warning/10',
};

export const TREATMENT_STATUS_STROKE: Record<TreatmentStatus, string> = {
  planned: 'stroke-status-warning',
  in_progress: 'stroke-accent',
  completed: 'stroke-status-success',
  cancelled: 'stroke-ink-secondary',
  on_hold: 'stroke-status-warning',
};

export const TREATMENT_STATUS_LABEL: Record<TreatmentStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  on_hold: 'On hold',
};
